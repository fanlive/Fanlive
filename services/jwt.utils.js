var jwt               = require('jsonwebtoken');
const JWT_SIGN_SECRET = 'supersecret';
module.exports = {
  //generate token for user
  generateTokenForUser: function(userData) {
    return jwt.sign({phone: userData.phone},JWT_SIGN_SECRET)
  },    
  parseAuthorization: function(authorization) {
    return (authorization != null) ? authorization.replace('Bearer ', '') : null;
  },
  getUser: function(authorization) {
    var user;
    var token = module.exports.parseAuthorization(authorization);
    if(token != null) {
      try {
        var jwtToken = jwt.verify(token, JWT_SIGN_SECRET);
        if(jwtToken != null)
          user=jwtToken.phone;              
      } catch(err) {}
    }
    return user;
  }
}
    


    