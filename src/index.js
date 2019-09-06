const RequestError = require('tedious').RequestError;
const ConnectionError = require('tedious').ConnectionError;
const EventEmitter = require('events');
const ConnectionPool = require('mssql').ConnectionPool;
const Mssql = require('mssql')
const config = require('./config').config
const knex_config = require('./config').knex
const Sql = require('knex')(knex_config)

class KeyvMssql extends EventEmitter {

  constructor(opts) {
    super();
    this.ttlSupport = false;
    this.opts = Object.assign({

      table: 'keyv',
      keySize: 255
    }, opts);

    // this creates (supposedly) the db table to be used
    // Sql.schema.hasTable('keyv')
    //   .then(true, this.entry = Sql.schema.createTable('keyv',
    //     table => {
    //       table.string('key').primary().notNullable().unique().index()
    //       table.enu('value').nullable().defaultTo(null);
    //     }))

    //this.pool = new ConnectionPool(config);

    // This actually connects to the db, I believe
    // this.opts.connect = () => this.pool.connect()
    //   .then(pool => {

    //     return sql => pool.query(sql).then((data) => data.recordsets)
    //       .catch(ConnectionError)
    //   }).catch(RequestError)

    //this.msql = Sql('keyv')
    this.keyvtable = Sql.schema.hasTable(this.opts.table)
      .then(() => Sql(this.opts.table),
        () => {
          return Sql.schema.createTable(this.opts.table,
            table => {
              table.string('key').primary().notNullable().unique().index()
              table.enu('value').nullable().defaultTo(null);
            }).then(() => Sql(this.opts.table));
        });


    // const connected = this.pool.connect()
    //   .then((pool) => pool.query())
    //   .catch(err => this.emit('error', err));

    // this.query = (sqlString) => this.mssql
    //   .then(sql => {
    //     console.log(sqlString);
    //     return sql.query(sqlString);
    //   });

  }

  async get(key) {
    const client = await this.keyvtable;
    const rows = await client.select({
      key
    }).where({
      'key': key
    }).returning('value');

    if (rows === undefined) {
      return undefined;
    }
    const row = rows[0];
    if (row === undefined) {
      return undefined;
    }
    return row;
  }

  async set(key, value) {

    value = value.replace(/\\/g, '\\\\').replace(/['"]/g, '\"');

    const client = await this.keyvtable;
    let setResult = Promise.resolve(undefined);
    let insertSucceeded = false;
    try {
      setResult = await client.insert({
        'key': key,
        'value': value
      });
      console.log('insert succeeded for', key, value);
      insertSucceeded = true;
    } catch (insertErr) {
      console.log('insert failed', insertErr);
    }
    if (!insertSucceeded) {
      try {
        setResult = await client.update({
          'key': key,
          'value': value
        });
      } catch (updateErr) {
        console.log('update failed', updateErr);
      }
    }
    return setResult;

  }

  async delete(key) {
    const client = await this.keyvtable;
    const exists = await client.where({
      key
    }).select({
      key
    });
    console.log('exists', exists);
    if (exists) {
      return client.where({
        key
      }).del().then(() => true);
    }
    return false;
  }
  async clear() {
    //const del = this.mssql.delete(this.entry)
    const client = await this.keyvtable;
    try {
      return client.where({}).del().then(() => undefined);
      return undefined;
    } catch (error) {
      console.log('clear failed', error)
      return error
    }
  }

}
module.exports = KeyvMssql;