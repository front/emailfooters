var request = require('request'),
        fs = require('fs'),
        path = require('path'),
        mongoose = require('mongoose'),
        CampaignModel = require('../models/Campaign'),
        UserModel = require('../models/User'),
        Schema = mongoose.Schema,
        ObjectId = Schema.ObjectId

var findByID = function(id, fn) {
    UserModel.UserSchema.findOne({_id: id}, function(err, user) {
        if (err) {
            fn(new Error('User ' + id + ' does not exist'));
        } else {
            fn(null, user);
        }
    });
};

var findByUsername = function(username, fn) {
    UserModel.UserSchema.findOne({username: username}, function(err, user) {
        if (err) {
            return fn(err, null);
        } else {
            fn(null, user);
        }
    })
};
var addNewUser = function(name, pass, fn) {
    var newUser = new UserModel.UserSchema({
        username: name,
        password: pass});
    newUser.save(function(err) {
        if (err) {
            return fn(err, null);
        } else {
            fn(null, newUser);
        }
    });
};
var findCampaign = function(userid, campaignid, opts, fn) {
    var findsch = {}, query;
    if (userid) {
        findsch.userID = userid;
    }
    if (campaignid) {
        findsch._id = campaignid;
    }
    if (!fn && typeof opts === 'function') {
        fn = opts;
        console.log('a')
        query = CampaignModel.CampaignSchema.find(findsch);
    } else {
        console.log('b')
        query = CampaignModel.CampaignSchema.find(findsch).sort(opts);
    }
    query.exec(function(err, data) {
        console.log(data)
        if (err) {
            return fn(err, null);
        } else {
            fn(null, data);
        }
    });
};
var removeCampaign = function(userid, campaignid, fn) {
    var findsch = {};
    if (userid) {
        findsch.userID = userid;
    }
    if (campaignid) {
        findsch._id = campaignid;
    }
    CampaignModel.CampaignSchema.find(findsch).remove(function(err, data) {
        if (err) {
            return fn(err, null);
        } else {
            fn(null, data);
        }
    });
};

module.exports.findByID = findByID;
module.exports.findByUsername = findByUsername;
module.exports.addNewUser = addNewUser;
module.exports.findCampaign = findCampaign;
module.exports.removeCampaign = removeCampaign;