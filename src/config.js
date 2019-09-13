const config = {
    user: 'SA',
    password: 'Password1',
    server: 'localhost',
    database: 'TestDB',
    url: 'mssql://localhost:1433',
    table: 'keyv'
}

module.exports.config = config

const knex_config = {
    client: 'mssql',
    connection: {
        user: 'SA',
        password: 'Password1',
        host: "localhost",
        database: 'TestDB',
    },
    useNullAsDefault: true
}

module.exports.knex = knex_config