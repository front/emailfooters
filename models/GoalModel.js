var mongoose = require('mongoose'),
Schema = mongoose.Schema,
ObjectId = Schema.ObjectId;

var GoalSchema = new Schema({
	id: ObjectId,
	title:{ type:String, required:true},
	actions:{type: String}
});

module.exports = mongoose.model('Goals', GoalSchema);