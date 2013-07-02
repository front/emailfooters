var mongoose = require('mongoose'),
mongooseAuth = require('mongoose-auth'),
Schema = mongoose.Schema,
CampaignSchema = new Schema({
    title: String,
    body: String,
    url: String,
    image: String,
    addlogo: Boolean,
    schedule: String,
    internal_title: String,
    ckwidth: String,
    ckheight: String,
    last_updated: {type: String, default: (function() {
            'use strict';
            return Math.round(Date.now() / 10);
        })()},
    userID: Schema.ObjectId
});

module.exports.CampaignSchema = mongoose.model('CampaignSchema', CampaignSchema);
