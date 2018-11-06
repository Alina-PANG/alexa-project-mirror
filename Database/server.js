/**
 * @author Hangzhi Pang
 */
 const { body,validationResult } = require('express-validator/check');
 const fileUpload = require('express-fileupload');
 const { sanitizeBody } = require('express-validator/filter');
 const bodyParser = require('body-parser');
 const express = require('express');
 const app = express();
 const db_func = require('./database/db_connection.js')
const WebSocket = require('ws');

 app.use(express.json());
 app.use(bodyParser.urlencoded({ extended: true }));
 app.use(bodyParser.json());
 app.set('view engine', 'ejs');
 app.use(express.static(__dirname + '/views/public'));
 // file upload
app.use(fileUpload());
app.use(express.static('audioclips'));

let clientSockets = [];
 
setInterval(() => {
    //Heartbeat Check code....
}, 5000); // Check Every 5 Seconds 

const wss = new WebSocket.Server({
  port: 7070
});

// app.get("/", (req, res) => {
//     res.sendFile(`${__dirname}/public/index.html`);
// });

// state changer
app.post("/request", (req, res) => {
    console.log(req.body);
    clientSockets.forEach((socket) => {
        if(socket.ID == req.body.ID){
            socket.WebSocket.send(JSON.stringify(
                {
                    type: "EchoRequest", 
                    state: req.body.state // Stop, Start, Pause, etc......
                }
            )); // Change this to suit needs
        }
    });
    res.send("OKAY");
});

app.post('/upload', function(req, res) {
    console.log(req);
    if(Object.keys(req.files).length == 0) {
        return res.status(400).send('No files were uploaded.');
    }

    // The name of input field
    let sampleFile = req.files.sampleFile;
    console.log(sampleFile);
    let fileName = sampleFile.name;
    sampleFile.mv('./audioclips/' + fileName, function(err) {
        if(err)
            return res.status(500).send(err);

        res.send('File uploaded!');
    });
});


// // websocket server, on connection generate ID and send display on front end
// wss.on('connection', function connection(ws) {
//     const id = guidGenerator();
//     let tmp = {
//         ID: id,
//         WebSocket: ws
//     };
//     clientSockets.push(tmp);
//     ws.on('message', function incoming(message) {
//       console.log('received: %s', message);
//     });
//     console.log("connected client")
//     ws.send(JSON.stringify(
//         {
//             type: "Initial", 
//             state: null,
//             data: id
//         }
//     ));
//     console.log(clientSockets);
// });

function guidGenerator() {
    var S4 = function() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4());
}

// Hangzhi Pang
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
            res.render("public/mtg_record", {mtg_name: mtg_name, mtg_id:mtg_id});
        }
        db_func.createMtg(req.body.mtg_name, req.body.mtg_code, render_mtg_name);
    }
});

// app.post("/:mtg_id/create_audio", (req, res) => {
//     let create_audio = function (audio_url){
//         // res.render("public/mtg", {audio_url: audio_url});
//     }
//     console.log(__dirname+': Saving audio name to DB with mtg_id '+ req.params.mtg_id+' ...')
//     db_func.createAudio(req.params.mtg_id, req.body.audio_url, create_audio);
// });

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


