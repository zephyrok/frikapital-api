const express = require('express');
const OrderDao = require('../dao/orderDao').OrderDao;
const router = express.Router();

module.exports = function (db, checkJwt) {
    const orderDao = new OrderDao(db);

    router.get('/', checkJwt, async function (req, res) {
        "use strict";

        let start = 0;
        let total = 10;
        if (req.query.start !== undefined) {
            start = req.query.start;
        }
        if (req.query.total !== undefined) {
            total = req.query.total;
        }

        try {
            let orders = await orderDao.getOrders(req.query, start, total);
            res.status(200).json(orders);
        }
        catch(err) {
            res.status(500).json(err);
        }
    });

    router.post('/', checkJwt, async function (req, res) {
        "use strict";

        const order = req.body;
        console.log('inside orders post');
        console.log(order);

        try {
            let result = await orderDao.createOrder(order);
            res.status(201).json(result);
        }
        catch(err) {
            res.status(500).json(err);
        }
    });

    router.get('/:id', checkJwt, async function (req, res) {
        "use strict";

        try {
            let order = await orderDao.getOrderById(req.params.id);
            if(order == null) {
                res.status(404).end();
            }
            else {
                res.status(200).json(order);
            }
        }
        catch(error) {
            res.status(500).json(error);
        }
    });

    router.post('/:id/packages', checkJwt, async function(req, res) {
        "use strict";

        const orderId = req.params.id;
        const orderPackage = req.body;

        try {
            let result = await orderDao.addPackageToOrder(orderId, orderPackage);
            res.status(200).json(result);
        }
        catch(err) {
            res.status(err.code).json(err);
        }
    });
    
    router.get('/:id/packages/:package/items', function(req, res) {

    });

    router.post('/:id/packages/:package/items', checkJwt, async function(req, res) {
        "use strict";

        const orderId = req.params.id;
        const packageId = req.params.package;
        const item = req.body;

        try {
            let result = await orderDao.addItemToPackage(orderId, packageId, item);
            res.status(200).json(result);
        }
        catch(err) {
            res.status(err.code).json(err);
        }
    });

    return router;
}