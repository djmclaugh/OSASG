var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RegisteredUser = new Schema({
	username:String,
	password:String,
	sessionID:String,
	sessionStart:Date,
	email:String
});

mongoose.model('RegisteredUser', RegisteredUser);
mongoose.connect('mongodb://localhost/OSASG');