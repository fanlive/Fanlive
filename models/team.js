var mongoose = require('mongoose');
//team shema
teamSchema = require('../schemas/teamSchema.js');
var Team = module.exports= mongoose.model('Team',teamSchema)

//Get Teams
module.exports.getTeam = function(callback,limit){
    Team.find(callback).limit(limit);
}


