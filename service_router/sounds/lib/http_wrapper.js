/**
 * Created by zhanghengyang on 15/4/24.
 */
var log = require("../../utils/logger").log;
var logger = new log("[sounds]");
var req = require("request");
var m_cache = require("sound-cache");
var config = require("../config.json");
var sample_config = require("../../config.json");
var type = require("./lean_type.js");
var AV = require("avoscloud-sdk").AV;
var _ = require("underscore");
////log 3
AV.initialize(config.source_db.APP_ID,config.source_db.APP_KEY);

var lean_post = function (APP_ID, APP_KEY, params) {

    var uuid = params.userRawdataId;
    logger.info(uuid,"Lean post started");
    var promise = new AV.Promise();
    req.post(
        {
            url: "https://leancloud.cn/1.1/classes/"+config.target_db.target_class,
            headers:{
                "X-AVOSCloud-Application-Id":APP_ID,
                "X-AVOSCloud-Application-Key":APP_KEY
            },
            json: params
        },
        function(err,res,body_str){

            if(err != null || (res.statusCode != 200 && res.statusCode !=201) ) {
                logger.error(uuid,"Request error log is,%s", err);
                if(_.has(res,"statusCode")){
                    logger.debug(uuid,res.statusCode)
                    promise.reject("Error is " + err + " " + "response code is " + res.statusCode);
                }else{
                    logger.error(uuid,"Response with no statusCode")
                    promise.reject("Error is " + err );
                }
            }
            else {
                body_str = JSON.stringify(body_str);
                logger.info(uuid,"Body is " + body_str);
                promise.resolve("Data saved successfully")
            }
        }
    );
    return promise

};


var parse_body = function(body) {

    var params = {};
    params["processStatus"] = "untreated";
    params["isTrainingSample"] = sample_config.is_sample;
    if(_.has(body,"ctx_probability")){
        params["soundProb"] = body.ctx_probability;
    }
    else{
        return null;
    }
    return params;

}



var sound_post = function (url, params) {

    var uuid = params.objectId;
    var promise = new AV.Promise();
    req.post(
        {
            url: url,
            //url:"http://httpbin.org/post",
            json: params,
            headers:{
                "X-request-Id":uuid
            }

        },
        function(err,res,body){
            if(err != null ||  (res.statusCode != 200 && res.statusCode !=201) ){
                logger.debug(uuid,JSON.stringify(res));
                if(_.has(res,"statusCode")){
                    logger.debug(uuid,res.statusCode)
                }else{
                    logger.error(uuid,"Response with no statusCode")
                }

                logger.error(uuid,"This is the req error,error is " + JSON.stringify(err))
                promise.reject("request error");
            }
            else if(body.response_ok){
                var body_str = JSON.stringify(body);
                logger.debug(uuid,"Body is ,s%", body_str);
                var processed_data = parse_body(body);
                if(!processed_data){
                    promise.reject("Key error, please check the func PARSE_BODY");
                    return;
                }

                processed_data["timestamp"] = params.timestamp;
                processed_data["userRawdataId"] = params.objectId;
                processed_data["sound_url"] = params.soundUrl;

                if(!m_cache.get(params.objectId)){
                    var inner_error = "The error is due to the cache confliction, IGNORE!"
                    logger.error(uuid,inner_error);
                    promise.reject(inner_error);
                    return;
                }
                try{
                    processed_data["user"] = type.leanUser(m_cache.get(params.objectId)["user"].id);
                }
                catch(e){
                    var inner_error = "Error is " + e + ", if the error is due to the cache confliction, IGNORE"
                    logger.error(uuid,inner_error);
                    promise.reject(inner_error);
                    return;
                }
                logger.debug(uuid,"Processed data is \n" + JSON.stringify(processed_data));
                logger.info(uuid,"Data proccessed");
                ///write_in_db body wrapping
                promise.resolve(processed_data);
            }
            else{
                logger.error("This is the sound service error " + JSON.stringify(body));
                promise.reject(JSON.stringify(body));
            }
        }
    );
    return promise;
};


exports.sound_post = sound_post;
exports.lean_post = lean_post;
