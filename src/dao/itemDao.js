/*
 * Item DAO
 */
var Item = require('../models/item');
const dropboxService = require('../services/dropboxService').dropboxService;

class ItemDao {
    constructor() {}

    createItem(body) {
        return new Promise((resolve, reject) => {
            var item = new Item(body);
            item.save().then(function (value) { resolve(value)}, function (err) {reject(err)});
        });
    }

    getItemById(id, includeImages, userId) {
        return new Promise((resolve, reject) => {
            Item.findById(id)
                .then(async function (value) {
                    let item = value.toObject();
                    if(includeImages) {
                        try {
                            let responseFilesList = await dropboxService.getListFolder(id, userId);
        
                            let images = [];
                            for(let entry of responseFilesList.entries) {
                                images.push(entry.name);
                            }
                            item.images = images;
                        }
                        catch(err) {
                            console.error(err)
                        }
                    }
                    
                    resolve(item);
                }, function (err) {reject(err)});
        });
    }

    getThumbnailByItemId(id, image, userId) {
        return new Promise((resolve, reject) => {
            dropboxService.getThumbnail(`${id}/${image}`, userId)
                .then(response => resolve(response))
                .catch(err => reject(err))
        })
    }

    getItems(query, start, total) {
        return new Promise((resolve, reject) => {
            let filter = {};
            let sort = {};
            if(query.name !== undefined) { filter.name = query.name; }
            if(query.type !== undefined) { filter.type = query.type; }
            if(query.exists !== undefined) { filter[query.exists] = { '$exists': true }}
            if(query.nonExists !== undefined) { filter[query.nonExists] = { '$exists': false }}
            if(query.details !== undefined) {
                for (const key in query.details) {
                    filter["details." + key] = query.details[key];
                }
            }
            if(query.text !== undefined && query.text !== null && query.text !== '') {
                filter["$text"] = { $search: query.text }
            }
            if(query.publicationStatus !== undefined && query.publicationStatus !== '') {
                filter["publications.mercadolibre.status"] = query.publicationStatus;
            }
            if(query.sortBy !== undefined && query.sortBy !== '') {
                if(query.sortDesc !== undefined) {
                    if(query.sortDesc == 'true') sort[query.sortBy] = -1;
                    else sort[query.sortBy] = 1;
                } else sort[query.sortBy] = -1;
            }
            else {
                sort._id = 1;
            }
            Item.find(filter, null, {skip: start, limit: total, sort: sort})
                .then(function (value) { resolve(value)}, function (err) {reject(err)});
        });
    }

    getItemsCount(query) {
        return new Promise((resolve, reject) => {
            let filter = {};
        
            if(query.name !== undefined) { filter.name = query.name; }
            if(query.type !== undefined) { filter.type = query.type; }
            if(query.exists !== undefined) { filter[query.exists] = { '$exists': true }}
            if(query.nonExists !== undefined) { filter[query.nonExists] = { '$exists': false }}
            if(query.details !== undefined) {
                for (const key in query.details) {
                    let value = query.details[key];
                    filter["details." + key] = value;
                }
            }
            if(query.text !== undefined && query.text !== null && query.text !== '') {
                filter["$text"] = { $search: query.text }
            }
            if(query.publicationStatus !== undefined && query.publicationStatus !== '') {
                filter["publications.mercadolibre.status"] = query.publicationStatus;
            }

            Item.count(filter).then(function (value) { resolve(value)}, function (err) {reject(err)});
        });
    }

    patchItem(id, update) {
        return new Promise((resolve, reject) => {
            Item.findOneAndUpdate({'_id': id }, update)
                .then(function (value) { resolve(value)}, function (err) {reject(err)});
        });
    }

    addMLPublication(id, publication) {
        return new Promise((resolve, reject) => {
            Item.findByIdAndUpdate(id, {'publications.mercadolibre': publication})
                .then(function (value) { resolve(value)}, function (err) {reject(err)});
        });
    }

    addOrderToItem(id, orderId, packageId, quantity, condition, comments, session) {
        return new Promise((resolve, reject) => {
            Item.findByIdAndUpdate(id,
                 {$addToSet: {'orders':
                    {
                        'id': orderId,
                        'package': packageId,
                        'quantity': quantity,
                        'condition': condition,
                        'comments': comments
                    }
                }}, { session: session })
                .then(function (value) { resolve(value)}, function (err) {reject(err)});
        });
    }

    addCostPerItemByOrder(itemIds, orderId, cost, session) {
        return new Promise((resolve, reject) => {
            Item.updateMany({'_id': { $in: itemIds}, 'orders.id': orderId}, 
                            { $set: { "orders.$.cost" : cost }},
                            { session: session })
                .then(function (value) { resolve(value)}, function (err) {reject(err)});
        });
    }

    addImageToItem(itemId, filename, file, userId) {
        return new Promise((resolve, reject) => {
            dropboxService.uploadFile(`${itemId}/${filename}`, file, userId)
                .then(response => resolve(response))
                .catch(err => reject(err));
        });
    }

    deleteImageFromItem(itemId, filename, userId) {
        return new Promise((resolve, reject) => {
            dropboxService.deleteFile(`${itemId}/${filename}`, userId)
                .then(response => resolve(response))
                .catch(err => reject(err));
        });
    }
}

module.exports.ItemDao = ItemDao;
