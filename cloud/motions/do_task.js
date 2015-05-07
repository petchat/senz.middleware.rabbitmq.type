/**
 * Created by zhanghengyang on 15/4/23.
 */

var logger = require("./lib/logger");
var config = require("./config.json");
var m_cache = require("motion-cache");
var AV = require("avoscloud-sdk").AV;
////log 3
AV.initialize(config.source_db.APP_ID,config.source_db.APP_KEY);
var req_lib = require("./lib/http_wrapper");


var get_raw_data = function(id){
    //questions on whether to set a request timeout
    logger.info("fetch sensor data started");
    var UserSensor = AV.Object.extend(config.source_db.target_class);

    var query_promise = function(id) {
        var promise = new AV.Promise();
        var query = new AV.Query(UserSensor);
        query.equalTo("objectId", id);
        query.find().then(
            function (o) {
                logger.debug("the object is " + JSON.stringify(o[0]));
                o = o[0];
                var a = {};
                var user = o.get("user");
                var raw_data = o.get("events");
                var timestamp = o.get("timestamp");

                a[o.id] = {
                    "rawData": raw_data,
                    "user": user,
                    "timestamp": timestamp
                };
                m_cache.get(o.id)["user"] = user;
                promise.resolve(a);
                logger.info("sensor data fetched successfully")
            },
            function (err) {
                promise.reject(id);
                logger.error("get the data from source db meeting error  " + err);
            }
        );
        return promise;

    };

    return query_promise(id);

};

var get_request_body = function(obj){
    /// batch request body for poi service

    logger.debug("object list is ",JSON.stringify(obj));
    var body = new Object();
    var id = Object.keys(obj)[0];
    body["timestamp"] = obj[id].timestamp;
    body["objectId"] = id;// here save the object Id for latter operation
    body["rawData"] = obj[id].rawData;
    body["clfType"] = ["SS"];
    //console.log("a is " + JSON.stringify(a));

    return body

};


var get_motion_type = function(body){

    /// 3 max retries
    var serv_url = config.serv_url;
    //http batch request
    return req_lib.motion_post(serv_url,body);
    //var sound_post = function(url,params,success_cbk,max_timeout){


}


var succeeded = function(suc_id){

    m_cache.del(suc_id);

};

var write_data = function(body){

    app_key = config.target_db.APP_KEY;
    app_id = config.target_db.APP_ID;
    return req_lib.lean_post(app_id,app_key,body);

}

var delete_obj = function(values){

    if (values.tries >= 3) {

        m_cache.del(id);
        logger.debug("exhausted id is ," + id);
        return true;

    }
    else{
        logger.debug("the id is not exhausted");
        return false;
    }
};

var check_exhausted = function(id){

    var r = delete_obj(m_cache.get(id));
    //var r = JSON.stringify(m_cache.get(id));
    //logger.error(r);
    return r;
};


function failed(request_id) {
    m_cache.get(request_id).tries += 1;
}

var start = function(request_id){

    logger.info("task started");
    logger.info("request id is " + request_id);
    if (typeof request_id != typeof "str" ) {
        logger.error("type of requestId is illegal");
        return;
    }
    //


    if(check_exhausted(request_id)) {
        logger.warn("retries too much, throw the id's request")

    };

    var promise = get_raw_data(request_id);

    promise.then(
        function (obj) {
            var body = get_request_body(obj);
            var promise = get_motion_type(body);
            promise.then(
                function (body) {
                    logger.info("motion service requested successfully");
                    return write_data(body);
                },
                function () {
                    logger.error("motion service requested into failure");
                }
            ).then(
                function(result){
                    logger.info("data have been written")
                    succeeded(request_id);
                    logger.info("one process end ");

                },
                function(result){
                    logger.info("data writing failed ")
                    failed(request_id);
                }
            )

        },
        function (errors) {
            logger.error("objects retrieving failed, failed ids are ,%s",errors);
        })

    };


exports.start = start ;