/**
 * Created by zhanghengyang on 15/4/23.
 */

var log = require("../utils/logger").log;
var logger = new log("[locations]");
var config = require("./config.json");
var url_generator = require("../utils/url_generator");
var m_cache = require("location-cache");
var req_lib = require("./lib/http_wrapper");
var AV = require("avoscloud-sdk").AV;
AV.initialize(config.source_db.APP_ID,config.source_db.APP_KEY);

var UserLocation = AV.Object.extend(config.source_db.target_class);
var User = AV.Object.extend("_User");
var Installation = AV.Object.extend("_Installation");

var get_raw_data = function(id){
    //questions on whether to set a request timeout
    logger.info(id,"Fetch location data started");

    var promise = new AV.Promise();

    var query_promise = function(id,promise) {
        var query = new AV.Query(UserLocation);
        query.equalTo("objectId", id);
        query.find().then(
            function (obj_list) {

                if (obj_list.length === 0){
                    var inner_error = "The id " + id + " " + "doesn't exist in the source db, please notify the ADMIN!";
                    logger.error(id, inner_error);
                    promise.reject(id, inner_error);
                    return;
                }

                logger.debug(id, "The object is " + JSON.stringify(obj_list[0]));
                var obj = obj_list[0];
                var a = {};
                var installationId = obj.get("installation").id;


                var install_query = new AV.Query(Installation);
                install_query.get(installationId,{
                    success:function(installation){
                        var user_query = new AV.Query(User);
                        var userId = installation.get("user").id;

                        user_query.get(userId,{
                            success:function(user){

                                logger.debug(id, "user is " + JSON.stringify(user));
                                var location = obj.get("location");
                                var timestamp = obj.get("timestamp");
                                var radius = obj.get("locationRadius");

                                a[obj.id] = {
                                    "location": location,
                                    "user": user,
                                    "timestamp": timestamp
                                };

                                if (!m_cache.get(obj.id)){
                                    promise.reject("Requested id " + obj.id + "has been deleted");
                                    return;
                                }
                                try{
                                    m_cache.get(obj.id)["user"] = user;
                                }
                                catch(e){
                                    var inner_error = "error is " + e + ", if the error is due to the cache confliction, IGNORE"
                                    logger.error(id, inner_error);
                                    promise.reject(inner_error);
                                    return;
                                }
                                logger.info(id, "Location data fetched successfully");
                                promise.resolve(a);
                            },
                            error:function(object,error){
                                logger.error(id, "User retrieve error " + JSON.stringify(error))
                                promise.reject(error)
                            }
                        })
                    },
                    error:function(object,error){
                        logger.error(id, "Installation retrieve error " + JSON.stringify(error))
                        promise.reject(error)
                    }
                });


            },
            function (err) {
                promise.reject(id);
                logger.error(id, "Get the data from source db meeting error  " + err);
            }
        );
        return promise;

    };

    return query_promise(id,promise);

};

var get_request_body = function(obj){
    /// batch request body for poi service

    var locations = [];
    var new_obj = {};
    var id = Object.keys(obj)[0];
    new_obj["timestamp"] = obj[id].timestamp;
    new_obj["objectId"] = id;
    new_obj["location"] = obj[id].location;
    new_obj["radius"] = obj[id].radius;

    locations.push(new_obj);

    var body = {"user_trace":locations};
    return body


};


var get_location_type = function(body,id){

    /// 3 max retries
    var serv_url = url_generator.location_url
    console.log(serv_url);
    //http batch request
    return req_lib.location_post(serv_url, body);
    //var sound_post = function(url,params,success_cbk,max_timeout){


}


var succeeded = function(suc_id){

    m_cache.del(suc_id);

};

var write_data = function(body){

    app_key = config.target_db.APP_KEY;
    app_id = config.target_db.APP_ID;
    return req_lib.lean_post(app_id, app_key, body);

};

var delete_obj = function(values,id){

    if (values.tries >= 3) {

        m_cache.del(id);
        logger.debug(id, "exhausted id is ," + id);
        return true;

    }
    else{
        logger.debug(id, "the id is not exhausted");
        return false;
    }
};

var check_exhausted = function(id){

    var r = false;
    if(!m_cache.get(id)){
        return true; // for if the id has been deleted by other process, it means the same as tries > 3 and being deleted in the context
    }
    try{
        r = delete_obj(m_cache.get(id),id);
    }
    catch(e){
        var inner_error = "error is " + e + ", if the error is due to the cache confliction, IGNORE"
        logger.error(id, inner_error);
        return true; // for if the id has been deleted by other process, it means the same as tries > 3 and being deleted in the context
    }
    //var r = JSON.stringify(m_cache.get(id));
    //logger.error(r);


    return r;
};


function failed(request_id) {

    if(!m_cache.get(request_id)) {
        return;
    }
    try {
        m_cache.get(request_id).tries += 1;
    }
    catch(e){
        var inner_error = "Error is " + e + ", if the error is due to the cache confliction, IGNORE"
        logger.error(request_id, inner_error);
    }
}

var start = function(request_id){

    logger.info(request_id, "Task start ...");
    if (typeof request_id != typeof "str" ) {
        logger.error(request_id, "Type of requestId is illegal");
        return;
    }
    //


    if(check_exhausted(request_id)) {
        logger.warn(request_id, "Retries too much, throw the id's request")
        return ;
    };

    var promise = get_raw_data(request_id);

    promise.then(
        function (obj) {
            var body = get_request_body(obj);
            var service_promise = get_location_type(body);
            service_promise.then(
                function (body) {
                    logger.info(request_id, "Location service requested successfully");
                    return write_data(body);
                },
                function (error) {
                    logger.error(request_id, error);
                    logger.error(request_id, "Location service requested into failure");
                    return AV.Promise.error(error);

                }
            ).then(
                function(result){
                    logger.info(request_id, "Data have been written")
                    succeeded(request_id);
                    logger.info(request_id, "One process end ");

                },
                function(error){
                    logger.error(request_id, JSON.stringify(error))
                    logger.error(request_id, "Data writing failed ")
                    failed(request_id);
                }
            )

        },
        function (error) {
            failed(request_id);
            logger.error(request_id, "Objects retrieving failed, error is " + error);
        })

    };


exports.start = start ;