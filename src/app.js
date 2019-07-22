/*
  Frikapital Backend Services
*/
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');
const db = require('./dbs');
const itemsRouter = require('./routes/items');
const ordersRouter = require('./routes/orders');

db.once('open', function() {
  const app = express();

  // Authentication middleware. When used, the
  // Access Token must exist and be verified against
  // the Auth0 JSON Web Key Set
  const checkJwt = jwt({
    // Dynamically provide a signing key
    // based on the kid in the header and 
    // the signing keys provided by the JWKS endpoint.
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: process.env.JWT_JWKSURI
    }),
    getToken: function fromHeaderOrQuerystring (req) {
      if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
          return req.headers.authorization.split(' ')[1];
      } else if (req.query && req.query.token) {
        return req.query.token;
      }
      return null;
    },

    // Validate the audience and the issuer.
    audience: process.env.JWT_AUDIENCE,
    issuer: process.env.JWT_ISSUER,
    algorithms: ['RS256']
  });

  app.use(function(req, res, next) {
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", 0);
    next();
  });

  app.use(morgan('dev'));
  app.use(bodyParser.json());
  app.use(cors());
  app.use('/api/v1/items', itemsRouter(db, checkJwt));
  app.use('/api/v1/orders', ordersRouter(db, checkJwt));
  app.use(express.static('public'));
  app.use(express.static('swagger'));

  var port = process.env.PORT || 3000;

  // Set up express

  app.use(function (err, req, res, next) {
      console.error(err.stack);
      if(err.status !== undefined) {
        res.status(err.status).send(err);
      } 
      else {
        res.status(500).send(err);
      }
     
  });

  // Start the server listening
  var server = app.listen(port, function() {
    var port = server.address().port;
    console.log('Frikapital server listening on port %s.', port);
  });
});

process.on('uncaughtException', function(err) {
    console.log(err);
});
