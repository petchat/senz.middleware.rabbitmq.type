/**
 * Created by zhanghengyang on 15/4/29.
 */
var config = require("../config.json");
var log_tag = config.log_tag;
var debug = config.debug;
if(debug){
    var log = require("tracer").colorConsole(
        {
            format : "{{timestamp}} <{{title}}> {{message}} (in {{file}}:{{line}})",
            dateformat : "isoDateTime"
        }
    );
}
else{
    var logentries = require('node-logentries');
    var log = logentries.logger({
        token:'ad2b1f4a-8c29-487a-ad8b-cae67c834c4b'
    });
}


exports.info = function(info){
    log.info(log_tag + info);
}

exports.debug = function(debug){
    log.debug(log_tag + debug);
}


////exports.notice = function(notice){
//    log.notice(log_tag + notice);
//}


exports.warn = function(warn){
    if(debug){
        log.warn(log_tag + warn);
    }
    else{
        log.warning(log_tag + warn);
    }
}

exports.error = function(err){
    if(debug){
        log.error(log_tag + err);
    }
    else{
        log.err(log_tag + err);
    }
}

//exports.alert = function(alert){
//    log.alert(log_tag + alert);
//}