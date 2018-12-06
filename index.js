const axios = require('axios')
const qs = require('query-string')

async function getTrainData(startStation, stopStation) {
  async function grantAccessToken() {
    const grant_info = { grant_type: 'client_credentials', client_id: 'fiHVbw8mmYYDWY4Q3DtWr0T7uMIa', client_secret: 'Lsg5Vyn15u2VqXwwKgAXW_ezZdAa' }
    const res = await axios.post('http://164.115.43.151:8280/token', qs.stringify(grant_info))
    return res.data.access_token
  }
  const token = await grantAccessToken()
  const payload = { StartStation: startStation, DestStation: stopStation, LangCode: 'TH', flag: 'GetData' }
  const config = { headers: { Authorization: `Bearer ${token}` } }
  const res = await axios.post('http://164.115.43.151:8280/railwayService/1.0/trainsearch', payload, config)
  console.log(res.data)
  return res.data
}

getTrainData(1001,3107)
