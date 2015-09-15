var rabbit = require('wascally');
var configuration = require('./configuration.js');
var log = require("../utils/logger").log;
var logger = new log("[rabbitMQ]");




var env = null;
if(process.env.APP_ENV === "prod"){
    env = "_prod"

}else{

    env = "_test"
}



function handleMessage(callback,type){
    //setting up the handler for the subscriber
    var final_type = "senz.message." + type + env ;
    rabbit.handle(final_type, function(msg) {
        try {
            logger.info("subscriber",'* Received Msg from event.');
            callback(msg.body);
            msg.ack();
        }
        catch( err ) {
            console.log("rabbitmq caught error is " + JSON.stringify(err) );
            msg.nack();
        }
    });
    logger.info("",'------ Receiving ------');
    logger.info("",'* Waiting for Msg from publisher.');
}

exports.registerEvent = function(callback, consumer_name, raw_event){
    var event = raw_event + env;
    var config = configuration.topology;
    config['queues'][config['queues'].length] = { name: consumer_name + env, subscribe: true};
    config['bindings'][config['bindings'].length] = { exchange: event , target: consumer_name + env  };//,keys: '' };
    var routing_key = null
    if(event == "new_motion_arrival" + env){ routing_key = "motion";}
    if(event == "new_sound_arrival" + env){ routing_key = "sound";}
    if(event == "new_location_arrival" + env){ routing_key = "location";}
    if(event == "new_calendar_arrival" + env) { routing_key = "calendar"}
    if(event == "new_applist_arrival" + env ) { routing_key = "applist"}
    if(event == "new_predicted_motion_arrival" + env) { routing_key = "predicted_motion"}
    rabbit.configure(config)
        .then(handleMessage(callback,routing_key));
};
