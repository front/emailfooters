var mongoose = require('mongoose'),
mongooseAuth = require('mongoose-auth'),
Schema = mongoose.Schema,
UserSchema = new Schema({
    username: String,
    password: String,
    imageurl: String
});
module.exports.UserSchema = mongoose.model('UserSchema', UserSchema);