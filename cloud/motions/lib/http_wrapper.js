/**
 * Created by zhanghengyang on 15/4/24.
 */
var logger = require("./logger");
var req = require("request");
var m_cache = require("motion-cache");
var config = require("../config.json");
var type = require("./lean_type.js");
var AV = require("avoscloud-sdk").AV;
////log 3
AV.initialize(config.source_db.APP_ID,config.source_db.APP_KEY);

var lean_post = function (APP_ID, APP_KEY, params) {

    logger.info("lean post started");
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
        function(err,res,body){
            if(err != null ){
                logger.error("request error log is" + err);
                promise.reject("request error");}
            else {
                var body_str = JSON.stringify(body)
                logger.info("body is " + body_str);
                promise.resolve("save success")
            }
        }
    );
    return promise;
   /// promise 传出去。。

};


var parse_body = function(body) {

    var params = {};
    params["processStatus"] = "untreated";
    params["motionProb"] = body.pred[0]; // todo check if given a list..
    params["isTrainingSample"] = config.is_sample;
    return params;

}



var motion_post = function (url, params) {

    var promise = new AV.Promise();
    req.post(
        {
            url: url,
            //url:"http://httpbin.org/post",
            json: params

        },
        function(err,res,body){
            if(err != null ){
                logger.error(JSON.stringify(err));
                promise.reject("request error");
            }
            else if(body.response_ok){
                var body_str = JSON.stringify(body);
                logger.debug("body is ,s%", body_str);
                var processed_data = parse_body(body);
                processed_data["timestamp"] = params.timestamp;
                processed_data["userRawdataId"] = params.objectId;



                if(!m_cache.get(params.objectId)){
                    var inner_error = " the error is due to the cache confliction, IGNORE!"
                    logger.error(inner_error);
                    promise.reject(inner_error);
                }
                try{
                    processed_data["user"] = type.leanUser(m_cache.get(params.objectId)["user"].id);
                }
                catch(e){
                    var inner_error = "error is " + e + ", if the error is due to the cache confliction, IGNORE"
                    logger.error(inner_error);
                    promise.reject(inner_error);
                }

                logger.info("data proccessed");
                ///write_in_db body wrapping
                promise.resolve(processed_data);
            }
            else{
                logger.error(JSON.stringify(body))
                promise.reject(JSON.stringify(body));
            }
        }
    );
    return promise;
};



exports.motion_post = motion_post;
exports.lean_post = lean_post;
