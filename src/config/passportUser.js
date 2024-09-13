// passportConfig.js
import dotenv from "dotenv";
import passport from "passport";
import { User } from "../models/userModel.js";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
dotenv.config();

// google strategy
passport.use(
  "google-user",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.APP_BASE_URL}/api/public/user/google/callback`,
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {

      try {
        let user = await User.findOne({ $or: [{ googleId: profile.id }, { email: profile.emails[0].value }] });
        if (user && !user?.googleId) {
          user.googleId = profile.id,
            user.profileImage = profile.photos[0].value,
            user.save();
        }
        if (!user) {
          user = new User({
            profileImage: profile.photos[0].value,
            googleId: profile.id,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile.emails[0].value,
            isEmailVerified: true,
          });
          const refreshToken = user.generateRefreshToken();
          user.refreshToken = refreshToken;
          await user.save();
        }
        const accessToken = user.generateAccessToken();
        return done(null, { user, accessToken });
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// facebook strategies
passport.use(
  "facebook-user",
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: `${process.env.APP_BASE_URL}/api/public/user/facebook/callback`,
      profileFields: ["id", "emails", "name"],
      scope: ["email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ facebookId: profile.id });

        if (!user) {
          user = new User({
            facebookId: profile.id,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile.emails[0].value,
            isEmailVerified: true,
          });
          await user.save();
        }
        const accessToken = user.generateAccessToken();
        return done(null, { user, accessToken });
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

export default passport;
