var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GuestUser = new Schema({
	username:String,
	sessionID:String,
	sessionStart:Date
});

var RegisteredUser = new Schema({
	username:String,
	password:String,
	sessionID:String,
	sessionStart:Date,
	email:String
});

mongoose.model('RegisteredUser', RegisteredUser);
mongoose.model('GuestUser', GuestUser);
mongoose.connect('mongodb://localhost/OSASG');