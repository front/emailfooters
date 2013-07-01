var CampaignModel = require('../models/Campaign'),
        UserModel = require('../models/User'),
        mongoose = require('mongoose'),
        fs = require('fs'),
        path = require('path'),
        appconn = require('../config/main.json'),
        helperFunctions = require('../scripts/helperFunctions'),
        passporth = require('../scripts/passportHelpers'),
// Connect to DB
        mongoconn = mongoose.connect(appconn.connection1),
        fileCleanerService, rasterizerService, retrApp;

module.exports.fileCleanerService = function() {
    return fileCleanerService;
};
module.exports.rasterizerService = function() {
    return rasterizerService;
};
module.exports.retrApp = function() {
    return retrApp;
};
module.exports = function(app) {
    rasterizerService = app.settings.rasterizerService;
    fileCleanerService = app.settings.fileCleanerService;
    retrApp = app.settings.firstLogin;
    app.post('/login', passporth.passport.authenticate('local', {
        failureRedirect: '/loginfail',
        failureFlash: false}), function(req, res, next) {
        res.redirect('/user');
    });
    app.get('/loginfail', function(req, res, next) {
        req.message = {};
        req.message.username_message = "Username and/or password incorrect.";
        req.type = 'username_message';
        req.url = '/login';
        helperFunctions.showMessage(req, res, next);
    });
    app.get('/deleteall', helperFunctions.ensureAuthenticated, function(req, res, next) {
        var dirPath = path.join(__dirname, "../imgurl/", req.user._id + "", "/"),
                rmDir = function(dirPath) {
            var files = [];
            try {
                files = fs.readdirSync(dirPath);
            } catch (e) {
                return;
            }
            if (files.length > 0) {
                for (var i = 0; i < files.length; i++) {
                    var filePath = path.join(dirPath, '/', files[i]);
                    if (fs.statSync(filePath).isFile()) {
                        fs.unlinkSync(filePath);
                    }
                }
            }
        };
        helperFunctions.removeCampaign(req.user._id, undefined, function(err, campaigns) {
            if (err) {
                req.message = JSON.stringify(err);
                helperFunctions.showMessage(req, res, next);
                console.log(err);
            } else {
                rmDir(dirPath);
                res.redirect('/campaigns');
            }
        })
    });
    app.get('/campaign/delete/:id', helperFunctions.ensureAuthenticated, function(req, res, next) {
        helperFunctions.removeCampaign(req.user._id, req.params.id, function(err, newUser) {
            if (err) {
                req.message = JSON.stringify(err);
                helperFunctions.showMessage(req, res, next);
                console.log(err);
            } else {
                var imagePath = path.join(__dirname, "../imgurl/", req.user._id + "", "/", "screenshot_" + req.params.id);
                if (fs.existsSync(imagePath)) {
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
                } else {
                    res.redirect('/campaigns');
                }
            }
        })
    });
    app.get('/errorpage', function(req, res, next) {
        res.render('errorpage', {pagetitle: 'Error', message: req.flash('info')});
    });
    app.get('/flash/:id', function(req, res, next) {
    });
    app.get('/', function(req, res, next) {
        res.render('frontpage', {pagetitle: 'Welcome to Emailfooters', user: req.user});
    });
    // Add campaign
    app.get('/add', helperFunctions.ensureAuthenticated, function(req, res, next) {
        var params = {}, dirPath = path.join(__dirname, "../uploads/", req.user._id + "", "/");
        params.user = req.user;
        params.pagetitle = 'Add';
        params.uploadedList = helperFunctions.getUploadedFiles(req, res, next, params, dirPath);
    });
    app.post('/add', helperFunctions.ensureAuthenticated, function(req, res, next) {
        helperFunctions.addNewCampaign(req, res, next);
    });
    //ckEditor upload file
    app.post('/adddata/:id?', helperFunctions.ensureAuthenticated, function(req, res, next) {
        helperFunctions.uploadImage(req, res, next);
    });
    // Campaign list
    app.get('/campaigns', helperFunctions.ensureAuthenticated, function(req, res, next) {
        helperFunctions.findCampaign(req.user._id, req.params.id, "last_updated -1", function(err, campaigns) {
            if (err) {
                req.message = JSON.stringify(err);
                helperFunctions.showMessage(req, res, next);
                console.log(err);
            } else {
                res.render('campaigns', {pagetitle: 'Your list of campaigns', user: req.user, campaigns: campaigns});
            }
        })
    });

    // Show One specific campaign
    app.get('/campaign/:id', helperFunctions.ensureAuthenticated, function(req, res, next) {
        helperFunctions.findCampaign(null, req.params.id, function(err, campaign) {
            var params = campaign[0], dirPath = path.join(__dirname, "../uploads/", req.user._id + "", "/");
            if (err || !campaign) {
                return 'No campaign found with that id';
            } else {
                params.user = req.user;
                params.idd = req.params.id;
                params.pagetitle = 'View of selected campaign';
                params.uploadedList = helperFunctions.getUploadedFiles(req, res, next, params, dirPath);
            }
        })
    });
    app.get('/uploaded/:id?', helperFunctions.redirectAuthenticated, function(req, res, next) {
        var dirPath = path.join(__dirname, "../uploads/", req.user._id + "", "/");
        if (req.headers['referer'] && (req.headers['referer'].indexOf('/campaign/' + req.params.id) || req.headers['referer'].indexOf('/add'))) {
            if (fs.existsSync(dirPath)) { // or fs.existsSync
                fs.readdir(path.join(__dirname, "../uploads/", req.user._id + "", "/"), function(err, data) {
                    var files = [];
                    if (err) {
                        req.message = JSON.stringify(err);
                        helperFunctions.showMessage(req, res, next);
                        console.log(err);
                    }
                    if (data) {
                        for (var i in data) {
                            files.push({name: data[i], path: req.protocol + "://" + req.get('host') + "/" + req.user._id + "" + "/" + data[i]});
                        }
                    }
                    res.render('uploaded_files', {filelist: files});
                });
            } else {
                res.render('uploaded_files', {filelist: []});
            }
        }
    });
    //List of user uploaded files to use for ckeditor
    app.get('/uploaded/:id', helperFunctions.ensureAuthenticated, function(req, res, next) {
        var dirPath = path.join(__dirname, "../uploads/", req.user._id + "", "/");
        helperFunctions.findCampaign(null, req.params.id, function(err, campaign) {
            if (err || !campaign) {
                return 'No campaign found with that id';
            } else {
                console.log(campaign)
                var params = campaign[0];
                params.user = req.user;
                params.idd = req.params.id;
                params.pagetitle = 'View of selected campaign';
                params.uploadedList = '';
                if (fs.existsSync(dirPath)) {
                    fs.readdir(path.join(__dirname, "../uploads/", req.user._id + "", "/"), function(err, data) {
                        var files = [];
                        if (err) {
                            req.message = JSON.stringify(err);
                            helperFunctions.showMessage(req, res, next);
                            console.log(err);
                        }
                        if (data) {
                            for (var i in data) {
                                files.push(path.join(req.protocol, "/", req.get('host'), "/", req.user._id + "", "/", data[i]));
                            }
                        }
                        params.uploadedList = JSON.stringify(files.join(","));
                        res.write(JSON.stringify(params.uploadedList));
                        res.end();
                    });
                } else {
                    params.uploadedList = "";
                    res.write("");
                    res.end();
                }
            }
        });
    });

    // Rendered output for a single campaign that was used for screenshot
    app.get('/campaign/render/:id', helperFunctions.ensureAuthenticated, function(req, res, next) {
        helperFunctions.findCampaign(null, req.params.id, function(err, campaign) {
            if (err) {
                if (req) {
                    req.message = JSON.stringify(err);
                    helperFunctions.showMessage(req, res, next);
                }
                console.log(err);
            } else {
                res.render('render', {pagetitle: 'Campaign view', user: req.user, campaign: campaign[0]});
            }
        });
    });
    app.get('/campaign/viewrender/:id', helperFunctions.redirectAuthenticated, function(req, res, next) {
        helperFunctions.findCampaign(null, req.params.id, function(err, campaign) {
            if (err) {
                if (req) {
                    req.message = JSON.stringify(err);
                    helperFunctions.showMessage(req, res, next);
                }
                console.log(err);
            } else {
                res.render('render_screenshot', {pagetitle: 'Campaign view', user: req.user, campaign: campaign[0]});
            }
        });
    });
    app.get('/campaign/generaterender/:id', helperFunctions.redirectAuthenticated, function(req, res, next) {
        helperFunctions.findCampaign(null, req.params.id, function(err, campaign) {
            if (err) {
                if (req) {
                    req.message = JSON.stringify(err);
                    helperFunctions.showMessage(req, res, next);
                }
                console.log(err);
            } else {
                res.render('render_screenshot', {pagetitle: 'Campaign view', user: req.user, campaign: campaign[0]});
            }
        });
    });
    // Catches the screenshot callback
    app.post('/screenshotCallback', helperFunctions.ensureAuthenticated, function(req, res, next) {

    });
    // Generates file and img tag   
    app.get('/campaign/generateurl/:id?', helperFunctions.ensureAuthenticated, function(req, res, next) {

    });
    // Shows the actual screenshot file for a campaign
    app.get('/campaign/screenshot/:id?', helperFunctions.ensureAuthenticated, function(req, res, next) {
        helperFunctions.findCampaign(null, req.params.id, function(err, campaign) {
            if (err) {
                if (req) {
                    req.message = JSON.stringify(err);
                    helperFunctions.showMessage(req, res, next);
                }
                console.log(err);
            } else {
                helperFunctions.printScreenshot(campaign[0], req, res, next);
            }
        });
    });

    app.get('/user', helperFunctions.ensureAuthenticated, function(req, res) {
        if (!app.settings.firstLogin) {
            retrApp = true;
            app.settings.firstLogin = true;
        }
        res.render('user', {user: req.user});
    });

    app.get('/login', function(req, res, next) {
        res.render('login', {pagetitle: 'Login to your account', message: req.flash('info')});
    });

    app.get('/logout', function(req, res) {
        req.logout();
        retrApp = false;
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
            req.message.pass_message = "Password required.";
            req.type = 'pass_message';
            flag = true;
        }
        if (!req.body.confirm.length) {
            req.message.confirm_message = "Password confirmation required.";
            req.type = 'confirm_message';
            flag = true;
        }
        if (!flag && req.body.confirm !== req.body.password) {
            req.message.confirm_message = "Passwords must match.";
            req.type = 'confirm_message';
            flag = true;
        }
        if (req.body.name.length < 4) {
            req.message.name_message = "Name length must have more than three characters.";
            req.type = 'name_message';
            flag = true;
        }
        if (flag) {
            helperFunctions.showMessage(req, res, next);
        } else {
            helperFunctions.findByUsername(req.body.name, function(err, userdata) {
                if (err) {
                    req.message = JSON.stringify(err);
                    helperFunctions.showMessage(req, res, next);
                    console.log(err);
                } else {
                    if (userdata) {
                        req.message.name_message = "Name allready exist. Choose another username";
                        req.type = 'name_message';
                        helperFunctions.showMessage(req, res, next);
                    } else {
                        helperFunctions.addNewUser(req.body.name, req.body.password, function(err, newUser) {
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
                                        retrApp = true;
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
};