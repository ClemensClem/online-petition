const spicedPg = require("spiced-pg");
let db;
if (process.env.DATABASE_URL) {
    //this will run if petition is running on heroku
    db = spicedPg(process.env.DATABASE_URL);
} else {
    //this will run if project is running on localhost
    db = spicedPg(
        process.env.DATABASE_URL ||
            "postgres:postgres:postgres@localhost:5432/petition"
    );
}

module.exports.addUser = (firstname, lastname, email, password) => {
    return db.query(
        `INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING id`,
        [firstname, lastname, email, password]
    );
};

module.exports.addSignatures = (signature, userId) => {
    return db.query(
        `INSERT INTO signatures (signature, user_id) VALUES ($1, $2) RETURNING id`,
        [signature, userId]
    );
};

module.exports.addProfile = (age, city, homepage, userId) => {
    return db.query(
        `INSERT INTO user_profiles (age, city, homepage, user_id) VALUES ($1, $2, $3, $4)`,
        [age, city, homepage, userId]
    );
};

module.exports.getAll = (userId) => {
    return db.query(
        `SELECT users.first, users.last, users.email, user_profiles.age, user_profiles.city, user_profiles.homepage
        FROM users
        JOIN user_profiles
        ON users.id = user_profiles.user_id
        WHERE users.id = $1`,
        [userId]
    );
};

module.exports.getPassword = (email) => {
    return db.query(`SELECT password FROM users WHERE email = $1`, [email]);
};

module.exports.getUserId = (email) => {
    return db.query(`SELECT id FROM users WHERE email = $1`, [email]);
};

module.exports.getSigners = () => {
    return db.query(`SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.homepage
    FROM users
    JOIN signatures
    ON users.id = signatures.user_id 
    RIGHT JOIN user_profiles
    ON signatures.user_id = user_profiles.user_id`);
};

module.exports.getSignersByCity = (city) => {
    return db.query(
        `SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.homepage 
    FROM users
    JOIN signatures
    ON users.id = signatures.user_id 
    RIGHT JOIN user_profiles
    ON signatures.user_id = user_profiles.user_id
    WHERE LOWER(user_profiles.city) = LOWER ($1)`,
        [city]
    );
};

module.exports.getSignatureCount = () => {
    return db.query(`SELECT COUNT(*) FROM signatures`);
};

module.exports.getSignature = (userId) => {
    return db.query(`SELECT signature FROM signatures WHERE user_id = $1`, [
        userId,
    ]);
};

module.exports.getSignatureId = (userId) => {
    return db.query(`SELECT id FROM signatures WHERE user_id = $1`, [userId]);
};

module.exports.checkSignature = (userId) => {
    return db.query(
        `SELECT EXISTS(SELECT * FROM signatures WHERE user_id = $1)`,
        [userId]
    );
};

module.exports.checkEMail = (email) => {
    return db.query(`SELECT EXISTS(SELECT * FROM users WHERE email = $1)`, [
        email,
    ]);
};

module.exports.updateUsersWithPassword = (
    userId,
    first,
    last,
    email,
    password
) => {
    return db.query(
        `UPDATE users
        SET first=$2, last=$3, email=$4, password=$5
        WHERE id=$1`,
        [userId, first, last, email, password]
    );
};

module.exports.updateUsers = (userId, first, last, email) => {
    return db.query(
        `UPDATE users
        SET first=$2, last=$3, email=$4
        WHERE id=$1`,
        [userId, first, last, email]
    );
};

module.exports.updateProfile = (userId, age, city, homepage) => {
    return db.query(
        `INSERT INTO user_profiles (user_id, age, city, homepage)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id)
    DO UPDATE SET age=$2, city=$3, homepage=$4`,
        [userId, age, city, homepage]
    );
};

module.exports.deleteSignature = (userId) => {
    return db.query(`DELETE FROM signatures WHERE user_id=$1`, [userId]);
};

module.exports.deleteUser = (userId) => {
    return db.query(`DELETE FROM users WHERE id=$1`, [userId]);
};

module.exports.deleteUserProfile = (userId) => {
    return db.query(`DELETE FROM user_profiles WHERE user_id=$1`, [userId]);
};
