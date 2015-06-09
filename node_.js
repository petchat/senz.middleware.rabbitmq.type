var AV = require("avoscloud-sdk").AV;

var promise = new AV.Promise();


var NodeCache = require("node-cache");

var mycache = new NodeCache();



//mycache.set("a","b",function(err,success){
//    if(!err && success){
//        console.log(success);
//        return new AV.Promise.error("fuck");
//    }
//})

var i = 0;
var func = function(){
    var func2 = function(){
        var promise = new AV.Promise();
        mycache.set("a",1,function(){
            while(i<10000000){
                i = i +1;
            }
           promise.resolve("a");
        });
        return promise
    };

    return func2();
};

func().then(
    function(success){
        console.log("success is " + success);
        return new AV.Promise.as("aasdgasdfadsf");
    },
    function(error){
        console.log("error is " + error);
        process.exit();
    })
    .then(
    function(a){
        console.log("suc is " + a);
    },
    function(b){

    }
);



