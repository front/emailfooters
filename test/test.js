var assert = require('assert'),
    should = require('should'),
    Models = require('../models/Campaign'),
    mongoose = require('mongoose'),
    helperFunctions = require('../routes/helperFunctions');

mongoose.connect('mongodb://localhost/Emailads2');

describe('app', function() {
  it('should inherit from event emitter', function(done) {
    var app = express();
    app.on('foo', done);
    app.emit('foo');
  });
});
