# MSSQL storage adapter for [Keyv](https://github.com/lukechilds/keyv)

## Usage
Install keyv and keyv-mssql
```
npm install --save keyv keyv-mssql
```
Then Create a new Keyv instance, passing an instanciated KeyvMssql object as the store
```js
const Keyv = require("keyv");
const KeyvMssql = require("keyv-mssql");

const store = new KeyvMssql({
  connection: {
    user: "SA",
    password: "Password1",
    host: "localhost",
    database: "TestDB"
  }
});
const keyv = new Keyv({ store: store });
```

You can specify a custom table with the `table` option, the primary key size with `keySize`, and whether or not to use null as default with `useNullAsDefault`.

e.g:

```js
const store = new KeyvMssql({
  connection: {
    user: "SA",
    password: "Password1",
    host: "localhost",
    database: "TestDB"
  },
  table: "keyv",
  useNullAsDefault: true,
  keySize: 255
});
```



