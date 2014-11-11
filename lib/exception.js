var qs      = require('querystring'),
    error   = require('./error'),
    logger  = require('./logger'),
    api     = require('./api'),
    CONFIG  = require('../config/config'),
    handler = function handler(err, req, cb) {
        var rec = {
                Msg: err.method + ': ' + err.name,
                Level: 'ERROR',
                EpochMs: new Date().toUTCString(),
                Ex: error.formatEx(err, req)
            },
            fail_counter = 0,
            fail = function () {
                fail_counter += 1;
                if (fail_counter < CONFIG.REQUEST_ATTEMPTS) {
                    setTimeout(function () {
                        api.postLogs(logger.storage, null, fail);
                    }, CONFIG.REQUEST_TIMER);
                }
            };

        if (CONFIG.APP_DETAILS) {
            logger.storage.push(rec);
            api.postLogs(logger.storage, cb, fail);
        }
    },
    excCaught = false;

module.exports = {
    excCaught: excCaught,
    exc : function exc(req) {
        return function() {
            var body = '';
            if (req) {
                req.on('data', function (chunk) {
                    body += chunk;
                });
                req.on('end', function () {
                    var json = qs.parse(body);
                    req.body = json;
                });
            }

            process.on('uncaughtException', function (err) {
                if (!excCaught) {
                    excCaught = true;
                    handler(err, req);                    
                }
            });
        };
    },

    expressExc : function expressExc(err, req, res, next) {
        var cb = function () {
            next(err);
        };

        if (!err) {
            return next();
        }

        if (!excCaught) {
            excCaught = true;
            handler(err, req, cb);
        }

        next(err);
    }
};