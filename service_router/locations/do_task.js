/**
 * Created by zhanghengyang on 15/4/23.
 */

var log = require("../utils/logger").log;
var logger = new log("[locations]");
var config = require("./config.json");
var url_generator = require("../utils/url_generator");
var req_lib = require("./lib/http_wrapper");
var AV = require("avoscloud-sdk").AV;
AV.initialize(config.source_db.APP_ID,config.source_db.APP_KEY);
var UserLocation = AV.Object.extend(config.source_db.target_class);
var Installation = AV.Object.extend("_Installation");
var redis = require('promise-redis')();
var client0 = redis.createClient();
var client2 = redis.createClient();

var get_log_obj = function(req){
    if(typeof req === typeof {}) return AV.Promise.as(req);

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
    return client2.select(2).then(
        function(){
            return client2.get(installationId);
        })
    .then(
        function(cache_user){
            if(cache_user) return AV.Promise.as(cache_user);

            var installation_query = new AV.Query(Installation);
            installation_query.equalTo("objectId", installationId);
            return installation_query.find().then(
                function(installation_list){
                    return AV.Promise.as(installation_list[0]);
                }).then(
                function(installation){
                    var userId = installation.get("user").id;
                    client2.set(installationId, userId);
                    return AV.Promise.as(userId);
                }).catch(
                function(err){
                    return AV.Promise.error(err);
                });
        })
        .catch(
            function(e){
                return AV.Promise.error(e);
            });
};

var get_raw_data_o = function(req){
    return get_log_obj(req).then(
        function(log){
            if(!log) return AV.Promise.error("invalid log id");

            var LogId = log.objectId || log.id;
            succeeded(LogId);
            var installation = log.installation;
            if(!installation) return AV.Promise.error("invalid installation");

            var installationId = installation.objectId || installation.id;
            var location = log.location;
            var timestamp = log.timestamp;
            var radius = log.locationRadius;
            if(log.sdkVersion.slice(-3) == 'ios'){
                var extra = log.value;
            }else{
                extra = log.extra;
            }
            return get_user_obj(installationId)
                .then(
                    function(userId){
                        var a = {
                            "extra": extra,
                            "location": location,
                            "userId": userId,
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
    body.userId = obj.userId;

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
    return client0.select(0)
        .then(
            function(){
                return AV.Promise.all([client0.srem('location', suc_id), client0.del(suc_id)]);
            })
        .catch(
            function(e){
                return AV.Promise.error(e);
            })
};

var failed = function(request) {
    logger.debug("REDIS: ", "add to redis!");
    if(typeof request == typeof {}){
        return client0.select(0)
            .then(
                function(){
                    if(request.tries){
                        request.tries += 1;
                    }else{
                        request.tries = 1;
                    }
                    return AV.Promise.all([client0.sadd('location', request.objectId),
                        client0.set(request.objectId, JSON.stringify(request))]);
                })
            .catch(
                function(e){
                    return AV.Promise.as(e);
                })
    }
};

var start = function(log_obj){
    return get_raw_data_o(log_obj)
        .then(
            function(raw_data){
                var userId = raw_data.userId;
                var extra = raw_data.extra;
                var body = get_request_body(raw_data);
                return get_location_type(body).then(
                    function(location_type){
                        location_type['user_id'] = userId;
                        location_type['extra'] = extra;
                        return write_data(location_type);
                    });
        })
        .then(
            function(msg){
                logger.debug("success", msg);
            },
            function(err){
                logger.error("location", JSON.stringify(err));
                failed(log_obj);
            })
};


exports.start = start ;