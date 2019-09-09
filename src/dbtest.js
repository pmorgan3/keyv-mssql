const config = require('./config').config
const knex_config = require('./config').knex
const Sql = require('knex')(knex_config)

const testDb = async () => {
    //let delRes = await Sql('keyv').del();
    const insertRes = await Sql('keyv').insert({
        key: 'foo',
        value: 'bar'
    });
    const selRes = await Sql('keyv').select();

    console.log(selRes, 'created');
    let delRes = await Sql('keyv').del();
    console.log('delRes', delRes);
    const selDelRes = await Sql('keyv').select();
    console.log('selDelRes', selDelRes);

    return true;
}

testDb();