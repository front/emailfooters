/* jshint esnext: true, strict: true, node: true */
'use strict';

var Models = require('../models/Campaign');
// Needed modules
var mongoose = require('mongoose'),
    fs = require('fs'),
    path = require('path'),
    utils = require('../lib/utils'),
    join = require('path').join,
    request = require('request'),
    url = require('url'),
    passport = require('passport'),
    util = require('util'),
    flash = require('connect-flash'),
    helperFunctions = require('./helperFunctions');

// Connect to DB
// var mongoconn = mongoose.connect('mongodb://' + domain + '/DBname');
var mongoconn = mongoose.connect('mongodb://root:root@' + GLOBAL.domain);

String.prototype.trim = function() {
  return this.replace(/^\s+|\s+$/g, '');
};

var fileCleanerService, rasterizerService;

module.exports.fileCleanerService = function() {
  return fileCleanerService;
};

module.exports.rasterizerService = function() {
  return rasterizerService;
};

module.exports = function(app) {
  rasterizerService = app.settings.rasterizerService;
  fileCleanerService = app.settings.fileCleanerService;
  app.post('/login', passport.authenticate('local', {
    failureRedirect: '/loginfail',
    failureFlash: false}), function(req, res, next) {
    res.redirect('/user');
  });
  app.get('/loginfail', function(req, res, next) {
    var flag;
    req.message = {};
    req.message.username_message = 'Username and/or password incorrect.';
    req.type = 'username_message';
    req.url = '/login';
    helperFunctions.showMessage(req, res, next);
  });
  app.get('/deleteall', ensureAuthenticated, function(req, res, next) {
    // Models.CampaignSchema.collection.drop();
    var dirPath = path.join(__dirname, '../imgurl/', req.user._id + '', '/');
    var rmDir = function(dirPath) {
      var files;
      try {
        files = fs.readdirSync(dirPath);
      }
      catch (e) {
        return;
      }
      if (files.length > 0) {
        for (var i = 0; i < files.length; i++) {
          var filePath = path.join(dirPath, '/', files[i]);
          console.log(fs.statSync(filePath).isFile());
          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
          }
          //  else
          //      rmDir(filePath);
        }
        console.log('Removing all screenshots');
      }
      //fs.rmdirSync(dirPath);
    };
    Models.CampaignSchema
        .find({userID: req.user._id})
        .remove(function(err, campaigns) {
          if (err) {
            req.message = JSON.stringify(err);
            helperFunctions.showMessage(req, res, next);
            console.log(err);
          }
          else {
            rmDir(dirPath);
            res.redirect('/campaigns');
          }
        });
  });
  app.get('/campaign/delete/:id', ensureAuthenticated, function(req, res, next) {
    Models.CampaignSchema
                .find({userID: req.user._id, _id: req.params.id})
                .remove(function(err, campaigns) {
          if (err) {
                req.message = JSON.stringify(err);
                helperFunctions.showMessage(req, res, next);
                console.log(err);
          } else {
                console.log('Delete screenshot');
                var imagePath = path.join(__dirname, '../imgurl/', req.user._id + '', '/', 'screenshot_' + req.params.id);
                fs.unlink(imagePath, function(err) {
              if (err) {
                if (req) {
                  req.message = JSON.stringify(err);
                  helperFunctions.showMessage(req, res, next);
                }
                console.log(err);
              }
              res.redirect('/campaigns');
                });
          }
        });
  });
  app.get('/errorpage', function(req, res, next) {
    res.render('errorpage', {pagetitle: 'Error', message: req.flash('info')});
    // res.redirect('errorpage', {pagetitle: 'Error', data: req});
  });
  app.get('/flash/:id', function(req, res, next) {
    //  req.message = "Hi! T'his is a test page!";
    //   helperFunctions.showMessage(req, res, next)
    //req.flash('info', 'Welcome');
    // res.redirect('/errorpage');

    //  res.redirect('/campaigns');
  });
  app.get('/', function(req, res, next) {
    res.render('frontpage', {pagetitle: 'Welcome to Emailfooters', user: req.user});
  });
  app.get('/add', ensureAuthenticated, function(req, res, next) {
    console.log(req.user);
    console.log(JSON.stringify(req.isAuthenticated));
    var params = {};
    var dirPath = path.join(__dirname, '../uploads/', req.user._id + '', '/');
    params.user = req.user;
    params.pagetitle = 'Add';
    params.uploadedList = helperFunctions.getUploadedFiles(req, res, next, params, dirPath);
    //  res.render('index', {pagetitle: 'Add', user: req.user});
  });

  app.post('/add', ensureAuthenticated, function(req, res, next) {
    helperFunctions.addNewCampaign(req, res, next);
  });
  app.post('/adddata/:id?', ensureAuthenticated, function(req, res, next) {
    helperFunctions.uploadImage(req, res, next);
  });
  // Campaign list
  app.get('/campaigns', ensureAuthenticated, function(req, res, next) {
    Models.CampaignSchema
                .find({userID: req.user._id}).sort('last_updated -1')
                .exec(function(err, campaigns) {
          if (err) {
                req.message = JSON.stringify(err);
                helperFunctions.showMessage(req, res, next);
                console.log(err);
          } else {
                if (campaigns.length > 0) {
              console.log('Found campaigns!!');
            //   console.log(campaigns);
                } else {
              console.log('no campaigns found');
                }
                res.render('campaigns', {pagetitle: 'Your list of campaigns', user: req.user, campaigns: campaigns});
          }
        });
  });

  // Show One specific campaign
  app.get('/campaign/:id', ensureAuthenticated, function(req, res, next) {
    console.log(' --------------------------');
    console.log(req.protocol + '://' + req.get('host') + req.url);
    var query = Models.CampaignSchema.findOne({'_id': req.params.id});
    query.exec(function(err, campaign) {
      if (err || !campaign)
        return 'No campaign found with that id';
      console.log('Found campaign!');
      console.log(campaign);
      console.log(req.user);

      var params = campaign;
      var dirPath = path.join(__dirname, '../uploads/', req.user._id + '', '/');
      params.user = req.user;
      params.idd = req.params.id;
      params.pagetitle = 'View of selected campaign';
      params.uploadedList = helperFunctions.getUploadedFiles(req, res, next, params, dirPath);

    });
  });
  app.get('/uploaded/:id?', redirectAuthenticated, function(req, res, next) {
    var dirPath = path.join(__dirname, '../uploads/', req.user._id + '', '/');
    if (req.headers.referer && (req.headers.referer.indexOf('/campaign/' + req.params.id) || req.headers.referer.indexOf('/add'))) {
      if (fs.existsSync(dirPath)) { // or fs.existsSync
        fs.readdir(path.join(__dirname, '../uploads/', req.user._id + '', '/'), function(err, data) {
          if (err) {
            req.message = JSON.stringify(err);
            helperFunctions.showMessage(req, res, next);
            console.log(err);
          }
          var files = [];
          if (data) {
            for (var i in data) {
              files.push({name: data[i], path: req.protocol + '://' + req.get('host') + '/' + req.user._id + '' + '/' + data[i]});
            }
          }
          res.render('uploaded_files', {filelist: files});
        });
      } else {
        res.render('uploaded_files', {filelist: []});
      }
    }
  });
  app.get('/uploaded/:id', ensureAuthenticated, function(req, res, next) {
    var dirPath = path.join(__dirname, '../uploads/', req.user._id + '', '/');
    var query = Models.CampaignSchema.findOne({'_id': req.params.id});

    console.log('start');
    console.log(req.headers);
    console.log(req.params);
    console.log(req.body);

    query.exec(function(err, campaign) {
      if (err || !campaign)
        return 'No campaign found with that id';

      console.log(campaign);

      var params = campaign;
      params.user = req.user;
      params.idd = req.params.id;
      params.pagetitle = 'View of selected campaign';
      params.uploadedList = '';
      if (fs.existsSync(dirPath)) {
        fs.readdir(path.join(__dirname, '../uploads/', req.user._id + '', '/'), function(err, data) {
          if (err) {
            req.message = JSON.stringify(err);
            helperFunctions.showMessage(req, res, next);
            console.log(err);
          }
          var files = [];
          if (data) {
            for (var i in data) {
              files.push(path.join(req.protocol, '/', req.get('host'), '/', req.user._id + '', '/', data[i]));
            }
          }
          params.uploadedList = JSON.stringify(files.join(','));
          res.write(JSON.stringify(params.uploadedList));
          res.end();
          // res.render('index', params);
        });
      } else {
        params.uploadedList = '';
        res.write('');
        res.end();
      }
    });
  });

  // Rendered output for a single campaign that was used for screenshot
  app.get('/campaign/render/:id', ensureAuthenticated, function(req, res, next) {
    Models.CampaignSchema
                .findOne({'_id': req.params.id})
                .exec(function(err, campaign) {
          console.log(campaign);
          if (err) {
                if (req) {
              req.message = JSON.stringify(err);
              helperFunctions.showMessage(req, res, next);
                }
                console.log(err);
          } else {
                res.render('render', {pagetitle: 'Campaign view', user: req.user, campaign: campaign});
          }
        });
  });
  app.get('/campaign/viewrender/:id', redirectAuthenticated, function(req, res, next) {
    Models.CampaignSchema
                .findOne({'_id': req.params.id})
                .exec(function(err, campaign) {
          if (err) {
                if (req) {
              req.message = JSON.stringify(err);
              helperFunctions.showMessage(req, res, next);
                }
                console.log(err);
          } else {
                console.log('??');
                res.render('render_screenshot', {pagetitle: 'Campaign view', user: req.user, campaign: campaign});
          }
        });
  });
  app.get('/campaign/generaterender/:id', redirectAuthenticated, function(req, res, next) {
    Models.CampaignSchema
                .findOne({'_id': req.params.id})
                .exec(function(err, campaign) {
          if (err) {
                if (req) {
              req.message = JSON.stringify(err);
              helperFunctions.showMessage(req, res, next);
                }
                console.log(err);
          } else {
                console.log('??');
                // if(req.data)
                //     res.redirect('/campaigns')
                //else
                console.log(campaign);
                var loc = GLOBAL.address + '/' + campaign.userID + '/screenshot_' + req.params.id;
                console.log(loc);
                res.render('render_screenshot', {pagetitle: 'Campaign view', user: req.user, campaign: campaign, imgurl: "<img src='" + loc + "'/>"});
          }
        });
  });
  // Catches the screenshot callback
  app.post('/screenshotCallback', ensureAuthenticated, function(req, res, next) {
    /*req.on('end', function() {
         res.send('foobar');

         res.end();
         });
         res.send('bazbaz');

         req.pipe(fs.createWriteStream(path.join(__dirname, '../public/screenshots/foo.png')));*/
  });
  // Generates file and img tag
  app.get('/campaign/generateurl/:id?', ensureAuthenticated, function(req, res, next) {
    //  console.log('!!!')
    //var urlinfo =  GLOBAL.address + '/' + req.user._id + '/screenshot_' + req.params.id;
    //res.render('campaigns', {pagetitle: 'Your list of campaigns', user: req.user, campaigns: campaigns, urlinfo: urlinfo});
  });
  // Shows the actual screenshot file for a campaign
  app.get('/campaign/screenshot/:id?', ensureAuthenticated, function(req, res, next) {
    //var url = GLOBAL.address + '/campaign/render/' + req.params.id;
    Models.CampaignSchema
                .findOne({'_id': req.params.id})
                .exec(function(err, campaign) {
          if (err) {
                if (req) {
              req.message = JSON.stringify(err);
              helperFunctions.showMessage(req, res, next);
                }
                console.log(err);
          } else {
                helperFunctions.printScreenshot(campaign, req, res, next);
          }
        });
  });

  app.get('/user', ensureAuthenticated, function(req, res) {
    if (!app.settings.firstLogin) {
      app.settings.firstLogin = true;
    }
    res.render('user', {user: req.user});
  });

  app.get('/login', function(req, res, next) {
    res.render('login', {pagetitle: 'Login to your account', message: req.flash('info')});
  });

  app.get('/logout', function(req, res) {
    req.logout();
    app.settings.firstLogin = false;
    res.redirect('/');
  });

  app.get('/signup', function(req, res, next) {
    res.render('signup', {pagetitle: 'Sign up', message: req.flash('info')});
  });

  app.post('/signup', function(req, res, next) {
    var flag;
    req.message = {};
    if (!req.body.password.length) {
      req.message.pass_message = 'Password required.';
      req.type = 'pass_message';
      flag = true;
    }
    if (!req.body.confirm.length) {
      req.message.confirm_message = 'Password confirmation required.';
      req.type = 'confirm_message';
      flag = true;
    }
    if (!flag && req.body.confirm != req.body.password) {
      req.message.confirm_message = 'Passwords must match.';
      req.type = 'confirm_message';
      flag = true;
    }
    if (req.body.name.length < 4) {
      req.message.name_message = 'Name length must have more than three characters.';
      req.type = 'name_message';
      flag = true;
    }
    if (flag) {
      helperFunctions.showMessage(req, res, next);
    } else {
      Models.UserSchema
                    .find({username: req.body.name})
                    .exec(function(err, userdata) {
                if (err) {
              req.message = JSON.stringify(err);
              helperFunctions.showMessage(req, res, next);
              console.log(err);
                } else {
              if (userdata.length > 0) {
                req.message.name_message = 'Name allready exist. Choose another username';
                req.type = 'name_message';
                helperFunctions.showMessage(req, res, next);
              } else {
                var newUser = new Models.UserSchema({
                  username: req.body.name,
                  password: req.body.password});
                newUser.save(function(err) {
                  if (err) {
                    req.message = JSON.stringify(err);
                    helperFunctions.showMessage(req, res, next);
                    console.log(err);
                  } else {
                    req.login(newUser, function(error) {
                      if (error) {
                        throw error;
                      }
                      if (!app.settings.firstLogin) {
                        app.settings.firstLogin = true;
                      }
                      res.render('user', {user: newUser}); // This route is the home where the user should be connected, or is redirected to /login
                    });
                  }
                });
              }
                }
          });
    }
  });

  function getApp() {
    return app;
  }

  function redirectAuthenticated(req, res, next) {
    if (app.settings.firstLogin) {
      return next();
    } else {
      res.redirect('/login');
    }
  }
};
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/login');
  }
}

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  helperFunctions.findByID(id, function(err, user) {
    done(err, user);
  });
});
