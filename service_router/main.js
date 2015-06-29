//require("newrelic"); todo add the new relic monitor
var express = require("express");
var app = express();
var middle = require("./middlewares");
var location = require("./locations/init");
var sound = require("./sounds/init");
var motion = require("./motions/init");
var log = require("./utils/logger").log;
var logger = new log("[main]");
var request = require("request");
var bodyParser = require("body-parser");
var bugsnag = require("bugsnag");
var url_generator = require("./utils/url_generator");

//bugsnag initialization
logger.debug(JSON.stringify(process.env));
if(process.env.APP_ENV === "prod"){
     bugsnag_token = "2748e60ebaf7d9a97b2aeeb74dcaed00"
}else
 if(process.env.APP_ENV === "test"){
     bugsnag_token = "b2a3e05ca63da34b87cea60c8b7fe3f7"
}else{
     bugsnag_token = "b2a3e05ca63da34b87cea60c8b7fe3f7"
 }
bugsnag.register(bugsnag_token);
logger.info("","bugsnag initialized");

logger.info("","url generated");

location.init();
motion.init();
sound.init();

//

//<-- middlwares
//app.use(bodyParser.urlencoded({
//    extended: true
//}));
app.use(bugsnag.requestHandler); //To ensure that asynchronous errors are routed to the error handler, add the requestHandler middleware to your app as the first middleware

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


app.use(bugsnag.errorHandler); //make sure to add this after all other middleware, but before any "error" middleware:


logger.info("","Service interchange api opened,");

//todo the listen port must be 3000
var server = app.listen(3001, function () {

    var host = server.address().address
    var port = server.address().port
    logger.debug("",'App listening at http://' + host + ":" + port);

})


exports.express_app = app
