/**
 * Created by zhanghengyang on 15/4/22.
 */

var sub = require('../rabbit_lib/subscriber');
var m_task = require("./do_task");
var task_interval = require("../config.json").interval;
var log = require("../utils/logger").log;
var logger = new log("[locations]");
var redis = require('promise-redis')();
var client = redis.createClient();

var config = require("./config.json");
var AV = require("avoscloud-sdk").AV;
AV.initialize(config.source_db.APP_ID,config.source_db.APP_KEY);

var event = "new_location_arrival";
var queue_name = "placesOfInterests";


exports.init = function(){
    sub.registerEvent(locationCallback,queue_name,event);
    logger.info("","now listening to the rabbitmq ...");
    logger.debug("","Scheduler start ... \n Interval is " + task_interval);
    //todo scheduleCleanFromLeanCloud();
    scheduleCleanFromRedis();
};

var locationCallback = function(msg){
    var log_obj = msg.object || msg.objectId;
    m_task.start(log_obj);
};

var scheduleFailed = function(){
    return client.select(0)
        .then(
            function(){
                return client.srandmember('location');
            })
        .then(
            function(logId){
                logger.info("scheduleFailed", logId);
                return client.get(logId);
            })
        .then(
            function(item){
                if(item && item.length > 100){
                    var obj = JSON.parse(item);
                    if(obj.tries < 10 && obj.location.latitude > 0 && obj.location.longitude>0){
                        obj.tries += 1;
                        logger.debug("test1", JSON.stringify(obj));
                        m_task.start(obj);
                    }else{
                        return AV.Promise.all(client.srem('location', obj.objectId), client.del(obj.objectId)).then(
                            function(){
                                return backupToDb1(obj.objectId, obj);
                            })
                    }
                }
            })
        .catch(
            function(e){
                console.log(e);
                return Promise.error(e);
            })
};

var backupToDb1 = function(id, obj){
    return client.select(1)
        .then(
            function(){
                return client.sadd('location', id);
            })
        .then(
            function(){
                return client.set(id, JSON.stringify(obj));
            })
        .catch(
            function(e){
                logger.error("second failed", JSON.stringify(e));
                return Promise.error(e);
            });
};

var scheduleCleanFromRedis = function(){
    setInterval(function(){
        scheduleFailed();
    }, 500)
};

//var scheduleCleanFromMemoryCache = function(){
//    setInterval(
//        function () {
//            if(m_cache.size()>0) {
//                var keys = m_cache.keys();
//                var id = keys.pop();
//                m_task.start(m_cache.get(id));
//            }
//        }, task_interval);
//};
//
//var scheduleCleanFromLeanCloud = function(){
//
//    var rule = new timer.RecurrenceRule();
//
//    rule.minute = minute ;
//    rule.hour = hour ;
//    var fail_query = AV.Query(Fail);
//    fail_query.equalTo("isSuccess","0");
//    var j = schedule.scheduleJob(rule,m_task.start(id));
//};
