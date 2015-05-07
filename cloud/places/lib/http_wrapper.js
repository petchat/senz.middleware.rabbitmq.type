/**
 * Created by zhanghengyang on 15/4/24.
 */
var req = require("request");
var m_cache = require("location-cache");
var config = require("../config.json");
var type = require("./lean_type.js");
var logger = require("./logger");
var AV = require("avoscloud-sdk").AV;
////log 3
AV.initialize(config.source_db.APP_ID,config.source_db.APP_KEY);

var suc_ids = [];

var lean_post = function (APP_ID, APP_KEY, params) {

    logger.debug("body params' type is %s, \n params is %s", (typeof params), JSON.stringify(params));
    var promise = new AV.Promise();
    req.post(
        {
            url: "https://leancloud.cn/1.1/batch",
            headers:{
                "X-AVOSCloud-Application-Id":APP_ID,
                "X-AVOSCloud-Application-Key":APP_KEY
            },
            json: params

        },
        function(err,res,body){

            if(err != null ){
                promise.reject("batch request ERROR");}

            else {
                logger.error("request error log is %s", err);
                var body_str = JSON.stringify(body)
                promise.resolve(body);
            }
        }
    );
    return promise
   /// promise
};

var batch_body = function (req_list) {

    var body = {};
    var single = {};
    body["requests"] = [];
    var lean_list = [];
    req_list.forEach(function (b) {
        var temp = {};
        temp["method"] = "POST";
        temp["path"] = "/1.1/classes/" + config.target_db.target_class;
        temp["body"] = b;
        lean_list.push(temp);
    });
    body["requests"] = lean_list;

    logger.debug("batch requests body " + body);

    return body

}

var load_data = function(body) {

    var single_req_list = [];
    //console.log("response results" + typeof json_body);
    logger.error("type is %s %s",typeof pois,JSON.stringify(body));

    body.results.parse_poi.forEach(function (obj) {
        var params = {};
        pois = obj.pois;

        var most_probable_poi = pois.sort(
            function (a, b) {
            return parseFloat(a.distance) - parseFloat(b.distance)
        })[0];
        suc_ids.push(obj.objectId);
        params["isTrainingSample"] = config.is_sample;
        params["userRawdataId"] = obj.objectId;
        params["timestamp"] = obj.timestamp;
        params["processStatus"] = "untreated";
        params["poiType"] = most_probable_poi.poiType;
        params["poiName"] = most_probable_poi.name;
        logger.error(JSON.stringify(m_cache.get(obj.objectId)["user"]));
        params["user"] = type.leanUser(m_cache.get(obj.objectId)["user"].id);
        single_req_list.push(params);
        logger.debug("params are \n" + JSON.stringify(params));

    });
    return [single_req_list,suc_ids];
}
var batch_post = function (url, params, max_timeout) {

    var promise = new AV.Promise();
    req.post(
        {
            url: url,
            //url:"http://httpbin.org/post",
            json: params,
            timeout:max_timeout

        },
        function(err,res,body){
            if(err != null ){
                logger.error("locations batch post meets errors: " + err);
                promise.reject("request error");
            }
            else {
                var body_str = JSON.stringify(body);
                if(body == null || body == undefined || body =='' ) {
                    console.log("11111");
                    logger.error("send to the administrator, the geopoint can't decode the right poi info");
                    promise.reject("ERROR! please see the error log");

                }
                else{
                    logger.debug("locations batch service's body is ",body_str);
                    var tuple = load_data(body);
                    if(!tuple) {
                        promise.reject("ERROR! please see the error log")
                    }
                    else{
                        ///write_in_db body wrapping
                        promise.resolve( [batch_body(tuple[0]),tuple[1]] );
                    }
                }

            }
        }
    );
    return promise;
};


exports.batch_post = batch_post;
exports.lean_post = lean_post;
