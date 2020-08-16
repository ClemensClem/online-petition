const express = require("express");
const app = express();
exports.app = app; //exports server from main file "index.js"
const hb = require("express-handlebars");
const cookieSession = require("cookie-session");
const {
    addUser,
    addSignatures,
    getAll,
    getSignature,
    getSignatureCount,
    getSigners,
    getSignersByCity,
    getPassword,
    getUserId,
    checkSignature,
    getSignatureId,
    checkEMail,
    updateProfile,
    updateUsers,
    updateUsersWithPassword,
    deleteSignature,
    deleteUser,
    deleteUserProfile,
} = require("./db");

//Security
//////////
let key;
if (process.env.PORT) {
    //this will run if petition is running on heroku.com
    key = process.env; //cookieSeesionScret is the property with which secret is set up to Heroku step 17)
} else {
    //this will run if project is running on localhost
    key = require("./secrets.json");
}

const csurf = require("csurf");
const helmet = require("helmet");
const { hash, compare } = require("./bc");

//Handlebar Boilerplate
///////////////////////
app.engine("handlebars", hb());
app.set("view engine", "handlebars");

///Middleware
/////////////
app.use(
    cookieSession({
        secret: key.sessionKey,
        cookie: { secure: !true },
        maxAge: 1000 * 60 * 60 * 24 * 14, // milliseconds * seconds * minutes * hours * days
    })
);

//Express static file serving
/////////////////////////////
app.use(express.static("./public"));

app.use(
    express.urlencoded({
        extended: false,
    })
);

//csruf middleware
//////////////////
app.use(csurf());

app.use(function (req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
});

//Setting X-Frame-Options
/////////////////////////
app.use(helmet.frameguard({ action: "DENY" }));

///Serving websites
///////////////////
app.get("/", (req, res) => {
    res.redirect(301, "register");
});

//Logout
app.get("/logout", (req, res) => {
    req.session = null;
    console.log('Logout, redirect to GET "/register"-route');
    res.redirect(301, "./register");
});

//Register page
app.get("/register", (req, res) => {
    //check if userId cookie is existing --> user is logged in already
    if (req.session.userId) {
        //if so check if signatureId cookie is existing --> user signed petition already
        if (req.session.signatureId) {
            //if so redirect to "thankyou"-page
            res.redirect(301, "./petition/thankyou");
            //if signatureId cookie is not existing redirect to "petition"-page
        } else {
            res.redirect(301, "./profile");
        }
        //if userId cookie is not existing render the "register"-page
    } else {
        res.render("register", {
            layout: "main",
            error: false,
        });
    }
});

//check if user with this email address exists in database
app.post("/register", (req, res) => {
    let { firstName, lastName, email } = req.body;
    //check if email exists in table users
    checkEMail(email)
        .then((eMailExists) => {
            //if so redirect to "login"-page
            if (eMailExists.rows[0].exists) {
                console.log(
                    'User with this EMail is existing, redirect to "/login"-page from POST "register"-route'
                );
                res.redirect(301, "/login");
                //if user is not existing in table users --> create new data set
            } else {
                hash(req.body.password).then((hashedPw) => {
                    addUser(firstName, lastName, email, hashedPw)
                        .then((idObj) => {
                            req.session.userId = idObj.rows[0].id;
                        })
                        //if data set is created successfully in users table redirect to petition page
                        .then(() => {
                            res.redirect(301, "/profile");
                        })
                        .catch((err) => {
                            console.log(
                                'Error in POST "/register"-route, storing user to the database "users": ',
                                err
                            );
                            res.render("register", {
                                layout: "main",
                                error: true,
                            });
                        });
                });
            }
        })
        .catch((err) => {
            console.log(
                'Error in "register"-route, checking if user email exists in table users',
                err
            );
            res.render("register", {
                layout: "main",
                error: true,
            });
        });
});

//Login page
app.get("/login", (req, res) => {
    //check if user was not redirected from register-page because email address is existing already
    if (!req.headers.referer) {
        //check if userId cookie is existing --> user is logged in already
        if (req.session.userId) {
            //if so check if signatureId cookie is existing --> user signed petition already
            if (req.session.signatureId) {
                //if so redirect to "thankyou"-page
                console.log(
                    'redirect from GET "/login"-route to "/petition/thankyou"-route'
                );
                res.redirect(301, "/petition/thankyou");
                //if signatureId cookie is not existing redirect to "petition"-page
            } else {
                console.log(
                    'redirect from GET "/login"-route to "/petition"-route'
                );
                res.redirect(301, "/petition");
            }
            //if userId cookie is not existing render the "login"-page
        } else {
            res.render("login", {
                layout: "main",
            });
        }
        //if user is redirect from register because of existing email address go here
    } else {
        if (req.headers.referer.endsWith("register")) {
            res.render("login", {
                layout: "main",
                login: true,
            });
        } else {
            res.render("login", {
                layout: "main",
            });
        }
    }
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    //check if email is existing in database
    checkEMail(email).then((eMailExists) => {
        if (eMailExists.rows[0].exists) {
            //if so, checking if password is matching --> authentication
            getPassword(email).then((pwObj) => {
                const pwFromDatabase = pwObj.rows[0].password;
                compare(password, pwFromDatabase).then((authentication) => {
                    //authentication OK, set cookie with userId
                    if (authentication) {
                        getUserId(email).then((idObj) => {
                            req.session.userId = idObj.rows[0].id;
                            //check if signature is existing in database --> did the user signed the petition already?
                            checkSignature(req.session.userId).then(
                                (signatureExists) => {
                                    //if signature exists, set cookie with signatureId and redirect to "thankyou"-page
                                    if (signatureExists.rows[0].exists) {
                                        getSignatureId(req.session.userId)
                                            .then((signatureIdObj) => {
                                                req.session.signatureId =
                                                    signatureIdObj.rows[0].id;
                                                console.log(
                                                    'Redirect to "/petition/thankyou" from "/login"-route'
                                                );
                                                res.redirect(
                                                    301,
                                                    "/petition/thankyou"
                                                );
                                            })
                                            //error handling in route, redirect to "login"-page
                                            .catch((err) => {
                                                console.log(
                                                    'ERR in POST "/login"-route: ',
                                                    err
                                                );
                                                res.render("login", {
                                                    layout: "main",
                                                    error: true,
                                                });
                                            });

                                        //if signature does not exist, redirect to "sign-up"-page
                                    } else {
                                        console.log(
                                            'Redirect to "/petition" from POST "/login"-route'
                                        );
                                        res.redirect(301, "../petition");
                                    }
                                }
                            );
                        });
                        //if authentication fails, render error page
                    } else {
                        console.log('No authentication POST-"/login"-route');
                        res.render("login", {
                            layout: "main",
                            noAuthentication: true,
                        });
                    }
                });
            });
            //if user is not exsting,
            //To Do: render error page with content: user not existing new login or new registering!
        } else {
            console.log('User not existing POST "/login"-route');
            res.render("login", {
                layout: "main",
                noUserExisting: true,
            });
        }
    });
});

//Profile page
app.get("/profile", (req, res) => {
    if (req.session.userId) {
        res.render("profile", {
            layout: "main",
        });
    } else {
        console.log('Redirect from GET "/profile"-route to "/register');
        res.redirect(301, "./register");
    }
});

app.post("/profile", (req, res) => {
    let age = req.body.age ? req.body.age : null;
    let { city, homepage } = req.body;
    //checking if url starts with http
    homepage = urlCheck(homepage);
    //Updating profile
    updateProfile(req.session.userId, age, city, homepage)
        .then(() => {
            console.log(
                'Redirect from POST "/profile"-route to "/petition"-route'
            );
            res.redirect(301, "./petition");
        })
        .catch((err) => {
            console.log('Error in POST "/profile"-route": ', err);
            res.render("profile", {
                layout: "main",
                error: true,
            });
        });
});

//Editing profile page
app.get("/profile/edit", (req, res) => {
    if (req.session.userId) {
        getAll(req.session.userId)
            .then((profileObj) => {
                let profileData = profileObj.rows[0];
                res.render("edit", {
                    layout: "main",
                    profileData: profileData,
                    closeAccount: true,
                });
            })
            .catch((err) => {
                console.log('Error in "profile/edit"-route', err);
                res.render("edit", {
                    layout: "main",
                    closeAccount: true,
                    error: true,
                });
            });
    } else {
        console.log('Redirect from GET "/profile/edit"-route to "/login');
        res.redirect(301, "../login");
    }
});

app.post("/profile/edit", (req, res) => {
    let age = req.body.age ? req.body.age : null;
    let { firstName, lastName, email, password, city, homepage } = req.body;
    //If password field is filled hash the password for the database update
    if (password) {
        hash(password)
            .then((hashedPw) => {
                Promise.all([
                    updateUsersWithPassword(
                        req.session.userId,
                        firstName,
                        lastName,
                        email,
                        hashedPw
                    ),
                    updateProfile(req.session.userId, age, city, homepage),
                ])
                    .then(() => {
                        console.log(
                            'Redirect from POST "profile/edit"-route to "/petition/thankyou"-route'
                        );
                        res.redirect(301, "../petition/thankyou");
                    })
                    .catch((err) => {
                        console.log(err);
                        res.render("edit", {
                            layout: "main",
                            closeAccount: true,
                            error: true,
                        });
                    });
            })
            .catch((err) => {
                console.log('Error in POST "/profile/edit"-route: ', err);
            });
        //If there is no password entered in the field then go here
    } else {
        Promise.all([
            updateUsers(req.session.userId, firstName, lastName, email),
            updateProfile(req.session.userId, age, city, homepage),
        ])
            .then(() => {
                console.log(
                    'Redirect from POST "profile/edit"-route to "/petition/thankyou"-route'
                );
                res.redirect(301, "../petition/thankyou");
            })
            .catch((err) => {
                console.log('Error in POST "/profile/edit"-route: ', err);
                res.render("edit", {
                    layout: "main",
                    closeAccount: true,
                    error: true,
                });
            });
    }
});

//Petition page
app.get("/petition", (req, res) => {
    //check if cookie userId is existing --> user signed in already
    if (req.session.userId) {
        //check if cookie signatureId is existing --> if user signed the petition already redirect to "thankyou"-page
        if (req.session.signatureId) {
            console.log(
                'Redirect to "petition/thankyou"-page from GET "petition"-route, signature is existing'
            );
            res.redirect(301, "./petition/thankyou");
            //user is logged in but didn't sign the petition already
        } else {
            res.render("petition", {
                layout: "main",
            });
        }
        //if user is not logged in redirect to login page
    } else {
        console.log(
            'redirect to "/login"-page from GET-"/petition"-page, user did not log in already'
        );
        res.redirect(301, "/login");
    }
});

//Sign-up for the petition
app.post("/petition", (req, res) => {
    let { hiddenSignature, signatureCheck } = req.body;
    //check if signature pad is filled
    if (signatureCheck) {
        //if so write data to table
        addSignatures(hiddenSignature, req.session.userId)
            .then((idObj) => {
                req.session.signatureId = idObj.rows[0].id;
                console.log(
                    'Successful storage of signature: Redirect to "/thankyou"-page from POST "/petition"-page'
                );
                res.redirect(301, "./petition/thankyou");
            })
            //error handling
            .catch((err) => {
                console.log('Error in "/petition"-route: ', err);
                res.render("petition", {
                    layout: "main",
                    error: true,
                });
            });
        //if signature pad is not filled render the "error"-page
    } else {
        res.render("petition", {
            layout: "main",
            noSignature: true,
        });
    }
});

//Thank-You page
app.get("/petition/thankyou", (req, res) => {
    //Checking if signature cookie is existing --> did the user sign the petition already?
    if (req.session.signatureId) {
        Promise.all([getSignatureCount(), getSignature(req.session.userId)])
            .then((dbObj) => {
                let count = dbObj[0].rows[0].count;
                let signature = dbObj[1].rows[0].signature;
                res.render("thankYouPage", {
                    layout: "main",
                    numberOfSigners: true,
                    helpers: {
                        countSignatures() {
                            return count;
                        },
                        signature() {
                            return signature;
                        },
                    },
                });
            })
            .catch((err) => {
                console.log('Error in "/petition/thankyou"-route: ', err);
                res.render("thankYouPage", {
                    layout: "main",
                    numberOfSigners: false,
                    error: true,
                });
            });
        //If there is no signature cookie existing redirect to "/petition"-route
    } else {
        console.log(
            'Redirect from GET "/petition/thankyou"-route to "/petition"'
        );
        res.redirect(301, "../petition");
    }
});

app.post("/petition/thankyou", (req, res) => {
    //Check for delete-post
    if (req.body.deleteSignature) {
        deleteSignature(req.session.userId)
            .then(() => {
                req.session.signatureId = null;
                console.log(
                    'Redirect from POST "/petition/thankyou"-route to "/petition"-route'
                );
                res.redirect(301, "../petition");
            })
            .catch((err) => {
                console.log('Error in POST "/petition/thankyou-route', err);
                res.render("thankYouPage", {
                    layout: "main",
                    error: true,
                });
            });
    }
});

//Page with all signers
app.get("/petition/signers", (req, res) => {
    if (req.session.signatureId) {
        getSigners()
            .then((queryObj) => {
                return queryObj.rows;
            })
            .then((signersArray) => {
                res.render("signersPage", {
                    layout: "main",
                    signers: signersArray,
                    allSigners: true,
                });
            })
            .catch((err) => {
                console.log('Error in GET "/petition/signers"-route: ', err);
                res.render("signersPage", {
                    layout: "main",
                    allSigners: true,
                    error: true,
                });
            });
    } else {
        console.log(
            'Redirect from GET "/petition/signers"-route to "/petition"'
        );
        res.redirect(301, "./petition");
    }
});

app.get("/petition/signers/:city", (req, res) => {
    if (req.session.signatureId) {
        getSignersByCity(req.params.city)
            .then((queryObj) => {
                return queryObj.rows;
            })
            .then((signersArray) => {
                res.render("signersPage", {
                    layout: "main",
                    signers: signersArray,
                    signersByCity: true,
                });
            })
            .catch((err) => {
                console.log(
                    'Error in GET "/petition/signers/:city"-route: ',
                    err
                );
                res.render("signersPage", {
                    layout: "main",
                    signersByCity: true,
                    error: true,
                });
            });
    } else {
        console.log(
            'Redirect from GET "/petition/signers/:city"-route to "/petition"-route'
        );
        res.redirect(301, "/petition");
    }
});

app.get("/close-account", (req, res) => {
    if (req.session.userId) {
        Promise.all([
            deleteUserProfile(req.session.userId),
            deleteSignature(req.session.userId),
            deleteUser(req.session.userId),
        ])
            .then(() => {
                console.log("Deleted successfully");
                req.session = null;
                console.log(
                    'Account deleted and redirect to "/register"-route'
                );
                res.redirect(301, "/register");
            })
            .catch((err) => {
                console.log('Error in GET "/close-account" route: ', err);
                res.render("edit", {
                    layout: "main",
                    closeAccount: true,
                    error: true,
                });
            });
    } else {
        //if no userId cookie is set do the redirect to /register
        console.log('Redirect from GET "/close-account" to /register route');
        res.redirect(301, "/register");
    }
});

//checks if app.listen is run by node/Heroku, if it is supertest block evaluates to false and app.listen is not executet. Supertets doesn't need the app.listen for testing
if (require.main === module) {
    app.listen(process.env.PORT || 8080, () => {
        console.log("Server is there!");
    });
}

//Checks URL for secure http
let urlCheck = (url) => {
    if (url.startsWith("http")) {
        console.log('url starts with "http" ', url);
        return url;
    } else {
        if (url === "") {
            return url;
        } else {
            return "https://" + url;
        }
    }
};
