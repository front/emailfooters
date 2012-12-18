var mongoose = require('mongoose'),
Schema = mongoose.Schema,
ObjectId = Schema.ObjectId;

var CampaignSchema = new Schema({
	id        : ObjectId,
	title     : { type: String, required: true},
	vision    : { type: String},
});

module.exports = mongoose.model('Campaign', CampaignSchema);
