



    if(process.env.APP_ENV === "prod"){
        sound_url = "https://api.trysenz.com" +
        "/utils/sound_detector/";

        motion_url = "https://api.trysenz.com" +
        "/utils/motion_detector/";

        location_url = "http://api.trysenz.com/v2/parserhub/location/info/";

        static_info_url = "https://api.trysenz.com/apps/user_categorizer/predict_platform";


        console.log("fuck here" + " prod")
    }
    else{

        sound_url = "https://api.trysenz.com" + "/test/utils/sound_detector/";
        motion_url = "https://api.trysenz.com" + "/test/utils/motion_detector/";
        location_url = "http://api.trysenz.com/v2/parserhub/location/info/";

        static_info_url = "";


        console.log("fuck here" + " test")

    }


exports.motion_url = motion_url;

exports.location_url = location_url;

exports.sound_url = sound_url;

exports.static_info_url = static_info_url;