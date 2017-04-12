var cors_proxy = require('cors-anywhere');
var internalIp = require('internal-ip');

const IP = internalIp();
const PORT = 4321;

var proxy = function(options) {
    if (options.subtitle) {
        if (options._.length) {
            options._.forEach(function(path,idx,playlist) {
                if (path.includes('http')) {

                	cors_proxy.createServer({
                		originWhitelist: [], // Allow all origins
                		// requireHeader: ['origin', 'x-requested-with'],
                		removeHeaders: ['cookie', 'cookie2']
                	}).listen(PORT);
                    path = 'http://' + IP + ':' + PORT + '/'+ path;
                    playlist[idx] = path;
                }
            });
        }
    }
    return options;
}

module.exports = proxy;
