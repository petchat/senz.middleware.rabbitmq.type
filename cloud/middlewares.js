/**
 * Created by zhanghengyang on 15/5/4.
 */

var location = require("./places/init");
var sound = require("./sounds/init");
var motion = require("./motions/init");
var motion_log = require("./motions/lib/logger");
var location_log = require("./places/lib/logger");
var sound_log = require("./sounds/lib/logger");
var json = require("jsonfile");

var location_config = "./cloud/places/config.json";
var motion_config = "./cloud/motions/config.json";
var sound_config = "./cloud/sounds/config.json";

exports.toDebug = function(){

    var l_obj = json.readFileSync(location_config);
    if (l_obj.debug) {
        location_log.info("location is already in debug mode");
    }
    else{
        l_obj.debug = true;
        json.writeFile(location_config,l_obj);
        location_log.info("now! location is in debug mode...");

    }

    var m_obj = json.readFileSync(motion_config);
    if (m_obj.debug) {
        motion_log.info("motion is already in debug mode");
    }
    else{
        m_obj.debug = true;
        json.writeFile(motion_config,m_obj);
        motion_log.info("now! motion is already in debug mode");

    }

    var s_obj = json.readFileSync(sound_config);
    if (s_obj.debug) {
        sound_log.info("location is already in debug mode");
    }
    else{
        s_obj.debug = true;
        json.writeFile(sound_config,s_obj);
        motion_log.info("now! sound is already in debug mode");

    }

};

//todo complete the following three functions
exports.toProd = function(){

};

exports.isNotTraining = function(){

};

exports.isTraining = function(){

};

exports.start_location_service = function(){
    location.init();
}
exports.start_sound_service = function(){
    sound.init();
}
exports.start_motion_service = function(){
    motion.init();
}
