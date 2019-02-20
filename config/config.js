var mongoose=require('mongoose')
var octopush = require('octopush');
mongoose.connect("mongodb://localhost:27017/fanlive",function (err) {
    if(err){
        throw err;
    }
console.log("connected")
}),

module.exports = {
    user_login: '*******@*******',
    api_key: '****************',
    sms_recipients: ['+21626498352'],
    sms_type: octopush.constants.SMS_WORLD,
    sms_sender: 'Gloo',
      
};
