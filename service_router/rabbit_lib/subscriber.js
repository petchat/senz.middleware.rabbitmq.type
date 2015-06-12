var rabbit = require('wascally');
var configuration = require('./configuration.js');
var log = require("../utils/logger").log;
var logger = new log("[rabbitMQ]");

function handleMessage(callback,type){
    //setting up the handler for the subscriber
    var final_type = "senz.message." + type ;
    rabbit.handle(final_type, function(msg) {
        try {
            logger.info("",'* Received Msg from event.');
            callback(msg.body);
            msg.ack();
        }
        catch( err ) {
            msg.nack();
        }
    });
    logger.info("",'------ Receiving ------');
    logger.info("",'* Waiting for Msg from publisher.');
}

exports.registerEvent = function(callback, consumer_name, event){
    var config = configuration.topology;
    config['queues'][config['queues'].length] = { name: consumer_name, subscribe: true};
    config['bindings'][config['bindings'].length] = { exchange: event, target: consumer_name };//,keys: '' };
    if(event == "new_motion_arrival"){var routing_key = "motion";}
    if(event == "new_sound_arrival"){var routing_key = "sound";}
    if(event == "new_location_arrival"){var routing_key = "location";}
    rabbit.configure(config)
        .then(handleMessage(callback,routing_key));
};
