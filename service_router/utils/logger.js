/**
 * Created by zhanghengyang on 15/4/29.
 */
var config = require("../config.json");
var debug = config.debug;

var log = function(log_tag) {

    if (debug) {
        var log = require("tracer").colorConsole(
            {
                format: "{{timestamp}} <{{title}}> {{message}} (in {{file}}:{{line}})",
                dateformat: "isoDateTime"
            }
        );
    }
    else {
        var logentries = require('node-logentries');
        var log = logentries.logger({
            token: 'ad2b1f4a-8c29-487a-ad8b-cae67c834c4b'
        });
    }

    return {
        "info": function (id, info) {
            log.info(log_tag + " <" + id + "> " + info);
        },

        "debug": function (id, debug) {
            log.debug(log_tag + " <" + id + "> " + debug);
        },

        ////exports.notice = function(notice){
        //    log.notice(log_tag + notice);
        //}


        "warn": function (id, warn) {
            if (debug) {
                log.warn(log_tag + " <" + id + "> " + warn);
            }
            else {
                log.warning(log_tag + " <" + id + "> " + warn);
            }
        },

        "error": function (id, err) {
            if (debug) {
                log.error(log_tag + " <" + id + "> " + err);
            }
            else {
                log.err(log_tag + " <" + id + "> " + err);
            }
        }
    }


//exports.alert = function(alert){
//    log.alert(log_tag + alert);
//}


}


exports.log = log;

