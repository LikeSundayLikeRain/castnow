var md5 = require('../utils/md5')
var stupidMD5 = require('../utils/blackbox')
var request = require('sync-request')
var debug = require('debug')('castnow:douyu');

function getSourceURL(rid) {
  const API_KEY = 'a2053899224e8a92974c729dceed1cc99b3d8282'
  const tt = Math.round(new Date().getTime() / 60 / 1000)
  const did = md5(Math.random().toString()).toUpperCase()
  const signContent = [rid, did, API_KEY, tt].join('')
  const sign = stupidMD5(signContent)
  var body = {
    'cdn': 'ws',
    'rate': '0',
    'ver': '2017022801',
    'tt': tt,
    'did': did,
    'sign': sign
  }
  body = Object.keys(body).map(key => `${key}=${encodeURIComponent(body[key])}`).join('&')
  try {
    var res = request('POST', `https://www.douyu.com/lapi/live/getPlay/${rid}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body
    })
    const videoInfo = JSON.parse(res.getBody('utf8'))
    const baseUrl = videoInfo.data.rtmp_url
    const livePath = videoInfo.data.rtmp_live
    if (baseUrl && livePath) {
      const videoUrl = baseUrl + '/' + livePath
      return videoUrl
    } else {
      debug('Douyu source url resolve failed')
      debug('HTTP Code: %s', res.statusCode)
      debug('ERROR Code: %s', videoInfo.error)
      process.exit()
    }
  }
  catch (e) {
    debug(e)
    process.exit()
  }

}

var douyu = function (ctx, next) {
  if (ctx.mode !== 'launch' || !ctx.options.douyu) return next();
  var orgPath = ctx.options.playlist[0].path;
  if (/^\d+$/g.test(orgPath)) {
    var rid = orgPath
  } else {
    var rid = /.*douyu.com\/(\w+)/g.exec(orgPath)[1]
  }
  debug('Room ID: %s', rid)
  ctx.options.playlist[0].path = getSourceURL(rid)
  ctx.options.tomp4 = true
  ctx.options['ffmpeg-c'] = 'copy'
  ctx.options['-copyts'] = true
  next();
}

module.exports = douyu