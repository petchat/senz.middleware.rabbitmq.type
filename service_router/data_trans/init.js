/**
 * Created by zhanghengyang on 15/7/14.
 */

var sub = require('../rabbit_lib/subscriber');
var m_task = require("./task");
var log = require("../utils/logger").log;
var logger = new log("[data trans]");

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
    logger.debug(msg.object.id,"The calendar object sent at " + msg.object.timestamp);
    m_task.start(msg.object);
};

var predicted_motion_cbx = function(msg) {
    logger.debug(msg.object.id,"The predicted motion object sent at " + msg.object.timestamp);
    m_task.start(msg.object);
};

var ios_motion_cbx = function(msg) {
    logger.debug(msg.object.id,"The ios motion object sent at " + msg.object.timestamp);
    m_task.start(msg.object);
};