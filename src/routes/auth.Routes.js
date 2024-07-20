import { Router } from "express";
import passport from "passport";
const authRoute = Router();

authRoute.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
  }));

  export default authRoute