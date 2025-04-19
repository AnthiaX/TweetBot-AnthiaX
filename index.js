const express = require('express');
const bodyParser = require('body-parser');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// Optional: Welcome route for root URL
app.get('/', (req, res) => {
  res.send('🚀 TweetBot for AnthiaX is alive and tweeting! 👑');
});

// Setup OAuth 1.0a
const oauth = OAuth({
  consumer: {
    key: process.env.API_KEY,
    secret: process.env.API_SECRET,
  },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
    return crypto.createHmac('sha1', key).update(base_string).digest('base64');
  },
});

const token = {
  key: process.env.ACCESS_TOKEN,
  secret: process.env.ACCESS_TOKEN_SECRET,
};

// /tweet POST endpoint
app.post('/tweet', async (req, res) => {
  const tweetText = req.body.text;

  if (!tweetText) {
    return res.status(400).json({ error: 'Missing tweet text' });
  }

  const request_data = {
    url: 'https://api.twitter.com/2/tweets',
    method: 'POST',
  };

  const oauthHeader = oauth.toHeader(oauth.authorize(request_data, token));

  try {
    const response = await axios.post(
      request_data.url,
      { text: tweetText }, // POST body should still be JSON
      {
        headers: {
          Authorization: oauthHeader.Authorization, // Use the generated header
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(200).json({ success: true, tweet: response.data });
  } catch (err) {
    console.error('Tweet failed:', err.response?.data || err.message);
    res.status(500).json({
      error: 'Tweet failed',
      details: err.response?.data || err.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 TweetBot running on port ${PORT}`);
});
