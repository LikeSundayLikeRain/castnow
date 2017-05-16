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
  var res = request('POST', `https://www.douyu.com/lapi/live/getPlay/${rid}`, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: Object.keys(body).map(key => `${key}=${encodeURIComponent(body[key])}`).join('&')
  })
  const videoInfo = JSON.parse(res.getBody('utf8'))
  if (videoInfo.data.rtmp_url && videoInfo.data.rtmp_live) {
    return videoInfo.data.rtmp_url + '/' + videoInfo.data.rtmp_live
  } else {
    debug('Douyu source url resolve failed\n' + videoInfo)
    process.exit()
  }
}

var douyu = function (ctx, next) {
  try {
    if (ctx.mode !== 'launch' || !ctx.options.douyu) return next();
    var orgPath = ctx.options.playlist[0].path;
    var rid = /(.*douyu.com\/)?(\w+)/g.exec(orgPath)[2]
    if (!/^\d+$/g.test(rid)) {
      var res = request('GET', `https://www.douyu.com/${rid}`).getBody('utf-8')
      rid = /room_id=(\d+)/.exec(res)[1]
    }
    debug('Room ID: %s', rid)
    var room = JSON.parse(request('GET', `http://m.douyu.com/html5/live?roomId=${rid}`).getBody('utf-8'))['data']
    if (room['show_status'] == '2') {
      debug('Live stream is offline')
      process.exit()
    }
    ctx.options.playlist[0].path = getSourceURL(rid)
    ctx.options.playlist[0].media = {
      metadata: {
        title: room['room_name'],
        subtitle: room['show_details'],
        images: [room['room_src']]
      }
    }
    ctx.options.tomp4 = true
    ctx.options['ffmpeg-codec'] = 'copy'
    ctx.options['ffmpeg-copyts'] = true
    next();
  } catch (e) {
    debug(e)
    process.exit()
  }
}

module.exports = douyu