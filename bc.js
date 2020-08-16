//bcrypt
const bcrypt = require("bcryptjs");
let { genSalt, hash, compare } = bcrypt;
const { promisify } = require("util");

genSalt = promisify(genSalt);
hash = promisify(hash);
compare = promisify(compare);

module.exports.compare = compare;
module.exports.hash = (clearTextPw) =>
    genSalt().then((salt) => hash(clearTextPw, salt));

////////////
//Demo bcrypt
/* genSalt()
    .then((salt) => {
        console.log("salt", salt);
        return hash("superSafe", salt); //takes two arguments clear text pw and salt and combines it
    })
    .then((hashedPw) => {
        console.log("hashedPw", hashedPw);
        return compare("superSafe", hashedPw); //first is PW second is the hasehd pw in the database
    })
    .then((compareMatchValue) => {
        console.log("password match?", compareMatchValue);
    }); */
