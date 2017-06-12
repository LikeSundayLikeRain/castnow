var cors_proxy = require('cors-anywhere');
var internalIp = require('internal-ip');
var fs = require('fs');
var debug = require('debug')('castnow:cors');

const IP = internalIp();
const PORT = 4321;

var isFile = function (item) {
  return fs.existsSync(item.path) && fs.statSync(item.path).isFile();
};

var cors = function (ctx, next) {
  if (ctx.mode !== 'launch' || !ctx.options.cors) return next();
  if (ctx.options.subtitles && !isFile(ctx.options.playlist[0]) && (ctx.options.playlist[0].path.indexOf('magnet') < 0)) {
    debug('CORS needed, starting server...')
    cors_proxy.createServer({
      originWhitelist: [], // Allow all origins
      // requireHeader: ['origin', 'x-requested-with'],
      removeHeaders: ['cookie', 'cookie2']
    }).listen(PORT);
    debug('Server started at ' + IP + ':' + PORT)
    ctx.options.playlist[0].path = 'http://' + IP + ':' + PORT + '/' + ctx.options.playlist[0].path
    ctx.options.playlist[0].type = 'video/mp4'
  }
  next()
}

module.exports = cors;