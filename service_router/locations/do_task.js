/**
 * Created by zhanghengyang on 15/4/23.
 */

var log = require("../utils/logger").log;
var logger = new log("[locations]");
var config = require("./config.json");
var url_generator = require("../utils/url_generator");
var m_cache = require("memory-cache");
var req_lib = require("./lib/http_wrapper");
var AV = require("avoscloud-sdk").AV;
AV.initialize(config.source_db.APP_ID,config.source_db.APP_KEY);
var UserLocation = AV.Object.extend(config.source_db.target_class);
var Installation = AV.Object.extend("_Installation");
var redis = require('promise-redis')();
var client = redis.createClient();

var get_log_obj = function(req){
    if(typeof req === typeof {}) return AV.Promise.as(JSON.parse(JSON.stringify(req)));

    var query = new AV.Query(UserLocation);
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
    return client.get(installationId).then(
        function(obj){
            if(obj) return AV.Promise.as(JSON.parse(obj));

            var installation_query = new AV.Query(Installation);
            installation_query.equalTo("objectId", installationId);
            return installation_query.find().then(
                function(installation_list){
                    return AV.Promise.as(installation_list[0]);
                },
                function(err){
                    return AV.Promise.error(err);
                }).then(
                function(installation){
                    var userId = installation.get("user").id;
                    var user = {
                        "__type": "Pointer",
                        "className": "_User",
                        "objectId": userId
                    };
                    client.set(installationId, JSON.stringify(user));
                    return AV.Promise.as(user);
                },
                function(err){
                    return AV.Promise.error(err);
                });
        },
        function(err){
            return AV.Promise.error(err);
        });
};

var get_raw_data_o = function(req){
    return get_log_obj(req).then(
        function(log){
            if(!log) return AV.Promise.error("invalid log id");

            var LogId = log.objectId || log.id;
            succeeded(LogId);
            console.log(log);
            var installation = log.installation;
            if(!installation) return AV.Promise.error("invalid installation");

            var installationId = installation.objectId || installation.id;

            var location = log.location;
            var timestamp = log.timestamp;
            var radius = log.locationRadius;
            return get_user_obj(installationId)
                .then(
                    function(user){
                        var a = {
                            "location": location,
                            "user": user,
                            "objectId": LogId,
                            "timestamp": timestamp,
                            "radius": radius
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
    var locations = [];
    var new_obj = {};
    new_obj["timestamp"] = obj.timestamp;
    new_obj["objectId"] = obj.objectId;
    new_obj["location"] = obj.location;
    new_obj["radius"] = obj.radius;

    locations.push(new_obj);

    var body = {"user_trace":locations};
    body.dev_key = "senz";
    body.userId = obj.user.objectId;

    return body
};

var get_location_type = function(body){
    var serv_url = url_generator.location_url;
    return req_lib.location_post(serv_url, body);
};


var write_data = function(body){
    var app_key = config.target_db.APP_KEY;
    var app_id = config.target_db.APP_ID;
    return req_lib.lean_post(app_id, app_key, body);
};

var succeeded = function(suc_id){
    client.srem('location', suc_id);
    client.select(1);
    client.del(suc_id);
    client.select(0);
};

var failed = function(request) {
    if(typeof request == typeof {}){
        client.sadd('location', request.objectId);
        client.select(1);
        client.set(request.objectId, JSON.stringify(request));
        client.select(0);
    }
    if(typeof request == typeof 'str'){
        client.sadd('location', request.objectId);
    }
};

var start = function(log_obj){
    return get_raw_data_o(log_obj)
        .then(
        function(raw_data){
            var user = raw_data.user;
            var body = get_request_body(raw_data);
            return get_location_type(body).then(
                function(location_type){
                    location_type['user'] = user;
                    logger.info(log_obj, "Location service requested successfully");
                    return write_data(location_type);
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
            logger.error(log_obj, JSON.stringify(error));
            failed(log_obj);
        }
    )
};


exports.start = start ;