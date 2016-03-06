// Requiring dependencies
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var moment = require('moment');
var db = require('./mysql_conn.js');

// Moment.js
moment().format();

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
        res.sendStatus(403);
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
    }});

// Register
app.get('/register', function(req, res) {
    // Used to register the establishment
    res.render('register_new', { title: "Register" });});

app.post('/register', function(req, res) {

    // Getting the form data and cleaning it of XSS scripts,
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
    }});

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');});

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
    })(req, res, next);});

app.get('/create-task', function(req, res) {
    // Page for creating a new task
    if (req.isAuthenticated()) { // Checking they're logged in
        // Checking they have classes to assign to
        db.query("SELECT classes.id FROM classes WHERE owner_id = ?", req.user.id, function(err, rows, fields) {
            if (err) throw err;
            // Checking result
            if (rows.length > 0) { // There is data
                res.render("create-task.ejs", { title: "Create a new task" });
            } else if (rows.length < 1) { // No data
                res.render("create-class.ejs", { title: "Create a new class", warn_msg: "You must create a class before creating any tasks!" });
            }
        });
    } else if (!req.isAuthenticated()) {
        res.redirect("/login");
    }});

app.get('/change-password', function(req, res) {
    if (req.isAuthenticated()) {
        res.render("change-password.ejs", { title: "Change password" });
    } else if (!req.isAuthenticated()) {
        res.redirect("/login");
    }});

app.get('/create-class', function(req, res) {
    if (req.isAuthenticated()) {
        res.render("create-class.ejs", { title: "Create a new Class" });
    } else if (!res.isAuthenticated()) {
        res.redirect("/login");
    }});

app.get('/edit-task/:task_id', function(req, res) {
    if (req.isAuthenticated()) {
        // Getting the task ID from the URL
        var task_id = req.params.task_id;

        // Checking that this task belongs to this user
        db.query("SELECT * FROM tasks WHERE tasks.id = ? AND set_by_id = ?", [task_id, req.user.id], function(err, rows, fields) {
            if (err) throw err;
            // Checking there is data
            if (rows.length < 1) {
                // No data
                res.sendStatus(403);

            } else if (rows.length > 0) {
                // User owns this task, prepare the template
                var task_info = {
                    task_name: rows[0]['task_name'],
                    task_desc: rows[0]['task_desc'],
                    task_id: rows[0]['id'],
                    due_date: rows[0]['date_due']
                }

                res.render("edit-task.ejs", { task: task_info, title: "Editing Task" });

            }

        });

    } else if (!req.isAuthenticated()) {
        res.redirect("/login");
    }});

app.get('/edit-class/:class_id', function(req, res) {

    // Checking they're logged in
    if (req.isAuthenticated()) {
        // They are, let's get the information about this class
        var class_id = req.params.class_id;
        db.query("SELECT * FROM classes WHERE classes.owner_id = ? AND classes.id = ?", [req.user.id, class_id], function(err, rows, fields) {
            // Checking for errors
            if (err) throw err;

            // Checking the data response
            if (rows.length < 1) {
                // No data
                res.redirect("/");

            } else if (rows.length > 0) {

                // There's data
                var class_object = {
                    class_name: rows[0]['class_name'],
                    class_id: rows[0]['id']
                }

                res.render("edit-class", { title: "Edit class", class_info: class_object });
            }
        });

    } else if (!req.isAuthenticated()) {
        // They're not, let's redirect them
        res.redirect("/login");
    }});

// API
app.get('/api', ensureAuthenticationAPI, function(req, res) {
    res.json({
        data: 'Cool cats...'
    });});

//////////////////////////////////////////////////////////////////////
// ROUTES FOR EDITING CLASSES
//////////////////////////////////////////////////////////////////////
app.post('/save-class', ensureAuthenticationAPI, function(req, res) {
    // Getting the form data
    var class_name = xssFilters.inHTMLData(req.body.class_name);
    // Validating the information
    if (validator.isNull(class_name)) {
        // No name given
        res.json({
            stat: 0,
            str: "You must fill out all fields in the form"
        });
    } else if (!validator.isLength(class_name, vali_str_opt)) {
        // Not long enough!
        res.json({
            stat: 0,
            str: "Your organisation name must be longer than " + vali_str_opt.min + " characters"
        });
    } else {
        // All good! Create the class model
        var class_model = {
            id: null,
            owner_id: req.user.id,
            class_name: class_name,
            date_created: 'CURRENT_TIMESTAMP'
        }
        db.query('INSERT INTO classes SET ?', class_model, function(err, result) {
            // Checking if was added successfully
            if (err) throw err;
            res.json({
                stat: 1,
            })
        });
    }});
app.get('/classes', ensureAuthenticationAPI, function(req, res) {
    // Querying the database for Classes
    if (req.isAuthenticated()) {
        db.query("SELECT classes.id, classes.class_name FROM classes WHERE owner_id = ? ORDER BY date_created DESC", req.user.id, function(err, rows, fields) {
            if (err) throw err;
            res.json({
                class_data: rows
            });
        });
    } else if (!req.isAuthenticated()) {
        res.redirect("/login");
    }});
app.put('/classes', ensureAuthenticationAPI, function(req, res) {

    // Getting data from the request
    var class_id = req.body.class_id,
        class_name = req.body.class_name;

    // Updating the class
    db.query("UPDATE classes SET classes.class_name = ? WHERE owner_id = ? AND classes.id = ?", [class_name, req.user.id, class_id], function(err, result) {
        // Checking for those pesky errors!
        if (err) throw err;
        // Checking data
        if (result.affectedRows > 0) {
            // Success!
            res.json({
                stat: 1
            });

        } else if (result.affectedRows < 1) {
            // Failure
            res.json({
                stat: 0,
                str: "You do not have permission to edit this class"
            });

        }

    });});
app.delete('/classes', ensureAuthenticationAPI, function(req, res) {

    // Getting the data from API call
    var class_id = req.body.class_id;

    // Deleting it from the DB
    db.query("DELETE FROM classes WHERE classes.id = ? AND classes.owner_id = ?", [class_id, req.user.id], function(err, result) {

        // Checking for errors
        if (err) throw err;

        // Checking data
        if (result.affectedRows > 0) {
            // Success! Delete set tasks
            db.query("DELETE FROM tasks WHERE tasks.class_id = ?", class_id, function(err, result) {

                // Checking for error
                if (err) throw err;

                // Success, remove users from class
                db.query("DELETE FROM relations WHERE relations.class_id = ?", class_id, function(err, result) {

                    // You should know how it goes by now... Checking for errors
                    if (err) throw err;

                    // Success!
                    res.json({
                        stat: 1
                    });

                });

            });


        } else if (result.affectedRows < 1) {
            // Failure
            res.json({
                stat: 0,
                str: "You do not have permission to delete this Class!"
            });

        }

    });});

//////////////////////////////////////////////////////////////////////
// ROUTES FOR SAVING TASKS
//////////////////////////////////////////////////////////////////////
app.post('/save-task', ensureAuthenticationAPI, function(req, res) {
    // Getting the form data
    var task_name = xssFilters.inHTMLData(req.body.task_name),
        task_desc = xssFilters.inHTMLData(req.body.task_desc),
        task_due_date = xssFilters.inHTMLData(req.body.task_due_date),
        class_id = xssFilters.inHTMLData(req.body.class);

    // Validating the data
    if (validator.isNull(task_name) || validator.isNull(task_desc) || validator.isNull(task_due_date) || validator.isNull(class_id)) {
        // Not all filled in
        res.json({
            stat: 0,
            str: "You must fill out all fields!"
        });

    } else if (!validator.isLength(task_name, vali_str_opt) || !validator.isLength(task_desc, vali_str_opt)) {
        // Not long enough!
        res.json({
            stat: 0,
            str: "Description and name must be longer than " + vali_str_opt.min + " characters"
        });

    } else if (!moment(task_due_date).isValid()) {
        // Date is not valid
        res.json({
            stat: 0,
            str: "Date is invalid"
        });

    } else {

        // Checking that the class the user is adding to is theirs
        db.query("SELECT classes.owner_id FROM classes WHERE classes.id = ?", class_id, function(err, rows, fields) {
            if (err) throw err;
            if (rows.length < 1) {
                // That class doesn't exist
                res.json({
                    stat: 0,
                    str: "That class doesn't exist!"
                });

            } else if (rows.length > 0) {
                // That class does exist, see if the User owns is
                if (rows[0]['owner_id'] === req.user.id) {
                    // All good, let's create the object to insert into database
                    var date_set = moment().unix(),
                        date_due = moment(task_due_date).unix();

                    var new_task = {
                        id: null,
                        task_name: task_name,
                        task_desc: task_desc,
                        date_due: date_due,
                        date_set: date_set,
                        set_by_id: req.user.id,
                        class_id: class_id
                    }

                    // Inserting into database
                    db.query("INSERT INTO tasks SET ?", new_task, function(err, result) {
                        if (err) throw err;
                        res.json({
                            stat: 1
                        });
                    });
                } else if (rows.owner_id !== req.user.id) {
                    // User doesn't own it!
                    res.json({
                        stat: 0,
                        str: "You do not have pemission to access that class..."
                    });
                }

            }
        });

    }});

//////////////////////////////////////////////////////////////////////
// ROUTES FOR EDITING ENROLMENTS/CLASSES
//////////////////////////////////////////////////////////////////////
app.get('/enroled/:class_id', ensureAuthenticationAPI, function(req, res) {

    // Getting the enroled students
    var class_id = req.params.class_id;

    // Querying the Database
    db.query("SELECT std_users.stu_full_name, std_users.stu_id FROM std_users, relations, classes WHERE relations.student_id = std_users.stu_id and relations.class_id = classes.id and classes.id = ? and classes.owner_id = ?", [class_id, req.user.id], function(err, rows, fields) {
        // Checking response
        if (err) throw err;
        res.json({
            enroled_data: rows
        });

    });});
app.put('/enroled/:class_id/:student_id', ensureAuthenticationAPI, function(req, res) {

    // Getting the data from the API call
    var class_id = req.params.class_id,
        student_id = req.params.student_id,
        student_name = "";

    console.log(class_id + " " + student_id);

    // Making sure that User exists
    db.query("SELECT stu_full_name FROM std_users WHERE stu_id = ?", student_id, function(err, rows, fields) {
        // Checking response
        if (err) throw err;
        // Checking data
        if (rows.length > 0) {

            // Setting the Student name for the client
            student_name = rows[0]['stu_full_name'];

            // User does exist, check that the class exist
            db.query("SELECT class_name FROM classes WHERE id = ? AND owner_id = ?", [class_id, req.user.id], function(err, rows, fields) {
                // Checking response
                if (err) throw err;
                // Checking the data
                if (rows.length > 0) {
                    // The class does exist and the person does own it, add the user to the class
                    var enrol_model = {
                        id: null,
                        class_id: class_id,
                        student_id: student_id,
                        joined_class: 'CURRENT_TIMESTAMP'
                    }
                    // Inserting to the Database
                    db.query("INSERT INTO relations SET ?", enrol_model, function(err, result) {
                        // Checking the update
                        if (err) throw err;
                        // Checking the data
                        if (result.affectedRows > 0) {
                            // Success! Getting info to send to client
                            res.json({
                                stat: 1,
                                user_id: student_id,
                                user_name: student_name
                            });

                        } else if (result.affectedRows < 1) {
                            // Failure
                            res.json({
                                stat: 0,
                                str: "Failed to add user to class!"
                            });
                        }

                    });

                } else if (rows.length < 1) {
                    // The class either doesn't exist or the person doesn't own it
                    res.json({
                        stat: 0,
                        str: "You do not have permission to edit this class"
                    });

                }

            });

        } else if (rows.length < 1) {
            // User does not exist
            res.json({
                stat: 0,
                str: "That user doesn't exist!"
            });

        }

    });});
app.delete('/enroled/:class_id/:student_id', ensureAuthenticationAPI, function(req, res) {

    // Getting data from the URL
    var class_id = req.params.class_id,
        student_id = req.params.student_id;

    // Checking that the logged in user actually owns this class
    db.query("SELECT class_name FROM classes WHERE id = ? AND owner_id = ?", [class_id, req.user.id], function(err, rows, fields) {
        // Checking for errors
        if (err) throw err;
        // Checking for data
        if (rows.length > 0) {
            // This user owns it, remove it
            db.query("DELETE FROM relations WHERE relations.class_id = ? AND relations.student_id = ?", [class_id, student_id], function(err, result) {
                // Checking for errors
                if (err) throw err;
                // Checking the data
                if (result.affectedRows > 0) {
                    // Success!
                    res.json({
                        stat: 1
                    });

                } else if (result.affectedRows < 1) {
                    // Failure
                    res.json({
                        stat: 0,
                        str: "There was an issue removing this user from this class"
                    });
                }

            });

        } else if (rows.length < 1) {
            // User doesn't own it
            res.json({
                stat: 0,
                str: "You do not have permission to edit this class"
            });

        }

    });});

//////////////////////////////////////////////////////////////////////
// ROUTES FOR SEARCHING FOR STUDENTS
//////////////////////////////////////////////////////////////////////
app.get('/student-search', ensureAuthenticationAPI, function(req, res) {

    // Getting data from the request
    var class_id = req.query.class_id,
        search_query = req.query.search_query;

    // Searching for the Student
    db.query("SELECT std_users.stu_full_name, std_users.stu_id FROM std_users where std_users.stu_id NOT IN (select relations.student_id from relations where relations.class_id = ?) AND std_users.stu_lname LIKE ?", [class_id, search_query], function(err, rows, fields) {
        if (err) throw err;
        res.json({
            data: rows
        });
    });});

//////////////////////////////////////////////////////////////////////
// ROUTES FOR EDITING TASKS
//////////////////////////////////////////////////////////////////////
app.get('/tasks', ensureAuthenticationAPI, function(req, res) {
    // Querying the database for Tasks
    db.query("SELECT tasks.task_name, tasks.task_desc, tasks.date_due, tasks.id, tasks.date_set, classes.class_name 'class_name' FROM tasks, classes WHERE tasks.class_id = classes.id AND tasks.set_by_id = ? ORDER BY tasks.date_set DESC", req.user.id, function(err, rows, fields) {
        if (err) throw err;
        res.json({
            task_data: rows
        });
    });});
app.delete('/edit-task/:task_id', ensureAuthenticationAPI, function(req, res) {

    // Checking that user owns this Task
    db.query("DELETE FROM tasks WHERE set_by_id = ? AND tasks.id = ?", [req.user.id, req.params.task_id],function(err, result) {
        if (err) throw err;
        // Checking data
        if (result.affectedRows < 1) {
            // Nothing was deleted
            res.json({
                stat: 0,
                str: "You don't have permission to delete this task."
            });

        } else if (result.affectedRows > 0) {
            // Something was deleted
            res.json({
                stat: 1
            });

        }

    });});
app.put('/edit-task/:task_id', ensureAuthenticationAPI, function(req, res) {
    // Put request to update a task

    // Getting the data
    var task_name = xssFilters.inHTMLData(req.body.task_name),
        task_desc = xssFilters.inHTMLData(req.body.task_desc),
        task_due_date = xssFilters.inHTMLData(req.body.task_due_date),
        task_id = req.params.task_id;

    // Validating the data
    if (validator.isNull(task_name) || validator.isNull(task_desc) || validator.isNull(task_due_date)) {
        // Not all filled in
        res.json({
            stat: 0,
            str: "You must fill out all fields!"
        });

    } else if (!validator.isLength(task_name, vali_str_opt) || !validator.isLength(task_desc, vali_str_opt)) {
        // Not long enough!
        res.json({
            stat: 0,
            str: "Description and name must be longer than " + vali_str_opt.min + " characters"
        });

    } else if (!moment(task_due_date).isValid()) {
        // Date is not valid
        res.json({
            stat: 0,
            str: "Date is invalid"
        });

    } else {

        var task_update_model = {
            task_name: task_name,
            task_desc: task_desc,
            date_due: task_due_date
        }

        // Updating the database
        db.query("UPDATE tasks SET ? WHERE set_by_id = ? AND tasks.id = ?", [task_update_model, req.user.id, task_id], function(err, result) {
            // Check response
            if (err) throw err;
            if (result.affectedRows < 1) {
                // Nothing updated
                res.json({
                    stat: 0,
                    str: "You don not have persmission to edit this task"
                });
            } else if (result.affectedRows > 0) {
                res.json({
                    stat: 1
                });
            }
        });

    }});

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
    return code_sub;}
