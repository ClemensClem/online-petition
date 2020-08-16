app.use((req, res) => {
    if (!req.session.userId && req.url != "/login" && req.url != "/register") {
        res.redirect("/register");
    } else {
        next();
    }
});

//In a route the "next" argument can also be used
const requireLoggedOutUser = (req, res, next) => {
    if (req.session.userId) {
        res.redirect("/petition");
    } else {
        next();
    }
};

const requireSignedUser = (req, res, next) => {
    console.log("Stuff your logic here");
};

//Using const requireLoggedOutUser
app.get("/register", requireLoggedOutUser, requireSignedUser, (req, res) => {
    res.sendStatus(200);
});

//Moving logic to middleware.js in the next step --> for making cleaner code
