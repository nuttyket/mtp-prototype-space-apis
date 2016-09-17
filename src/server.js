// server.js

// modules =================================================
var express        = require('express');
var app            = express();
var bodyParser     = require('body-parser');
var methodOverride = require('method-override');

// configuration ===========================================

// set port
var port = process.env.PORT || 8080; 


// parse application/json 
app.use(bodyParser.json( {type: 'application/json', limit: '50mb' })); 

// parse application/vnd.api+json as json
app.use(bodyParser.json({ type: 'application/vnd.api+json', limit: '50mb'  })); 

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true })); 

// override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
app.use(methodOverride('X-HTTP-Method-Override')); 

// set the static files location /public/img will be /img for users
app.use(express.static(__dirname + '/public')); 

// routes ==================================================
require('./app/routes')(app); // configure our routes

// start app ===============================================
// startup our app at http://localhost:8080
app.listen(port);               

// shoutout to the user                     
console.log('Server listening on ' + port);

// expose app           
exports = module.exports = app; 