const rp = require('request-promise-native');

class DropboxService {
    constructor() {
        this.access_token = null;
        this.expires_in = null;
        this.users = new Map();
    }

    getListFolder(path, userId) {
        const _this = this;
        return new Promise((resolve, reject) => {
            _this.getUserToken(userId)
                .then(token => {
                    rp(
                        {
                            "url": "https://api.dropboxapi.com/2/files/list_folder",
                            "method": "POST",
                            "json": true,
                            "body": {
                                "path": "/items/" + path,
                                "recursive": false,
                                "include_media_info": false,
                                "include_deleted": false,
                                "include_has_explicit_shared_members": false,
                                "include_mounted_folders": true
                            }
                        })
                        .auth(null, null, true, token)
                        .then(response => resolve(response))
                        .catch(err => reject(err));
                })
                .catch(err => reject(err));
        })
    }

    getThumbnail(path, userId) {
        const _this = this;
        console.log(`getThumbnail, path:${path}, userId:${userId}`);
        return new Promise((resolve, reject) => {
            _this.getUserToken(userId)
                .then(token => {
                    console.log(`token: ${token}`)
                    rp(
                        {
                            url: "https://content.dropboxapi.com/2/files/get_thumbnail_batch",
                            method: "POST",
                            json: true,
                            body: {
                                "entries": [
                                    {
                                        "path": `/items/${path}`,
                                        "format": "jpeg",
                                        "size": "w128h128",
                                        "mode": "strict"
                                    }
                                ]
                            }
                        })
                        .auth(null, null, true, token)
                        .then(response => {
                            resolve(response.entries[0].thumbnail);
                        })
                        .catch(err => reject(err));
                })
                .catch(err => reject(err));
        })
    }

    uploadFile(path, file, userId) {
        const _this = this;
        return new Promise((resolve, reject) => {
            _this.getUserToken(userId)
                .then(token => {
                    rp(
                        {
                            url: "https://content.dropboxapi.com/2/files/upload",
                            method: "POST",
                            json: false,
                            body: file,
                            headers: {
                                'Dropbox-API-Arg': `{\"path\": \"/items/${path}\",\"mode\": \"add\",\"autorename\": true,\"mute\": false,\"strict_conflict\": false}`,
                                'Content-Type': 'application/octet-stream'
                            }
                        })
                        .auth(null, null, true, token)
                        .then(response => resolve(response))
                        .catch(err => reject(err));
                })
                .catch(err => reject(err));
        });
    }

    deleteFile(path, userId) {
        const _this = this;
        return new Promise((resolve, reject) => {
            _this.getUserToken(userId)
                .then(token => {
                    rp(
                        {
                            url: "https://api.dropboxapi.com/2/files/delete_v2",
                            method: "POST",
                            json: true,
                            body: {
                                "path": `/items/${path}`
                            }
                        })
                        .auth(null, null, true, token)
                        .then(response => {
                            resolve(response);
                        })
                        .catch(err => reject(err));
                })
                .catch(err => reject(err));
        });
    }

    getTemporalLink(path, userId) {
        const _this = this;
        return new Promise((resolve, reject) => {
            _this.getUserToken(userId)
                .then(token => {
                    rp(
                        {
                            url: "https://api.dropboxapi.com/2/files/get_temporary_link",
                            method: "POST",
                            json: true,
                            body: {
                                "path": `/items/${path}`
                            }
                        })
                        .auth(null, null, true, token)
                        .then(response => {
                            resolve(response);
                        })
                        .catch(err => reject(err));
                })
                .catch(err => reject(err));
        });
    }

    getUserToken(userId) {
        console.log(`userId ${userId}`);
        const _this = this;
        return new Promise((resolve, reject) => {
            if(_this.users.get(userId) !== undefined) {
                resolve(_this.users.get(userId));
            }
            else if(_this.access_token === null) {
                console.log('calling getManagementAPIAccess');
                getManagementAPIAccess()
                    .then(response => {
                        console.log(`response from getManagementAPIAccess: ${JSON.stringify(response)}`);
                        _this.access_token = response.access_token;
                        _this.expires_in = response.expires_in;

                        getDropboxToken(userId, _this.access_token)
                            .then(response => {
                                _this.users.set(userId, response);
                                resolve(response);
                            })
                            .catch(err => reject(err))
                    })
                    .catch(err => reject(err));
            }
            else {
                getDropboxToken(userId, _this.access_token)
                    .then(response => {
                        _this.users.set(userId, response);
                        resolve(response);
                    })
                    .catch(err => reject(err))
            }
        });
    }
}

function getManagementAPIAccess() {
    return new Promise((resolve, reject) => {
        rp({
                url: `${process.env.AUTH0_HOST}/oauth/token`,
                method: 'POST',
                json: true,
                body: {
                    "client_id": process.env.AUTH0_CLIENT_ID,
                    "client_secret": process.env.AUTH0_CLIENT_SECRET,
                    "audience": `${process.env.AUTH0_HOST}/api/v2/`,
                    "grant_type": "client_credentials"
                }
            })
            .then(response => resolve(response))
            .catch(err => reject(err));
    });
}

function getDropboxToken(userId, accessToken) {
    return new Promise((resolve, reject) => {
        rp(
            {
                url: `${process.env.AUTH0_HOST}/api/v2/users/${userId}`,
                method: 'GET',
                json: true
            }
        )
        .auth(null, null, true, accessToken)
        .then(response => {
            if(response.hasOwnProperty('identities') && Array.isArray(response.identities) && response.identities.length > 0) {
                for(let identity of response.identities) {
                    if(identity.provider === 'dropbox') {
                        resolve(identity.access_token);
                    }
                }
                reject({error: 'dropbox provider not found'});
            }
            else {
                reject({error: 'identities not found'});
            }
        })
        .catch(err => reject(err));
    });
}

module.exports.dropboxService = new DropboxService();