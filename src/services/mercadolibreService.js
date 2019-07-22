const rp = require('request-promise-native');

class MercadolibreService {
    constructor() {
        this.access_token = null;
        this.expires_in = null;
        this.refresh_token = null;
    }

    getItem(publicationId) {
        return new Promise((resolve, reject) => {
            rp({
                url: `https://api.mercadolibre.com/items/${publicationId}`,
                method: "GET",
                json: true
            })
            .then(response => resolve(response))
            .catch(err => reject(err));
        })
    }

    createItem(description, price, title, imageLinks) {
        const _this = this;
        return new Promise((resolve, reject) => {
            _this.getToken()
                .then(token => {
                    rp({
                        url: "https://api.mercadolibre.com/items?access_token=" + token,
                        method: "POST",
                        json: true,
                        body: {
                            "title": title,
                            "category_id":"MLM14739",
                            "price": price,
                            "currency_id":"MXN",
                            "available_quantity": 1,
                            "buying_mode":"buy_it_now",
                            "listing_type_id":"bronze",
                            "condition":"new",
                            "description": {"plain_text": description},
                            "pictures": imageLinks
                        }
                    })
                    .then(response => resolve(response))
                    .catch(err => reject(err));
                })
                .catch(err => reject(err));
        })
    }

    updateItem(publicationId, price, title, status, imageLinks) {
        const _this = this;
        return new Promise((resolve, reject) => {
            _this.getToken()
                .then(token => {
                    rp({
                        url: `https://api.mercadolibre.com/items/${publicationId}?access_token=${token}`,
                        method: "PUT",
                        json: true,
                        body: {
                            "title": title,
                            "price": price,
                            "status": status,
                            "available_quantity": 1,
                            "pictures": imageLinks
                        }
                    })
                    .then(response => resolve(response))
                    .catch(err => reject(err));
                })
                .catch(err => reject(err));
        });
    }

    getToken() {
        const _this = this;
        return new Promise((resolve, reject) => {
            if(_this.access_token === null) {
                rp({
                    method: 'POST',
                    uri: 'https://api.mercadolibre.com/oauth/token',
                    json: true,
                    form: {
                        grant_type: 'client_credentials',
                        client_id: process.env.MELI_CLIENT_ID,
                        client_secret: process.env.MELI_CLIENT_SECRET
                    }
                })
                .then(response => {
                    _this.access_token = response.access_token;
                    _this.expires_in = response.expires_in;
                    _this.refresh_token = response.refresh_token;
                    resolve(_this.access_token);
                })
                .catch(err => reject(err));
            }
            else {
                resolve(_this.access_token);
            }
        });
    }
}

module.exports.mercadolibreService = new MercadolibreService();