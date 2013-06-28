/* jshint esnext: true, strict: true, node: true */
'use strict';

var Models = require('../models/Campaign'),
    request = require('request'),
    fs = require('fs'),
    path = require('path'),
    utils = require('../lib/utils.js'),
    indexFunctions = require('./index.js'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
// , ObjectID = require('mongodb').ObjectID

var processImageUsingCache = function(filePath, res, url, callback) {
  if (url) {
    // asynchronous
    postImageToUrl(filePath, url, callback);
  }
  else {
    // synchronous
    sendImageInResponse(filePath, res, callback);
  }
};

var processImageUsingRasterizer = function(rasterizerOptions, filePath, res, url, callback) {
  console.log('-------------------------------------');
  console.log(filePath);
  console.log(url);
  console.log('------------- end -------------------');
  if (url && url === true) {
    console.log('a');
    //  console.log(rasterizerOptions)
    // rasterizerOptions.headers.url = "/"
    callRasterizer(rasterizerOptions, function(error) {
      if (error) {
        return callback(error);
      }
      sendImageInResponse(filePath, res, callback);
    });
  }
  else if (url) {
    callRasterizer(rasterizerOptions, function(error) {
      if (error) {
        return callback(error);
      }
      postImageToUrl(filePath, url, callback);
    });
  }
  else {
    console.log('b');
    // synchronous
    callRasterizer(rasterizerOptions, function(error) {
      if (error) {
        return callback(error);
      }
      sendImageInResponse(filePath, res, callback);
    });
  }
};

var callRasterizer = function(rasterizerOptions, callback) {
  request.get(rasterizerOptions, function(error, response, body) {
    if (error || response.statusCode != 200) {
      console.log('Error while requesting the rasterizer: %s', error.message);
      indexFunctions.rasterizerService().restartService();
      return callback(new Error(body));
    }
    callback(null);
  });
};

var postImageToUrl = function(imagePath, url, callback) {
  console.log('Streaming image to %s', url);
  var fileStream = fs.createReadStream(imagePath);
  fileStream.on('end', function() {
    console.log('Readfile!');
    indexFunctions.fileCleanerService().addFile(imagePath);
  });
  fileStream.on('error', function(err) {
    if (err) {
      console.log('Error while reading file: %s', err.message);
      callback(err);
    }
    else {
      callback(null);
    }
  });
  fileStream.pipe(request.post(url, function(err) {
    console.log('piped file!');
    if (err) {
      console.log('Error while streaming screenshot: %s', err);
      callback(err);
    }
    else {
      callback(null);
    }
  }));
};

var sendImageInResponse = function(imagePath, res, callback) {
  console.log('Sending image in response');
  res.sendfile(imagePath, function(err) {
    indexFunctions.fileCleanerService().addFile(imagePath);
    callback(err);
  });
};

var findByID = function(id, fn) {
  Models.UserSchema.findOne({_id: id}, function(err, user) {
    if (err) {
      fn(new Error('User ' + id + ' does not exist'));
    }
    else {
      fn(null, user);
    }
  });
};

var findByUsername = function(username, fn) {
  Models.UserSchema.findOne({username: username}, function(err, user) {
    if (err) {
      return fn(null, null);
    }
    else {
      fn(null, user);
    }
  });
};

var getUploadedFiles = function(req, res, next, params, dirPath) {

  if (fs.existsSync(dirPath)) {
    fs.readdir(dirPath, function(err, data) {
      if (err) {
        req.message = JSON.stringify(err);
        showMessage(req, res, next);
        console.log(err);
      }
      var files = [];
      if (data) {
        for (var i in data) {
          files.push(req.protocol + '://' + req.get('host') + '/' + req.user._id + '' + '/' + data[i]);
        }
      }
      params.uploadedList = JSON.stringify(files.join(','));
      console.log('+===================');
      console.log(req.params);
      res.render('index', params);
    });
  } else {
    fs.mkdir(dirPath, 0777, function(e) {
      if ((e && e.code === 'EEXIST')) {
      } else {
        params.uploadedList = JSON.stringify([]);
        res.render('index', params);
      }
    });
  }
};

var uploadImage = function(req, res, next) {
  if (typeof req.files.image !== 'undefined' && req.files.image.size !== 0) {
    console.log('Will try to save image');
    var imgpath = req.files.image.path;
    //  console.log(req.user._id)
    var dirPath = path.join(__dirname, '../uploads/', req.user._id + '', '/');
    var newPath = path.join(__dirname, '../uploads/', req.user._id + '', '/', req.files.image.name);
    var writeToFile = function(data) {
      fs.writeFile(newPath, data, function(err) {
        if (err && data && data !== 0) {
          if (req) {
            req.message = JSON.stringify(err);
            showMessage(req, res, next);
          }
          console.log(err);
        }
        else {
          console.log('Saved file to: ' + newPath);
          console.log('Saved file as: ' + path.join(__dirname, req.user._id + '', '/', req.files.image.name));
          // return
          req.body.image = newPath;
          if (!req.savedata) {
            res.redirect(req.headers.referer);
          }
          else {
            res.end();
          }
        }
      });
    };

    fs.readFile(imgpath, function(err, data) {
      fs.mkdir(dirPath, 0777, function(e) {
        console.log(e);
        if ((e && e.code === 'EEXIST') && data && data !== 0) {
          writeToFile(data);
        }
        else {
          if (req) {
            req.message = JSON.stringify(err);
            showMessage(req, res, next);
          }
        }
      });
    });
  } else {
    res.end('error');
  }

};
function copyTemp(filePath, urlfileDir, urlfilePath, req, res) {
  var writeToFile = function(data) {
    fs.writeFile(urlfilePath, data, function(err) {
      if (err && data && data !== 0) {
        if (req) {
          req.message = JSON.stringify(err);
          showMessage(req, res, next);
        }
        console.log(err);
      } else {
        //req.body.text = "<img src='" + urlfilePath + "'/>";
        // res.redirect(req.headers['referer']);
      }
    });
  };
  fs.readFile(filePath, function(err, data) {
    if (err) {
      if (req) {
        req.message = JSON.stringify(err);
        showMessage(req, res, next);
      }
      console.log(err);
    }
    fs.mkdir(urlfileDir, 0777, function(e) {
      if ((e && e.code === 'EEXIST') && data && data !== 0) {
        writeToFile(data);
      } else {
        writeToFile(data);
      }
    });
  });
}
var printScreenshot = function(campaign, req, res, next) {
  var url = GLOBAL.address + '/campaign/viewrender/' + req.params.id;
  // required options
  var options = {
    uri: GLOBAL.location + ':' + indexFunctions.rasterizerService().getPort() + '/',
    headers: {url: url}
  };
  if (campaign.ckwidth) {
    options.headers.width = campaign.ckwidth;
  }
  if (campaign.ckheight) {
    options.headers.height = campaign.ckheight;
  }
  var params = [
    'clipRect',
    'javascriptEnabled',
    'loadImages',
    'localToRemoteUrlAccessEnabled',
    'userAgent',
    'userName',
    'password',
    'delay'
  ];
  params.forEach(function(name) {
    try {
      if (req.param(name, false)) {
        options.headers[name] = req.param(name);
      }
    }
    catch (err) {
    }
  });
  // var filename = 'screenshot_' + utils.md5(url + JSON.stringify(options)) + '.png';
  var filename = 'screenshot_' + campaign._id + '.png';
  options.headers.filename = filename;
  var filePath = path.join(indexFunctions.rasterizerService().getPath(), filename);
  var callbackUrl = req.param('callback', false) ? utils.url(req.param('callback')) : false;
  //callbackUrl='http://localhost:3000/screenshotCallback';
  console.log('callbackURL is now=' + callbackUrl);
  var urlfileDir = path.join(__dirname, '../imgurl/', req.user._id + '', '/');
  var urlfilePath = path.join(urlfileDir, filename);
  if (fs.existsSync(filePath)) {
    console.log('Request for %s - Found in cache', url);
    processImageUsingCache(filePath, res, callbackUrl, function(err) {
      if (err) {
        next(err);
      }
      copyTemp(filePath, urlfileDir, urlfilePath, req, res);
    });
    return;
  }
  console.log('Request for %s - Rasterizing it', url);
  processImageUsingRasterizer(options, filePath, res, callbackUrl, function(err) {
    if (err) {
      next(err);
    }
    if (fs.existsSync(filePath)) {
      copyTemp(filePath, urlfileDir, urlfilePath, req, res);
    }
  });
};
var addNewCampaign = function(req, res, next) {
  // Save attached image
  // Build object that will be saved
  // Find user to save to
  // console.log(req.user);
  var campaign;
  // req.savedata = true;
  // uploadImage(req, res, next);
  if (req.body.idd) {
    Models.CampaignSchema.findOne({_id: req.body.idd}, function(err, camp) {
      if (err) {
        if (req) {
          req.message = JSON.stringify(err);
          showMessage(req, res, next);
        }
        console.log(err);
      }
      else {
        camp.title = req.body.title || '';
        camp.body = req.body.CKeditor || '';
        camp.url = req.body.url || '';
        camp.schedule = req.body.schedule || '';
        camp.internal_title = req.body.internal_title || '';
        camp.addlogo = req.body.addlogo || '';
        camp.image = req.body.image || '';
        camp.userID = req.user._id;
        camp.ckwidth = req.body.ckwidth;
        camp.ckheight = req.body.ckheight;
        camp.last_updated = undefined;

        campaign = camp;
        console.log(camp);
        campaign.save(function(err) {
          if (err) {
            if (req) {
              req.message = JSON.stringify(err);
              showMessage(req, res, next);
            }
            console.log(err);
          }
          else {
            console.log('Delete tmp image');
            var imagePath = path.join(indexFunctions.rasterizerService().getPath(), 'screenshot_' + camp._id + '.png');
            console.log(fs.existsSync(imagePath));
            if (fs.existsSync(imagePath)) {
              fs.unlink(imagePath, function(err) {
                if (err) {
                  if (req) {
                    req.message = JSON.stringify(err);
                    showMessage(req, res, next);
                  }
                  console.log(err);
                }
              });
            }
            res.redirect('/campaign/' + campaign._id);
          }
        });
      }
    });
  }
  else {
    campaign = new Models.CampaignSchema();
    campaign.title = req.body.title || '';
    campaign.body = req.body.CKeditor || '';
    campaign.url = req.body.url || '';
    campaign.schedule = req.body.schedule || '';
    campaign.internal_title = req.body.internal_title || '';
    campaign.addlogo = req.body.addlogo || '';
    campaign.image = req.body.image || '';
    campaign.userID = req.user._id;
    campaign.ckwidth = req.body.ckwidth;
    campaign.ckheight = req.body.ckheight;
    // console.log(document.getElementByTagName("iframe")[0].offsetWidth)
    // campaign.width = document.getElementByTagName("iframe")[0].offsetWidth;
    campaign.save(function(err) {
      if (err) {
        if (req) {
          req.message = JSON.stringify(err);
          showMessage(req, res, next);
        }
        console.log(err);
      }
      else {
        console.log('Saved Campaign');
        res.redirect('/campaign/' + campaign._id);
      }
    });
  }

  // res.redirect('/campaign/' + campaign._id);
  // console.log(res);
  // res.render('/');
};
var showMessage = function(req, res, next) {
  req.flash('info', req.message);
  if (!req.type) {
    res.redirect('/errorpage');
  }
  else {
    res.redirect(req.url);
  }
};

module.exports.findByID = findByID;
module.exports.findByUsername = findByUsername;
module.exports.processImageUsingCache = processImageUsingCache;
module.exports.processImageUsingRasterizer = processImageUsingRasterizer;
module.exports.callRasterizer = callRasterizer;
module.exports.postImageToUrl = postImageToUrl;
module.exports.sendImageInResponse = sendImageInResponse;
module.exports.addNewCampaign = addNewCampaign;
module.exports.uploadImage = uploadImage;
module.exports.showMessage = showMessage;
module.exports.getUploadedFiles = getUploadedFiles;
module.exports.printScreenshot = printScreenshot;
