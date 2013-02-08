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
, util = require('util')
, flash = require('connect-flash')
, helperFunctions = require('./helperFunctions');


// Connect to DB
mongoose.connect('mongodb://localhost/Emailads2');

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

  app.post('/add', ensureAuthenticated, function (req,res,next){
    helperFunctions.addNewCampaign(req,res,next);
   
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
    helperFunctions.processImageUsingRasterizer(options, filePath, res, callbackUrl, function(err) { if(err) next(err); });
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

app.get('/signup', function(req,res){
  res.render('signup');
});

app.post('/signup', function(req, res){
  
  var newUser = new Models.UserSchema({ 
    username: req.body.name, 
    password: req.body.password });

  newUser.save(function (err) {
    if (err) console.log(err);
  });
  res.render('index', {});
});
}



passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  // console.log('DeserializeUser')

  helperFunctions.findByID(id, function (err, user) {
    done(err, user);
  });
});


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}
