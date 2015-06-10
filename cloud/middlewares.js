/**
 * Created by zhanghengyang on 15/5/4.
 */

var location = require("./locations/init");
var sound = require("./sounds/init");
var motion = require("./motions/init");
var motion_log = require("./utils/logger");
var location_log = require("./utils/logger");
var sound_log = require("./utils/logger");
var main_log = require("./utils/logger");
var json = require("jsonfile");
var util = require("util");


var path = require("path");
var cur_dir_name = path.dirname(__filename);
console.log(cur_dir_name)
main_log.error(cur_dir_name);
var location_config = cur_dir_name + "/places/config.json";
var motion_config = cur_dir_name + "/motions/config.json";
var sound_config = cur_dir_name + "/sounds/config.json";
//var sound_config = "./config.json";
var main_config = cur_dir_name + "/config.json";


var rewriteData = function(file,logger,type,target,value,aim){

    console.log("file is " + file);
    json.readFile(file,function(err,obj){
        if(!err){

            logger.debug(util.inspect(obj));
            if(obj[target] != value){
                obj[target] = value
                json.writeFile(file,obj,function(err){
                    if(!err){
                        console.log("type is " + type);
                        logger.info("now! " + type + " is " + aim)
                    }
                    else{
                        logger.error(err);
                    }
                })
            }
            else{
                logger.info(type + " is already " + aim)
            }
        }
        else{
            logger.error(JSON.stringify(err));
        }
    })

}



exports.toDebug = function(){

    //todo add promise
    var aim = "in debug mode";
    var target = "debug";
    rewriteData(location_config,location_log,"location",target,true,aim);
    rewriteData(sound_config,sound_log,"sound",target,true,aim);
    rewriteData(motion_config,motion_log,"motion",target,true,aim);
    rewriteData(main_config,main_log,"main",target,true,aim);

};

//todo complete the following three functions
exports.toProd = function(){

    //todo add promise

    rewriteData(location_config,location_log,"location","debug",false,"in production mode");
    rewriteData(sound_config,sound_log,"sound","debug",false,"in production mode");
    rewriteData(motion_config,motion_log,"motion","debug",false,"in production mode");
    rewriteData(main_config,main_log,"main","debug",false,"in production mode");


};



exports.toPredictionData = function(){

    //todo add promise

    var target = 0;
    rewriteData(location_config,location_log,"location","is_sample",target,"providing prediction data");
    rewriteData(motion_config,motion_log,"motion","is_sample",target,"providing prediction data");
    rewriteData(sound_config,sound_log,"sound","is_sample",target,"providing prediction data");



};

exports.toTrainingData = function(){

    //todo add promise

    var target = 1;
    rewriteData(location_config,location_log,"location","is_sample",target,"providing training data");
    rewriteData(motion_config,motion_log,"motion","is_sample",target,"providing training data");
    rewriteData(sound_config,sound_log,"sound","is_sample",target,"providing training data");

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
