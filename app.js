/* jshint esnext: true, strict: true, node: true */

'use strict';

/**
 * Module dependencies.
 */
var domain = 'localhost',
    protocol = 'http',
    view_port = 3000;

GLOBAL.domain = domain;
GLOBAL.location = protocol + '://' + domain;
GLOBAL.address = protocol + '://' + domain + ':' + view_port;

var express = require('express'),
    routes = require('./routes'),
    http = require('http'),
    path = require('path'),
    config = require('config'),
    request = require('request'),
    util = require('util'),
    RasterizerService = require('./lib/rasterizerService'),
    FileCleanerService = require('./lib/fileCleanerService'),
    flash = require('connect-flash'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    helperFunctions = require('./routes/helperFunctions');


// var MongoStore = require('connect-mongo')(config);
process.on('uncaughtException', function(err) {
  console.error('[uncaughtException]', err);
  /*
  request.get('/errorpage')
    request(
    { method: 'GET'
    , uri: '/errorpage'
    , multipart:
      [ { 'content-type': 'text/html,application/xhtml+xml,application/xml'
        ,  body: JSON.stringify(err)
        }
      , { body: JSON.stringify({text:'error', err:err}) }
      ]
    }
  , function (error, response, body) {
      if(response.statusCode == 201){
        console.log('document saved as: bla')
      } else {
        console.log('error: '+ response.statusCode)
        console.log(body)
      }
    }
  )
  */
  process.exit(1);
});

process.on('SIGTERM', function() {
  process.exit(0);
});

process.on('SIGINT', function() {
  process.exit(0);
});

/**
 * Express configuration.
 */
var app = express();
app.configure(function() {
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  // app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());

  app.use(express.session({
    secret: 'keyboard cat',
    maxAge: new Date(Date.now() + 3600000)
    /*store: new MongoStore({db: mongoose.connection.db},
        function(err) {
            console.log(err || 'connect-mongodb setup ok');
        })*/
  }));

  // passport setup. These needs to be *before*   app.use(app.router);
  app.use(flash());
  app.use(passport.initialize());
  app.use(passport.session());

  app.use('/', app.router);
  app.set('rasterizerService', new RasterizerService(config.rasterizer).startService());
  app.set('fileCleanerService', new FileCleanerService(config.cache.lifetime));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.static(path.join(__dirname, 'uploads')));
  app.use(express.static(path.join(__dirname, 'imgurl')));
  app.locals = {
    global_location: GLOBAL.address
  };
});

app.configure('development', function() {
  app.use(express.errorHandler());
});
require('./routes')(app);

/**
 * Start server with Express.
 */
var zserver = http.createServer(app);
zserver.listen(app.get('port'), function(a, b) {
  console.log('Express server listening on port ' + app.get('port'));
  /* var fs = require('fs');
     *  fs.writeFile(__dirname + "/tmp/test", '\n', function(err) {
     if (err) {
     console.log(err);
     }
     });
     Object.keys(app).forEach(function(key) {
     var val = app[key].toString();
     fs.appendFile(__dirname + "/tmp/test", key + '   -    ' + val + '\n', function(err) {
     if (err) {
     console.log(err);
     }
     });
     });*/
});

/**
 * Authentication.
 */
passport.use(new LocalStrategy(
  function(username, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function() {
      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      helperFunctions.findByUsername(username, function(err, user) {
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false, {message: 'Unknown user ' + username});
        }
        if (user.password != password) {
          return done(null, false, {message: 'Invalid password'});
        }
        return done(null, user);
      });
    });
  }
));




