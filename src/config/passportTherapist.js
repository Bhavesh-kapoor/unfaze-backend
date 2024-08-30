// passportConfig.js
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Therapist } from "../models/therapistModel.js";
import dotenv from "dotenv";

dotenv.config();

// google strategy
passport.use(
  "google-therapist",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/therapist/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await Therapist.findOne({ googleId: profile.id });
        if (!user) {
          user = new Therapist({
            googleId: profile.id,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile.emails[0].value,
            is_email_verified: true,
          });

          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// facebook strategies
passport.use(
  "facebook-therapist",
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "/auth/therapist/facebook/callback",
      profileFields: ["id", "emails", "name"],
      scope: ["email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await Therapist.findOne({ facebookId: profile.id });

        if (!user) {
          user = new Therapist({
            facebookId: profile.id,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile.emails[0].value,
          });

          await user.save();
        }

        return done(null, user);
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
