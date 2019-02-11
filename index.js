const qs = require('querystring')
const csv = require('csvtojson')
const Crawler = require('crawler')
const urlBase = 'http://api.brfares.com/querysimple'
const codesFile = './station_codes.csv'

let complete = 0
let c = new Crawler({
  rateLimit: 200,
  jQuery: false,
  headers: {
    'Accept-Encoding': 'identity'
  },
  callback: function(err, res, done){
    if (err) {
      writeLog(`Error with ${res.options.uri}`)
      writeLog(err)
    }
    try {
      let data = JSON.parse(res.body)
      let singleStandard = getFare(data, 'SINGLE', 'STD')
      if (singleStandard.length === 0) {
        writeLog(`${res.options.from} - ${res.options.to} - ${singleStandard.length}`)
      }
      complete ++
      process.stdout.write(`.`)
      if (complete % 100 === 0) {
        writeLog(`Checked ${complete}`)
      }
    } catch (err) {
      writeLog(`Error with ${res.options.uri}`)
      writeLog(err)
    }

    done();
  }
})

function getFaresData(from, to, crawler) {
  crawler.queue({
    uri: `${urlBase}?${qs.stringify({orig: from, dest: to})}`,
    from,
    to
  })
}

function getFare(data, type, ticketClass) {
  return data.fares.filter(fare => {
    return fare.ticket.type.desc === type && fare.ticket.tclass.desc === ticketClass
  })
}

function writeLog(msg) {
  console.log(`\n`)
  console.log(msg)
}

async function processFares(station, c) {
  let codes = await csv()
  .fromFile(codesFile)
  
  codes.map(code => {
    getFaresData(station, code['CRS Code'], c)
  })
}

let station = process.argv[2]
if (station.length === 3) {
  processFares(station, c)
} else {
  writeLog(`Please add station argument`)
}
