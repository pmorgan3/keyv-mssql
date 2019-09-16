var test = require('ava');
var keyvTestSuite = require('@keyv/test-suite').default;
var keyvOfficialTests = require('@keyv/test-suite').keyvOfficialTests;
var Keyv = require('keyv');
var KeyvMssql = require('../src/index');

const store = () => new KeyvMssql({
    connection: {
        user: 'SA',
        password: 'Password1',
        host: "localhost",
        database: 'TestDB',
    },
    useNullAsDefault: true,
    table: 'keyv',
    keySize: 255
});

keyvTestSuite(test, Keyv, store);