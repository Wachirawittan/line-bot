'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const config = require('./config.json');

// create LINE SDK client
const client = new line.Client(config);
const app = express();

var rtg   = require("url").parse(process.env.REDIS_URL);
var redis = require("redis").createClient(rtg.port, rtg.hostname);
redis.auth(rtg.auth.split(":")[1]);
console.log(process.env.REDIS_URL);
redis.on('connect', function() {
    console.log('Redis client connected');
});

// webhook callback
app.post('/webhook', line.middleware(config), (req, res) => {
  // req.body.events should be an array of events
  if (!Array.isArray(req.body.events)) {
    return res.status(500).end();
  }
  // handle events separately
  Promise.all(req.body.events.map(event => {
    console.log('event', event);
    // check verify webhook event
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
    token,
    texts.map((text) => ({ type: 'text', text }))
  );
};

// callback function to handle a single event
function handleEvent(event) {
  switch (event.type) {
    case 'message':
      const message = event.message;
      switch (message.type) {
        case 'text':
          var resultText;
          redis.get(message.text, function (error, result) {
            if (error) {
              console.log(error);
              throw error;
            }
            resultText = "จำนวนแคลลอรี่ของ "+message.text+" เท่ากับ "+result+" แคลลอรี่";
            console.log('GET result ->' + result);
            return replyText(event.replyToken, resultText);
          });
          if(message.text=='' || message.text == null  || message.text){
            return handleText(message, event.replyToken);
          }
          return handleText(testText, event.replyToken);
        default:
          throw new Error(`Unknown message: ${JSON.stringify(message)}`);
      }

    default:
      throw new Error(`Unknown event: ${JSON.stringify(event)}`);
  }
}



function handleText(message, replyToken) {
  return replyText(replyToken, message.text);
}

function handleImage(message, replyToken) {
  return replyText(replyToken, 'Got Image');
}

function handleVideo(message, replyToken) {
  return replyText(replyToken, 'Got Video');
}

function handleAudio(message, replyToken) {
  return replyText(replyToken, 'Got Audio');
}

function handleLocation(message, replyToken) {
  return replyText(replyToken, 'Got Location');
}

function handleSticker(message, replyToken) {
  return replyText(replyToken, 'Got Sticker');
}

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
