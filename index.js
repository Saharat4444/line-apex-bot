const express = require('express');
const line    = require('@line/bot-sdk');
const axios   = require('axios');

const app = express();

const lineConfig = {
  channelAccessToken: process.env.LINE_TOKEN,
  channelSecret:      process.env.LINE_SECRET
};

const lineClient = new line.Client(lineConfig);

// รับ Webhook จาก LINE → Forward ไป APEX
app.post('/webhook',
  line.middleware(lineConfig),
  async (req, res) => {
    res.status(200).send('OK');

    for (const event of req.body.events) {
      if (event.type !== 'message') continue;
      if (event.message.type !== 'text') continue;

      try {
        // ส่งไป APEX โดยใส่ค่าใน HTTP Header
        await axios.post(process.env.APEX_URL, {}, {
          headers: {
            'user_id':      event.source.userId,
            'user_message': event.message.text,
            'reply_token':  event.replyToken,
            'Content-Type': 'application/json'
          }
        });
      } catch (err) {
        console.error('Error:', err.message);
      }
    }
  }
);

app.get('/', (_, res) => res.send('LINE Bot is running!'));
app.listen(process.env.PORT || 3000);
