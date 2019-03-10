
'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const config = require('./config.json');
// create LINE SDK client
const client = new line.Client(config);

const app = express();

app.post('/webhook', line.middleware(config), (req, res) => {
  if (!Array.isArray(req.body.events)) {
    return res.status(500).end();
  }
  Promise.all(req.body.events.map(event => {
    console.log('event', event);
    if (event.replyToken === '00000000000000000000000000000000' ||
      event.replyToken === 'ffffffffffffffffffffffffffffffff') {
      return;
    }
    return handleEvent(event);
  }))
    .then(() => res.end())
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// simple reply function
const replyText = (token, texts) => {
  texts = Array.isArray(texts) ? texts : [texts];
  return client.replyMessage(
    token,texts.map((text) => ({ type: 'text', text }))
  );
};

function handleEvent(event) {
  switch (event.type) {
    case 'message':
      const message = event.message;
      switch (message.type) {
        case 'text':
          return handleText(message, event.replyToken);
        default:
          throw new Error(`Unknown message: ${JSON.stringify(message)}`);
      }
  }
}

function handleText(message, replyToken) {
  return replyText(replyToken, message.text);
}


const port = process.env.PORT;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
