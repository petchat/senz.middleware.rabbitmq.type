/**
 * Created by zhanghengyang on 15/7/14.
 */


var sub = require('../rabbit_lib/subscriber');
var m_task = require("./task");
var log = require("../utils/logger").log;
var logger = new log("[data trans]");

///*
//A new motion rawdata arrival called 'new_motion_arrival'
//A new sound rawdata arrival called 'new_sound_arrival'.
//    A new location rawdata arrival called 'new_location_arrival'.



var event = "new_calendar_arrival";
var queue_name = "calendar_queue";
var pre_motion_event = "new_predicted_motion_arrival";
var pre_motion_queue = "predicted_motion_queue";
var ios_motion_event = "new_ios_motion_arrival";
var ios_motion_queue = "ios_motion_queue";

exports.init = function(){
    sub.registerEvent(calendar_cbx, queue_name, event);
    sub.registerEvent(predicted_motion_cbx, pre_motion_queue, pre_motion_event);
    sub.registerEvent(ios_motion_cbx, ios_motion_queue, ios_motion_event);
    logger.info("","now listening to the rabbitmq ...");


};



var calendar_cbx = function(msg) {
    console.log("\n" + "fuck" + "\n");
    logger.info(msg.object.id,"a new calendar data arrived");
    logger.debug(msg.object.id,"The calendar object sent at " + msg.object.timestamp)
    logger.info(msg.object.id,"Data is " + JSON.stringify(msg.object));
    m_task.start(msg.object);
};

var predicted_motion_cbx = function(msg) {
    console.log("\n" + "fuck" + "\n");
    logger.info(msg.object.id,"a new predicted motion data arrived");
    logger.debug(msg.object.id,"The predicted motion object sent at " + msg.object.timestamp)
    logger.info(msg.object.id,"Data is " + JSON.stringify(msg.object));
    m_task.start(msg.object);
};

var ios_motion_cbx = function(msg) {
    console.log("\n" + "fuck" + "\n");
    logger.info(msg.object.id,"a new ios motion data arrived");
    logger.debug(msg.object.id,"The ios motion object sent at " + msg.object.timestamp);
    logger.info(msg.object.id,"Data is " + JSON.stringify(msg.object));
    m_task.start(msg.object);
};