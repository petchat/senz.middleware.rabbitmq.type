
var sound_url = null;
    motion_url = null;
    location_url = null;




    if(process.env.APP_ENV === "prod"){
        sound_url = "http://api.trysenz.com" +
        "/utils/sound_detector/"

        motion_url = "http://api.trysenz.com" +
        "/utils/motion_detector/"

        location_url = "http://api.trysenz.com" +
        "/pois/location_probability/"

        console.log("fuck here" + " prod")
    }
    else{

        sound_url = "http://api.trysenz.com" + "/test/utils/sound_detector/"
        motion_url = "http://api.trysenz.com" + "/test/utils/motion_detector/"
        location_url = "http://api.trysenz.com" + "/test/pois/location_probability/"

        console.log("fuck here" + " test")

    }


exports.motion_url = motion_url

exports.location_url = location_url

exports.sound_url = sound_url