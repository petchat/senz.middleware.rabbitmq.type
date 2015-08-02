/**
 * Created by zhanghengyang on 15/7/14.
 */
/**
 * Created by zhanghengyang on 15/4/23.
 */

var log = require("../utils/logger").log;
var logger = new log("[applist]");
var config = require("./config.json");
var AV = require("avoscloud-sdk").AV;
var url_gen = require("../utils/url_generator");
var _ = require("underscore");
AV.initialize(config.source_db.APP_ID, config.source_db.APP_KEY);
var req = require("request");

var Installation = AV.Object.extend("_Installation");

var get_user_id = function(obj){
    //questions on whether to set a request timeout
    logger.info(obj.objectId,"Fetch applist data started");

    var promise = new AV.Promise();

    var installation_query = new AV.Query(Installation);
    var installationId = obj.installation.objectId
    console.log(installationId)
    installation_query.equalTo("objectId", installationId);
    installation_query.first({
        success:function(installation){
            console.log(JSON.stringify(installation));
            var userId = installation.get("user").id;

            promise.resolve(userId)

        },
        error:function(object, error){
            logger.error(obj.objectId, JSON.stringify(error));
            promise.reject(error);
        }
    } )

    return promise

};




var service_post = function (params, url, auth_key) {

    var uuid = params.userRawdataId;
    logger.info(uuid, "static info service post started");
    var promise = new AV.Promise();
    req.post(
        {
            url: url,
            headers:{
                "X-request-Id":uuid,
                "X-senz-Auth": auth_key
            },
            json: params
        },
        function(err,res,body){
            if(err != null || (res.statusCode != 200 && res.statusCode !=201 || body.code !== 0) ) {
                if(_.has(res,"statusCode")){
                    console.log(res)
                    logger.debug(uuid,res.statusCode)
                    logger.error(uuid, body.detail)
                    promise.reject("Error is " + err + " " + "response code is " + res.statusCode);
                }else{
                    logger.error(uuid,"Response with no statusCode")
                    logger.error(uuid, body.detail)
                    promise.reject("Error is " + err );
                }
            }
            else {
                var body_str = JSON.stringify(body)
                logger.debug(uuid,"Body is " + body_str);
                promise.resolve("Data request successfully")
            }
        }
    );
    return promise;

};



var request_static_info = function(body){

    var url = url_gen.static_info_url;
    var auth_key = "5548eb2ade57fc001b000001190f474a930b41e46b37c08546fc8b6c"
    return service_post(body, url, auth_key);

};


var start = function(applist){

    var request_id = applist.objectId
    logger.info(request_id, "Task start ...");

    var promise = get_user_id(applist);

    promise.then(
        function (userId) {
            var body = {};
            body.userId = userId ;
            body.userRawdataId = applist.objectId;
            body.applist = applist.value.packages;
            body.timestamp = applist.timestamp;
            logger.debug(request_id, JSON.stringify(body));

            return request_static_info(body);
        },
        function (error) {
            logger.error(request_id, error);
            logger.error(request_id, "User Id requested into failure");
            return AV.Promise.error(error);

        }
    ).then(
        function(result){
            logger.info(request_id, "Static info service requested successfully")
            logger.info(request_id, "One process end ");

        },
        function(error){
            logger.error(request_id, JSON.stringify(error))
            logger.error(request_id, "Static info service requested in fail")
        }
            )

};


exports.start = start ;