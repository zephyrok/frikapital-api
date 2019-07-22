var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var itemPackageSchema = new Schema({
    "id" : Schema.Types.ObjectId,
    "quantity" : Number,
    "condition" : String,
    "comments": String
});
var packageOrderSchema = new Schema({
    "id" : String,
    "cost" : {
        "mxn" : Number,
        "usd" : Number,
        "jpy" : Number
    },
    "url" : String,
    "items" : [ itemPackageSchema ]
});
var orderSchema = new Schema({
    "_id" : String,
    "cost" : {
        "mxn" : Number,
        "usd" : Number,
        "jpy" : Number
    },
    "shipping" : {
        "mxn" : Number,
        "usd" : Number,
        "jpy" : Number
    },
    "weight" : Number,
    "created_date" : { type: Date, default: Date.now },
    "totalItems" : { type: Number, default: 0 },
    "packages" : [ packageOrderSchema ],
    "updated_date" : { type: Date, default: Date.now }
});

var Order = mongoose.model('Order', orderSchema);
module.exports = Order;