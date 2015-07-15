/**
 * Created by zhanghengyang on 15/7/14.
 */
/**
 * Created by zhanghengyang on 15/4/23.
 */

var log = require("../utils/logger").log;
var logger = new log("[calendar]");
var config = require("./config.json");

var AV = require("avoscloud-sdk").AV;
var toLeanUser = require("./lean_type").leanUser
AV.initialize(config.source_db.APP_ID, config.source_db.APP_KEY);
var req = require("request");

var Installation = AV.Object.extend("_Installation");

var get_user_id = function(obj){
    //questions on whether to set a request timeout
    logger.info(obj.objectId,"Fetch calendar data started");

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
                    console.log(res)
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



var write_data = function(body){

    app_key = config.target_db.APP_KEY;
    app_id = config.target_db.APP_ID;
    return lean_post(app_id, app_key, body);

};


var start = function(calendar){

    var request_id = calendar.objectId
    logger.info(request_id, "Task start ...");

    var promise = get_user_id(calendar);

    promise.then(
        function (userId) {
            var body = {};
            body.user = toLeanUser(userId);
            body.userRawdataId = calendar.objectId;
            body.calendarInfo = calendar.value;
            body.timestamp = calendar.timestamp;

            return write_data(body);
        },
        function (error) {
            logger.error(request_id, error);
            logger.error(request_id, "User Id requested into failure");
            return AV.Promise.error(error);

        }
    ).then(
        function(result){
            logger.info(request_id, "Data have been written")
            logger.info(request_id, "One process end ");

        },
        function(error){
            logger.error(request_id, JSON.stringify(error))
            logger.error(request_id, "Data written in  fail ")
        }
            )

};


exports.start = start ;