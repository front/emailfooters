var mongoose = require('mongoose'),
Campaign = require('../models/Campaign');
var fs = require('fs');
var path = require('path');

// Connect to DB
mongoose.connect('mongodb://localhost/Campaign');

exports.index = function(req, res){
	res.render('index', {});
};

exports.post = function(req, res){

	// Save file if it exists
	if (req.files.image.name && req.files.image.name !== ''){

		// Get file from post request
		fs.readFile(req.files.image.path, function (err, data) {

			// Set path for new file
			var newPath = path.join( __dirname, "../uploads/", req.files.image.name);

			fs.writeFile(newPath, data, function (err) {
				if(err) {
					console.log('error saving file:');
					console.log(err);
				} else {
					console.log('Saved file: ' + newPath);
					req.body.imageURL = newPath;
				}
			});
		});
	}

	// Send the 
	res.render('index', req.body);
};