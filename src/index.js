const tedious = require('tedious');
const EventEmitter = require('events');
const config = require('./config').config
const knex_config = require('./config').knex
const Sql = require('knex')(knex_config)

class KeyvMssql extends EventEmitter {

  constructor(opts) {
    super(opts);
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
            table.text('value').nullable().defaultTo(null);
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
    const client = Sql(this.opts.table);
    const row = await client.select('value').where({
      'key': key
    }).returning('value').then(p => p[0]).catch(TypeError);

    if (row === undefined) {
      return undefined;
    }

    return row['value'];
  }

  async set(key, value) {

    value = value.replace(/\\/g, '\\\\').replace(/[(')+]/g, "''").replace(/[\0]+/g, '').replace('"', "\"");

    const client = Sql(this.opts.table);
    let setResult = Promise.resolve(undefined);
    let insertSucceeded = false;
    //try {
    await client.insert({
      'key': key,
      'value': value
    }).catch(tedious.RequestError).then(async () => await client.update({
      'key': key,
      'value': value
    }));

    console.log('insert succeeded for', key, value);
    insertSucceeded = true;

    /*  } catch (requestError) {
       console.log('insert failed', requestError);
     } */
    /* if (!insertSucceeded) {
      try {
        setResult = client.update({
          key,
          value
        });
        insertSucceeded = true;

      } catch (updateErr) {
        console.log('update failed', updateErr);
      }
    } */
    return insertSucceeded;
  }

  async delete(key) {
    let doesKeyExist = await this.get(key)
    if (doesKeyExist === undefined)
      return false;
    const client = Sql(this.opts.table);
    const exists = await client.where({
      'key': key
    }).select('*');
    console.log('exists', exists);
    if (exists) {
      return client.where({
        'key': key
      }).del().then(() => true, () => false);
    }
    return false;
  }
  async clear() {
    //const del = this.mssql.delete(this.entry)
    const client = Sql(this.opts.table);
    try {
      return client.where({}).del().then(() => undefined);
    } catch (error) {
      console.log('clear failed', error)
      return error
    }
  }
}
module.exports = KeyvMssql;