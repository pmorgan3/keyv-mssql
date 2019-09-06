# KeyvMssql Methods and Variables

## Class variables

- this.ttlsupport

  - defaults to false
  - unsure of it's purpose

- this.opts

  - Object
  - unsure of it's purpose

- this.opts.connect

  - Type: function that resolves a promise given by this.pool.connect()

- Sql

  - An instance of the knex querybuilder

- this.pool

  - Type: ConnectionPool object
  - Purpose: the object used to run the given query

- this.msql

  - Type: Knex.QueryBuilder
  - Purpose: stores our written querys

## Class methods

- get(key)

  - Gets the value corresponding with the given key

- set(key, value)

  - stores the given key and value into the db

- delete(key)

  - deletes the key-value pair corresponding with the given key

- clear()

  - unsure
