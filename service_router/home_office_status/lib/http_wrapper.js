/**
 * Created by zhanghengyang on 15/4/24.
 */

var log = require("../../utils/logger").log;
var logger = new log("[home-office-status]");
var req = require("request");
var m_cache = require("home-office-status-cache");
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



var load_data = function(body, timestamp, objectId) {

    var uuid = objectId;
    var params = {}
    params.timestamp = timestamp;
    params.rawDataId = objectId;
    params.atPlace = body.results.home_office_status.at_place;
    params.goingHome = body.results.home_office_status.is_going_home;
    params.goingOffice = body.results.home_office_status.is_going_office;


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

    var uuid = params.objectId;
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
                var processed_data = load_data(body, params.timestamp, uuid);

                if(!processed_data){
                    promise.reject("ERROR!,please check the log")
                    return ;
                }
                processed_data["location"] = params.geo_point.location

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
