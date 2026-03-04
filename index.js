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

      try {
        // ส่งไป APEX และรอรับ reply text กลับมา
        const response = await axios.post(process.env.APEX_URL, {
          user_id:      event.source.userId,
          user_message: event.message.text,
          reply_token:  event.replyToken
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 25000
        });

        // ดึง reply จาก APEX
        const replyText = response.data.reply_text || 'ได้รับข้อความแล้วครับ';

        // Node.js ส่งกลับ LINE เอง
        await lineClient.replyMessage(event.replyToken, {
          type: 'text',
          text: replyText
        });

      } catch (err) {
        console.error('Error:', err.message);

        // ถ้า APEX Error ยังตอบ LINE ได้
        await lineClient.replyMessage(event.replyToken, {
          type: 'text',
          text: 'ขออภัย เกิดข้อผิดพลาดครับ'
        }).catch(() => {});
      }
    }
  }
);

app.get('/', (_, res) => res.send('LINE Bot is running!'));
app.listen(process.env.PORT || 3000);
