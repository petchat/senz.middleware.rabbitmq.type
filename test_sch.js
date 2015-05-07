

var a = require("location-cache");
var b = require("sound-cache");
var express = require("express");

var test = 1;
var test2 = 2 ;

var test4 = 1;
var test3 = 1;
var app = express();
app.get("/",function(a,b){
    console.log(a + test + test2);
    b.send({"a":"b","senz":test4 });

})
app.listen(3010);



return 1;