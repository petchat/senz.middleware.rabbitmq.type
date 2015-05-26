/**
 * Created by zhanghengyang on 15/4/22.
 */

var sub = require('../rabbit_lib/subscriber');
var m_cache = require("location-cache");
var m_task = require("./do_task");
var interval = require("./lib/interval");
var logger = require("./lib/logger");
var task_interval = interval.task_interval.check_interval;
var prev_interval = interval.prev_interval;



///*
//A new motion rawdata arrival called 'new_motion_arrival'
//A new sound rawdata arrival called 'new_sound_arrival'.
//    A new location rawdata arrival called 'new_location_arrival'.



var event = "new_location_arrival";
var queue_name = "placesOfInterests";


exports.init = function(){

    //


    sub.registerEvent(PlaceCallback,queue_name,event);
    logger.info("task_interval is " + task_interval);
    //logger.warn("fuck \n\n\n\n\n\\n\n\n\n\n\nn\fuck");
    setInterval(m_task.start,task_interval);

    //var rule = new timer.RecurrenceRule();
    //rule.minute = task_interval.check_interval;
    //var job = timer.scheduleJob(rule,m_task.start);
    //var cycle_check = timer.scheduleJob(rule,function(){
    //
    //    if (task_interval.check_interval === prev_interval){
    //
    //    }
    //    else {
    //        job.cancel();
    //        rule.minute = check_interval;
    //        job = timer.scheduleJob(rule,m_task.start);
    //    }
    //});




};

var PlaceCallback = function(msg)
{
    logger.info("a new msg ===========> ");
    logger.info(JSON.stringify(msg));
    var obj = {};
    obj["timestamp"] = msg.timestamp;
    obj["tries"] = 0;
    obj["user"] = {};
    m_cache.put(msg.objectId,obj);
    //m_task.start(msg.objectId);


}