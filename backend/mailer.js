import nodemailer from "nodemailer";
import googleApis from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const { google } = googleApis;
const OAuth2 = google.auth.OAuth2;
const oauth2Client = new OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL
);
oauth2Client.setCredentials({
  refresh_token:
    process.env.GOOGLE_REFRESH_TOKEN
});
const accessToken = oauth2Client.getAccessToken();
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    type: "Oauth2",
    user: process.env.EMAIL_ADDRESS,
    // pass: process.env.EMAIL_PASSWORD,
    clientId:
      process.env.GOOGLE_CLIENT_ID,
    clientSecret:
      process.env.GOOGLE_CLIENT_SECRET,
    refreshToken:
      process.env.GOOGLE_REFRESH_TOKEN,
    accessToken: accessToken,
    tls: { rejectUnauthorized: false },
  },
});
export default transporter;
