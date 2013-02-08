
/**
 * Module dependencies.
 */

 var express = require('express')
 , routes = require('./routes')
 , http = require('http')
 , path = require('path')
 , config = require('config')
 , RasterizerService = require('./lib/rasterizerService')
 , FileCleanerService = require('./lib/fileCleanerService')
 , flash = require('connect-flash')
 , passport = require('passport')
 , LocalStrategy = require('passport-local').Strategy
 , helperFunctions = require('./routes/helperFunctions');



 process.on('uncaughtException', function (err) {
  console.error("[uncaughtException]", err);
  process.exit(1);
});

 process.on('SIGTERM', function () {
  process.exit(0);
});

 process.on('SIGINT', function () {
  process.exit(0);
});


 var app = express();

 app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  //app.use(express.logger('dev'));
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());

  app.use(express.session({ secret: 'keyboard cat' }));

  // passport setup. These needs to be *before*   app.use(app.router);
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());

  app.use('/', app.router);
  app.set('rasterizerService', new RasterizerService(config.rasterizer).startService());
  app.set('fileCleanerService', new FileCleanerService(config.cache.lifetime));

  app.use(express.static(path.join(__dirname, 'public')));



});

 app.configure('development', function(){
  app.use(express.errorHandler());
});
 require('./routes')(app);

 http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {

      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      helperFunctions.findByUsername(username, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
        if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
        return done(null, user);
      })
    });
  }
  ));