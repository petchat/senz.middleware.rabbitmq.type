/**
 * Created by zhanghengyang on 15/4/24.
 */

var log = require("../../utils/logger").log;
var logger = new log("[motions]");
var req = require("request");
var m_cache = require("motion-cache");
var config = require("../config.json");
var sample_config = require("../../config.json");
var type = require("./lean_type.js");
var AV = require("avoscloud-sdk").AV;
var uuid = require("uuid");
var _ = require("underscore");

AV.initialize(config.source_db.APP_ID,config.source_db.APP_KEY);

var lean_post = function (APP_ID, APP_KEY, params) {

    var uuid = params.userRawdataId;
    logger.info(uuid, "Lean post started");
    var promise = new AV.Promise();
    req.post(
        {
            url: "https://leancloud.cn/1.1/classes/"+config.target_db.target_class,
            headers:{
                "X-AVOSCloud-Application-Id":APP_ID,
                "X-AVOSCloud-Application-Key":APP_KEY,
                "X-request-Id":uuid
            },
            json: params
        },
        function(err,res,body){
            if(err != null || (res.statusCode != 200 && res.statusCode !=201) ) {
                logger.error(uuid,"Request error log is" + err);
                if(_.has(res,"statusCode")){
                    logger.debug(uuid,res.statusCode)
                    promise.reject("Error is " + err + " " + "response code is " + res.statusCode);
                }else{
                    logger.error(uuid,"Response with no statusCode")
                    promise.reject("Error is " + err );
                }

            }
            else {
                var body_str = JSON.stringify(body)
                logger.info(uuid,"Body is " + body_str);
                promise.resolve("Data save successfully")
            }
        }
    );
    return promise;

};


var parse_body = function(body) {

    var params = {};
    params["processStatus"] = "untreated";
    params["motionProb"] = body.pred[0]; // todo check if given a list..
    params["isTrainingSample"] = sample_config.is_sample;
    return params;

};



var motion_post = function (url, params) {

    var uuid = params.objectId;
    var promise = new AV.Promise();
    req.post(
        {
            url: url,
            //url:"http://httpbin.org/post",
            headers:{
                "X-request-Id":uuid
            },
            json: params

        },
        function(err,res,body){
            if(err != null ||  (res.statusCode != 200 && res.statusCode !=201) ){
                logger.error(uuid, JSON.stringify(err));
                if(_.has(res,"statusCode")){
                    logger.debug(uuid,res.statusCode)
                }else{
                    logger.error(uuid,"Response with no statusCode")
                }

                promise.reject("motion service request error");
            }
            else if(body.response_ok){
                var body_str = JSON.stringify(body);
                logger.debug(uuid, "body is  " + body_str);
                var processed_data = parse_body(body);
                processed_data["timestamp"] = params.timestamp;
                processed_data["userRawdataId"] = params.objectId;
                processed_data["sensor_data"] = {"events":params.rawData};


                if(!m_cache.get(params.objectId)){
                    var inner_error = " the error is due to the cache confliction, IGNORE!"
                    logger.error(uuid, inner_error);
                    promise.reject(inner_error);
                    return;
                }
                try{
                    processed_data["user"] = type.leanUser(m_cache.get(params.objectId)["user"].id);
                }
                catch(e){
                    var inner_error = "error is " + e + ", if the error is due to the cache confliction, IGNORE"
                    logger.error(uuid, inner_error);
                    promise.reject(inner_error);
                    return;
                }

                logger.info(uuid, "data proccessed");
                ///write_in_db body wrapping
                promise.resolve(processed_data);
            }
            else{
                logger.error(uuid,"Body is " + JSON.stringify(body))
                promise.reject(JSON.stringify(body));
            }
        }
    );
    return promise;
};



exports.motion_post = motion_post;
exports.lean_post = lean_post;
