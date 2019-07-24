const express = require('express');
const multer  = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
const ItemDao = require('../dao/itemDao').ItemDao;
const PublicationDao = require('../dao/publicationDao').PublicationDao;
const router = express.Router();

module.exports = function (db, checkJwt) {
    const itemDao = new ItemDao();
    const publicationDao = new PublicationDao();

    router.get('/', checkJwt, async function (req, res) {
        let start = 0;
        let total = 10;
        
        if (req.query.start !== undefined) {
            start = parseInt(req.query.start);
        }
        if (req.query.total !== undefined) {
            total = parseInt(req.query.total);
        }

        try {
            let items = await itemDao.getItems(req.query, start, total);
            res.status(200).json(items);
        }
        catch(err) {
            res.status(500).json(err);
        }
    });

    router.get('/count', checkJwt, async function (req, res) {
        try {
            let count = await itemDao.getItemsCount(req.query);
            res.status(200).json({'count': count});
        }
        catch(err) {
            res.status(500).json(err);
        }
    });

    router.get('/:id', checkJwt, async function (req, res) {
        "use strict";
        try {
            let item = await itemDao.getItemById(req.params.id, true, req.user.sub);
            if(item == null) {
                res.status(404).end();
            }
            else {
                res.status(200).json(item);
            }
        }
        catch(err) {
            res.status(500).json(err);
        }
    });

    router.get('/:id/thumbnails/:image', checkJwt, async function (req, res) {
        "use strict";
        try {
            let image = await itemDao.getThumbnailByItemId(req.params.id, req.params.image);
        
            res.set('Content-Type', 'image/jpeg');
            res.send(image);
        }
        catch(err) {
            console.error('error:' + JSON.stringify(err));
            res.status(500).json(err);
        }
    });

    router.post('/:id/publications/mercadolibre', checkJwt, async function(req, res) {
        "use strict";

        try {
            let publication = await publicationDao.createMercadolibrePublication(req.params.id, req.body.price, req.body.title, req.user.sub);
            res.status(200).json(publication);
        }
        catch(error) {
            res.status(500).json(error);
        }
    });

    router.put('/:id/publications/mercadolibre', checkJwt, async function(req, res) {
        "use strict";

        try {
            let item = await itemDao.getItemById(req.params.id, true, req.user.sub);
            if(item === null) {
                res.status(404).end();
            }
            else {
                if(item.publications !== undefined) {
                    try {
                        await publicationDao.updateMercadolibrePublication(item, req.body.price, req.body.title, req.body.status, req.user.sub);
                        res.status(200).json();
                    }
                    catch(error) {
                        res.status(500).json(error);
                    }
                }
                else {
                    res.status(404).end();
                }
            }
        }
        catch(err) {
            res.status(500).json(err);
        }
    });

    router.get('/:id/publications/mercadolibre', checkJwt, async function(req, res) {
        "use strict";

        try {
            let item = await itemDao.getItemById(req.params.id, false, req.user.sub);
            if(item === null) {
                res.status(404).end();
            }
            else {
                if(item.publications !== undefined) {
                    let publication = await publicationDao.refreshMercadolibrePublication(req.params.id, item.publications.mercadolibre.id);
                    res.status(200).json(publication);
                }
                else {
                    res.status(404).end();
                }
            }
        }
        catch(err) {
            res.status(500).json(err);
        }
    });

    router.post('/', checkJwt, async function (req, res) {
        "use strict";
        const item = req.body;
        try {
            let result = await itemDao.createItem(item);
            res.status(201).json(result);
        }
        catch(err) {
            res.status(500).json(err);
        }
    });

    router.patch('/:id', checkJwt, async function(req, res) {
        "use strict";
        const item = req.body;
        const itemId = req.params.id;

        try {
            let result = await itemDao.patchItem(itemId, item);
            res.status(200).json(result);
        }
        catch(err) {
            res.status(500).json(err);
        }    
    });

    router.post('/:id/images', checkJwt, upload.array('files', 12), async function(req, res) {
        "use strict";
        const itemId = req.params.id;
        let responses = [];
        try {
            for(var i = 0; i < req.files.length; i++) {
                let file = req.files[i].buffer;
                let filename = req.files[i].originalname;
                let response = await itemDao.addImageToItem(itemId, filename, file, req.user.sub);
                responses.push(response);
            }
            res.status(200).json(responses);
        }
        catch(err) {
            res.status(500).json(err);
        }
    });

    router.delete('/:id/images/:filename', checkJwt, async function(req, res) {
        "use strict";
        const itemId = req.params.id;
        const filename = req.params.filename;
        try {
            let response = await itemDao.deleteImageFromItem(itemId, filename, req.user.sub);
            res.status(200).json(response);
        }
        catch(err) {
            res.status(500).json(err);
        }
    });

    return router;
}