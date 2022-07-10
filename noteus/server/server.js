const http = require('http');
const https = require('https');
const express = require('express');
const server = express();
const port = 5000;
var bodyParser = require('body-parser');
const xml = require('xml');

const compression = require("compression");
const cookieparser = require('cookie-parser');
const expressValidator = require('express-validator');
const session = require('express-session');
const helmet = require('helmet');
require('dotenv').config({path: __dirname + '/.env' });
var mysql = require('mysql');


// connection
const pool = mysql.createPool({
    connectionLimit: 15,
    host: process.env.host,
    user: process.env.username,
    password: process.env.password,
    port: process.env.port,
    database: process.env.dbname,
    secret: process.env.secret,
    createDatabaseTable: true,
    multipleStatements: true,
    insecureAuth: true
});

const MySQLstore = require('express-mysql-session')(session);
const sessionStore = new MySQLstore({}, pool);
server.use(session({ secret: process.env.secret, saveUninitialized: true, resave: false, store: sessionStore, cookie : {
}, maxAge: process.env.jwtcookieexpiresin * 24 * 60 * 60,
}));



server.use(helmet.dnsPrefetchControl());
server.use(helmet.expectCt());
server.use(helmet.frameguard());
server.use(helmet.hidePoweredBy());
server.use(helmet.hsts());
server.use(helmet.ieNoOpen());
server.use(helmet.noSniff());
server.use(helmet.permittedCrossDomainPolicies());
server.use(helmet.referrerPolicy());
server.use(helmet.xssFilter());

server.use(bodyParser.urlencoded({
    extended: false
 }));
 server.use(bodyParser.json()); 

server.use(express.json({ limit: '10kb'}));
server.use(express.urlencoded({ extended: false }));
server.use(cookieparser('secret'));
server.use(compression());


server.use('/', express.static('../client/public', { maxAge: 31557600 }));
server.use('/', require('./api'));


server.set('views', 'sites/');
server.set('view engine', 'ejs');


const jwt = require('jsonwebtoken')



server.get('/index', authenticateToken, (req, res) => {
  
})

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) return res.sendStatus(401)

  jwt.verify(token, process.env.secret, (err, user) => {
    console.log(err)
    if (err) return res.sendStatus(403)
    req.user = user
    next()
  })
}
  
server.listen(port, () => console.log(`Server started on port ${port}.`));
