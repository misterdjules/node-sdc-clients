var util = require('util');

var assert = require('assert-plus');

var RestifyClient = require('./restifyclient');

function VAPI(options) {
    RestifyClient.call(this, options);
    this.url = options.url;
}

util.inherits(VAPI, RestifyClient);


VAPI.prototype.close = function close() {
    this.client.close();
};

VAPI.prototype.createVolume = function createVolume(params, options, callback) {
    var payload;
    var query = {};

    if (typeof (options) === 'function') {
        callback = options;
        options = undefined;
    }

    assert.object(params, 'params');
    assert.optionalObject(options, 'options');
    assert.func(callback, 'callback');

    payload = params.payload;
    if (params.sync) {
        query.sync = 'true';
    }

    var opts = {
        path: '/volumes',
        query: query,
        headers: {}
    };

    if (options) {
        if (options.headers) {
            opts.headers = options.headers;
        }

        opts.log = options.log || this.log;
    }

    if (params.context) {
        opts.headers['x-context'] = JSON.stringify(params.context);
    }

    return this.post(opts, payload, callback);
};

VAPI.prototype.listVolumes = function listVolumes(params, options, callback) {
    // If only one argument then this is 'find all'
    if (typeof (params) === 'function') {
        callback = params;
        params = {};
    // If 2 arguments -> (params, callback)
    } else if (typeof (options) === 'function') {
        callback = options;
        options = undefined;
    }

    assert.optionalObject(params, 'params');
    assert.optionalObject(options, 'options');
    assert.func(callback, 'callback');

    var self = this;
    var reqOpts = { path: '/volumes', query: params };
    if (options) {
        reqOpts.headers = options.headers;
        reqOpts.log = options.log || this.log;
    }

    self.get(reqOpts, callback);
};

/**
 * Does a ping check to see if API is still serving requests.
 *
 * @param {Function} callback : of the form f(err).
 */
VAPI.prototype.ping = function (callback) {
    var opts = { path: '/ping' };
    this.get(opts, callback);
};

module.exports = VAPI;