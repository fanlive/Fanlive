var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//user shema
module.exports = userSchema = new Schema({
    phone:{ type: String,  required:true, index: { unique: true }},
    region_code : { type: String,default: null },
    username: { type: String, default: ""},
    code: String,
    active:{type: Boolean, default: false},
    path_img: { type: String, default: "" },
    registrationToken:String,
    lang:{type: String, default: 'FR'},
    device: String,
     team:[{          
              _id :{type: mongoose.Schema.Types.ObjectId, ref: 'Team'},
              name: { type: String, default:"" }
              
    }],
},
{
    timestamps: true
});