import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user.js';

passport.use(new GoogleStrategy({
    clientID: 'process.env.GOOGLE_CLIENT_ID',
    clientSecret: 'process.env.GOOGLE_CLIENT_SECRET',
    callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    let user = await User.findOne({ googleId: profile.id });
    if (user) {
        return done(null, user);
    } else {
        user = new User({
            googleId: profile.id,
            displayName: profile.displayName,
            email: profile.emails[0].value
        });
        await user.save();
        return done(null, user);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});

export default passport;
