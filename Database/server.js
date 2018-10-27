/**
 * @author KillerDucks <https://github.com/KillerDucks>
 */
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const bodyParser = require('body-parser');
const express = require('express');
const db_func = require('./database/db_connection.js')

const app = express();
app.use(express.static('public'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let clientSockets = [];
 
setInterval(() => {
    //Heartbeat Check code....
}, 5000); // Check Every 5 Seconds 

app.get("/", (req, res) => {
    res.sendFile(`${__dirname}/public/index.html`);
});

// app.get("/create_mtg", (req, res) => {
//     res.sendFile(`${__dirname}/public/mtg.html`);
//     //   res.render('error', {
//     //     data: {},
//     //     errors: {}
//     // })
// });

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
        res.sendFile(`${__dirname}/public/mtg.html`);
    }
});


app.listen("8080", () => {
    console.log("listening")
});


