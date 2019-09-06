const RequestError = require('tedious').RequestError;
const ConnectionError = require('tedious').ConnectionError;
const EventEmitter = require('events');
const ConnectionPool = require('mssql').ConnectionPool;
const Mssql = require('mssql')
const Sql = require('knex')({
  client: 'mssql',
  connection: {
    user: 'SA',
    password: 'Password1',
    host: "localhost",
    database: 'TestDB',
  },
  useNullAsDefault: true
})

const config = {
  user: 'SA',
  password: 'Password1',
  server: 'localhost',
  database: 'TestDB',
  url: 'mssql://localhost:1433'
}

class KeyvMssql extends EventEmitter {

  constructor(opts) {
    super();
    this.ttlSupport = false;
    this.opts = Object.assign({

      table: 'keyv',
      keySize: 255
    }, opts);

    // this creates (supposedly) the db table to be used
    Sql.schema.hasTable('keyv')
      .then(true, this.entry = Sql.schema.createTable('keyv',
        table => {
          table.string('key').primary().notNullable().unique()
          table.enu('value').nullable().defaultTo(null);
        }))

    this.pool = new ConnectionPool(config);

    // This actually connects to the db, I believe
    this.opts.connect = () => Promise.resolve(this.pool.connect()
      .then((pool) => {
        return sql => pool.query(sql).then((data) => data.recordsets)
          .catch(ConnectionError)
      })).catch(RequestError)

    this.msql = Sql('keyv')


    const connected = this.pool.connect()
      .then((pool) => pool.query())
      .catch(err => this.emit('error', err));

    this.query = (sqlString) => connected
      .then(query => query(sqlString));

  }

  async get(key) {
    const select = this.msql.select().from('keyv').where({
      'key': key
    }).returning('value')
    const rows = await Promise.resolve(this.query(select).catch(RequestError));

    if (rows === undefined) {
      return undefined;
    }
    const row = rows[0];
    if (row === undefined) {
      return undefined;
    }
    return row.value;
  }

  async set(key, value) {

    // if we're inserting an existing key, 
    // it makes sense to delete it as to not cause
    // conflicts.
    //
    // Right?

    value = value.replace(/\\/g, '\\\\');
    value = value.replace(/['"]/g, '\"');
    let upsert = this.msql.insert({
      'key': key,
      'value': value
    })

    try {
      return Promise.resolve(this.query(upsert).catch(RequestError))
    } catch (RequestError) {
      upsert = this.msql.update({
        'key': key,
        'value': value
      })
      return Promise.resolve(this.query(upsert).catch(RequestError))
    }
  }


  async delete(key) {
    const select = this.msql.select(key)

    const del = this.msql.where({
      'key': key
    }).del();

    const rows = await Promise.resolve(this.query(select).catch(RequestError));
    const row = rows[0];
    if (row === undefined) {
      return false;
    }
    return this.query(del).then(true);
  }

  async clear() {
    const del = this.msql.delete(this.entry)
    try {
      await Promise.resolve(this.query(del).catch(RequestError));
      return undefined;
    } catch (Error) {
      return Error
    }
  }

}
module.exports = KeyvMssql;