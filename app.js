/* var createError    = require('http-errors');
var mongoose       = require('mongoose'); */
var express        = require('express');
var app            = express();
var path           = require('path');
var compression    = require('compression');
var cookieParser   = require('cookie-parser');
var logger         = require('morgan');
var config         = require('./config/config.js');
var bodyParser     = require('body-parser');
var apiRouter      = require('./routes').router;
//const apiCallFromRequest = require('./services/request')

//const http = require('http')
var server = require('http').createServer(app)
var io = require('socket.io')(server,{path: '/socket.io'});
//var io = require('socket.io').listen(app.listen(config.portSoket),{path: '/api/socket.io'});
io.sockets.on('connection', function (socket) {
  console.log('client connect');
  socket.on('echo', function (data) {
    io.sockets.emit('message', data);
  });
});

// configure the app to use bodyParser()
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/public", express.static(path.join(__dirname, 'public')));
app.use(compression());
app.get('/', function(req, res) {
  if(req.headers['x-api-key'] != config.x_api_key){
    return res.status(401).json({ 'error': 'x_api_key incorrect' });
  }
});

app.use(function myauth(req, res, next) {
  if(req.headers['x-api-key'] != config.x_api_key){
  //  return res.status(401).json({ 'error': 'x_api_key incorrect' });
  }
  next();
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  console.log('404')
  res.status(404).json({ 'error': 'Page 404' });;
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = "";
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(500).json({ 'error': 'err 500' });  
});

let port = 3000;
server.listen(port, () => {
    console.log('Server is up and running on port number ' + port);
});
module.exports = app;


