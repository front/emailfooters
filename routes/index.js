var Campaign = require('../models/Campaign');
var User = require('../models/User');

// Needed modules
var mongoose = require('mongoose');
var fs = require('fs');
var path = require('path');
var utils = require('../lib/utils');
var join = require('path').join;
var request = require('request');
var url = require('url');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

// Connect to DB
mongoose.connect('mongodb://localhost/Emailads');


// dev - Create a default user
// var defaultUser = new User({ username: 'defaultUser' });
// defaultUser.save(function (err) {
//   if (err) console.log(err);
// })
var users = [
    { id: 1, username: 'test', password: 'test', email: 'bob@example.com' }
];

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function(err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));


module.exports = function(app){

  var rasterizerService = app.settings.rasterizerService;
  var fileCleanerService = app.settings.fileCleanerService;


  app.post('/login',
    passport.authenticate('local', 
    { 
      successRedirect: '/',
      failureRedirect: '/',
      failureFlash: false })
    );


  app.get('/deleteall', function(req,res,next){
    Campaign.collection.drop();
    res.redirect('/');
  });
  app.get('/', function(req,res, next){
    res.render('index', {});
  });
  app.post('/', function (req,res, next){
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
    campaign = new Campaign();
    campaign.title = req.body.title || '';
    campaign.body = req.body.body || '';
    campaign.url = req.body.url || '';
    campaign.schedule = req.body.schedule || '';
    campaign.internal_title = req.body.internal_title || '';
    campaign.addlogo = req.body.addlogo || '';
    campaign.image = req.body.image || '';


    campaign.save(function(err){
      if(err){
        console.log(err);
      } else {
        console.log('Saved Campaign');
      }
    });
    res.redirect('/campaign/' + campaign._id);
    // res.render('index', req.body);
  });

  // Campaign list
  app.get('/campaigns', function(req,res,next){
    Campaign
    .find()
    .exec( function(err,campaigns){
      if(err){
        console.log(err);
      } else {
        res.render('campaigns',{campaigns: campaigns});
      }
    }
    );
  });

  // Show One specific campaign
  app.get('/campaign/:id?', function (req,res,next){
    console.log(req.params.id);

    var query = Campaign.findOne({'_id': req.params.id});
    query.exec(function(err,campaign){
      if(err) return 'No campaign found with that id';
      console.log('Found campaign!');
      console.log(campaign);
      res.render('index', campaign);

    });
  });

  // Rendered output for a single campaign that will be used for screenshot
  app.get('/campaign/render/:id', function(req,res,next){
    Campaign
    .findOne({ '_id': req.params.id})
    .exec( function(err,campaign){
      if(err){
        console.log(err);
      } else {
        res.render('render',{campaign: campaign});
      }
    }
    );
  });

  // Catches the screenshot callback
  app.post('/screenshotCallback', function(req,res,next){
    req.on('end', function(){
      //console.log(req);
      res.send('foobar');
      //res.writeHead(200);

      res.end();
    });
    res.send('bazbaz');

    req.pipe(fs.createWriteStream(path.join( __dirname, '../public/screenshots/foo.png')));
  });

  // Shows the actual screenshot file for a campaign
  app.get('/campaign/screenshot/:id?', function(req,res, next){
    var url = 'http://localhost:3000/campaign/render/' + req.params.id;
    // required options
    var options = {
      uri: 'http://localhost:' + rasterizerService.getPort() + '/',
      headers: { url: url }
    };
    // console.log(rasterizerService.getPort());
    ['width', 'height', 'clipRect', 'javascriptEnabled', 'loadImages', 'localToRemoteUrlAccessEnabled', 'userAgent', 'userName', 'password', 'delay'].forEach(function(name) {
      if (req.param(name, false)) options.headers[name] = req.param(name);
      options.headers['width'] = '1';
      options.headers['height'] = '1';

      console.log( 'paramaters:' );
      console.log( req );
    });

    var filename = 'screenshot_' + utils.md5(url + JSON.stringify(options)) + '.png';
    options.headers.filename = filename;

    var filePath = join(rasterizerService.getPath(), filename);

    var callbackUrl = req.param('callback', false) ? utils.url(req.param('callback')) : false;
    //callbackUrl='http://localhost:3000/screenshotCallback';
    console.log('callbackURL is now=' + callbackUrl);


    if (path.existsSync(filePath)) {
      console.log('Request for %s - Found in cache', url);
      processImageUsingCache(filePath, res, callbackUrl, function(err) { if (err) next(err); });
      return;
    }
    console.log('Request for %s - Rasterizing it', url);
    console.log(callbackUrl);
    processImageUsingRasterizer(options, filePath, res, callbackUrl, function(err) { if(err) next(err); });
  });

  // User page
  app.get( '/user', function (req,res,next){
    var query = User
    .findOne(
      // {'_id': req.params.id}
      )
    .exec(function(err, user){
      if(err) { 
        console.log( 'No User found with that id');
      } else {
        console.log('Found User!');
        res.render('user', {user: user});
      }
    });
  });

  app.get('/login', function(req,res,next){
    res.render('login', {});
  });

// Helper functions
var processImageUsingCache = function(filePath, res, url, callback) {
  if (url) {
      // asynchronous
      //res.send('Will post screenshot to ' + url + ' when processed');
      console.log(url);

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
}
