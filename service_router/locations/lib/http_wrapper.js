/**
 * Created by zhanghengyang on 15/4/24.
 */

var log = require("../../utils/logger").log;
var logger = new log("[locations]");
var req = require("request");
var config = require("../config.json");
var type = require("./lean_type.js");
var AV = require("avoscloud-sdk").AV;
var _ = require("underscore");

var lean_post = function (APP_ID, APP_KEY, params) {
    var uuid = params.userRawdataId;
    logger.info(uuid, "Leancloud post started");
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
                logger.error(uuid, JSON.stringify(err));
                if(_.has(res,"statusCode")){
                    logger.debug(uuid,res.statusCode);
                    promise.reject("Error is " + err + " " + "response code is " + res.statusCode);
                }else{
                    promise.reject("Error is " + JSON.stringify(body) );
                }
            }else {
                promise.resolve("Data save successfully")
            }
        }
    );
    return promise;

};



var load_data = function(body, objectId, timestamp) {
    var params = {};
    if(!_.has(body.results, "poi_probability")){
        logger.error(objectId,"Error is " + "key error and the error object is " + JSON.stringify(body.results));
        return;
    }
    var near_home_office = body.results.home_office_label;
    var poi_probability = body.results.poi_probability[0];
    var speed = body.results.speed[0];
    var weather = body.results.weather;

    if(typeof poi_probability !== typeof {} ){
        logger.error(objectId,"Error is " + "Type error and the error object is " + JSON.stringify(body.results));
        return;
    }
    var userRawdataId = objectId;
    var poiProbLv1, poiProbLv2;
    var prob_lv1_object = {};
    var prob_lv2_object = {};
    var level_one = Object.keys(poi_probability);

    level_one.forEach(function(type1){
        var type1_obj = poi_probability[type1];
        prob_lv1_object[type1] = type1_obj.level1_prob;
        prob_lv2_object = _.extend(prob_lv2_object,type1_obj.level2_prob);
    });

    var address = body.results.pois[0].address;


    params["pois"] = body.results.pois[0];
    params["isTrainingSample"] = config.is_sample;
    params["userRawdataId"] = userRawdataId;
    params["timestamp"] = timestamp;
    params["processStatus"] = "untreated";
    params["poiProbLv1"] = prob_lv1_object;
    params["poiProbLv2"] = prob_lv2_object;
    params["near_home_office"] = near_home_office;
    params["speed"] = speed;
    params["weather"] = weather;
    _.extend(params, address);

    return params;
};


var location_post = function (url, params) {
    console.log(JSON.stringify(params));
    var uuid = params.user_trace[0].objectId;
    var promise = new AV.Promise();
    req.post(
        {
            url: url,
            headers:{
                "X-request-Id":uuid
            },
            json: params
        },
        function(err,res,body){
            if(err != null ||  (res.statusCode != 200 && res.statusCode !=201) ){
                logger.error(uuid, "Error is " + JSON.stringify(err));
                if(_.has(res,"statusCode")){
                    logger.debug(uuid,res.statusCode)
                }else{
                    logger.error(uuid,"Response with no statusCode")
                }
                promise.reject("Location service request error");
            }
            else{
                var processed_data = load_data(body, uuid, params.user_trace[0].timestamp );

                if(!processed_data){
                    promise.reject("ERROR!,please check the log");
                    return ;
                }
                processed_data["location"] = params.user_trace[0].location;
                processed_data["radius"] = params.user_trace[0].radius;
                logger.info(uuid, "data proccessed");
                ///write_in_db body wrapping
                promise.resolve(processed_data);
            }

        }
    );

    return promise;
};



exports.location_post = location_post;
exports.lean_post = lean_post;
