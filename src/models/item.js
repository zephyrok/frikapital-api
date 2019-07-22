var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var orderItemSchema = new Schema({
    "id" : String,
    "package" : String,
    "quantity" : Number,
    "condition" : String,
    "comments" : String,
    "cost" : {
        "mxn" : Number
    }
});
var itemSchema = new Schema({
    "name" : String,
    "type" : String,
    "details" : Schema.Types.Mixed,
    "created_date" : { type: Date, default: Date.now },
    "orders" : [ orderItemSchema ],
    "dimensions": {
        "height" : Number,
        "width" : Number,
        "length" : Number
    },
    "publications" : {
        "mercadolibre" : {
            "id" : String,
            "title" : String,
            "price" : Number,
            "permalink" : String,
            "thumbnail" : String,
            "status" : String
        }
    }
}, { collection: 'items'});

var Item = mongoose.model('Item', itemSchema);
module.exports = Item;