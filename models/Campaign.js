/*var mongoose = require('mongoose');
var mongooseAuth = require('mongoose-auth');

var Schema = mongoose.Schema;



var CampaignSchema = new Schema({ 
	title: String,
	body: String, 
	url: String, 
	image: String, 
	addlogo: Boolean, 
	schedule: String, 
	internal_title: String, 
	image: String,
	userID: Schema.ObjectId
});

var UserSchema = new Schema({
  username:  String,
  password:  String,
  imageurl: String
});

// Campaign.plugin(mongooseAuth, {
// 	facebook: true
// });

// var Campaign = mongoose.model('Campaign', Campaign);

// var testCamp = new Campaign({ 
// 	title: 'foo',
// 	body: 'bar ', 
// 	url: 'baz', 
// 	image: 'qux', 
// 	addloop: 'foobar', 
// 	schedule: 'foobaz', 
// 	internal_title: 'barbaz',  
// });

// testCamp.save(function (err) {
//   if (err) // ...
//   console.log('test model saved');
// });

module.exports.CampaignSchema = mongoose.model('CampaignSchema', CampaignSchema);
module.exports.UserSchema = mongoose.model('UserSchema', UserSchema);*/
var mongoose = require('mongoose');
var mongooseAuth = require('mongoose-auth');
var Schema = mongoose.Schema;
var CampaignSchema = new Schema({ 
	title: String,
	body: String, 
	url: String, 
	image: String, 
	addlogo: Boolean, 
	schedule: String, 
	internal_title: String, 
	image: String,
        ckwidth:String,
        ckheight:String,
        last_updated: { type: String, default: (function(){return Math.round(Date.now()/10);})() },
	userID: Schema.ObjectId
});
var UserSchema = new Schema({
  username:  String,
  password:  String,
  imageurl: String
});

// Campaign.plugin(mongooseAuth, {
// 	facebook: true
// });

// var Campaign = mongoose.model('Campaign', Campaign);

// var testCamp = new Campaign({ 
// 	title: 'foo',
// 	body: 'bar ', 
// 	url: 'baz', 
// 	image: 'qux', 
// 	addloop: 'foobar', 
// 	schedule: 'foobaz', 
// 	internal_title: 'barbaz',  
// });

// testCamp.save(function (err) {
//   if (err) // ...
//   console.log('test model saved');
// });

module.exports.CampaignSchema = mongoose.model('CampaignSchema', CampaignSchema);
module.exports.UserSchema = mongoose.model('UserSchema', UserSchema);