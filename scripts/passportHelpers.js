var helperFunctions = require('../scripts/helperFunctions'),
        passport = require('passport'),
        LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(function(username, password, done) {
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
            if (user.password !== password) {
                return done(null, false, {message: 'Invalid password'});
            }
            return done(null, user);
        });
    });
}
));
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    helperFunctions.findByID(id, function(err, user) {
        done(err, user);
    });
});

module.exports.passport = passport;