var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var i18n     = require('../services/locale.json');
//user shema
userSchema = require('../schemas/userShema.js');
var User = module.exports = mongoose.model('User',userSchema)

//Get User by phone 
module.exports.getUserByPhone = function(phone,callback){
    User.findOne({phone: phone},{_id:1,phone:1,active:1,path_img:1,region_code:1}, callback);
}
//Get User by ID 
module.exports.getUserById = function(id,callback){
    User.findOne({_id: id},{_id:1,phone:1}, callback);
}
//Add user 
module.exports.addUser = function(user,callback){
    User.create(user,callback);
}
// to delete when finish migration step1 
//Update activation code by user phone 
module.exports.updateCodeUser = function(phone,code,callback){
    User.findOneAndUpdate({phone: phone}, {$set:{code:code}}, {"fields": {_id: 1,phone: 1 },"new": true }, callback);
}
//check  code Sms 
module.exports.checkCodeSmsPhone = function(id,code,registrationToken,device,callback){
    User.findOneAndUpdate({_id: id,code: code},
        {$set:{
            registrationToken:registrationToken,
            active:true,
             device:device,
                    },
        },{"fields": { username:1, phone:1 },"new": true },callback);
}
//update name user 
module.exports.updateNameUser = function(phone,username,callback){
    User.findOneAndUpdate({phone: phone}, {$set:{username:username}}, {"fields": {_id: 1,phone: 1 },"new": true }, callback);
}
//update img user 
module.exports.updateImageUser = function(phone,image,callback){
    User.findOneAndUpdate({phone: phone}, {$set:{path_img:image}}, {"fields": {path_img: 1,phone: 1 },"new": true }, callback);
}
//Get users 
module.exports.getUsers = function(callback,limit){
    User.find(callback).limit(limit);
}
//add  team to user 
module.exports.addTeamToUser = function (phone, data, callback) {
    // console.log('data');
    // data._id = "5c5c5f867d296883bd945f13";
    // console.log(data);
     //console.log("id");
     //console.log;
     User.updateOne({ phone: phone }, { $push: { team: data } }, callback);
 }