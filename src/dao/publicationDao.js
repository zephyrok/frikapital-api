/**
 * Publication DAO
 */
const ItemDao = require('./itemDao').ItemDao;
const dropboxService = require('../services/dropboxService').dropboxService;
const mercadolibreService = require('../services/mercadolibreService').mercadolibreService;

class PublicationDao {
    constructor() {
        this.itemDao = new ItemDao();
    }

    async createMercadolibrePublication(itemId, price, title, userId) {
        //Find the images from Dropbox
        try {
            let item = await this.itemDao.getItemById(itemId, true, userId);
            let imageLinks = await getLinkImages(item, userId);
            let description = getDescription(item);
            let response = await mercadolibreService.createItem(description, price, title, imageLinks);

            let publication = {
                "id" : response.id,
                "title" : response.title,
                "price" : response.price,
                "permalink" : response.permalink,
                "thumbnail" : response.thumbnail,
                "status" : response.status
            }

            let itemResponse = await this.itemDao.addMLPublication(itemId, publication);
            return itemResponse;
        }
        catch(err){
            console.error('error', err);
            const error = {};
            error.message = 'Error occurred while publishing item';
            error.details = err;
            error.code = 500;
            throw error;
        }
    }

    async refreshMercadolibrePublication(itemId, publicationId) {
        try {
            let publication = await mercadolibreService.getItem(publicationId);
            this.itemDao.addMLPublication(itemId, publication);
            return publication
        }
        catch(err) {
            console.log('error', err);
            throw err;
        }
    }

    async updateMercadolibrePublication(item, price, title, status, userId) {
        try {
            if(item.publications !== undefined) {
                let imageLinks = await getLinkImages(item, userId);

                await mercadolibreService.updateItem(item.publications.mercadolibre.id, price, title, status, imageLinks);
            }
        }
        catch(err) {
            console.log('error', err);
            throw err;
        }
    }
}

async function getLinkImages(item, userId) {
    let imageLinks = [];
    if(item.images !== undefined && item.images.length > 12) {
        item.images = item.images.slice(0, 11);
    }
    for(let image of item.images) {
        try {
            let responseTemporalLink = await dropboxService.getTemporalLink(`${item._id}/${image}`, userId);
            imageLinks.push({"source": responseTemporalLink.link});
        }
        catch(err) {
            console.error(err);
        }
    }

    return imageLinks;
}

function getDescription(item) {
    let description = 
    `Condiciones del producto
Figura Nueva Original Importada de Japón.
Personaje: ${item.details.character}
Serie: ${item.details.serie}
Modelo: ${item.details.model}`;

    if(item.details.height != 0) {
        description += `\nAlto de la figura: ${item.details.height / 10}cm`
    }
    
    if(item.dimensions !== undefined) {
        description += `\nMedidas de la caja
Alto: ${item.dimensions.height / 10}cm
Ancho: ${item.dimensions.width / 10}cm
Largo: ${item.dimensions.length / 10}cm`;
    }

    return description;
}

module.exports.PublicationDao = PublicationDao;