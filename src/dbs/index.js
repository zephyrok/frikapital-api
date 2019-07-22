var mongoose = require('mongoose');
mongoose.set('debug', function (coll, method, query, doc) {
//console.log('coll:' + coll)
//console.log('method:' + method)
//console.log('query:' + JSON.stringify(query))
//console.log('doc:' + JSON.stringify(doc))
   });

//Set up default mongoose connection
var mongoDB = process.env.MONGOBD_CONNECTION;
mongoose.connect(mongoDB, { useNewUrlParser: true }).then(
    () => { console.log('Database connection successful') },
    err => { console.error(`Database connection error: ${JSON.stringify(err)}`) }
);

//Get the default connection
var db = mongoose.connection;
module.exports = db;