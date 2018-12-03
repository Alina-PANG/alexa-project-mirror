/**
 * @author Hangzhi Pang
 * @author Juwin Viray
 * 
 * This file is the webserver for the knocap project. It processes the http/https requests
 * and perform functions based off different requests
 */

 // node packages related to express webserver
 const { body,validationResult } = require('express-validator/check');
 const fileUpload = require('express-fileupload');
 const { sanitizeBody } = require('express-validator/filter');
 const bodyParser = require('body-parser');
 const express = require('express');

 // object for database manipulation
 const db_func = require('./database/db_connection.js')
 
 // node package for websocket and websocket server
 const WebSocket = require('ws');

 // node package file server (for file operations)
 const fs = require('fs');

 // node package for https
 const https = require('https');

 // node process for SoX (audio processor) and Speech to text
 // must install sox for audio processing and transcription
 // must install pocketsphinx and sphinxbase
 // child_process will run an instance of pocketsphinx on the server
const sox = require('sox');
const child_process = require('child_process');

// DNS name of instance, update this when you restart the AWS EC2 instance
const dnsInstance = 'ec2-52-207-221-188.compute-1.amazonaws.com';

// app setup
const app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/views/public'));

app.use(fileUpload());
app.use('/audioclips',express.static('audioclips'));


 // HTTPS  setup turn these off when working locally
 // https variables
 var privateKey = fs.readFileSync('./key.pem');
 var certificate = fs.readFileSync('./cert.pem');
 var credentials = {key: privateKey, cert: certificate};

// httpsServer
var httpsServer = https.createServer(credentials, app);
httpsServer.listen(8443);
// END HTTPS

// STATE CHANGE REQUEST
// processes state change request from external source (alexa)
app.post("/request", (req, res) => {
    //console.log(req.body);
    clientSockets.forEach((socket) => {
        if(socket.ID == req.body.ID){
            socket.WebSocket.send(JSON.stringify(
                {
                    type: "EchoRequest",
                    state: req.body.state // holddown, holdup, clip30, etc......
                }
            ));
        }
    });
    res.send("OKAY");
});

// UPLOAD REQUEST
// processes an upload request from front end.
// file upload and transcription happens here
app.post('/upload', function(req, res) {
    //console.log(req);
    if(Object.keys(req.files).length == 0) {
        return res.status(400).send('No files were uploaded.');
    }

    // The name of input field
    let sampleFile = req.files.sampleFile;

    // get file name and meeting ID
    let fileName = sampleFile.name;
    let meetingID = fileName.split('_')[0];

    sampleFile.mv('./audioclips/' + fileName, function(err) {
        if(err)
            return res.status(500).send(err);

        res.send('File uploaded!');

        
        // Transcription

        // resample the audio to 16000 bit, single channel wav for the transcription software
        // the transcoded copy is sent to the software and deleted later
        // sox must be installed on the machine as well as the nodejs package sox
        // note: this part must be commented out if attempting to work locally
        
        let tempFileName = fileName.split('_')[0] + 'temp'+ fileName.split('_')[1];

        // transcode happens here
        var job = sox.transcode('./audioclips/' + fileName, './audioclips/' + tempFileName, {
            sampleRate: 16000,
            format: 'wav',
            channelCount: 1,
            bitrate: 16 *1024,
        });

        job.on('error', function(err) {
            console.error(err);
        });

        job.start();

        // Speech to text Processing
        // Pocketsphinx and Sphinxbase must be installed on the ubuntu machine
        
        var textFileName = fileName.split(".")[0] + '.txt';

        // this runs a command line instruction to create a text file from the speech to text software
        var runCP = child_process.exec('pocketsphinx_continuous -infile ./audioclips/' + tempFileName + ' -logfn /dev/null > ./audioclips/'
            + textFileName, function(error) {
                if(error) {
                    console.log(error.stack);
                    console.log('error code ' + error.code);
                }
        });

        // Delete temporary transcoded file
        runCP.on('close', function() {
            fs.unlinkSync('./audioclips/' + tempFileName)
        });

        // file is uploaded, create URL strings
        let URL = `https://` + dnsInstance +`:8443/audioclips/${fileName}`;

        // comment this out if running local host
        let txtURL = `https://` + dnsInstance +`:8443/audioclips/${textFileName}`;
        
        // comment this in if running local host
        //let txtURL = 'placeholder';

        // push link(s) to database
        db_func.createAudio(meetingID, URL, txtURL);

    });
});


//JSON check - helper function
function isJSON(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

// websocket array. When a new socket connects it stores the connection data here
let clientSockets = [];

//TODO: implement heartbeat check
// use a heartbeat check to close unused sockets
/*
setInterval(() => {
    //Heartbeat Check code....
}, 5000); // Check Every 5 Seconds
*/

// Turn this off when working locally
const wss = new WebSocket.Server({
  server: httpsServer
});

/*
//FLAG local host, turn on whern working locally
const wss = new WebSocket.Server({
    port:7070
})
*/

// websocket server, on connection generate ID and send display on front end
wss.on('connection', function connection(ws) {
     const id = guidGenerator();
     let tmp = {
         ID: id,
         WebSocket: ws
     };
     clientSockets.push(tmp);

     ws.on('message', function incoming(message) {
       //console.log('received: %s', message);
       if(isJSON(message)){
           let data = JSON.parse(message);
           if(data.type == 'UpdateDB'){
               db_func.editMtgCode(data.meetingID, data.code);
           }
       }
     });
     console.log("connected client")

     ws.send(JSON.stringify(
         {
             type: "Initial",
             state: null,
             data: id
         }
     ));
     //console.log(clientSockets);
});

// Generates 4 digit code for websocket
function guidGenerator() {
    var S4 = function() {

        return (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
    };
    return (S4());
}

// Hangzhi Pang - Database functions/routing/rendering
 app.get("/", (req, res) => {
    res.render("public/index");
});

 app.get("/about", (req, res) => {
    res.render("public/about");
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
        //console.log(__dirname+': Saving meeting name to DB...')
        let render_mtg_name = function (mtg_name, mtg_id, mtg_code){
            res.render("public/mtg_record", {mtg_name: mtg_name, mtg_id:mtg_id ,mtg_code: mtg_code});
        }
        db_func.createMtg(req.body.mtg_name, req.body.mtg_code, render_mtg_name);
        //db_func.createMtg(req.body.mtg_name, req.body.mtg_code, render_mtg_name);
    }
});

// app.post("/:mtg_id/create_audio", (req, res) => {
//     let create_audio = function (audio_url){
//         // res.render("public/mtg", {audio_url: audio_url});
//     }
//     console.log(__dirname+': Saving audio name to DB with mtg_id '+ req.params.mtg_id+' ...')
//     db_func.createAudio(req.params.mtg_id, req.body.audio_url, create_audio);
// });
app.get("/:mtg_id/files", (req, res) => {
    let render_audios = function(audios){
        res.send(audios);
    }
    db_func.showAllAudio(req.params.mtg_id, render_audios);
})

app.post('/:mtg_id/files/delete/:audio_id', (req, res) => {
  let delete_audio_res = function(){
    res.redirect('/'+req.params.mtg_id+'/files');
  }
  db_func.deleteAudio(req.params.audio_id, delete_audio_res);
})

 app.get("/show_all_mtg", (req, res) => {
    let render_mtgs = function(mtgs){
        res.render("public/all_mtg", {meetings: mtgs});
    }
    db_func.showAllMtg(render_mtgs);
});

app.post("/cancel_mtg/:mtg_id", (req, res) => {
    let delete_mtg = function(){
        res.render("public/index");
    }
    db_func.cancelMtg(req.params.mtg_id, delete_mtg);
});



// app.post('/show_audios', (req, res) => {
//     let render_audios = function(mtg_id, audios){
//         res.render("public/audios", {mtg_id: mtg_id, audios: audios});
//     }
//     db_func.showAllAudio(req.body.mtg_id, render_audios);
// });

 app.listen("8080", () => {
    console.log(__dirname+": Listening on localhost 8080...")
});
