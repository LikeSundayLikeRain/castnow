var request = require('sync-request')
var debug = require('debug')('castnow:dnvod');


function getSourceURL(url) {
    
    var res = request('GET', url);

    var user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36';
    var cookies = res.headers['set-cookie'].join('; ')
    console.log(cookies)
    var headers = {
        'User-Agent': user_agent,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Referer': 'http://www.dnvod.tv/',
        'Accept-Encoding': '',
        'Accept-Language': 'de-DE,de;q=0.8,en-US;q=0.6,en;q=0.4,zh-CN;q=0.2,zh;q=0.2,zh-TW;q=0.2,fr-FR;q=0.2,fr;q=0.2',
        'X-Requested-With': 'XMLHttpRequest',
        'DNT': '1',
        'Cookie': cookies
    };

    var resbody = res.getBody('utf8');
    var id = /id:.*\'(.*)\',/.exec(resbody)[1];
    if (url.indexOf('Movie') > -1) {
        var category = 'Movie'
    } else if (url.indexOf('Adult') > -1) {
        var category = 'Adult'
    } else {
        debug('Not able to parse the category')
        process.exit()
    }
    var key = /key:.*\'(.*)\',/.exec(resbody)[1];
    debug('id: ' + id + '. key: '+key)
    var body = {
        'key': key
    }
    body = Object.keys(body).map(key => `${key}=${encodeURIComponent(body[key])}`).join('&')
    url = 'http://www.dnvod.tv/' + category + '/GetResource.ashx?id=' + id + '&type=htm';
    try {
        res = request('POST', url, {
            headers: headers,
            body: body
        });
        var videoInfo = JSON.parse(res.getBody('utf8'));
        var realUrl = videoInfo.http.provider;
        if (realUrl) {
            return realUrl
        } else {
            debug('Dnvod source url resolve failed\nHTTP Code: %s', res.statusCode)
            process.exit()
        }
    } catch (e) {
        debug(e)
        debug(videoInfo)
        process.exit()
    }
}

var dnvod = function (ctx, next) {
    if (ctx.mode !== 'launch' || !ctx.options.dn) return next();
    var orgPath = ctx.options.playlist[0].path;
    ctx.options.playlist[0].path = getSourceURL(orgPath);
    next();
}

module.exports = dnvod