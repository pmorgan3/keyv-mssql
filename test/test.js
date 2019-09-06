var test = require('ava');
var keyvTestSuite = require('@keyv/test-suite').default;
var keyvOfficialTests = require('@keyv/test-suite').keyvOfficialTests;
var Keyv = require('keyv');
var KeyvMssql = require('../src/index');

const store = () => new KeyvMssql();

keyvTestSuite(test, Keyv, store);