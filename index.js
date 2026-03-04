const express  = require('express');
const line     = require('@line/bot-sdk');
const axios    = require('axios');
const https    = require('https');  // เพิ่มบรรทัดนี้

const app = express();

const lineConfig = {
  channelAccessToken: process.env.LINE_TOKEN,
  channelSecret:      process.env.LINE_SECRET
};

const lineClient = new line.Client(lineConfig);

// เพิ่ม agent นี้
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

app.post('/webhook',
  line.middleware(lineConfig),
  async (req, res) => {
    res.status(200).send('OK');

    for (const event of req.body.events) {
      if (event.type !== 'message') continue;
      if (event.message.type !== 'text') continue;

      console.log('1. รับข้อความ:', event.message.text);

      try {
        console.log('2. กำลังส่งไป APEX...');

        const response = await axios.post(process.env.APEX_URL, {
          user_id:      event.source.userId,
          user_message: event.message.text,
          reply_token:  event.replyToken
        }, {
          headers:    { 'Content-Type': 'application/json' },
          timeout:    25000,
          httpsAgent: httpsAgent  // เพิ่มบรรทัดนี้
        });

        console.log('3. APEX ตอบ:', JSON.stringify(response.data));

        const replyText = response.data.reply_text || 'ได้รับข้อความแล้วครับ';

        await lineClient.replyMessage(event.replyToken, {
          type: 'text',
          text: replyText
        });

        console.log('5. ส่งกลับ LINE สำเร็จ');

      } catch (err) {
        console.error('Error ที่ step:', err.message);
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
