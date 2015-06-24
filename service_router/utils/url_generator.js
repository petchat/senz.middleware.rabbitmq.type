
var sound_url = null;
    motion_url = null;
    location_url = null;


exports.check_urls = function(){

    if(process.env.APP_ENV === "prod"){
        sound_url = "http://api.trysenz.com/" +
        "/pois/location_probability/" +
        "/sound_pred_mfcc_gmm_url/"

        motion_url = "http://api.trysenz.com/" +
        "/utils/motion_detector/" +
        "/motion_pred_ss_gmm_data/"

        location_url = "http://api.trysenz.com/" +
        "/utils/sound_detector/" +
        "/senz/locationprob/"

    }
    else{
        sound_url = "http://api.trysenz.com/" + "/test/pois/location_probability/" + "/sound_pred_mfcc_gmm_url/"
        motion_url = "http://api.trysenz.com/" + "/test/utils/motion_detector/" + "/motion_pred_ss_gmm_data/"
        location_url = "http://api.trysenz.com/" + "/test/utils/sound_detector/" + "/senz/locationprob/"


    }
};

exports.motion_url = motion_url

exports.location_url = location_url

exports.sound_url = sound_url