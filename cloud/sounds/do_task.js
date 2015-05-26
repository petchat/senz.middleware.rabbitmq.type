/**
 * Created by zhanghengyang on 15/4/23.
 */

var logger = require("./lib/logger");
var config = require("./config.json");
var m_cache = require("sound-cache");
var req_lib = require("./lib/http_wrapper");
var AV = require("avoscloud-sdk").AV;
////senz.log.tracer
AV.initialize(config.source_db.APP_ID,config.source_db.APP_KEY);

var get_audio = function(id){
    //questions on whether to set a request timeout
    logger.info("fetch trace started")
    var UserMic = AV.Object.extend(config.source_db.target_class);
    var User = AV.Object.extend("_User");
    var Installation = AV.Object.extend("_Installation");

    var query_promise = function(id) {
        var promise = new AV.Promise();
        var query = new AV.Query(UserMic);
        query.equalTo("objectId", id);
        query.find().then(
            function (obj) {



                logger.debug("the object is " + JSON.stringify(obj[0]));
                obj = obj[0];
                var a = {};
                var installationId = obj.get("installation").objectId;
                var install_query = new AV.Query(Installation);
                install_query.get(installationId,{
                    success:function(installation){
                        var user_query = new AV.Query(User);
                        var userId = installation.get("user").objectId;
                        user_query.get(userId,{
                            success:function(user){

                                logger.error("user is " + JSON.stringify(user));
                                var audio_url = obj.get("file").url();
                                var timestamp = obj.get("timestamp");
                                a[obj.id] = {
                                    "soundUrl": audio_url,
                                    "user": user,
                                    "timestamp": timestamp
                                };
                                if (!m_cache.get(obj.id)){
                                    promise.reject("requested id " + obj.id + "has been deleted");
                                }
                                m_cache.get(obj.id)["user"] = user;
                                logger.info("sensor data fetched successfully");
                                promise.resolve(a);
                            },
                            error:function(object,error){
                                logger.error("user retrieve error " + JSON.stringify(error))
                                promise.reject(error)
                            }
                        })
                    },
                    error:function(object,error){
                        logger.error("installation retrieve error " + JSON.stringify(error))
                        promise.reject(error)
                    }
                });

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

var delete_obj = function(values,id){

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

    var r = delete_obj(m_cache.get(id),id);
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
                function (error) {
                    logger.error("motion service requested into failure");
                    return AV.Promise.error(error);
                }
            ).then(
                function(result){
                    logger.info("data have been written")
                    succeeded(request_id);
                    logger.info("one process end ");

                },
                function(error){
                    logger.error("error is " + error);
                    logger.info("data writing failed ")
                    failed(request_id);
                }
            )

        },
        function (error) {
            logger.error("objects retrieved failed, failed ids are ,%s",error);
            failed(request_id);

        })

    };



exports.start = start ;