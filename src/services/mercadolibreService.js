const rp = require('request-promise-native');

class MercadolibreService {
    constructor() {
        this.accessToken = null;
        this.expiresIn = null;
        this.refreshToken = null;
        this.tokenTimestamp = null;
    }

    async getItem(publicationId) {
        try {
            let response = await rp({
                url: `https://api.mercadolibre.com/items/${publicationId}`,
                method: "GET",
                json: true
            });
            return response;
        } catch (err) {
            throw createError(err);
        }
    }

    async createItem(description, price, title, imageLinks) {
        const token = await this.getToken();
        try {
            let response = await rp({
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
            });
            return response;
        } catch (err) {
            throw createError(err);
        }
    }

    async updateItem(publicationId, price, title, status, imageLinks) {
        const token = await this.getToken();
        try {
            let response = await rp({
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
            });
            return response;
        } catch (err) {
            throw createError(err);
        }
    }

    async getToken() {
        if (this.accessToken !== null && !this.isTokenExpired()) {
            return this.accessToken;
        }
        else {
            let parameters = null;
            if (this.accessToken === null) {
                parameters = {
                    grant_type: 'client_credentials',
                    client_id: process.env.MELI_CLIENT_ID,
                    client_secret: process.env.MELI_CLIENT_SECRET
                }
            } else {
                parameters = {
                    grant_type: 'refresh_token',
                    client_id: process.env.MELI_CLIENT_ID,
                    client_secret: process.env.MELI_CLIENT_SECRET,
                    refresh_token: _this.refresh_token
                }
            }

            try {
                let response = await rp({
                    method: 'POST',
                    uri: 'https://api.mercadolibre.com/oauth/token',
                    json: true,
                    form: parameters
                });
                this.accessToken = response.access_token;
                this.expiresIn = response.expires_in * 1000;
                this.refreshToken = response.refresh_token;
                this.tokenTimestamp = Date.now();

                return this.accessToken; 
            } catch (err) {
                throw createError(err);
            }
        }
    }

    isTokenExpired() {
        const now = Date.now();
        if (now >= this.tokenTimestamp + this.expiresIn) {
            return true;
        } else {
            return false;
        }
    }
}

function createError(err) {
    const error = new Error(`${err.error.message}, cause: ${JSON.stringify(err.error.cause)}`);
    error.isOperational = true;
    return error;
}

module.exports.mercadolibreService = new MercadolibreService();