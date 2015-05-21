/**
 * Created by zhanghengyang on 15/4/23.
 */

var config = require("./config.json");
var m_cache = require("location-cache");
var AV = require("avoscloud-sdk").AV;
var interval = require("./lib/interval");
var req_lib = require("./lib/http_wrapper");
var logger = require("./lib/logger");
var Set = require("simplesets").Set
var AV = require("avoscloud-sdk").AV;
////log 3
AV.initialize(config.source_db.APP_ID,config.source_db.APP_KEY);

var suc_ids = [];//global value for filter the final save rawDataIds.

var request_ids = new Set(); //global value for deletion

var fetch_trace = function(ids){
    //questions on whether to set a request timeout
    logger.info("fetch trace starting !!!!!!")
    var UserLocation = AV.Object.extend(config.source_db.target_class);

    var query_promise = function(id) {
        var promise = new AV.Promise();
        var query = new AV.Query(UserLocation);
        query.equalTo("objectId", id);
        logger.debug("request id =====>>>>" + id);
        query.find().then(
            function (obj_list) {
                logger.debug(JSON.stringify(obj_list));
                if (obj_list.length > 1){
                    logger.error("there are errors in the leancloud query api");
                }
                var obj = obj_list[0];
                logger.info("fetch leancloud trace successfully");
                var a = {};
                var user = obj.get("user");
                var location = obj.get("location");
                var timestamp = obj.get("timestamp");
                a[obj.id] = {
                    "location": location,
                    "user": user,
                    "timestamp": timestamp
                };
                m_cache.get(obj.id)["user"] = user;
                suc_ids.push(id);
                promise.resolve(a);
            },
            function (err) {
                //
                promise.resolve(id);
                logger.error("error is " + err);
                logger.error("error id is " + id);
            }
        );
        return promise;

    };
    var promises = [];
    ids.each(function(id) {
        promises.push(query_promise(id));
    });
    return AV.Promise.all(promises);

};

var batch_body = function(obj_l){
    /// batch request body for poi service

    logger.debug("object list is ,%s >>>>>",JSON.stringify(obj_l));
    var locations = [];
    obj_l.forEach(function(obj){
        //console.log("obj is >>>>>>>>" + JSON.stringify(obj));
        logger.debug("batch pre-request object is " + JSON.stringify(obj));
        var new_obj = new Object();
        var id = Object.keys(obj)[0];
        new_obj["timestamp"] = obj[id].timestamp;
        new_obj["objectId"] = id;
        new_obj["location"] = obj[id].location;
        //console.log("a is " + JSON.stringify(a));
        locations.push(new_obj);
    });
    var body = {"locations":locations};
    //console.log("body is ,%s",JSON.stringify(body));
    logger.error("requests body is ");
    logger.debug(JSON.stringify(body))
    return body

};


function location_service(body,mode){
    ///poi service request need the auth key! do not forget
    /// 3 max retries
    /// mode : batch ; once
    /// keep the request waiting time being 1/2 of timer interval

    var serv_url = config.serv_url;
    var timeout = 0.5 * interval.task_interval.check_interval;

    logger.info("request the poi type of specific geopoint ");
    //http batch request
    return req_lib.batch_post(serv_url,body,timeout);
    //var sound_post = function(url,params,success_cbk,max_timeout){


}


var cache_purge = function(suc_ids){

    suc_ids.forEach(function(id){

        m_cache.del(id);

    });

    suc_ids.forEach(function(id){
        request_ids.remove(id);
    })

    var fail_ids = request_ids;

    fail_ids.forEach(function(id){
        m_cache.get(id).tries += 1;


    });
}

var write_batch_data = function(body){
    //set a request timeout
    console.log(body);
    app_key = config.target_db.APP_KEY;
    //var lean_post = function(target_class,APP_ID,APP_KEY,params,success_cbk,fail_cbk){
    app_id = config.target_db.APP_ID;
    return req_lib.lean_post(app_id,app_key,body);

}

var expired = function(values){

    if (values.tries >= 3) {

        request_ids.remove(id);
        logger.warn("the objectId (" + id + ")" + " tries too much,throw away~");
        try{
            return m_cache.del(id);

        }
        catch(e){
            logger.error("error is " + e);
        }

    }
};

var check_exhausted = function(i){

    var p = {};
    var ids = request_ids;
    ids.forEach(function (id) {
        var r = expired(m_cache.get(id));

    });
};

var get_cache_ids = function(){

    var id_set = new Set();
    m_cache.keys().forEach(function(id) {
        id_set.add(id);
    });
    return id_set
}

var start = function(){

    logger.info("task started");
    request_ids = get_cache_ids();

    if (!request_ids.size()) {
        logger.warn("empty list,no need to go on. let's return");
        return;
    }
    check_exhausted();
    var promise = fetch_trace(request_ids);
    promise.then(
        function (local_fetch_objs) {

            var temp_list  = [];
            local_fetch_objs.forEach(function(e){
                if (typeof e != typeof "1"){
                    temp_list.push(e);
                }
            });
            var body = batch_body(temp_list);
            var p = location_service(body, "batch");
            p.then(
                function (tuple) {

                    logger.info("location service requested successfully");
                    suc_ids = tuple[1];
                    return write_batch_data(tuple[0]);
                },
                function () {
                    logger.warn("location service requested in fail");

                }
            ).then(
                function(body){

                    body.forEach(function(obj){
                        if("error" in obj){
                            logger.warn("objectId requested wrongly, Id is " + suc_ids[body.indexOf(obj)]);
                            delete suc_ids[body.indexOf(obj)];
                        }
                    })
                    logger.info("succeessfully retrieved object ids" + suc_ids);
                    cache_purge(suc_ids);
                    logger.info("one process ends successfully");

                },
                function(result){
                    logger.error("one process ends in fail");
                    logger.error("result error is" + result);

                }
            )

        },
        function (errors) {
            logger.error("id list retrieve failed, failed ids are ,%s",errors);
        })

    };


exports.start = start ;