const express = require("express");
const router = express.Router();

//needs to be required in index.js
router.get("/profile", (req, res) => {
    res.sendStatus(200);
});
