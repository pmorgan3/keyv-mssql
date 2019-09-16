const tedious = require("tedious");
const EventEmitter = require("events");
const Sql = require("knex");

class KeyvMssql extends EventEmitter {
  constructor(opts) {
    super(opts);
    // set default values
    opts.table = opts.table || 'keyv'
    opts.keySize = opts.keySize || 255
    opts.client = opts.client || 'mssql'
    opts.useNullAsDefault = opts.useNullAsDefault || true
    this.ttlSupport = false;
    this.opts = Object.assign({
        table: opts.table,
        keySize: opts.keySize
      },
      opts
    );

    this.sql = Sql(opts)
    this.sql.schema
      .hasTable(this.opts.table)
      .then(async (exists) => {
        if (!exists) {
          await this.sql.schema.createTable(this.opts.table, table => {
            table
              .string("key")
              .primary();
            table
              .text("value")
              .nullable()
              .defaultTo(null);
          }).catch(err => this.emit(err));

        }
        this.keyvtable = this.sql(this.opts.table)

      });
  }

  async get(key) {
    const client = this.sql(this.opts.table);
    const row = await client
      .select("value")
      .where({
        key: key
      })
      .returning("value")
      .then(async (p) => await p[0])
      .catch(TypeError);

    if (row === undefined) {
      return undefined;
    }

    return await row["value"];
  }

  async set(key, value) {
    value = value
      .replace('"', '\"')
      .replace(/[(')+]/g, "''")
      .replace(/[\0]+/g, "");

    const client = this.sql(this.opts.table);

    let insertSucceeded = false;
    await client
      .insert({
        key: key,
        value: value
      })
      .catch(tedious.RequestError)
      .then(
        async () =>
          await client.update({
            key: key,
            value: value
          }).catch(tedious.RequestError)
      );
    insertSucceeded = true;

    return insertSucceeded;
  }

  async delete(key) {
    let doesKeyExist = await this.get(key);
    if (doesKeyExist === undefined) return false;
    const client = this.sql(this.opts.table);
    const exists = await client
      .where({
        key: key
      })
      .select("*");
    if (exists) {
      return await client
        .where({
          key: key
        })
        .del()
        .then(() => true, () => false);
    }
    return false;
  }
  async clear() {
    const client = this.sql(this.opts.table);
    return await client
      .where('key', 'like', `${this.namespace}:%`)
      .del()
      .from(this.opts.table)
      .then(() => undefined)
  }
}
module.exports = KeyvMssql;