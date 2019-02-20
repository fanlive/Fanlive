let constants = {
    base_url:         "https://api.sandbox.stickbythem.com",  
    path_user_image : "https://api.sandbox.stickbythem.com/public/users/images/",
    path_user_video : "https://api.sandbox.stickbythem.com/public/users/videos/",
    path_user_badge : "https://api.sandbox.stickbythem.com/public/badges/",
    path_Gloo_image : "https://api.sandbox.stickbythem.com/public/places/",
    path_rate_image : "https://api.sandbox.stickbythem.com/public/rates/",
    path_rate_image_admin : "https://api.sandbox.stickbythem.com/public/rates_admin/",
    earth_radius:      6371,
    distance:          500/6371,
    distancePlace:     100/6371,
    quarterDist:       500/6371,
    cityDist:          3000/6371,
    distanceSearch:    2/6371,
    maxDistance:       1000, 
    max_friends:       15,
    time_finish_gloo : 30,
};
module.exports = Object.freeze(constants);