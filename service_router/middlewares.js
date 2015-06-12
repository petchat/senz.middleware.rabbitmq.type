/**
 * Created by zhanghengyang on 15/5/4.
 */
var util = require("util");
var path = require("path");
var json = require("jsonfile");

var location = require("./locations/init");
var sound = require("./sounds/init");
var motion = require("./motions/init");
var log = require("./utils/logger").log;
var main_log = new log("[main]");
var cur_dir_name = path.dirname(__filename);
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

};



exports.toDebug = function(){

    //todo add promise
    var aim = "in debug mode";
    var target = "debug";

    rewriteData(main_config,main_log,"main",target,true,aim);

};

//todo complete the following three functions
exports.toProd = function(){

    //todo add promise

    rewriteData(main_config,main_log,"main","debug",false,"in production mode");

};



exports.toPredictionData = function(){

    //todo add promise

    var target = 0;
    rewriteData(main_config,main_log,"main","debug",target ,"providing prediction data");

};

exports.toTrainingData = function(){

    //todo add promise
    var target = 1;
    rewriteData(main_config,main_log,"main","debug",target ,"in production mode");
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
