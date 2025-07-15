const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const User = require('../models/User');
require("dotenv").config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/google/callback",
    passReqToCallback: true
  },
  async function(request, accessToken, refreshToken, profile, done) {
    try {
      // Extract user info from Google profile
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
      const firstName = profile.name && profile.name.givenName ? profile.name.givenName : '';
      const lastName = profile.name && profile.name.familyName ? profile.name.familyName : '';
      
      // Check if user already exists in our database
      let user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        // If user already exists, authenticate them
        return done(null, user);
      } else {
        // Instead of creating a user immediately, create a temporary user object
        // that will be stored in the session for ID verification
        const tempGoogleUser = {
          id: `temp_${profile.id}`, // Add an id property for serialization
          googleId: profile.id,
          email: email,
          firstName: firstName, 
          lastName: lastName,
          requiresIdVerification: true,
          isGoogleUser: true,
          // Include initials for avatar display consistency
          initials: (firstName && lastName) ? 
                    `${firstName[0]}${lastName[0]}`.toUpperCase() : 
                    (email ? `${email[0]}${email[1] || ''}`.toUpperCase() : '??')
        };
        
        console.log('Created temporary Google user:', tempGoogleUser);
        
        // Return temp user data without saving to database yet
        return done(null, tempGoogleUser);
      }
    } catch (error) {
      console.error('Error in Google strategy:', error);
      return done(error, null);
    }
  }
));

// Simplified serialization - just pass the whole user object
// This avoids complications with different user types
passport.serializeUser(function(user, done) {
  // For debugging
  console.log('Serializing user:', user);
  
  // Serialize the user object directly (for both DB users and temporary Google users)
  done(null, user);
});

// Simplified deserialization to match the simplified serialization
passport.deserializeUser(async function(user, done) {
    try {
      console.log('Deserializing user:', user);
      
      // If this is a database user (has a MongoDB _id), fetch fresh data from DB
      if (user._id) {
        const dbUser = await User.findById(user._id);
        if (dbUser) {
          return done(null, dbUser);
        }
        return done(new Error('User not found in database'), null);
      } 
      // If this is a temporary Google user (has our temporary id format), return as is
      else if (user.id && user.id.startsWith('temp_')) {
        return done(null, user);
      }
      // If this is a legacy database user (has regular id), fetch from DB
      else if (user.id && !user.id.startsWith('temp_')) {
        const dbUser = await User.findById(user.id);
        if (dbUser) {
          return done(null, dbUser);
        }
        return done(new Error('User not found in database'), null);
      }
      // Fallback
      else {
        return done(null, user);
      }
    } catch (error) {
      console.error('Error deserializing user:', error);
      return done(error, null);
    }
});