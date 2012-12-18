var mongoose = require('mongoose'),
Schema = mongoose.Schema,
ObjectId = Schema.ObjectId;

var ActionSchema = new Schema({
	title: { type: String, required:true},
	challenge: {type: String},
	startdate: Date
});

module.exports = mongoose.model('Actions 	', ActionSchema);
