/**
 * Created by zhanghengyang on 15/4/22.
 */

var sub = require('../rabbit_lib/subscriber');
var m_task = require("./do_task");
var log = require("../utils/logger").log;
var logger = new log("[locations]");
var redis = require('promise-redis')();
var client0 = redis.createClient();
var client1 = redis.createClient();

var config = require("./config.json");
var AV = require("avoscloud-sdk").AV;
AV.initialize(config.source_db.APP_ID,config.source_db.APP_KEY);

var event = "new_location_arrival";
var queue_name = "placesOfInterests";


exports.init = function(){
    sub.registerEvent(locationCallback,queue_name,event);
    logger.info("","now listening to the rabbitmq ...");
    scheduleCleanFromRedis();
};

var locationCallback = function(msg){
    var log_obj = msg.object || msg.objectId;
    m_task.start(log_obj);
};

var scheduleFailed = function(){
    return client0.select(0)
        .then(
            function(){
                return client0.srandmember('location');
            })
        .then(
            function(logId){
                return client0.get(logId);
            })
        .then(
            function(item){
                if(item && item.length > 100){
                    var obj = JSON.parse(item);
                    if(obj.tries < 10 && obj.location.latitude > 0 && obj.location.longitude>0){
                        logger.debug("From Redis db0", JSON.stringify(obj));
                        m_task.start(obj);
                        return AV.Promise.all(client0.srem('location', obj.objectId), client0.del(obj.objectId));
                    }else{
                        return AV.Promise.all(client0.srem('location', obj.objectId), client0.del(obj.objectId)).then(
                            function(){
                                return backupToDb1(obj.objectId, obj);
                            })
                    }
                }
            })
        .catch(
            function(e){
                logger.error("From Redis db0", JSON.stringify(e));
                return Promise.error(e);
            })
};

var scheduleFailed2 = function(){
    return client1.select(1)
        .then(
            function(){
                return client1.srandmember('location');
            })
        .then(
            function(logId){
                return client1.get(logId);
            })
        .then(
            function(item){
                var obj = JSON.parse(item);
                if(obj.tries >= 100 || obj.location.latitude <= 0 || obj.location.longitude <= 0){
                    logger.debug("From Redis db1", JSON.stringify(obj));
                    return AV.Promise.all(client1.srem('location', obj.objectId), client1.del(obj.objectId));
                }else{
                    m_task.start(obj);
                    return AV.Promise.all(client1.srem('location', obj.objectId), client1.del(obj.objectId));
                }
            })
        .catch(
            function(e){
                logger.error("From Redis db1", JSON.stringify(e));
                return AV.Promise.error(e);
            })
};

var backupToDb1 = function(id, obj){
    return client1.select(1)
        .then(
            function(){
                return client1.sadd('location', id);
            })
        .then(
            function(){
                return client1.set(id, JSON.stringify(obj));
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
    }, 1000);
    setInterval(function(){
        scheduleFailed2();
    }, 10000)
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
