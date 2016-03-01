// Requiring dependencies
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var db = require('./mysql_conn.js');

// Cleaning tools
var xssFilters = require('xss-filters'),
    validator = require('validator');

// Cleaning settings
var vali_str_opt = {
    min: 5,
    max: 100
}

var app = express();
var port = process.env.PORT || 1337;

// Requiring passport
var passport = require('passport');
var passportLocal = require('passport-local');

// Setting the renderer
app.set('view engine', 'ejs');

app.use("/views", express.static(__dirname + '/views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expressSession({ secret: 'casiodaemon',  resave: true, saveUninitialized: true }));

// Setting up Passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(new passportLocal.Strategy(function(email, password, done) {
    db.query('SELECT * FROM admin_users WHERE admin_users.email = ?', email, function(err, rows, fields) {
        if (err) { return done(err); } // There was an error
        if (rows.length < 1) { // No user
            return done(null, false, {message: 'User not found!'});
        } else if (rows.length > 0) { // There's a user
            // Getting the data
            var email_db = rows[0]['email'],
                password_db = rows[0]['password'];
            // Checking the credentials
            if (email !== email_db) { // Email is not correct
                return done(null, false, {message: 'Invalid Email'});
            } else if (password !== password_db) { // Password is not correct
                return done(null, false, {message: 'Invalid Password'});
            } else {
                // Validation success, create the user model
                var user_model = {
                    id: rows[0]['id'],
                    firstname: rows[0]['fname'],
                    lastname: rows[0]['lname'],
                    full_name: rows[0]['full_name'],
                    email: rows[0]['email'],
                    estab_id: rows[0]['estab_belongs_to']
                }
                // Returning
                return done(null, user_model);
            }
        }
    });
}));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    db.query('SELECT * FROM admin_users WHERE admin_users.id = ?', id, function(err, rows, fields) {
        if (err) { return done(err); } // There was an error
        if (rows.length < 1) { // No user
            done(null, null);
        } else if (rows.length > 0) { // There's a user
            // Validation success, create the user model
            var user_model = {
                id: rows[0]['id'],
                firstname: rows[0]['fname'],
                lastname: rows[0]['lname'],
                full_name: rows[0]['full_name'],
                email: rows[0]['email'],
                estab_id: rows[0]['estab_belongs_to']
            }
            // Returning
            done(null, user_model);
        }
    });
});

// Custom middleware for checking that User is logged in to use the API
function ensureAuthenticationAPI(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else if (!req.isAuthenticated()) {
        res.send(403);
    }
}

// Home
app.get('/', function(req, res) {
    // Checking the User is logged in
    if (req.isAuthenticated()) {
        // They are!
        res.render('index', {
            title: "Home",
            user: req.user
        });
    } else if (!req.isAuthenticated()) {
        // They're not!
        res.redirect("login");
    }
});

// Register
app.get('/register', function(req, res) {
    // Used to register the establishment
    res.render('register', { title: "Register" });
});

app.post('/register', function(req, res) {

    // Getting the form data and cleaning it of XSS scripts
    var org_name = xssFilters.inHTMLData(req.body.form_data.org_name),
        firstname = xssFilters.inHTMLData(req.body.form_data.fname),
        lastname = xssFilters.inHTMLData(req.body.form_data.lname),
        email = xssFilters.inHTMLData(req.body.form_data.email),
        password = xssFilters.inHTMLData(req.body.form_data.password),
        password_conf = xssFilters.inHTMLData(req.body.form_data.password_conf);

    // Validating the data (Length)
    if (validator.isNull(org_name) || validator.isNull(firstname) || validator.isNull(lastname) || validator.isNull(email) || validator.isNull(password) || validator.isNull(password_conf)) {
        res.json({
            stat: 0,
            message: "You must fill out all fields!"
        });
    } else if (!validator.isLength(org_name, vali_str_opt)) {
        res.json({
            stat: 0,
            message: "Your organisation name must be longer than " + vali_str_opt.min + " characters"
        });
    } else if (!validator.isEmail(email)) {
        res.json({
            stat: 0,
            message: "Please enter a valid Email"
        });
    } else if (!validator.isLength(password, vali_str_opt)) {
        res.json({
            stat: 0,
            message: "Password must be longer than " + vali_str_opt.min + " characters"
        });
    } else if (password != password_conf) {
        res.json({
            stat: 0,
            message: "Passwords do not match"
        });
    } else {

        // Checking the database if the User exists
        db.query('SELECT admin_users.id FROM admin_users WHERE admin_users.email = ?', email, function(err, rows, fields) {
            if (err) throw err; // Throwing the error to the Console
            // Checking if user exists
            if (rows.length < 1) {

                // Checking if that establishment exists
                db.query('SELECT establishments.estab_id FROM establishments WHERE estab_name = ?', org_name, function(err, rows, fields) {
                    // Check if any data was returned
                    if (err) throw err; // Throwing MySQL error
                    if (rows.length < 1) {

                        // Encrypting password
                        var password_hash = password,
                            name_com = firstname + " " + lastname;

                        // Preparing the object to insert
                        var user_model = {
                            id: null,
                            fname: firstname,
                            lname: lastname,
                            full_name: name_com,
                            email: email,
                            password: password_hash,
                            estab_belongs_to: null
                        }

                        // Inserting the user
                        var user_ins = db.query('INSERT INTO admin_users SET ?', user_model, function(err, result) {
                            if (err) throw err; // Throwing error, if there is one
                            // Generating a password for the establishment
                            var user_id = result.insertId,
                                org_pass = gen_code(user_id);

                            // Inserting the new establishment into the Database
                            // Preparing the estab model
                            var estab_model = {
                                estab_id: null,
                                estab_pass: org_pass,
                                estab_name: org_name
                            }

                            // Inserting into database
                            var estab_ins = db.query('INSERT INTO establishments SET ?', estab_model, function(err, result) {
                                if (err) throw err; // Throwing error, if there is one
                                // Success! The establishment has been inserted, now we add the user to it
                                var estab_id = result.insertId;
                                var add_user = db.query('UPDATE admin_users SET admin_users.estab_belongs_to = ? WHERE admin_users.id = ?', [estab_id, user_id], function(err, result) {
                                    if (err) throw err; // Throwing error, if there is one
                                    // We've successfully added the User to the establishment

                                    // Redirecting them to the reg success poage
                                    res.json({
                                        stat: 1,
                                        message: "You've successfully registered! <a href='/login'>Login</a>"
                                    });

                                });

                            });

                        });

                    } else if (rows.length > 0) {

                        // Establishment exists
                        res.json({
                            stat: 0,
                            message: "An establishment with that name exists, try another."
                        });

                    }
                });

            } else if (rows.length > 0) {
                // User already registered
                res.json({
                    stat: 0,
                    message: "Sorry, that email has already been registered."
                });
            }
        });
    }    
});

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

// Login
app.get('/login', function(req, res) {
    res.render('login', { title: "Login" });
});

app.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) {
            return next(err);
        } else if (!user) {
            return res.render("login", { title: "Failed to login!", err_msg: info.message });
        } else {
            req.login(user, function(err) {
                if (err) {
                    return next(err);
                }
                return res.redirect("/");
            });
        }
    })(req, res, next);
});

app.get('/create-task', function(req, res) {
    // Page for creating a new task
    res.render("create-task.ejs", { title: "New Task"});
});

// API
app.get('/api', ensureAuthenticationAPI, function(req, res) {
    res.json({
        data: 'Cool cats...'
    });
});

app.get('/classes', ensureAuthenticationAPI, function(req, res) {
    // Querying the database for Classes
    db.query("SELECT classes.id, classes.class_name FROM classes WHERE owner_id = ? ORDER BY date_created DESC", req.user.id, function(err, rows, fields) {
        if (err) throw err;
        res.json({
            class_data: rows
        });
    });
});

app.get('/tasks', ensureAuthenticationAPI, function(req, res) {
    // Querying the database for Tasks
    db.query("SELECT tasks.task_name, tasks.task_desc, tasks.date_due, tasks.id, tasks.date_set, classes.class_name 'class_name' FROM tasks, classes WHERE tasks.class_id = classes.id AND tasks.set_by_id = ? ORDER BY tasks.date_set DESC", req.user.id, function(err, rows, fields) {
        if (err) throw err;
        res.json({
            task_data: rows
        });
    });
});

app.listen(port, function() {
    console.log('http://127.0.0.1:' + port + '/');
});

// Function for generating the code
function gen_code(user_id) {
    // Generating code
    var new_id = user_id * 1000000,
        code = new_id.toString(36),
        code_sub = code.substring(0, 5);
    // Returning new Code
    return code_sub;
}
