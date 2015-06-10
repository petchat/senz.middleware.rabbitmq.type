//require("newrelic"); todo add the new relic monitor
var express = require("express");
var middle = require("./middlewares");
var location = require("./locations/init");
var sound = require("./sounds/init");
var motion = require("./motions/init");
var log = require("./utils/logger").log;
var logger = new log("[main]");
var rollbar = require("rollbar");
var request = require("request");
var bodyParser = require("body-parser");

location.init();


//motion.init();
//sound.init();
//
//rollbar.init("ca7f0172c3d44f54a17c75367116bd2a");


var app = express();

//<-- middlwares
app.use(rollbar.errorHandler('ca7f0172c3d44f54a17c75367116bd2a'));
//app.use(bodyParser.urlencoded({
//    extended: true
//}));
app.use(bodyParser.json());
//middlewares --!>

app.get("/",function(req,res){

    res.send({"return_type":"json"});
    //res.send("index page");

});


app.post("/test_post/",function(req,res){

    var params = req.body
    res.send(params);
})



app.get("/debug/",function(req,res){

    middle.toDebug();
    res.send({"status":"debug mode","logger":"tracer"});

});

app.get("/production/",function(req,res){

    middle.toProd();
    res.send({"status":"production mode","logger":"logentries"});

});

app.get("/train-set/",function(req,res){

    middle.toTrainingData();
    res.send({"status":"data set is training set"});

});

app.get("/real-data/",function(req,res){

    middle.toPredictionData();
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

logger.info("","Service interchange api opened,");

//todo the listen port must be 3000
var server = app.listen(3001, function () {

    var host = server.address().address
    var port = server.address().port
    logger.debug("",'App listening at http://' + host + ":" + port);

})


exports.express_app = app