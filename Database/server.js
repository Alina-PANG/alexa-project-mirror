/**
 * @author Hangzhi Pang
 */
 const { body,validationResult } = require('express-validator/check');
 const { sanitizeBody } = require('express-validator/filter');
 const bodyParser = require('body-parser');
 const express = require('express');
 const app = express();
 const db_func = require('./database/db_connection.js')

 app.use(express.json());
 app.use(bodyParser.urlencoded({ extended: true }));
 app.use(bodyParser.json());
 app.set('view engine', 'ejs');
 app.use(express.static(__dirname + '/views/public'));

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
        console.log('Saving meeting name to DB...')
        let render_mtg_name = function (mtg_name){
            res.render("public/mtg", {mtg_name: mtg_name});
        }
        db_func.createMtg(req.body.mtg_name, req.body.mtg_code, render_mtg_name);
    }
});

 app.get("/show_all_mtg", (req, res) => {
    let render_mtgs = function(mtgs){
        res.render("public/all_mtg", {meetings: mtgs});
    }
    db_func.showAllMtg(render_mtgs);
});

app.post('/show_audios', (req, res) => {
    let render_audios = function(mtg_id, audios){
        res.render("public/audios", {mtg_id: mtg_id, audios: audios});
    }
    db_func.showAllAudio(req.body.mtg_id, render_audios);
});


 app.listen("8080", () => {
    console.log("listening")
});


