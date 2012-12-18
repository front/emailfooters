// Set up db and models
var mongoose    = require('mongoose'),
campaignModel = require('../models/CampaignModel');
goalModel = require('../models/CampaignModel');

// Connect to DB
mongoose.connect('mongodb://localhost/EmailAds');



exports.index = function(req, res){
	res.render('index', { title: 'Create new campaign' });
};

exports.post = function(req,res){
	campaign = new campaignModel();
	campaign.title = req.body.title;
	campaign.vision = req.body.vision;
	console.log(campaign);

	campaign.save(function (err){
		if(err){
			console.log(err);
		}
		else {
			console.log( "saved campaign");
		}
	});

	res.render('index.jade', { title: 'My campaigns'});
};


exports.campaigns = function(req,res){
	campaignModel.find({}, function(err,searchResult){
		if(err){
			console.log(err);
		}
		res.render('campaigns.jade', {title: 'Campaigns', campaigns: searchResult});
	});
};


exports.campaign = function(req,res){
	campaignModel.find({title: req.params.title}, function(err,searchResult){
		console.log(searchResult[0]);
		res.render('campaign.jade', {title: req.params.title, campaign: searchResult[0]});
	});
};

exports.postNewGoal = function(req, res){

	//Save new goal
	goal = new goalModel();
	goal.title = req.body.goal;
	goal.save(function (err){
		if(err){
			console.log(err);
		}
		else {
			console.log( "saved goal: " + req.body.goal);
			campaignModel.update({title: req.params.title}, { $push: {goals: req.body.goal} }, function(err){
				if(err){
					console.log("error updating");
				}
				else{
					console.log("Updating complete");
				}
			});
		}
	});
		res.redirect('/campaign/' + req.params.title);

};
exports.deleteAll = function(req, res){
	campaignModel.remove({},function(err){
		if (!err){
			console.log( "Removed all");
		}
		else{
			console.log("Error while removing: " + err);
		}
	});
	res.redirect('/campaigns');
};