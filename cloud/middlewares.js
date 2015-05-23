/**
 * Created by zhanghengyang on 15/5/4.
 */

var location = require("./places/init");
var sound = require("./sounds/init");
var motion = require("./motions/init");
var motion_log = require("./motions/lib/logger");
var location_log = require("./places/lib/logger");
var sound_log = require("./sounds/lib/logger");
var main_log = require("./utils/logger");
var json = require("jsonfile");

var location_config = "./cloud/places/config.json";
var motion_config = "./cloud/motions/config.json";
var sound_config = "./cloud/sounds/config.json";
var main_config = "./config.json";

exports.toDebug = function(){

    var l_obj = json.readFileSync(location_config);
    var m_obj = json.readFileSync(motion_config);
    var s_obj = json.readFileSync(sound_config);
    var main_obj = json.readFileSync(main_config)
    //todo write and read async
    if (l_obj.debug) {
        location_log.info("location is already in debug mode");
    }
    else{
        l_obj.debug = true;
        json.writeFile(location_config,l_obj,function(err){
            if(!err){
                location_log.info("now! location is in debug mode...");

            }
            else {
                location_log.error(err);
            }
        });
    }


    if (m_obj.debug) {
        motion_log.info("motion is already in debug mode");
    }
    else{
        m_obj.debug = true;
        json.writeFile(motion_config,m_obj,function(err){
            if(!err){
                motion_log.info("now! motion is already in debug mode");
            }
            else{
                motion_log.error(err);
            }
        });

    }

    if (s_obj.debug) {
        sound_log.info("sound is already in debug mode");
    }
    else{
        s_obj.debug = true;
        json.writeFile(sound_config,s_obj,function(err){
            if(!err){
                sound_log.info("now! sound is already in debug mode");
            }
            else {
                sound_log.error(err);
            }
        });

    }

    if (main_obj.debug) {
        main_log.info("main module is already in debug mode");
    }
    else{
        main_obj.debug = true;
        json.writeFile(main_config,main_obj,function(err){
            if(!err){
                main_log.info("now! main module is already in debug mode");
            }
            else{
                main_log.error(err);
            }
        });
    }
};

//todo complete the following three functions
exports.toProd = function(){

    //todo write and read async
    var l_obj = json.readFileSync(location_config);
    if (!l_obj.debug) {
        location_log.info("location is already in production mode");
    }
    else{
        l_obj.debug = false;
        json.writeFile(location_config,l_obj);
        location_log.info("now! location is in production mode...");

    }

    var m_obj = json.readFileSync(motion_config);
    if (!m_obj.debug) {
        motion_log.info("motion is already in production mode");
    }
    else{
        m_obj.debug = false;
        json.writeFile(motion_config,m_obj);
        motion_log.info("now! motion is already in production mode");

    }

    var s_obj = json.readFileSync(sound_config);
    if (!s_obj.debug) {
        sound_log.info("sound is already in production mode");
    }
    else{
        s_obj.debug = false;
        json.writeFile(sound_config,s_obj);
        motion_log.info("now! sound is already in production mode");

    }

    if (!main_obj.debug) {
        main_log.info("main module is already in production mode");
    }
    else{
        main_obj.debug = false;
        json.writeFile(main_config,main_obj);
        main_log.info("now! main module is already in debug mode");

    }

};

exports.isNotTraining = function(){

    var l_obj = json.readFileSync(location_config);
    if (l_obj.isS) {
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

exports.isTraining = function(){

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

exports.start_location_service = function(){
    location.init();
}
exports.start_sound_service = function(){
    sound.init();
}
exports.start_motion_service = function(){
    motion.init();
}
