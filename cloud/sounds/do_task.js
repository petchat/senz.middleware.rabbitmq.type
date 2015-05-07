/**
 * Created by zhanghengyang on 15/4/23.
 */

var logger = require("./lib/logger");
var config = require("./config.json");
var m_cache = require("sound-cache");
var AV = require("avoscloud-sdk").AV;
var req_lib = require("./lib/http_wrapper");
var AV = require("avoscloud-sdk").AV;
////log 3
AV.initialize(config.source_db.APP_ID,config.source_db.APP_KEY);

var get_audio = function(id){
    //questions on whether to set a request timeout
    logger.info("fetch trace started")
    UserMic = AV.Object.extend("UserMic");

    var query_promise = function(id) {
        var promise = new AV.Promise();
        var query = new AV.Query(UserMic);
        query.equalTo("objectId", id);
        query.find().then(
            function (obj_list) {
                logger.debug("the object is " + JSON.stringify(obj_list[0]));
                var o = obj_list[0];
                var obj = {};
                var audio_url = o.get("audio").url();
                var user = o.get("user");
                var timestamp = o.get("timestamp");

                obj[o.id] = {
                    "soundUrl": audio_url,
                    "user": user,
                    "timestamp": timestamp
                };
                m_cache.get(o.id)["user"] = user;
                promise.resolve(obj);
                logger.info("sounds fetched successfully")
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

    logger.debug("object  is " + JSON.stringify(obj));
    var body = new Object();
    var id = Object.keys(obj)[0];
    body = obj[id];
    body["objectId"] = id;

    logger.debug("sound service body is " + JSON.stringify(body));

    return body

};


var get_sound_type = function(body){

    /// 3 max retries
    var serv_url = config.serv_url;
    //http batch request
    return req_lib.sound_post(serv_url,body);
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

        return false;
    }
};

var check_exhausted = function(id){

    var r = delete_obj(m_cache.get(id));
    return r;
};


function failed(request_id) {
    m_cache.get(request_id).tries += 1;
}

var start = function(request_id){

    logger.info("task started");
    logger.info("id > " + request_id );
    if (typeof request_id != typeof "str" ) {
        logger.error("type of requestId is illegal")
        return;
    }

    //if(check_exhausted(request_id)) {
    //    logger.warn("retries too much, throw the id's request")
    //
    //};

    var promise = get_audio(request_id);

    promise.then(
        function (obj) {
            var body = get_request_body(obj);
            var promise = get_sound_type(body);
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