/**
 * Created by zhanghengyang on 15/4/22.
 */

var sub = require('../rabbit_lib/subscriber');
var m_cache = require("memory-cache");
var m_task = require("./do_task");
var interval = require("./lib/interval");
var task_interval = require("../config.json").interval
var minute = interval.minute;
var hour = interval.hour;
var log = require("../utils/logger").log;
var logger = new log("[locations]");
var redis = require('promise-redis')();
var client = redis.createClient();

var config = require("./config.json");
var AV = require("avoscloud-sdk").AV;
AV.initialize(config.source_db.APP_ID,config.source_db.APP_KEY);
var Fail = AV.Object.extend("Failed");

var event = "new_location_arrival";
var queue_name = "placesOfInterests_o";


exports.init = function(){
    console.log(process.env);
    sub.registerEvent(locationCallback,queue_name,event);
    logger.info("","now listening to the rabbitmq ...");
    logger.debug("","Scheduler start ... \n Interval is " + task_interval);
    //todo scheduleCleanFromLeanCloud();
    scheduleCleanFromRedis();
};

var locationCallback = function(msg)
{
    var log_obj = msg.object || msg.objectId;
    m_task.start(log_obj);
};


var scheduleCleanFromRedis = function(){
    var scheduleFailed = function(){
        client.smembers('location')
            .then(function(l_list){
                var promises = [];
                l_list.forEach(function(LogId){
                    promises.push(client.get(LogId) || LogId);

                    setTimeout(function(){
                        client.srem('location', LogId);
                        client.del(LogId);
                    }, 5*60*1000);
                });
                return Promise.all(promises);
            })
            .then(
                function(errList){
                    errList.forEach(function(item){
                        logger.debug('scheduleFailed', item);
                        if(item) m_task.start(JSON.parse(item));

                    });
                });
    };
    setInterval(function(){
        scheduleFailed();
    }, 60*1000)
};

var scheduleCleanFromMemoryCache = function(){
    setInterval(
        function () {
            if(m_cache.size()>0) {
                var keys = m_cache.keys();
                var id = keys.pop();
                m_task.start(m_cache.get(id));
            }
        }, task_interval);
};

var scheduleCleanFromLeanCloud = function(){

    var rule = new timer.RecurrenceRule();
    //todo add the failing ids to the memory cache to check for 3 times

    rule.minute = minute ;
    rule.hour = hour ;
    var fail_query = AV.Query(Fail);
    //todo determine the 2 options: failing from leancloud once would throw the ids? or throw the ids according to the lastUpdatedAt?
    fail_query.equalTo("isSuccess","0");
    var j = schedule.scheduleJob(rule,m_task.start(id));
}
