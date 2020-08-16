const supertest = require("supertest");
const { app } = require("./index");

//Integrating Mock
//Testing /home route with mock
const cookieSession = require("cookie-session");

test('GET /home sends 200status code as response when there is a "submitted" ccokie, and chacks taht the correct HTML is sent back as response', () => {
    //creating the mock cookie
    cookieSession.mockSessionOnce({
        submitted: true,
    });
    //get request automatically takes the cookie we set up above
    return supertest(app)
        .get("/home")
        .them((res) => {
            expect(res.statusCode).toBe(200);
            expect(res.text).toContain("<h1>");
        });
});

test("GET /welcome sends 200 status code as response", () => {
    return supertest(app)
        .get("/welcome")
        .then((res) => {
            //"npm test" in terminal (bash) runs test
            //statusCode, text, headers are the 3 main important properties in the response
            expect(res.statusCode).toBe(200);
            expect(res.text).toBe("<h1>Welcome to my webiste...</h1>");
        });
});

test("GET/home redirects when I make request without cookies", () => {
    return supertest(app)
        .get("/home")
        .then((res) => {
            //302 is the redirect status code
            //response will include location header that will tell us where the user's been redirected to
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/welcome");
        });
});

test("POST /welcome sets submitted cookie to true", () => {
    //1. create an empty cookie that my server can write data to
    const cookie = {};
    cookieSession.mockSessionOnce(cookie);
    //cookie in index.test.js = req.session in index.js
    //any data written to re.session in index.js will be written to cookie index.test.js

    //2. make request to server (as usual)
    //the cookie session mock takes "cookie" and turns it into req.session
    return supertest(app)
        .post("/welcome")
        .then((res) => {
            expect(cookie).toEqual({
                submitted: true,
            });
            //this would also work
            //expect(cookie.submitted);
        });
});
