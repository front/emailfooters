var mongoose = require('mongoose');
var mongooseAuth = require('mongoose-auth');

var Schema = mongoose.Schema;

var User = new Schema({
  username:  String,
  password:  String,
  imageurl: String
});

module.exports = mongoose.model('User', User);
