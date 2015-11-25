/**
 * Created by zhanghengyang on 15/5/25.
 */


var request = require("supertest");
var app = require("./main.js").express_app;
var should = require("should");

request(app)
    .get("/")
    .expect("Content-Type",/json/)
    //.expect("Content-Length", "20")
    .expect(200)
    //.expect({"return_type":"json"},function(err){
    //
    //})
    .end(function(err,res){
        var body = res.body;
        body.should.have.property("return_type","json");
        console.log(body);
        console.log("fuck");
        console.log(err);
        //if(err) throw err;
    });


var test_ob = {"a":"b"};
request(app)
    .post("/test_post/")
    .send(test_ob)
    .expect("Content-Type",/json/)
    .expect(200)
    .end(function(err,res){
         var body = res.body;
         console.log(body);

         body.should.have.property("a","b")
         console.log("fuck again");
         console.log(err);
     })


var AV = require("avoscloud-sdk").AV;

var promise = new AV.Promise();
var uuid = require("uuid");

var NodeCache = require("node-cache");
//


var a = function(){
    return this
}

var l_a = new a();
var l_b = new a();
l_a.test = 1
l_b.test = 2
console.log(l_a.test)
console.log(l_b.test)




//values.keys().forEach(key){
//    if(values[key] > temp_max){
//        temp_max = values[key]
//    }
//}



//console.log(uuid.v4());
//
//var spawn = require('child_process').spawn,
//    grep  = spawn('grep', ['ssh']);
//
//
//var AV = require("avoscloud-sdk").AV;
//AV.initialize("9ra69chz8rbbl77mlplnl4l2pxyaclm612khhytztl8b1f9o","1zohz2ihxp9dhqamhfpeaer8nh1ewqd9uephe9ztvkka544b")
//var LOG = AV.Object.extend("Log");
//var query = new AV.Query(LOG)
//query.include("attachment");
//query.equalTo("objectId","558a870ee4b02dd0d665719e")
//query.first(
//    function(object){
//        console.log(JSON.stringify(object))
//        console.log(object.get("attachment").url())
//    }
//);

//var promise = new AV.Promise();
//
//a = {"objectId":1}
//console.log(a.objectId);
//var mycache = new NodeCache();
//
//var a = function(tag){
//    return {
//        "logger":function(id, msg){
//            console.log(arguments);
//            process.env
//            require("tracer").colorConsole(
//            {
//                format : "{{timestamp}} <{{title}}> {{message}} (in {{file}}:{{line}})",
//                dateformat : "isoDateTime"
//            }
//        ).info(tag + " " +msg + " "+ id)
//        },
//        "b":2
//    }
//};
//
//var a1 = new a("location");
//var a2 = new a("sound");
//
//a1.logger("fuck");
//a2.logger(msg = "fuck2");

//
//console.log('start');
//process.nextTick(function() {
//    console.log('nextTick callback');
//});
//console.log('scheduled');
//for(i=0;i<=1000000;i++){
//    console.log(i)
//}
//// Output:
// start
// scheduled
// nextTick callback

//
//var a = function(id){
//    console.log(id)
//};
//
//var i = setInterval(function(){
//    //console.log(child.pid);
//    console.log('Spawned child pid: ' + grep.pid);
//    grep.stdin.end();
//    //console.log(i._idleStart)
//},1);
//

//
//var s = function(){
//    var b = 1;
//    a();
//}
//s()
//


//
//
//var json = require("jsonfile");
//var path = require("path");
//console.log(path.resolve("./"))
//console.log(path.dirname(__filename))
//json.readFile("./service_router/config.json",function(err,obj){
//
//    console.log(JSON.stringify(err));
//    console.log(JSON.stringify(obj))
//
//})


//mycache.set("a","b",function(err,success){
//    if(!err && success){
//        console.log(success);
//        return new AV.Promise.error("fuck");
//    }
//})
//
//var i = 0;
//var func = function(){
//    var func2 = function(){
//        var promise = new AV.Promise();
//        mycache.set("a",1,function(){
//            while(i<10000000){
//                i = i +1;
//            }
//           promise.resolve("a");
//        });
//        return promise
//    };
//
//    return func2();
//};
//
//func().then(
//    function(success){
//        console.log("success is " + success);
//        return new AV.Promise.as("aasdgasdfadsf");
//    },
//    function(error){
//        console.log("error is " + error);
//        process.exit();
//    })
//    .then(
//    function(a){
//        console.log("suc is " + a);
//    },
//    function(b){
//
//    }
//);
//
//
//



