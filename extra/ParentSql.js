const EventEmitter = require('events');
const ConnectionPool = require('mssql').ConnectionPool;
const Mssql = require('mssql');
const Sql = require('knex')({
    client: 'mssql',
    connection: {
        user: 'SA',
        password: 'Password1',
        host: "localhost",
        database: 'TestDB',
    }
})
class KeyvSql extends EventEmitter {
    constructor(opts) {
        super();
        this.ttlSupport = false;

        this.opts = Sql.schema
            .createTable('keyv', function (table) {
                table.string('key').primary().unique()
                table.text('value')
            })

        this.entry = Sql
        /* 
         */
        const connected = this.entry('keyv').connection()
            .then(query => query(() => query))
            .catch(err => this.emit('error', err));

        this.query = sqlString => connected
            .then(query => query(sqlString))
    }
    get(key) {
        const select = this.entry('keyv').select().where({
            key
        }).toQuery();

        return this.query(select)
            .then(rows => {
                const row = rows[0];
                if (row === undefined) {
                    return undefined;
                }
                return row.value;
            })
    }

    set(key, value) {
        let upsert;

        upsert = this.entry('keyv').insert({
            key,
            value
        })
    }
}