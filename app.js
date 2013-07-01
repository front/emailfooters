/**
 * Module dependencies.
 */
var express = require('express'),
routes = require('./routes'),
http = require('http'),
path = require('path'),
config = require('config'),
request = require('request'),
RasterizerService = require('./lib/rasterizerService'),
FileCleanerService = require('./lib/fileCleanerService'),
flash = require('connect-flash'),
passport = require('passport'),
appconn = require('./config/main.json'),
app = express(), zserver;

process.on('uncaughtException', function(err) {
    console.error("[uncaughtException]", err);
    process.exit(1);
});

process.on('SIGTERM', function() {
    process.exit(0);
});

process.on('SIGINT', function() {
    process.exit(0);
});

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
        global_location: appconn.address
    };
});
app.configure('development', function() {
    app.use(express.errorHandler());
});
require('./routes')(app);


zserver = http.createServer(app);
zserver.listen(app.get('port'), function(a, b) {
    console.log("Express server listening on port " + app.get('port'));
});