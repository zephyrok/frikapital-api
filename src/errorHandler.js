module.exports.errorHandler = new errorHandler();

function errorHandler() {
    this.handleError = async function(err, res) {
        console.log('Inside errorHandler');
        console.error(err.stack);
        if (err.isOperational) {
            if(err.status !== undefined) {
                res.status(err.status).json({"message": err.name + ': ' + err.message});
            } 
            else {
                res.status(500).json({"message": err.name + ': ' + err.message});
            }
            return true;
        } else {
            return false;
        }
    };
}