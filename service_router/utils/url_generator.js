
var sound_url = null;
    motion_url = null;
    location_url = null;

exports.check_urls = function(){

    if(process.env.APP_ENV === "prod"){
        sound_url = "http://api.trysenz.com/"
        motion_url = "http://api.trysenz.com/"
        location_url = "http://api.trysenz.com/"

    }else
    if(process.env.APP_ENV === "test"){
        sound_url = "http://api.trysenz.com/"
        motion_url = "http://api.trysenz.com/"
        location_url = "http://api.trysenz.com/"

    }else{
        sound_url = "http://api.trysenz.com/"
        motion_url = "http://api.trysenz.com/"
        location_url = "http://api.trysenz.com/"
    }
};

exports.motion_url = motion_url

exports.location_url = location_url

exports.sound_url = sound_url