/**
 * Created by zhanghengyang on 15/4/23.
 */

var log = require("../utils/logger").log;
var logger = new log("[motions]");
var config = require("./config.json");
var m_cache = require("memory-cache");
var req_lib = require("./lib/http_wrapper");
var url_generator = require("../utils/url_generator");
var AV = require("avoscloud-sdk").AV;
AV.initialize(config.source_db.APP_ID,config.source_db.APP_KEY);

var UserSensor = AV.Object.extend(config.source_db.target_class);
var User = AV.Object.extend("_User");
var Installation = AV.Object.extend("_Installation");
var MAX_TRIES = require("../config.json").max_tries;
var redis = require('promise-redis')();
var client = redis.createClient();

var get_log_obj = function(req){
    if(typeof req === typeof {}) return AV.Promise.as(JSON.parse(JSON.stringify(req)));

    //var c = m_cache.get(req);
    //if(c) return AV.Promise.as(c);

    var query = new AV.Query(UserSensor);
    query.equalTo("objectId", req);
    return query.find().then(
        function (obj_list) {
            var log = JSON.parse(JSON.stringify(obj_list[0]));
            return AV.Promise.as(log);
        },
        function(err){
            return AV.Promise.error(err);
        });
};

var get_user_obj = function(installationId){
    return client.select(2).then(
        function(){
            return client.get(installationId);
        })
    .then(
        function(cache_user){
            if(cache_user) return AV.Promise.as({
                "__type": "Pointer",
                "className": "_User",
                "objectId": cache_user
            });

            var installation_query = new AV.Query(Installation);
            installation_query.equalTo("objectId", installationId);
            return installation_query.find().then(
                function(installation_list){
                    return AV.Promise.as(installation_list[0]);
                })
                .then(
                    function(installation){
                        var userId = installation.get("user").id;
                        var user = {
                            "__type": "Pointer",
                            "className": "_User",
                            "objectId": userId
                        };
                        client.set(installationId, userId);
                        return AV.Promise.as(user);
                    })
                .catch(
                    function(err){
                        return AV.Promise.error(err);
                    });
        })
        .catch(
            function(err){
                return AV.Promise.error(err);
            });
};

var get_raw_data_o = function(req){
    return get_log_obj(req).then(
        function(log){
            if(!log) return AV.Promise.error("invalid log id");

            var LogId = log.objectId || log.id;
            if(m_cache.get(LogId)) succeeded(LogId);
            //console.log(log);
            var installation = log.installation;
            if(!installation) return AV.Promise.error("invalid installation");

            var installationId = installation.objectId || installation.id;
            var raw_data = log.value.events;
            var timestamp = log.timestamp;

            return get_user_obj(installationId)
                .then(
                    function(user){
                        var a = {
                            "user": user,
                            "timestamp": timestamp,
                            "objectId": LogId,
                            "rawData": raw_data
                        };
                        return AV.Promise.as(a);
                    },
                    function(err){
                        return AV.Promise.error(err);
                    });
        },
        function(err){
            return AV.Promise.error(err);
        });
};

var get_request_body = function(obj){
    var body = {};
    body["timestamp"] = obj.timestamp;
    body["objectId"] = obj.objectId;
    body["rawData"] = obj.rawData;

    return body
};

var get_motion_type = function(body){
    var serv_url = url_generator.motion_url;
    console.log("motion url: " + serv_url);
    return req_lib.motion_post(serv_url, body);
};

var write_data = function(body){
    var app_key = config.target_db.APP_KEY;
    var app_id = config.target_db.APP_ID;
    return req_lib.lean_post(app_id, app_key, body);
};

var failed = function(request) {
    if(typeof request === typeof 'str'){
        m_cache.put(request, request);
    }
    if(typeof request === typeof {}){
        m_cache.put(request.objectId, request);
    }
};

var succeeded = function(suc_id){
    m_cache.del(suc_id);
};

var start = function(request_id){
    return get_raw_data_o(request_id).then(
        function(raw_data){
            var user = raw_data.user;
            var body = get_request_body(raw_data);
            return get_motion_type(body).then(
                function(motion_type){
                    motion_type['user'] = user;
                    logger.info(request_id, "Motion service requested successfully");
                    return write_data(motion_type);
                },
                function(err){
                    return AV.Promise.error(err);
                }
            )
        }
    ).then(
        function(success){
            console.log(success);
        },
        function(error){
            logger.error(request_id, JSON.stringify(error));
            failed(request_id);
        }
    );
};


exports.start = start ;
