/**
 * Created by zhanghengyang on 15/4/26.
 */



var leanUser = function(id){

    var user = {
        "__type": "Pointer",
        "className": "_User",
        "objectId": id
    };
    return user
}


var leanFile = function(id){

    var file =  {"id": id,
        "__type": "File"}
    return file
}


var leanDate = function(isostring){

    var a =  {
        "__type": "Date",
        "iso": isostring
    };
    return a;
}

exports.leanUser = leanUser;
exports.leanFile = leanFile;
exports.leanDate = leanDate;