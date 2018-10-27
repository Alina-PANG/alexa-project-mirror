/**
 * @author KillerDucks <https://github.com/KillerDucks>
 */
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const bodyParser = require('body-parser');
const express = require('express');
const db_func = require('./database/db_connection.js')

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/views/public/static'));

let clientSockets = [];
 
setInterval(() => {
    //Heartbeat Check code....
}, 5000); // Check Every 5 Seconds 

app.get("/", (req, res) => {
    res.render("public/index");
});

app.post("/create_mtg", (req, res) => {
    sanitizeBody('mtg_name').trim().escape(),
    body('mtg_name').isLength({ min: 1 }).trim().withMessage('Meeting Name Empty.')
    .isAlpha().withMessage('Meeting Name Must Be Alphabet Letters.');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        }
    else {
        db_func.createMtg(req.body.mtg_name);
        res.render("public/mtg", {mtg_name: req.body.mtg_name});
    }
});


app.listen("8080", () => {
    console.log("listening")
});


