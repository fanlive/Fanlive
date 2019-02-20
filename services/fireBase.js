var admin = require("firebase-admin");

var serviceAccount = require("../firebase/myprojectreact-2aeb1-firebase-adminsdk-9edy3-3dec28e78e.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://myprojectreact-2aeb1.firebaseio.com"
});

module.exports =  {
  sendNotifaction : function sendNotifaction (Message,registrationToken) {
    admin.messaging().sendToDevice(registrationToken,Message)
    .then((response) => {
      // Response is a message ID string.
      console.log('Successfully sent message:', response);
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });
    return 'test';
  },
  SendUserNotif : function SendUserNotif (registrationTokens,topic,message) { 
    admin.messaging().subscribeToTopic(registrationTokens, topic)
    .then(function(response) {
      console.log('Successfully subscribed user to topic:', response);
      admin.messaging().send(message)
      .then((response) => {
        // Response is a message ID string.
        console.log('Successfully sent message to user:', response);
      })
      .catch((error) => {
        console.log('Error sending message:', error);
      });
    })
    .catch(function(error) {
      console.log('Error subscribing to topic:', error);
    });
  }


}