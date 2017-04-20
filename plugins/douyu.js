var md5 = require('../utils/md5')
var stupidMD5 = require('../utils/blackbox')
var request = require('sync-request')

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
  var res = request('POST', `https://www.douyu.com/lapi/live/getPlay/${rid}`, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body
  })
  if (res.statusCode == 200) {
    res = JSON.parse(res.getBody('utf8'))
    return res.data.rtmp_url + '/' + res.data.rtmp_live
  }
}

var douyu = function (ctx, next) {
  if (ctx.mode !== 'launch' || !ctx.options.douyu) return next();
  var orgPath = ctx.options.playlist[0].path;
  var rid_reg = /.*douyu.com\/(\w+)/g
  var rid = rid_reg.exec(orgPath)[1]
  ctx.options.playlist[0].path = getSourceURL(rid)
  ctx.options.tomp4 = true
  ctx.options['ffmpeg-vcodec'] = 'copy'
  next();
}

module.exports = douyu
//# sourceMappingURL=douyu.js.map