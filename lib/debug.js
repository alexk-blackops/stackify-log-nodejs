var fs        = require('fs'),
    path      = require('path'),
    util      = require('util'),
    log_path  = path.join(process.cwd(), 'stackify-debug.log'),
    debug     = false,
    stream    = false,
    makeMsg   = function (msg) {
        return new Date().toString() + ' ' + msg + '\n';
    },
    // create writable stream if debug mode is turned on
    init      = function () {
        stream = fs.createWriteStream(log_path, {flags: 'a'});
        stream.write(makeMsg('Debugging started'));
        stream.on('error', function (err) {
            console.error('Error occured during writing to the log file ', util.inspect(err));
        });
    };

module.exports = {

    set: function (option) {
        debug = (option === true) ? true :  false;
        if (debug) {
            init();
        }
    },

    write: function (msg) {
        if (debug) {
            stream.write(makeMsg(msg));
        }
    },

    writeResponse: function (response, close) {
        var body = (typeof response.body === 'object') ? JSON.stringify(response.body, null, 4) : response.body,
            msg = 'url: ' + response.request.uri.href + ':' + response.request.uri.port + ', method: '
                          + response.req.method + ', status: ' + response.statusCode + '\nresponse: ' + body;
        if (close) {
            this.close('Response received\n' + msg);
        } else {
            this.write('Response received\n' + msg);
        }
    },

    writeRequest: function (request, close) {
        if (request.body.Msgs) {
            request.body.Msgs = request.body.Msgs.length + ' messages';
        }
        if (close) {
            this.close('Request sent\n' + JSON.stringify(request, null, 4));
        } else {
            this.write('Request sent\n' + JSON.stringify(request, null, 4));
        }
    },

    // special case - write synchronously to file if synchronous request before exit failed
    writeSync: function (msg) {
        try {
            fs.appendFileSync(log_path, msg);
        } catch (err) {
            console.error('Error occured during writing to the log file ', util.inspect(err));
        }
    },

    close: function (msg) {
        var exit_msg = 'Exiting the app',
            message  = msg || exit_msg;

        if (stream) {
            stream.end(makeMsg(message) + (msg ? makeMsg(exit_msg) : ''));
        }
    }
};