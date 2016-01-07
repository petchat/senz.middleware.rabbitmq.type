/**
 * Created by zhanghengyang on 15/7/14.
 */

var log = require("../utils/logger").log;
var logger = new log("[data trans]");
var config = require("./config.json");
var  _ = require("underscore");
var AV = require("avoscloud-sdk").AV;
var toLeanUser = require("./lean_type").leanUser;
AV.initialize(config.source_db.APP_ID, config.source_db.APP_KEY);
var req = require("request");
var redis = require('promise-redis')();
var client = redis.createClient();
var Installation = AV.Object.extend("_Installation");


var get_user_obj = function(obj){
    var installationId = obj.installation.objectId;

    return client.select(2).then(
        function(){
            return client.get(installationId);
        })
    .then(
        function(cache_user){
            if(cache_user) return AV.Promise.as({
                "__type": "Pointer",
                "className": "_User",
                "objectId": cache_user
            });

            var installation_query = new AV.Query(Installation);
            installation_query.equalTo("objectId", installationId);
            return installation_query.find().then(
                function(installation_list){
                    return AV.Promise.as(installation_list[0]);
                })
                .then(
                    function(installation){
                        var userId = installation.get("user").id;
                        var user = toLeanUser(userId);
                        client.set(installationId, userId);
                        return AV.Promise.as(user);
                    })
                .catch(
                    function(err){
                        return AV.Promise.error(err);
                    });
        })
        .catch(
            function(err){
                return AV.Promise.error(err);
            });
};

var lean_post = function (APP_ID, APP_KEY, params) {

    var uuid = params.userRawdataId;
    logger.info(uuid, "Leancloud post started");
    var promise = new AV.Promise();
    if (params.type == "calendar"){
        url =  "http://api.trysenz.com/mongodb/api/UserCalendar"

    }else if(params.type == "sensor") {
        params.type = "predicted_motion";
        url =  "http://api.trysenz.com/mongodb/api/UserMotion"

    }else if(params.type == "predictedMotion"){
        url =  "http://api.trysenz.com/mongodb/api/UserMotion"
    }

    req.post(
        {
            url: url,
            headers:{
                "Content-Type": "application/json",
                "X-AVOSCloud-Application-Id":APP_ID,
                "X-AVOSCloud-Application-Key":APP_KEY,
                "X-request-Id":uuid
            },
            json: params
        },
        function(err,res,body){
            if(err != null || (res.statusCode != 200 && res.statusCode !=201) ) {
                if(_.has(res,"statusCode")){
                    //console.log(res)
                    logger.debug(uuid,res.statusCode);
                    promise.reject("Error is " + err + " " + "response code is " + res.statusCode);
                }else{
                    logger.error(uuid,"Response with no statusCode");
                    promise.reject("Error is " + err );
                }
            }
            else {
                var body_str = JSON.stringify(body);
                logger.debug(uuid,"Body is " + body_str);
                promise.resolve("Data save successfully")
            }
        }
    );
    return promise;

};

var write_data = function(body){
    var app_key = config.target_db.APP_KEY;
    var app_id = config.target_db.APP_ID;
    return lean_post(app_id, app_key, body);
};

var start = function(data_object){
    var request_id = data_object.objectId;
    logger.info(request_id, "Task start ...");

    get_user_obj(data_object).then(
        function (user) {
            var body = {};
            body.user = user;
            body.userRawdataId = data_object.objectId;
            body.timestamp = data_object.timestamp;
            body.type = data_object.type;

            if(data_object.type == "predictedMotion"){
                var android_motion_to_standard_motion = {
                    "ride": "riding",
                    "sit": "sitting",
                    "run": "running",
                    "walk": "walking",
                    "drive": "driving"
                };

                //var prob_object = {}
                body.rawInfo = data_object.value;
                var motionProb = data_object.value.detectedResults.motion;
                var isWatchPhone = data_object.value.detectedResults.isWatchPhone;
                var new_motionProb = {};
                Object.keys(motionProb).forEach(function(android_key){
                    new_motionProb[android_motion_to_standard_motion[android_key]] = motionProb[android_key]
                });

                //result_list.forEach(function(obj){
                //    prob_object[motion_stat_dict[obj.motionType]] = obj.similarity
                //})
                body.motionProb = new_motionProb;
                body.isWatchPhone = isWatchPhone

            }else if(data_object.type == "calendar"){

                body.calendarInfo = data_object.value;
            }else if(data_object.type == "sensor"){
                //console.log("fuck your")
                var sensor_array = data_object.value.events;
                var activity_array = _.filter(sensor_array,
                    function(sample){
                        return sample.sensorName == "activity"
                    }
                );

                if(activity_array.length == 0){
                    body.motionProb= {"unknown":1}

                }else{

                    var max_prob_activity = _.max(activity_array, function(status){
                        //var keys = Object.keys(status);
                        //console.log(status)

                        var values = status.values;
                        //console.log(values)
                        var temp_max = -1;
                        var temp_type = "";
                        Object.keys(values).forEach(function(type){
                            //console.log("fuck 444")
                            if(values[type] >= temp_max){
                                temp_max = values[type];
                                temp_type = type
                            }
                        });
                        //console.log(temp_max)
                        return temp_max
                    });

                    var values = max_prob_activity.values;

                    var temp_max = -1;
                    var temp_type = "";
                    Object.keys(values).forEach(function(type){
                        if(values[type] >= temp_max){
                            temp_max = values[type];
                            temp_type = type
                        }
                    });
                    //var motion_stat_dict = {"0":"sitting", "1":"driving", "2":"riding", "3":"walking","4":"running"}
                    var ios_type_dict = {"unknown":"unknow","stationary":"sitting","automotive":"driving","cycling":"riding","walking":"walking","running":"running"};

                    body.motionProb = {};
                    body.motionProb[[ios_type_dict[temp_type]]] = 1

                }
            }
            //console.log("fuck your 2")


            return write_data(body);
        },
        function (error) {
            logger.error(request_id, error);
            logger.error(request_id, "User Id requested into failure");
            return AV.Promise.error(error);

        }
    ).then(
        function(result){
            logger.info(request_id, "Data have been written");
            logger.info(request_id, JSON.stringify(result));

        },
        function(error){
            logger.error(request_id, JSON.stringify(error));
            logger.error(request_id, "Data written in  fail ")
        }
            )

};


exports.start = start ;
