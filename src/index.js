const tedious = require('tedious');
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

    Sql.schema.hasTable(this.opts.table)
      .then(this.keyvtable = Sql(this.opts.table),
        () => {
          Sql.schema.createTable(this.opts.table, table => {
            table.string('key').primary().notNullable().unique().index();
            table.enu('value').nullable().defaultTo(null);
          });
          this.keyvtable = Sql(this.opts.table);
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

  //! FUNCTIONAL
  async get(key) {
    const client = this.keyvtable;
    const row = await client.select('*').where({
      key
    }).returning('value').then(p => p[0]).catch(TypeError);

    if (row === undefined) {
      return undefined;
    }

    return row;
  }

  async set(key, value) {

    value = value.replace(/\\/g, '\\\\').replace(/['"]/g, '\"');

    const client = this.keyvtable;
    let setResult = Promise.resolve(undefined);
    let insertSucceeded = false;
    try {
      setResult = client.insert({
        key,
        value
      }).catch(tedious.RequestError);
      console.log('insert succeeded for', key, value);
      insertSucceeded = true;
    } catch (requestError) {
      console.log('insert failed', requestError);
    }
    if (!insertSucceeded) {
      try {
        setResult = client.update({
          key,
          value
        });
      } catch (updateErr) {
        console.log('update failed', updateErr);
      }
    }
    return insertSucceeded;
  }

  async delete(key) {
    let doesKeyExist = await this.get(key)
    if (doesKeyExist === undefined)
      return false;
    const client = this.keyvtable;
    const exists = await client.where({
      key
    }).select('*');
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
    const client = this.keyvtable;
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