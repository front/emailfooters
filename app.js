
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
  app.use(express.logger('dev'));
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
