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

passport.serializeUser((user, done) => {
  console.log("Serializing user:", user);
  done(null, user);
});

passport.deserializeUser((user, done) => {
  console.log("Deserializing user:", user);
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:8000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google OAuth callback received:", {
          profileId: profile.id,
          email: profile.emails?.[0]?.value,
          name: profile.displayName,
        });

        if (!profile.emails || !profile.emails[0]?.value) {
          return done(new Error("No email found in Google profile"), null);
        }

        // Check if user already exists
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
          // Create new user if doesn't exist
          user = await User.create({
            email: profile.emails[0].value,
            fullName: profile.displayName,
            googleId: profile.id,
            password: Math.random().toString(36).slice(-8),
            phone: "0000000000",
          });
        } else if (!user.googleId) {
          // Update Google ID if not set
          user.googleId = profile.id;
          await user.save();
        }

        // Generate JWT token
        const token = jwt.sign(
          { userId: user._id, email: user.email, fullName: user.fullName },
          process.env.JWT_SECRET,
          { expiresIn: "2h" }
        );

        return done(null, { token });
      } catch (error) {
        console.error("Google authentication error:", error);
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
