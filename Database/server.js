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
        console.log(__dirname+": "+errors);
    }
    else {
        console.log(__dirname+': Saving meeting name to DB...')
        let render_mtg_name = function (mtg_name, mtg_id){
            res.render("public/mtg", {mtg_name: mtg_name, mtg_id:mtg_id});
        }
        db_func.createMtg(req.body.mtg_name, req.body.mtg_code, render_mtg_name);
    }
});

app.post("/:mtg_id/create_audio", (req, res) => {
    let create_audio = function (audio_url){
        // res.render("public/mtg", {audio_url: audio_url});
    }
    console.log(__dirname+': Saving audio name to DB with mtg_id '+ req.params.mtg_id+' ...')
    db_func.createAudio(req.params.mtg_id, req.body.audio_url, create_audio);
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
    console.log(__dirname+": Listening on localhost 8080...")
});


