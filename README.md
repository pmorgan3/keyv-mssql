MSSQL storage adapter for [Keyv](https://github.com/lukechilds/keyv).

## Usage

```js
const KeyvMssql = require("KeyvMssql");

const keyv = new KeyvMssql({
  connection: {
    user: "SA",
    password: "Password1",
    host: "localhost",
    database: "TestDB"
  }
});
```

You can specify a custom table with the `table` option, the primary key size with `keySize`, and whether or not to use null as default with `useNullAsDefault`.

e.g:

```js
const keyv = new Keyv({
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
