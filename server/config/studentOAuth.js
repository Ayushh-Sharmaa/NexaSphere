import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { studentAuthService } from "../services/studentAuthService.js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
const BASE_URL = process.env.BASE_URL || "http://localhost:8080";

export const hasGoogleOAuth = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
export const hasGitHubOAuth = Boolean(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET);

const DOMAIN_RESTRICTION = process.env.OAUTH_DOMAIN_RESTRICTION || "";

if (hasGoogleOAuth) {
  passport.use(
    "google",
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${BASE_URL}/api/auth/google/callback`,
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value || "";
          if (DOMAIN_RESTRICTION && !email.endsWith(`@${DOMAIN_RESTRICTION}`)) {
            return done(null, false, {
              message: `Only @${DOMAIN_RESTRICTION} emails allowed`,
            });
          }
          const user = await studentAuthService.findOrCreateFromOAuth(profile);
          const token = studentAuthService.generateToken(user);
          return done(null, { user, token });
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

if (hasGitHubOAuth) {
  passport.use(
    "github",
    new GitHubStrategy(
      {
        clientID: GITHUB_CLIENT_ID,
        clientSecret: GITHUB_CLIENT_SECRET,
        callbackURL: `${BASE_URL}/api/auth/github/callback`,
        scope: ["user:email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email =
            profile.emails?.[0]?.value || `${profile.username}@github.oauth`;
          const user = await studentAuthService.findOrCreateFromOAuth(profile);
          const token = studentAuthService.generateToken(user);
          return done(null, { user, token });
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

passport.serializeUser((data, done) => done(null, data));
passport.deserializeUser((data, done) => done(null, data));

export default passport;
