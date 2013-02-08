var Models = require('../models/Campaign')
, request = require('request');


var processImageUsingCache = function(filePath, res, url, callback) {
  if (url) {
    // asynchronous
    postImageToUrl(filePath, url, callback);
  } else {
    // synchronous
    sendImageInResponse(filePath, res, callback);
  }
}

var processImageUsingRasterizer = function(rasterizerOptions, filePath, res, url, callback) {
  if (url) {
    // asynchronous
    //res.send('Will post screenshot to ' + url + ' when processed');
    callRasterizer(rasterizerOptions, function(error) {
      if (error) return callback(error);
      postImageToUrl(filePath, url, callback);
    });
  } else {
    // synchronous
    callRasterizer(rasterizerOptions, function(error) {
      if (error) return callback(error);
      sendImageInResponse(filePath, res, callback);
    });
  }
}

var callRasterizer = function(rasterizerOptions, callback) {
  request.get(rasterizerOptions, function(error, response, body) {
    if (error || response.statusCode != 200) {
      console.log('Error while requesting the rasterizer: %s', error.message);
      rasterizerService.restartService();
      return callback(new Error(body));
    }
    callback(null);
  });
}

var postImageToUrl = function(imagePath, url, callback) {
  console.log('Streaming image to %s', url);
  var fileStream = fs.createReadStream(imagePath);
  fileStream.on('end', function() {
    console.log('Readfile!');
    fileCleanerService.addFile(imagePath);
  });
  fileStream.on('error', function(err){
    console.log('Error while reading file: %s', err.message);
    callback(err);
  });
  fileStream.pipe(request.post(url, function(err) {
    console.log('piped file!');
    if (err) console.log('Error while streaming screenshot: %s', err);
    callback(err);
  }));
}

var sendImageInResponse = function(imagePath, res, callback) {
  console.log('Sending image in response');
  res.sendfile(imagePath, function(err) {
    fileCleanerService.addFile(imagePath);
    callback(err);
  });
}


var findByID = function (id, fn) {
  Models.UserSchema.findOne({_id: id}, function(err, user){
    if(err){ 
      fn(new Error('User ' + id + ' does not exist'));
    } else {
      fn(null, user);
    }
  });
}

var findByUsername = function(username, fn) {
  Models.UserSchema.findOne({username: username}, function(err, user){
    if(err){ 
      return fn(null, null);
    } else {
      fn(null, user);
    }
  });
}

var addNewCampaign = function (req,res,next){
  // Save attached image
  if ( typeof req.files.image !== 'undefined'){
    console.log('Will try to save image');
    fs.readFile(req.files.image.path, function (err, data) {
      var newPath = path.join( __dirname, "../uploads/", req.files.image.name);
      fs.writeFile(newPath, data, function (err) {
        if (err) {
          console.log( err );
        } else {
          console.log('Saved file: ' + newPath);
          req.body.image = newPath;
        }
      });
    });
  }

  // Build object that will be saved
  campaign = new Models.CampaignSchema();
  campaign.title = req.body.title || '';
  campaign.body = req.body.CKeditor || '';
  campaign.url = req.body.url || '';
  campaign.schedule = req.body.schedule || '';
  campaign.internal_title = req.body.internal_title || '';
  campaign.addlogo = req.body.addlogo || '';
  campaign.image = req.body.image || '';

  // Find user to save to
  // console.log(req.user);
  campaign.userID = req.user._id;

  console.log(campaign);

  campaign.save(function(err){
    if(err){
      console.log(err);
    } else {
      console.log('Saved Campaign');
    }
  });
  res.redirect('/campaign/' + campaign._id);
}

module.exports.findByID = findByID;
module.exports.findByUsername = findByUsername;
module.exports.processImageUsingCache = processImageUsingCache;
module.exports.processImageUsingRasterizer = processImageUsingRasterizer;
module.exports.callRasterizer = callRasterizer;
module.exports.postImageToUrl = postImageToUrl;
module.exports.sendImageInResponse = sendImageInResponse;
module.exports.addNewCampaign = addNewCampaign;