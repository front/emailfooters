var Models = require('../models/Campaign');
// Needed modules
var mongoose = require('mongoose')
, fs = require('fs')
, path = require('path')
, utils = require('../lib/utils')
, join = require('path').join
, request = require('request')
, url = require('url')
, passport = require('passport')
, LocalStrategy = require('passport-local').Strategy
, util = require('util')
, flash = require('connect-flash');


// Connect to DB
mongoose.connect('mongodb://localhost/Emailads2');

// dev - Create a default user
var defaultUser = new Models.UserSchema({ username: 'test', password: 'test' });
defaultUser.save(function (err) {
  if (err) console.log(err);
})


passport.use(new LocalStrategy(
  function(username, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {

      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      findByUsername(username, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
        if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
        return done(null, user);
      })
    });
  }
  ));


module.exports = function(app){

  var rasterizerService = app.settings.rasterizerService;
  var fileCleanerService = app.settings.fileCleanerService;


  app.post('/login',
    passport.authenticate('local',
    {
      successRedirect: '/user',
      failureRedirect: '/loginfail',
      failureFlash: false })
    );


  app.get('/deleteall', ensureAuthenticated, function(req,res,next){
    Models.CampaignSchema.collection.drop();
    res.redirect('/');
  });
  app.get('/', function(req,res, next){
    res.render('frontpage', {user: req.user});
  });
  app.get('/add', ensureAuthenticated, function(req,res, next){
    res.render('index', {user:req.user});
  });
  app.get('/loginfail', function(req,res, next){
    res.end('login fail');
  });

  app.post('/add', ensureAuthenticated, function (req,res, next){


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
    campaign.body = req.body.body || '';
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
    // res.render('index', req.body);
  });

  // Campaign list
  app.get('/campaigns', ensureAuthenticated, function(req,res,next){


    Models.CampaignSchema
    .find({ userID: req.user._id})
    .exec( function(err,campaigns){
      if(err){
        console.log(err);
      } else {
        if (campaigns.length > 0) {
          console.log('Found campaigns!!'); 
          console.log( campaigns);
        } else {
          console.log('no campaigns found');
        }
        res.render('campaigns',{ user: req.user, campaigns: campaigns });
      }
    }
    );
  });

  // Show One specific campaign
  app.get('/campaign/:id', ensureAuthenticated, function (req,res,next){

    console.log('foo');
    var query = Models.CampaignSchema.findOne({'_id': req.params.id});
    query.exec(function(err, campaign){
      console.log('bar');

      if(err) return 'No campaign found with that id';
      console.log('Found campaign!');
      console.log(campaign);
      console.log(req.user);

      var params = campaign;
      params.user = req.user;
      res.render('index',  params );

    });
  });

  // Rendered output for a single campaign that will be used for screenshot
  app.get('/campaign/render/:id', ensureAuthenticated, function(req,res,next){
    Models.CampaignSchema
    .findOne({ '_id': req.params.id})
    .exec( function(err,campaign){
      if(err){
        console.log(err);
      } else {
        res.render('render',{user:req.user, campaign: campaign});
      }
    }
    );
  });

  // Catches the screenshot callback
  app.post('/screenshotCallback', ensureAuthenticated, function(req,res,next){
    req.on('end', function(){
      res.send('foobar');

      res.end();
    });
    res.send('bazbaz');

    req.pipe(fs.createWriteStream(path.join( __dirname, '../public/screenshots/foo.png')));
  });

  // Shows the actual screenshot file for a campaign
  app.get('/campaign/screenshot/:id?', ensureAuthenticated, function(req,res, next){
    var url = 'http://localhost:3000/campaign/render/' + req.params.id;
    // required options
    var options = {
      uri: 'http://localhost:' + rasterizerService.getPort() + '/',
      headers: { url: url }
    };

    // console.log(rasterizerService.getPort());
    ['width', 'height', 'clipRect', 'javascriptEnabled', 'loadImages', 'localToRemoteUrlAccessEnabled', 'userAgent', 'userName', 'password', 'delay'].forEach(function(name) {
    });
      if (req.param(name, false)) options.headers[name] = req.param(name);
      options.headers['width'] = '1';
      options.headers['height'] = '1';

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
    processImageUsingRasterizer(options, filePath, res, callbackUrl, function(err) { if(err) next(err); });
  });


app.get('/user', ensureAuthenticated, function(req, res){
  res.render('user', { user: req.user });
});

app.get('/login', function(req,res,next){
  res.render('login', {});
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});




// Helper functions
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
}

function findById(id, fn) {
  Models.UserSchema.findOne({_id: id}, function(err, user){
    if(err){ 
      fn(new Error('User ' + id + ' does not exist'));
    } else {
      fn(null, user);
    }
  });
}

function findByUsername(username, fn) {
  Models.UserSchema.findOne({username: username}, function(err, user){
    if(err){ 
      return fn(null, null);
    } else {
      fn(null, user);
    }
  });
}

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  // console.log('DeserializeUser')

  findById(id, function (err, user) {
    done(err, user);
  });
});


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}
