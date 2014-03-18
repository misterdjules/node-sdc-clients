// Copyright 2013 Joyent, Inc.  All rights reserved.

var Logger = require('bunyan'),
    util = require('util'),
    clone = require('clone');

var libuuid = require('libuuid');
function uuid() {
    return (libuuid.create());
}

var Package = require('../lib/index').Package;


// --- Globals

var UFDS_URL = 'ldaps://' + (process.env.UFDS_IP || '10.99.99.18');
var pack;

var entry = {
    name: 'regular_128',
    version: '1.0.0',
    max_physical_memory: 128,
    quota: 5120,
    max_swap: 256,
    cpu_cap: 350,
    max_lwps: 2000,
    zfs_io_priority: 1,
    'default': true,
    vcpus: 1,
    active: true,
    networks: [
        'aefd7d3c-a4fd-4812-9dd7-24733974d861',
        'de749393-836c-42ce-9c7b-e81072ca3a23'
    ],
    traits: {
        bool: true,
        arr: ['one', 'two', 'three'],
        str: 'a string'
    }
};

var another_entry = {
    name: 'regular_256',
    version: '1.0.0',
    max_physical_memory: 256,
    quota: 5120,
    max_swap: 512,
    cpu_cap: 350,
    max_lwps: 2000,
    zfs_io_priority: 1,
    'default': true,
    vcpus: 1,
    active: true
};

var PKG;

// --- Tests

exports.setUp = function (callback) {
    pack = new Package({
        url: UFDS_URL,
        bindDN: 'cn=root',
        bindPassword: 'secret',
        log: new Logger({
            name: 'ufds_packages_unit_test',
            stream: process.stderr,
            level: (process.env.LOG_LEVEL || 'info'),
            serializers: Logger.stdSerializers
        }),
        tlsOptions: {
            rejectUnauthorized: false
        }
    });
    pack.ufds.on('ready', function () {
        pack.ufds.removeAllListeners('error');
        callback();
    });
    pack.ufds.on('error', function (err) {
        pack.ufds.removeAllListeners('ready');
        callback(err);
    });
};


exports.test_create_package = function (t) {
    pack.add(entry, function (err, pkg) {
        t.ifError(err);
        t.ok(pkg);
        t.ok(pkg.uuid);
        t.equal(pkg.vcpus, 1);
        t.equal(pkg.max_swap, 256);
        t.equal(pkg.traits.bool, true);
        t.ok(Array.isArray(pkg.networks));
        t.equal(pkg.networks.length, 2);
        t.deepEqual(pkg.traits.arr, ['one', 'two', 'three']);
        t.equal(pkg.traits.str, 'a string');
        PKG = pkg;
        t.done();
    });
};


exports.test_get_package_by_uuid = function (t) {
    pack.get(PKG.uuid, function (err, pkg) {
        t.ifError(err);
        t.ok(pkg);
        t.equal(pkg.uuid, PKG.uuid);
        t.done();
    });
};


exports.test_modify_mutable_attribute = function (t) {
    var changes = clone(PKG);
    changes.active = 'false';
    changes['default'] = 'false';
    changes.traits = {
        bool: false,
        arr: ['one', 'two', 'three'],
        str: 'a string'
    };
    changes.networks = [
        'de749393-836c-42ce-9c7b-e81072ca3a23'
    ];
    pack.update(PKG, changes, function (err) {
        t.ifError(err);
        pack.get(PKG.uuid, function (err, pkg) {
            t.ifError(err);
            t.ok(pkg);
            t.equal(pkg.active, 'false');
            t.equal(pkg['default'], 'false');
            t.equal(pkg.traits.bool, false);
            t.equal(pkg.networks.length, 1);
            t.ok(Array.isArray(pkg.networks), 'networks is array');
            PKG = pkg;
            t.done();
        });
    });
};


exports.test_modify_immutable_attribute = function (t) {
    var changes = clone(PKG);
    changes.max_physical_memory = 256;
    pack.update(PKG, changes, function (err) {
        t.ok(err);
        t.ok(/immutable/.test(err.message));
        t.ok(/max_physical_memory/.test(err.message));
        t.done();
    });
};


exports.test_delete_package = function (t) {
    pack.del(PKG, function (err) {
        t.ok(err);
        t.equal(err.message, 'Packages cannot be deleted');
        t.equal(err.statusCode, 405);
        // Verify ufds straight deletion doesn't work too:
        pack.ufds.del(PKG.dn, function (err) {
            t.ok(err);
            t.ok(/immutable/.test(err.message));
            t.done();
        });
    });
};


exports.test_list_packages = function (t) {
    pack.add(another_entry, function (err, pkg) {
        t.ifError(err);
        t.ok(pkg);
        t.ok(pkg.uuid);
        pack.list(function (err2, packages) {
            t.ifError(err2);
            t.ok(util.isArray(packages));
            t.done();
        });
    });
};


exports.test_search_packages = function (t) {
    var filter = '(&(objectclass=sdcpackage)(max_physical_memory=128))';
    pack.list(filter, function (err, packages) {
        t.ifError(err);
        t.ok(util.isArray(packages));
        packages.forEach(function (p) {
            t.equal('128', p.max_physical_memory);
        });
        t.done();
    });
};


exports.test_instantiate_with_ufds_instance = function (t) {
    var instance = new Package(pack.ufds);
    t.ok(instance);
    t.done();
};


exports.tearDown = function (callback) {
    pack.ufds.close(function () {
        callback();
    });
};