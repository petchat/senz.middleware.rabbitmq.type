/**
 * Created by zhanghengyang on 15/7/14.
 */


var sub = require('../rabbit_lib/subscriber');
var m_task = require("./task");
var log = require("../utils/logger").log;
var logger = new log("[applist]");

///*
//A new motion rawdata arrival called 'new_motion_arrival'
//A new sound rawdata arrival called 'new_sound_arrival'.
//    A new location rawdata arrival called 'new_location_arrival'.



var event = "new_applist_arrival";
var queue_name = "applist_queue";


exports.init = function(){

    //


    sub.registerEvent(applist_cbx, queue_name, event);
    logger.info("","now listening to the rabbitmq ...")


};



var applist_cbx = function(msg) {
    console.log("\n" + "fuck" + "\n");
    logger.info(msg.object.id,"a new applist data arrived");
    logger.debug(msg.object.id,"The applist object sent at " + msg.object.timestamp)
    logger.info(msg.object.id,"Data is " + JSON.stringify(msg.object));
    m_task.start(msg.object);

};

