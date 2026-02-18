const querystring = require("querystring");
const axios = require("axios");
require('dotenv').config();

// 1. Generate the Google Auth URL
const getGoogleAuthURL = () => {
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = {
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        access_type: "offline",
        response_type: "code",
        prompt: "consent",
        scope: [
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
        ].join(" "),
    };

    return `${rootUrl}?${querystring.stringify(options)}`;
};

// 2. Exchange the authorization code for tokens (Access & ID Token)
const getGoogleTokens = async (code) => {
    const url = "https://oauth2.googleapis.com/token";
    const values = {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
    };

    try {
        const res = await axios.post(
            url,
            querystring.stringify(values),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );
        return res.data; // contains access_token, refresh_token, id_token, etc.
    } catch (error) {
        console.error("Failed to fetch auth tokens");
        throw new Error(error.response.data.error_description);
    }
};

// 3. Get the user from Google with the access token
const getGoogleUser = async ({ id_token, access_token }) => {
    try {
        const res = await axios.get(
            `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
            {
                headers: {
                    Authorization: `Bearer ${id_token}`,
                },
            }
        );
        return res.data;
    } catch (error) {
        console.error("Error fetching Google user");
        throw new Error(error.message);
    }
};

module.exports = { getGoogleAuthURL, getGoogleTokens, getGoogleUser };

