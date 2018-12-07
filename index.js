const express = require('express')
const Webtask = require('webtask-tools')
const bodyParser = require('body-parser')
const axios = require('axios')
const qs = require('query-string')
const Client = require('@line/bot-sdk').Client;
const { DateTime } = require("luxon")

const app = express()


app.use(bodyParser.urlencoded({
  extended: false
}))
app.use(bodyParser.json())
app.get('/', (req, res) => {
  res.json({
    msg: 'hi'
  })
})


app.post('/webhooks/line', async (req, res) => {
  const context = req.webtaskContext
  const lineConfig = getLineConfig(req)
  const client = new Client(lineConfig)

  const message = {
    type: 'text',
    text: 'Hello World!'
  }


  for (const event of req.body.events) {
    if (event.type === 'message') {
      // const lineRes = await client.replyMessage(event.replyToken,message)
      await handleMessage(event, client)
      console.log(event)


    }
  }
  res.json({
    msg: 'hi'
  })
})



// Bot Logic
const handleLogic = (context, message) => {
  if (message === 'รถไฟ') {


  }
}


// Line Message handler
const handleMessage = async (event, client) => {
  const { replyToken, message } = event

  if (message.type === 'text') {
    if (message.text.match(/รถไฟ/)) {
      const tmp = message.text.split(" ")
      // console.log(tmp)
      let train_info = await getTrainData(tmp[1], tmp[2])
      let train_bubbles = generateTrainBubble(train_info)
      const msg = {
        "type": "flex",
        "altText": "Train schedule",
        "contents": {
          "type": "carousel",
          "contents": train_bubbles
        }
      }
      try {
        await client.replyMessage(replyToken, msg)
      }
      catch (e) {
        console.log(e)       
      }

    } else {
      const msg = {
        type: 'text',
        text: 'ใจเย็นน เรายังทำไม่เสร็จ'
      }
      client.replyMessage(replyToken, msg)
    }
  }







  
  // else if (message.type === 'sticker') {
  // }
}

const getLineConfig = (req) => {
  const context = req.webtaskContext
  return {
    channelAccessToken: context.secrets.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: context.secrets.LINE_CHANNEL_SECRET
  }
}


function generateTrainBubble(data) {
  // const time_list = data.data
  const now_hour = DateTime.local().setZone("Asia/Bangkok").hour
  // console.log(now_hour)
  let time_list = []
  if (data.data.length > 6) {
    for (const ele of data.data) {
      const tmp = ele.DepTime.split(':')
      if (parseInt(tmp[0]) <= now_hour + 7) {
        time_list.push(ele)
      }
    }
  }
  else {
    time_list = data.data
  }

  let result = []
  for (const record of time_list) {
    result.push({
      "type": "bubble",
      "body": {
        "type": "box",
        "layout": "vertical",
        "spacing": "sm",
        "contents": [
          {
            "type": "text",
            "text": "TRAIN INFO",
            "weight": "bold",
            "color": "#1DB446",
            "size": "sm"
          },
          {
            "type": "text",
            "text": record.LangTTName,
            "wrap": true,
            "weight": "bold",
            "size": "xl"
          },
          {
            "type": "text",
            "text": `Train NO.${record.TrainNo}`,
            "size": "xs",
            "color": "#aaaaaa",
            "wrap": true
          },
          {
            "type": "separator",
            "margin": "xxl"
          },
          {
            "type": "box",
            "layout": "vertical",
            "margin": "xxl",
            "spacing": "sm",
            "contents": [
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  {
                    "type": "text",
                    "text": "Departure",
                    "size": "sm",
                    "color": "#555555",
                    "flex": 0
                  },
                  {
                    "type": "text",
                    "text": record.DepTime,
                    "size": "sm",
                    "color": "#111111",
                    "weight": "bold",
                    "align": "end"
                  }
                ]
              },
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  {
                    "type": "text",
                    "text": "Arrival",
                    "size": "sm",
                    "color": "#555555",
                    "flex": 0
                  },
                  {
                    "type": "text",
                    "text": record.ArrTime,
                    "size": "sm",
                    "color": "#111111",
                    "weight": "bold",
                    "align": "end"
                  }
                ]
              }
            ]
          }
        ]
      }
    })
  }
  console.log(result)
  return result

}









// Data Providers
async function getTrainData(startStation, stopStation) {
  async function grantAccessToken() {
    const grant_info = {
      grant_type: 'client_credentials',
      client_id: 'fiHVbw8mmYYDWY4Q3DtWr0T7uMIa',
      client_secret: 'Lsg5Vyn15u2VqXwwKgAXW_ezZdAa'
    }
    const res = await axios.post('http://164.115.43.151:8280/token', qs.stringify(grant_info))
    return res.data.access_token
  }

  async function getStationData() {
    const payload = {
      LangCode: 'TH',
      flag: 'station'
    }
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
    const res = await axios.post('http://164.115.43.151:8280/railwayService/1.0/trainlookup', payload, config)
    return res.data
  }
  function stationNameToCode(name) {
    // console.log(name)
    for (const ele of stations.data) {
      if (ele.stname.match(new RegExp(name))) {
        // console.log(`${ele.stname} at ${ele.StStart}`)
        return ele.StStart
      }
    }
  }

  const token = await grantAccessToken()
  const stations = await getStationData()  
  const start = stationNameToCode(startStation)
  const stop = stationNameToCode(stopStation)


  const payload = {
    StartStation: start,
    DestStation: stop,
    LangCode: 'TH',
    flag: 'GetData'
  }
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
  const res = await axios.post('http://164.115.43.151:8280/railwayService/1.0/trainsearch', payload, config)
  // console.log(res.data)
  return res.data
}


module.exports = Webtask.fromExpress(app)
