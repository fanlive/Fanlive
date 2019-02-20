ModelUsers       = require('../models/user.js');
let jwtUtils     = require('../services/jwt.utils');
ModelTeams      = require('../models/team.js');
let i18n         = require('../services/locale.json');
let octopush     = require('octopush');
let config       = require('../config/config.js');
//const NodeCache  = require("node-cache");
let fs           = require('fs');
let fireBase = require('../services/fireBase.js');
const constants  = require('../lib/constants.js');

// Require `PhoneNumberFormat`.
const PNF       = require('google-libphonenumber').PhoneNumberFormat;
// Get an instance of `PhoneNumberUtil`.
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
//const myCache   = new NodeCache( { stdTTL: 9999999999999, checkperiod: 120 } );
//obj             = { my: "distance", variable: 30 };
//myCache.set( "distance", obj);


module.exports = {
  getAllUsers: function (req, res, next) { 
    // Getting auth header
      
    let headerAuth  = req.headers['authorization'];  
    let userId      = jwtUtils.getUser(headerAuth);
    if (userId){
      ModelUsers.getUsers( function(err,users){
        if(err){
          throw err;
        }
        return res.status(200).json(users);
      });
    } else {
      return res.status(401).json({'error': 'wrong token'});
    }
  },

  // */users/step1/addUser
  //update user already authentified with phone number
  //if dosen't exist we will create it :D
  step1:function(req, res) {
    let user         = {};
    user.region_code = null;
    if(req.body.phone != undefined){
      if(req.body.phone.trim().length > 0){
        phone        = req.body.phone.replace(/[-_ ]/g,'').trim();
        let phoneNum = phone.substr(1);
        let first_c  = phone.substr(0,1);
        let n        = phoneNum.substr(0,1);
        if(first_c == "+" && !isNaN(phoneNum) && parseInt(phoneNum) != NaN && ( phoneNum % 1 === 0) && phoneNum.length > 3 && n != 0){
          // Parse number with country code and keep raw input.
          const number        = phoneUtil.parseAndKeepRawInput(req.body.phone.trim());
          const isValidNumber = phoneUtil.isValidNumber(number);
          const RegionCode    = phoneUtil.getRegionCodeForNumber(number);
          const NumberType    = phoneUtil.getNumberType(number);
          const phoneNumber   = phoneUtil.format(number, PNF.E164);
          if(isValidNumber == true){
            // Check if type of phone is Mobile or no          
            if(NumberType != 0 && NumberType != 4){
              //Generate a rondom code 
              let code = Math.floor(Math.random() * 8999) + 1000;
              // Send Activation code via sms to user
              let sms = new octopush.SMS(config.user_login, config.api_key);            
              sms.set_sms_text(i18n.Sms_validation.fr + code);
              sms.set_sms_recipients([phoneNumber]);
              sms.set_sms_type(octopush.constants.fr);
              sms.set_sms_sender(config.sms_sender);
              sms.set_sms_request_id(sms.uniqid());
              sms.set_option_with_replies(0);
              sms.set_option_transactional(1);
              sms.set_sender_is_msisdn(0);
              sms.set_request_keys('TRS');
              sms.send(function(e, r){
                console.log(JSON.stringify(e));
                console.log(JSON.stringify(r));
              });
              
              user.code        = code;
              user.region_code = RegionCode;
              user.phone       = phoneNumber;
              // Check if user existe
              ModelUsers.getUserByPhone(phoneNumber, function(err, result){
                if(result){
                  // Update activation code by user phone
                  ModelUsers.updateCodeUser(phoneNumber, code, function(err2, userData){
                    if(err){
                      res.status(500).json({
                        'success': false,
                        'error': {
                          'message':i18n.InternetError,
                          'code': 500
                        }
                      });
                    } else {
                      res.status(200).json({
                        'success':true,
                        'data':{
                          'new':false,
                          'id': userData._id
                        }
                      });
                    }              
                  });           
                } else {
                  ModelUsers.addUser(user, function(err2, userData){
                    if(err2){
                      res.status(500).json({
                        'success': false,
                        'data': {
                          'message':i18n.InternetError,
                          'code': 500
                        }
                      });
                    } else {
                      res.status(200).json({
                        'success':true,
                        'data':{
                          'new':true,
                          'id': userData._id
                        }
                      });
                    }
                  });
                }
              });
            } else {
              res.status(200).json({
                'success': false,
                'error': {
                  'message':i18n.NotMobileNumber,
                  'code': 3
                }
              });
            } 
          } else {
            res.status(200).json({
              'success': false,
              'error': {
                'message':i18n.InvalidPhoneNumber,
                'code': 2
              }
            });
          }
        } else {
          res.status(200).json({
            'success': false,
            'error': {
              'message':i18n.InvalidPhoneNumber,
              'code': 2
            }
          });
        }
      } else {
        res.status(401).json({
          'success': false,
          'error': {
            'message': i18n.RequiredPhoneNumber,
            'code': 1
          }
        });
      }    
    } else {
      res.status(400).json({
        'success': false,
        'error': {
          'message': i18n.MissingPhoneNumber,
          'code': 100
        }
      });
    }
  },

  step2: function(req, res) {
    let userId            = req.body.user_id;
    let code              = req.body.code;
    let registrationToken = req.body.registrationToken;
    let device            = req.body.device;
    if(userId != undefined && code != undefined && registrationToken != undefined && device != undefined){
      userId            = userId.trim();
      code              = code.trim();
      registrationToken = registrationToken.trim();
      device            = device.trim();
      if(userId != "" && code != "" && registrationToken != ""&& device != ""){
        ModelUsers.getUserById(userId, function(error, me){      
          if(me){
              // Check validation code
                ModelUsers.checkCodeSmsPhone(userId,code,registrationToken,device, function(err, user){
                  if(err){
                    res.status(500).json({
                      'success': false,
                      'error': {
                        'message':i18n.InternetError,
                        'code': 500
                      }
                    });
                  } else {
                    // If success
                    if(user){
                      let data = {
                        token : jwtUtils.generateTokenForUser(user),
                        phone    : user.phone,
                        username : user.username                      
                      }                    
                      res.status(200).json({
                        'success': true,
                        'data': data
                      });
                      
                    } else {
                      res.status(200).json({
                        'success': false,
                        'error': {
                          'message':i18n.InvalidCode,
                          'code': 10
                        }
                      });
                    }                
                  }
                });
          } else {
            res.status(401).json({
              'success': false,
              'error': {
                'message':i18n.InvalidUserId,
                'code': 7
              }
            });
          }       
        });
      } else {
        // Check if empty field
        if(userId == ""){
          res.status(401).json({
            'success': false,
            'error': {
              'message': i18n.ReaquireddUserId,
              'code': 1
            }
          });
        } else {
          if(code == ""){
            res.status(401).json({
              'success': false,
              'error': {
                'message':i18n.ReaquiredCode,
                'code': 2
              }
            });
          } else {
            if(registrationToken == ""){
              res.status(401).json({
                'success': false,
                'error': {
                  'message': i18n.ReaquiredToken,
                  'code': 3
                }
              });
            }else {
              if(device == ""){
                res.status(401).json({
                  'success': false,
                  'error': {
                      'message': i18n.ReaquiredDevice,
                      'code': 6
                    }
                });
              }
            }
          }
        }
      }
    } else {
      // Check missing field
      if(userId == undefined){
        res.status(400).json({
          'success': false,
          'error': {
            'message': i18n.MissingUserId,
            'code': 100
          }
        });
      } else {
        if (code == undefined) {
          res.status(400).json({
            'success': false,
            'error': {
              'message':i18n.MissingCode,
              'code': 101
            }
          });
        } else {
          if (registrationToken == undefined) {
            res.status(400).json({
              'success': false,
              'error': {
                'message':i18n.MissingToken,
                'code': 102
              }
            });
          }else {
            if (device == undefined) {
              res.status(400).json({
               'success': false,
               'error': {
                  'message':i18n.MissingDevice,
                  'code': 105
                }
              });
            }
          }
        }
      }
    }      
  },
  step3: function(req, res) {  
    // Getting auth header
    let headerAuth  = req.headers['authorization'];
    let login       = jwtUtils.getUser(headerAuth);
    let username    = req.body.username;
    if(login){    
      // Check user existe
      ModelUsers.getUserByPhone(login, function(err,me){
        if(me){
          if(username != undefined){
            username = username.trim();
            if(username != ''){
              if(username.length > 3){
                if( username.length < 20){
                  ModelUsers.updateNameUser(login,username, function(err, user){
                    if(user){
                      res.status(200).json({
                        'success':true,
                        'data':user 
                      });
                    } else {
                      res.status(403).json({
                        'success': false,
                        'error': {
                          'message':i18n.WrongToken,
                          'code': 403
                        }
                      });
                    }
                  });
                } else {
                  res.status(200).json({
                    'success': false,
                    'error': {
                      'message':i18n.LongUsername,
                      'code': 3
                    }
                  });
                } 
              } else {
                res.status(200).json({
                  'success': false,
                  'error': {
                    'message': i18n.ShortUsername,
                    'code': 2
                  }
                });
              }
            } else {
              res.status(401).json({
                'success': false,
                'error': {
                  'message': i18n.RequiredUsername,
                  'code': 1
                }
              });
            }
          } else {//
            res.status(400).json({
              'success': false,
              'error': {
                'message':i18n.MissingUsername,
                'code': 100
              }
            });
          }
        } else {
          res.status(403).json({
            'success': false,
            'error': {
              'message':i18n.WrongToken,
              'code': 403
            }
          });
        } 
      });
    } else {
      res.status(403).json({
        'success': false,
        'error': {
          'message':i18n.WrongToken,
          'code': 403
        }
      });
    } 
  }, 
// upload image

step4:function(req, res, err) {  
  // Getting auth header
  let headerAuth  = req.headers['authorization'];
  let login       = jwtUtils.getUser(headerAuth);
  if (login){    
    // Check user existe
    ModelUsers.getUserByPhone(login, function(err2,me){
      if(me){
        if(!err){
          if(req.file){
            ModelUsers.getUserByPhone(login, function(err3, me){
              ModelUsers.updateImageUser(login,req.file.filename, function(err4, result){
                if(!err3){
                  if(me.path_img != "" && me.path_img != undefined){
                    fs.exists("./public/users/images/"+me.path_img, function(exists) {
                      if(exists && fs.statSync('./public/users/images/'+me.path_img).isFile() ) {
                        fs.unlinkSync('./public/users/images/'+me.path_img);
                      }
                    });
                  }
                  result.path_img = constants.path_user_image + result.path_img;
                  res.status(200).json({
                    'success': true,
                    'data': result
                  });
                } else {              
                  res.status(500).json({
                    'success': false,
                    'error': {
                      'message':i18n.InternetError,
                      'code': 500
                    }
                  });
                }
              });
            });             
          } else {
            res.status(401).json({
              'success': false,
              'error': {
                'message': i18n.requiredImage,
                'code': 1
              }
            });
          }     
        } else {
          if(err == "Error: Unexpected field"){
            res.status(200).json({
              'success': false,
              'error': {
                'message': i18n.MissingImage,
                'code': 101
              }
            });
          } else {
            if(err == "Error: File to large"){
              res.status(200).json({
                'success': false,
                'error': {
                  'message': i18n.ErrorBigImage,
                  'code': 102
                }
              });
            } else {
              res.status(200).json({
                'success': false,
                'error': {
                  'message':err,
                  'code': 100
                }
              });
            }        
          }      
        }
      } else {
        res.status(403).json({
          'success': false,
          'error': {
          'message':i18n.WrongToken,
          'code': 403
          }
        });
      }
    });
  } else {
    res.status(403).json({
      'success': false,
      'error': {
        'message':i18n.WrongToken,
        'code': 403
      }
    });
  }
},

step5: function(req, res) {
 
  let team = { 
    name: req.body.name,
   _id: req.body._id}
 let headerAuth = req.headers['authorization'];
 let login = jwtUtils.getUser(headerAuth);
 if (login) {
   // Check user exist
   ModelUsers.getUserByPhone(login, function (err, me) {
     if (me) {
       if (team._id != undefined) {
         if (team.name != undefined) {

       //team = team.trim();
         if (team.name != '') {
           if (team._id != '') {
           ModelUsers.addTeamToUser(login, team, function (err, user) {
             if (user) {
               res.status(200).json({
                 'success': true,
                 'data': user
               });
             } else {
               res.status(403).json({
                 'success': false,
                 'error': {
                   'message': i18n.WrongToken,
                   'code': 403
                 }
               });
             }
           });
         }else {
           res.status(401).json({
             'success': false,
             'error': {
               'message': i18n.RequiredTeamId,
               'code': 1
             }
           });
         }
       }else {
           res.status(401).json({
             'success': false,
             'error': {
               'message': i18n.Requiredname,
               'code': 2
             }
           });
         }

       } else {
         res.status(400).json({
           'success': false,
           'error': {
             'message': i18n.Missingname,
             'code': 100
           }
         });
       }
     }else {
         res.status(400).json({
           'success': false,
           'error': {
             'message': i18n.MissingTeamId,
             'code': 101
           }
         });
       }
     } else {
       res.status(403).json({
         'success': false,
         'error': {
           'message': i18n.WrongToken,
           'code': 403
         }
       });
     }
   });
 } else {
   res.status(403).json({
     'success': false,
     'error': {
       'message': i18n.WrongToken,
       'code': 403
     }
   });
 }
},

step6_OneToken: function(req, res) {  
  let headerAuth  = req.headers['authorization'];
  let login       = jwtUtils.getUser(headerAuth);

  if(login){    
    // Check user existe
    ModelUsers.getUserByPhone(login, function(err,me){
      if(me){
        let registrationToken = req.body.registrationToken;
        let username  = req.body.username;
        let message = i18n.Title_Notification.fr + username ;
var payload = {
    notification: {
      title: i18n.Title_Notification.fr,
      body: message
    },
    data: {
     // id:_id,
      title: i18n.Title_Notification.fr,
      body: message
    }
  };
  if(registrationToken != undefined  && registrationToken != ""){
  fireBase.sendNotifaction(payload,registrationToken);
  }
} else {
  res.status(403).json({
    'success': false,
    'error': {
      'message': i18n.WrongToken,
      'code': 403
    }
  });
}
});
} else {
res.status(403).json({
'success': false,
'error': {
  'message': i18n.WrongToken,
  'code': 403
}
});
}
},
step7_AllToken: function(req, res) {  
  let headerAuth  = req.headers['authorization'];
  let login       = jwtUtils.getUser(headerAuth);

  if(login){    
    // Check user existe
    ModelUsers.getUserByPhone(login, function(err,me){
      if(me){
        //let registrationToken = req.body.registrationToken;
       // let username  = req.body.username;
        let message = i18n.Title_Notification.fr ;
//var registrationToken1 = "f8sMzbbCs2c:APA91bH0wVNZ3tirGm88p7vjUCOJAoB8d1wyRScZ3bK9mLmCiyF7a-xx1CbkW2Po8WqIv8ULcXtkMr7oY6zRVZQi6okETDsYbXEQIOTYPIuDA1qcdVjt52xyqlUJ_8NfwrndIvKVTAEH";
//var registrationToken2 = "eqmhDQZT1s8:APA91bHhwOCA5WdKT21HMo9jWhhamR6rFh9iiUTldW2yX6JYyOrZD0DeJN6nGeBkAqe0vYw74hQlMpBaLWSkeTR2QAJLSalvf2aBFC_3cl4x8koMLrN6utFozTu5V0Glf3QjC0Z_gwk0";
      let registrationTokens=[];
var payload = {
    notification: {
      title: i18n.Title_Notification.fr,
      body: message
    },
    data: {
     // id:_id,
      title: i18n.Title_Notification.fr,
      body: message
    },
    topic:"hello"+ me._id
  }; 
  if(registrationTokens != undefined  && registrationTokens != ""){
  fireBase.SendUserNotif(registrationTokens,topic,payload);
  }
} else {
  res.status(403).json({
    'success': false,
    'error': {
      'message': i18n.WrongToken,
      'code': 403
    }
  });
}
});
} else {
res.status(403).json({
'success': false,
'error': {
  'message': i18n.WrongToken,
  'code': 403
}
});
}
},
}
