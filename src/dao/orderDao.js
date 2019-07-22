/*
 * Order DAO
 */
const ItemDao = require('./itemDao').ItemDao;
const Order = require('../models/order');

class OrderDao {
    constructor(database) {
        this.db = database;
        this.itemDao = new ItemDao();
    }

    createOrder(body) {
        return new Promise((resolve, reject) => {
            var order = new Order(body);
            order.save().then(function (value) { resolve(value)}, function (err) {reject(err)});
        })
    }

    getOrderById(id) {
        return new Promise((resolve, reject) => {
            Order.findById(id).then(function (value) { resolve(value)}, function (err) {reject(err)});
        });
    }
 
    getOrders(query, start, total) {
        return new Promise((resolve, reject) => {
            let filter = {};
            let sort = {};
            if (query.filter !== undefined) {
                for (const key in query.filter) {
                    filter[key] = query.filter[key];
                }
            }

            if(query.sortBy !== undefined) {
                if(query.sortDesc !== undefined) {
                    if(query.sortDesc == 'true') sort[query.sortBy] = -1;
                    else sort[query.sortBy] = 1;
                } else sort[query.sortBy] = -1;
            }
            else {
                sort._id = 1;
            }

            Order.find(filter, null, {skip: start, limit: total, sort: sort})
                .then(function (value) { resolve(value)}, function (err) {reject(err)});
        });
    }

     addPackageToOrder(orderId, orderPackage) {
        const _this = this;
        return new Promise((resolve, reject) => {
            let session = _this.db.startSession();
            Order.findById(orderId).then(async function (order) {
                if(!order) reject({'error': `Order ${orderId} not found`})
                let itemsCount = 0;
                session.startTransaction();
                if(orderPackage.items !== undefined) {
                    try {
                        for (let item of orderPackage.items) {
                            await _this.itemDao.addOrderToItem(item.id, orderId, orderPackage.id, item.quantity, item.condition, item.comments, session);
                            itemsCount += item.quantity;
                        }
                    }
                    catch(err) {
                        session.abortTransaction();
                        reject(err);
                    }
                }

                Order.findByIdAndUpdate(orderId,
                    {$addToSet: {'packages': orderPackage}, $inc: { 'totalItems': itemsCount}, $set: {'updated_date': new Date()}},
                    { session: session })
                    .then(async function (value) {
                        _this.calculateCostForItems(orderId, session)
                            .then(() => {
                                session.commitTransaction();
                                resolve(value);
                            })
                            .catch(err => {
                                session.abortTransaction();
                                reject(err);
                            })
                    }, function (err) {reject(err)});
                
            }, function (err) {reject(err)});
        });
    }

    addItemToPackage(orderId, packageId, item) {
        const _this = this;
        return new Promise((resolve, reject) => {
            let session = _this.db.startSession();
            session.startTransaction();
            _this.itemDao.addOrderToItem(item.id, orderId, packageId, item.quantity, item.condition, item.comments, session)
                .then(value => {
                    Order.updateOne({ '_id': orderId, 'packages.id': packageId }, 
                        {$addToSet: {'packages.$.items': item}, $inc: { 'totalItems': item.quantity}, $set: {'updated_date': new Date()}},
                        { session: session})
                        .then(function (result) { 
                            if(result.matchedCount == 1 && result.modifiedCount == 1) {
                                _this.calculateCostForItems(orderId, session)
                                    .then(() => {
                                        session.commitTransaction();
                                        resolve(value);
                                    })
                                    .catch(err => {
                                        session.abortTransaction();
                                        reject(err);
                                    })
                            }
                            else {
                                session.abortTransaction();
                                reject({'error': `Package ${packageId} was not modified. Item was not added to order ${orderId}`});
                            }
                        }, function (err) {
                            session.abortTransaction();
                            reject(err);
                        });
                })
                .catch(err => {
                    session.abortTransaction();
                    reject(err);
                });
        });
    }

    calculateCostForItems(orderId, session) {
        const _this = this;
        return new Promise((resolve, reject) => {
            Order.findById(orderId)
                .then(function (order) {
                    if(!order) reject({'error': `Order ${orderId} not found`})
                    if(order.totalItems > 0) {
                        const shippingPerItem = order.shipping.mxn / order.totalItems;
                        for(let orderPackage of order.packages) {
                            let totalItems = 0;
                            let itemIds = [];
                            for (let item of orderPackage.items) {
                                totalItems += item.quantity;
                                itemIds.push(item.id);
                            }
            
                            const costPerItem = orderPackage.cost.mxn / totalItems;
                            const cost = {};
                            cost.mxn = costPerItem + shippingPerItem;
                            _this.itemDao.addCostPerItemByOrder(itemIds, orderId, cost, session)
                                .then(value => resolve(value))
                                .catch(err => reject(err));
                        }
                    }
                }, function (err) {reject(err)});
        });
    }
}

module.exports.OrderDao = OrderDao;