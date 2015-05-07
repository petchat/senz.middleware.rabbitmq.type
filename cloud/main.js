var publisher = require('./rabbit_lib/publisher');
var express = require("express");
var middle = require("./middlewares");
var location = require("./places/init");
var sound = require("./sounds/init");
var motion = require("./motions/init");
var logger = require("./utils/logger");


//location.init();
//motion.init();
//sound.init();

var app = express();
app.get("/debug/",function(req,res){
    middle.toDebug();
    res.send({"status":"debug mode","logger":"tracer"});

});

app.get("/production/",function(req,res){
    middle.toProd();
    res.send({"status":"production mode","logger":"logentries"});

});

app.get("/train-set/",function(req,res){
    middle.isTraining();
    res.send({"status":"data set is training set"});

});

app.get("/real-data/",function(req,res){
    middle.isNotTraining();
    res.send({"status":"data set is not training set"});


app.get("/services/motion/start/",function(req,res){

    motion.init();
    res.send({"status":"motion service started"});
});

app.get("/services/location/start/",function(req,res){

    location.init();
    res.send({"status":"location service started"})
});

app.get("/services/sound/start/",function(req,res){

    sound.init();
    res.send({"status":"sound service started"});
});

});
logger.info("service interchange api opened,")
app.listen(8080);


