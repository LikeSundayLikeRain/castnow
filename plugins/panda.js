var request = require('sync-request')
var debug = require('debug')('castnow:panda');


var panda = function (ctx, next) {
  if (ctx.mode !== 'launch' || !ctx.options.panda) return next();
  var orgPath = ctx.options.playlist[0].path;
  var rid = /.*panda.tv\/(\d+)/.exec(orgPath)[1]
  var res = JSON.parse(request('GET', `http://www.panda.tv/api_room?roomid=${rid}`).getBody('utf-8'))
  data = res['data']
  video_info = data['videoinfo']

  if (video_info['status'] != '2') {
    debug('Stream is offline')
    process.exit()
  }
  plflag0 = video_info['plflag'].split('_')[0]
  plflag1 = video_info['plflag'].split('_')[1]
  plflag0 = parseInt(plflag0) - 1
  if (plflag1 == '21') {
    plflag0 = 10
    plflag1 = '4'
  }
  if (plflag0 < 1) {
    live_panda = 'live_panda'
  } else {
    live_panda = ''
  }
  stream_addr = video_info['stream_addr']
  if (stream_addr['SD'] == '1') {
    suffix = ''
  } else if (stream_addr['HD'] == '1') {
    suffix = '_mid'
  } else {
    suffix = '_small'
  }
  room_key = video_info['room_key']
  var url = `http://pl${plflag1}.live.panda.tv/live_panda/${room_key}${live_panda}${suffix}.flv`
  ctx.options.playlist[0].path = url;
  ctx.options.playlist[0].media = {
    metadata: {
      title: data['roominfo']['name'],
      subtitle: data['roominfo']['details'],
      images: data['roominfo']['pictures']['img']
    }
  }
  ctx.options.tomp4 = true
  ctx.options['ffmpeg-c'] = 'copy'
  next();
}

module.exports = panda