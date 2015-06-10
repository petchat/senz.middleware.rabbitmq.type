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
                logger.error(uuid,"Request error log is" + err);
                promise.reject("Error is " + err + "," + "response code is " + res.statusCode);
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



var load_data = function(body) {


    var params = {};
    var obj = body.results[0];
    var uuid = obj.objectId;
    //console.log("response results" + typeof json_body);
    logger.debug(uuid, "Body is " + JSON.stringify(body));
        var poi_probability = obj.poi_probability;
        if(typeof poi_probability !== typeof {}){
            logger.error(uuid,"Error is " + "key error and the error object is " + obj);
            return;
        }
        var timestamp = obj.timestamp;
        var userRawdataId = obj.objectId;
        var poiProbLv1, poiProbLv2;
        var prob_lv1_object = {};
        var prob_lv2_object = {};
        var level_one = Object.keys(poi_probability);

        level_one.forEach(function(type1){
            var sum = null;
            var type1_obj = poi_probability[type1];
            prob_lv2_object = _.extend(prob_lv2_object,type1_obj);
            Object.keys(type1_obj).forEach(function(type2){
                sum += type1_obj[type2];
            });
            prob_lv1_object[type1] = sum;
        });

        params["isTrainingSample"] = config.is_sample;
        params["userRawdataId"] = userRawdataId;
        params["timestamp"] = timestamp
        params["processStatus"] = "untreated";
        params["poiProbLv1"] = prob_lv1_object;
        params["poiProbLv2"] = prob_lv2_object;
        if(!m_cache.get(obj.objectId)){
            logger.error(uuid,"The id " + id + "has been deleted!");
            return;
        }
        //async error catch using domain, although it may cause memory leaks.
        //http://www.alloyteam.com/2013/12/node-js-series-exception-caught/

        try{
            params["user"] = type.leanUser(m_cache.get(obj.objectId)["user"].id);
        }
        catch (e){
            logger.error(uuid,"error is " + e + ", if the error is due to the cache confliction, IGNORE");
            return ;
        }

        logger.debug(uuid,"params are \n" + JSON.stringify(params));

    return params;
};





var location_post = function (url, params) {

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
                promise.reject("Location service request error");
            }
            else{
                var body_str = JSON.stringify(body);
                logger.debug(uuid, "body is  " + body_str);
                var processed_data = load_data(body);

                if(!processed_data){
                    promise.reject("ERROR!,please check the log")
                }

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
