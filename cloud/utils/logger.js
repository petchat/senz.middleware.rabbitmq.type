/**
 * Created by zhanghengyang on 15/5/4.
 */

/**
 * Created by zhanghengyang on 15/4/29.
 */
var log_tag = "main module";
var debug = true;


if(debug){
    var log = require("tracer").colorConsole();
}
else{
    var logentries = require('node-logentries');
    var log = logentries.logger({
        token:'1a528118-f843-4124-87d9-2843eace4998'
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