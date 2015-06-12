/**
 * Created by zhanghengyang on 15/5/25.
 */


var request = require("supertest");
var app = require("./main.js").express_app;
var should = require("should");

request(app)
    .get("/")
    .expect("Content-Type",/json/)
    //.expect("Content-Length", "20")
    .expect(200)
    //.expect({"return_type":"json"},function(err){
    //
    //})
    .end(function(err,res){
        var body = res.body;
        body.should.have.property("return_type","json");
        console.log(body);
        console.log("fuck");
        console.log(err);
        //if(err) throw err;
    });


var test_ob = {"a":"b"};
request(app)
    .post("/test_post/")
    .send(test_ob)
    .expect("Content-Type",/json/)
    .expect(200)
    .end(function(err,res){
         var body = res.body;
         console.log(body);

         body.should.have.property("a","b")
         console.log("fuck again");
         console.log(err);
     })
