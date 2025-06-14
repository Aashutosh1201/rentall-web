const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Verify required environment variables
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error("Google OAuth credentials are not configured!");
  console.error(
    "Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file"
  );
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:8000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google profile received:", {
          id: profile.id,
          email: profile.emails?.[0]?.value,
          name: profile.displayName,
        });

        // Check if user already exists
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
          console.log("Creating new user from Google profile");
          // Create new user if doesn't exist
          user = await User.create({
            email: profile.emails[0].value,
            fullName:
              profile.displayName || profile.name?.givenName || "Google User",
            googleId: profile.id,
            // Set a random password for Google users
            password: Math.random().toString(36).slice(-8),
            // Set a default phone number that can be updated later
            phone: "not provided",
            isActive: true,
            emailVerified: true,
            phoneVerified: false,
          });
        } else {
          console.log("Existing user found:", user.email);
          // Update Google ID if not set
          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }
        }

        // Generate JWT token
        const token = jwt.sign(
          { userId: user._id, email: user.email, fullName: user.fullName },
          process.env.JWT_SECRET,
          { expiresIn: "2h" }
        );

        return done(null, { user, token });
      } catch (error) {
        console.error("Google authentication error:", error);
        return done(error, null);
      }
    }
  )
);

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user from the session
passport.deserializeUser((user, done) => {
  done(null, user);
});

module.exports = passport;
