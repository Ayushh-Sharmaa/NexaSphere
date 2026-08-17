import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { studentAuthService } from "../services/studentAuthService.js";
import jwt from "jsonwebtoken";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
const BASE_URL = process.env.BASE_URL || "http://localhost:8080";

export const hasGoogleOAuth = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
export const hasGitHubOAuth = Boolean(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET);

const DOMAIN_RESTRICTION = process.env.OAUTH_DOMAIN_RESTRICTION || "";

function verifyBypassToken(stateToken, email) {
  if (!stateToken || !process.env.JWT_SECRET) return false;
  try {
    const decoded = jwt.verify(stateToken, process.env.JWT_SECRET);
    return (
      decoded.bypassSso === true &&
      String(decoded.email).toLowerCase() === String(email).toLowerCase()
    );
  } catch (err) {
    return false;
  }
}

if (hasGoogleOAuth) {
}

export default passport;
