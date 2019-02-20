let express                 = require('express');
let usersController         = require('./controllers/users');
let TeamsController         = require('./controllers/teams');
let path                    = require('path');
let crypto                  = require('crypto');
let multer                  = require('multer');
// Upload user Image
let storageImage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/users/images/')
  },

  filename: function(req, file, cb) {
    crypto.pseudoRandomBytes(16, function (err, raw) {
      if (err) return cb(err)  
      cb(null, raw.toString('hex') + path.extname(file.originalname))
    });
  }
});
//filter image
const imageFilter = (req, file, cb) => {
  let type      = file.mimetype;
  let typeArray = type.split("/");
  if (typeArray[0] == "image") {
    cb(null, true);
  } else {
    cb('Invalid File Extension',false)
  }
};

// Upload
// Max size image 
let uploadImageUser  = multer({ storage: storageImage,limits: {fileSize: 99999965536},fileFilter: imageFilter }).single('image');


//All route
exports.router =(function() {
    let apiRouter = express.Router(); 
    //Get all user

    apiRouter.route('/users/').get(usersController.getAllUsers);
    //Add user(inactive) if not exist if exist send anather code(active) 
    apiRouter.route('/users/step1/addUser').post(usersController.step1);
    //Check code (body : code and registrationToken)
    apiRouter.route('/users/step2/addUser').put(usersController.step2);
    //Update username user 
    apiRouter.route('/users/step3/addUser/').put(usersController.step3);
    //Upload picture for user
    apiRouter.put('/users/step4/addUser/',  function(req, res) {
        uploadImageUser(req,res,function(err){
             usersController.step4(req,res,err);
        });
    });
    //Get All Teams
    apiRouter.route('/teams/getTeam/').get(TeamsController.getTeam);
    //Choose Favorite Team
    apiRouter.route('/users/addFavTeam/').put(usersController.step5);
    apiRouter.route('/users/send_Notif_To_One/').put(usersController.step6_OneToken);
    apiRouter.route('/users/send_Notif_To_All/').put(usersController.step7_AllToken);
   

    return apiRouter;
})();