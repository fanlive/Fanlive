var mongoose = require('mongoose');
var Schema = mongoose.Schema;


//team schema
module.exports =teamSchema = new Schema({
    name:{ type: String, required:true, unique: true },
},
{    timestamps: true
});