const express = require('express');
const line    = require('@line/bot-sdk');
const axios   = require('axios');

const app = express();

const lineConfig = {
  channelAccessToken: process.env.LINE_TOKEN,
  channelSecret:      process.env.LINE_SECRET
};

const lineClient = new line.Client(lineConfig);

app.post('/webhook',
  line.middleware(lineConfig),
  async (req, res) => {
    res.status(200).send('OK');

    for (const event of req.body.events) {
      if (event.type !== 'message') continue;
      if (event.message.type !== 'text') continue;

      // ส่งไป APEX แบบไม่รอผล (fire and forget)
      axios.post(process.env.APEX_URL, {
        user_id:      event.source.userId,
        user_message: event.message.text,
        reply_token:  event.replyToken
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000  // รอสูงสุด 10 วินาที
      }).catch(err => console.error('APEX Error:', err.message));

    }
  }
);

app.get('/', (_, res) => res.send('LINE Bot is running!'));
app.listen(process.env.PORT || 3000);
