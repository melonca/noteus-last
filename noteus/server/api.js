const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
dotenv.config({ path: './' });
var mysql = require('mysql');
const { request } = require('express');
const bcrypt = require("bcrypt");
const session = require('express-session');
const { name } = require('ejs');
const saltRounds = 10;
const xml = require('xml');

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

// Check connection
const con = pool.getConnection(function (err) {
    if (err) {
        console.log('Error: ' + err);
    }
    else {
        console.log('MySQL connected.');
    }
});

// function checkLogin(request, response){
//     if (req.session.uid) {
//         try {
//             const id = req.session.uid;
//             pool.getConnection(function (err, conn) {
//             conn.query('SELECT user_name FROM USERS where id = ?', [id], (error, result) =>  {
//                 if(!result){
//                     return next();
//                 }
//                 req.user_data = result[0];
//                 return next();
//             });
//             });
//         } 
//         catch (error) {
//             return next();
//         }
//     }
//     else {
//         next();
//     }
// }

router.get('/', (req, res, next) => {
    res.render('perche', {
        // spremenljivke za ejs
    });
});

router.get('/login', (req, res, next) => {
    res.render('login', {
        
    });
});

router.get('/sites/sitemap.xml', (req, res, next) => {
    	res.setHeader('content-type', 'text/xml');
	res.sendFile(__dirname + '/sites/sitemap.xml', {

    });
});

router.post('/POST/login', function(request, response) {
	var user_name = request.body.user_name;
	var password = request.body.password;
    pool.getConnection(function (err, con) {
	if (user_name && password) {
		con.query('SELECT * FROM users WHERE user_name = ?', [user_name], function(error, results, fields) {
		if(error){
			response.send(error);
		}	
		else if (results.length > 0) {
                if(bcrypt.compare(password, results[0].password)){
                    request.session.loggedin = results[0].user_id;
				    request.session.user_name = user_name;
				    response.redirect('/index');
                }else{
                    response.send('Incorrect Username and/or Password!');
                }
				
			} else {
				response.send('Incorrect Username and/or Password!');
			}			
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
    })
});

router.get('/register', (req, res, next) => {
    res.render('register', {
        // spremenljivke za ejs
    });
});
router.post('/POST/register', async (req, res, next) => {
    function uID() {
        var ID = "";
        for (let index = 0; index < Math.random(); index++) {
            ID += Math.random() * 10;

        }
        return ID;
    }
    var { user_name, email, password } = req.body;
    password = await bcrypt.hash(password, 10);
    console.log(user_name + ": " + email + ": " + password);
    pool.getConnection(function (err, con) {
        con.query(`insert into users (user_id,user_name,email,password) values (?,?,?,?)`, [uID(), user_name, email, password],
            async function (err, res1) {
                if (err) {
                    return console.log(err);
                } else {
                    res.redirect("/index");
                }

            });
    })
});
router.get('/contact', (req, res, next) => {
    res.render('contact', {
        // spremenljivke za ejs
    });
});

router.get('/logout', async (request, response) => {
        if (request.session.loggedin) {
            response.redirect("/");
            request.session.destroy();
        } else {
            response.json({result: 'ERROR', message: 'User is not logged in.'});
        }
    });

    router.post('/POST/contacts', (req, res, next) => {
        var {name, phone, email} = req.body;
        pool.getConnection(function (err, con) {
            con.query(`SELECT user_id, name, phone, email FROM phone_book WHERE user_id = ? AND name = ?`, [req.session.loggedin, name],
                async function (err, res1) {
                    if (err) {
                        return console.log(err);
                    }else if(!(res1.length > 0)){
                        con.query(`insert into phone_book (user_id, name, phone, email) values (?,?,?,?)`, [req.session.loggedin, name, phone, email],
                        async function (err, res1) {
                            if (err) {
                                return console.log(err);
                            }
                        });
                    }
            });
        })
    });

    router.get('/GET/contacts', (req, res, next) => {
        if(req.session.loggedin){
            pool.getConnection(function (err, con) {
                con.query(`SELECT name, phone, email FROM phone_book WHERE user_id = ? LIMIT 7`, [req.session.loggedin],
                    async function (err, res1) {
                        if (err) {
                            return console.log(err);
                        }else{
                            res.json(res1);
                        }
                    });
            })
        }
        
    });

    router.post('/POST/notes', (req, res, next) => {
        var {note, title, date} = req.body;
        pool.getConnection(function (err, con) {
            con.query(`SELECT user_id, title FROM notepad WHERE user_id = ? AND title = ?`, [req.session.loggedin, title],
                async function (err, res2) {
                    if (err) {
                        return console.log(err);
                    }else if(!(res2.length > 0)){
                        con.query(`insert into notepad (user_id, title, notes, date) values (?,?,?,?)`, [req.session.loggedin, title, note, date],
                        async function (err, res2) {
                            if (err) {
                                return console.log(err);
                            }
                        });
                    }
            });
        })
    });

    router.get('/GET/notes', (req, res, next) => {
        if(req.session.loggedin){
            pool.getConnection(function (err, con) {
                con.query(`SELECT title, notes, date FROM notepad WHERE user_id = ? LIMIT 7`, [req.session.loggedin],
                    async function (err, res2) {
                        if (err) {
                            return console.log(err);
                        }else{
                            res.json(res2);
                        }
                    });
            })
        }
        
    });
// http://localhost:8000/index
router.get('/index', function(request, response) {
    if(request.session.loggedin){
        response.render('index',{
            //spremenljivke za ejs
            uName: request.session.user_name
        });
    }else{
        response.redirect("/login");
    }
        
});
module.exports = router;
