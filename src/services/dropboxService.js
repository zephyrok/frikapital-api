const rp = require('request-promise-native');
var fetch = require('node-fetch');
var Dropbox = require('dropbox').Dropbox;

class DropboxService {
    constructor() {
        this.dbx = new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN, fetch: fetch})
        this.access_token = null;
        this.expires_in = null;
        this.users = new Map();
    }

    async getListFolder(path) {
        try {
            const result = await this.dbx.filesListFolder({
                "path": `/items/${path}`,
                "recursive": false,
                "include_media_info": false,
                "include_deleted": false,
                "include_has_explicit_shared_members": false,
                "include_mounted_folders": true
            });
            return result.entries;
        } catch (err) {
            throw createError(err);
        }
    }

    async getThumbnail(path) {
        try {
            const result = await this.dbx.filesGetThumbnail({
                "path": `/items/${path}`,
                "format": "jpeg",
                "size": "w128h128",
                "mode": "strict"
            });
            return result.fileBinary;
        } catch (err) {
            throw createError(err);
        }
    }

    async uploadFile(path, file) {
        try {
            const result = await this.dbx.filesUpload({
                contents: file,
                path: `/items/${path}`,
                mode: {'.tag':'add'},
                autorename: true,
                mute: false,
                strict_conflict: false
            });
            return result.name;
        } catch (err) {
            throw createError(err);
        }
    }

    async deleteFile(path) {
        try {
            const result = await this.dbx.filesDeleteBatch({
                entries: [
                    {path: `/items/${path}`}
                ]
            });
            return result['.tag'];
        } catch (err) {
            throw createError(err);
        }
    }

    async getTemporalLink(path) {
        try {
            const result = await this.dbx.filesGetTemporaryLink({
                path: `/items/${path}`
            });
            return result.link;
        } catch (err) {
            throw createError(err);
        }
    }
}

function createError(err) {
    if (err.user_message === undefined) {
        return Error(err.error_summary);
    } else {
        return Error(err.user_message.text);
    }
}

module.exports.dropboxService = new DropboxService();