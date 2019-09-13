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
      .then((this.keyvtable = Sql(this.opts.table)), () => {
        Sql.schema.createTable(this.opts.table, table => {
          table
            .string("key")
            .primary()
            .notNullable()
            .unique()
            .index();
          table
            .text("value")
            .nullable()
            .defaultTo(null);
        });
        this.keyvtable = Sql(this.opts.table);
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
      .replace('"', '"')
      .replace(/\\/g, "\\\\")
      .replace(/[(')+]/g, "''")
      .replace(/[\0]+/g, "");

    const client = Sql(this.opts.table);

    let insertSucceeded = false;
    //try {
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
          })
      );

    console.log("insert succeeded for", key, value);
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
    console.log("exists", exists);
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
    //const del = this.mssql.delete(this.entry)
    const client = Sql(this.opts.table);
    try {
      return await client.del().then(async () => await undefined);
    } catch (error) {
      console.log("clear failed", error);
      return await undefined;
    }
  }
}
module.exports = KeyvMssql;