/**
 * Created by zhanghengyang on 15/4/24.
 */

var log = require("../../utils/logger").log;
var logger = new log("[locations]");
var req = require("request");
var m_cache = require("location-cache");
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
                logger.debug(uuid,"Body is " + body_str);
                promise.resolve("Data save successfully")
            }
        }
    );
    return promise;

};



var load_data = function(body, objectId, timestamp) {


    var params = {};
    if(!_.has(body.results, "poi_probability")){
        logger.error(uuid,"Error is " + "key error and the error object is " + JSON.stringify(body.results));
        return;
    }
    var poi_probability = body.results.poi_probability[0];
    var uuid = objectId;
    //console.log("response results" + typeof json_body);
    if(typeof poi_probability !== typeof {} ){
        logger.error(uuid,"Error is " + "Type error and the error object is " + JSON.stringify(body.results));
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

    var address = body.results.pois[0].address


    params["pois"] = body.results.pois[0];
    params["isTrainingSample"] = config.is_sample;
    params["userRawdataId"] = userRawdataId;
    params["timestamp"] = timestamp
    params["processStatus"] = "untreated";
    params["poiProbLv1"] = prob_lv1_object;
    params["poiProbLv2"] = prob_lv2_object;
    _.extend(params, address)
    
    logger.debug(uuid,"params are \n" + JSON.stringify(params));

    if(!m_cache.get(objectId)){
            logger.error(uuid,"The id " + uuid + " has been deleted!");
            return;
        }
        //async error catch using domain, although it may cause memory leaks.
        //http://www.alloyteam.com/2013/12/node-js-series-exception-caught/

        try{
            params["user"] = type.leanUser(m_cache.get(objectId)["user"].id);
        }
        catch (e){
            logger.error(uuid,"error is " + e + ", if the error is due to the cache confliction, IGNORE");
            return ;
        }


    return params;
};





var location_post = function (url, params) {

    var uuid = params.user_trace[0].objectId;
    logger.debug(uuid,"Params are " + JSON.stringify(params));

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

                logger.debug(uuid,JSON.stringify(res));
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
                var body_str = JSON.stringify(body);
                logger.debug(uuid, "Body is  " + body_str);
                var processed_data = load_data(body, uuid, params.user_trace[0].timestamp );

                if(!processed_data){
                    promise.reject("ERROR!,please check the log")
                    return ;
                }
                processed_data["location"] = params.user_trace[0].location

                processed_data["radius"] = params.user_trace[0].radius
                console.log("fuck \n")

                console.log(JSON.stringify(processed_data));
                console.log("fuck \n");

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
