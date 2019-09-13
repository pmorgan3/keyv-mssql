const tedious = require("tedious");
const EventEmitter = require("events");
const config = require("./config").config;
const knex_config = require("./config").knex;
const Sql = require("knex")(knex_config);

class KeyvMssql extends EventEmitter {
  constructor(opts) {
    super(opts);
    this.ttlSupport = false;
    this.opts = Object.assign({
        table: config.table,
        keySize: 255
      },
      opts
    );

    Sql.schema
      .hasTable(this.opts.table)
      .then(async (exists) => {
        if (!exists) {
          await Sql.schema.createTable(this.opts.table, table => {
            table
              .string("key")
              .primary();
            table
              .text("value")
              .nullable()
              .defaultTo(null);
          }).catch(err => this.emit(err));

        }
        this.keyvtable = Sql(this.opts.table)

      });
  }

  async get(key) {
    const client = Sql(this.opts.table);
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

    const client = Sql(this.opts.table);

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
    const client = Sql(this.opts.table);
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
    const client = Sql(this.opts.table);
    return await client
      .where('key', 'like', `${this.namespace}:%`)
      .del()
      .from(this.opts.table)
      .then(() => undefined)
  }
}
module.exports = KeyvMssql;