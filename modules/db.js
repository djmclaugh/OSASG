var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SessionSchema = new Schema({
  session: Object
});

exports.Session = mongoose.model('Session', SessionSchema);
mongoose.connect('mongodb://localhost/OSASG');