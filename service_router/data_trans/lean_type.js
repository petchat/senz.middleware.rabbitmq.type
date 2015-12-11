/**
 * Created by zhanghengyang on 15/7/14.
 */
/**
 * Created by zhanghengyang on 15/4/26.
 */

var leanUser = function(id){
    return {
        "__type": "Pointer",
        "className": "_User",
        "objectId": id};
};

var leanFile = function(id){
    return  {"id": id,
        "__type": "File"};
};


var leanDate = function(isostring){

    return {
        "__type": "Date",
        "iso": isostring
    };
};

exports.leanUser = leanUser;
exports.leanFile = leanFile;
exports.leanDate = leanDate;