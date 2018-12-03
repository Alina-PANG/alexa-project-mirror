/**
 * @author Hangzhi Pang
 */
 const { body,validationResult } = require('express-validator/check');
 const fileUpload = require('express-fileupload');
 const { sanitizeBody } = require('express-validator/filter');
 const bodyParser = require('body-parser');
 const express = require('express');

 const db_func = require('./database/db_connection.js')
 const WebSocket = require('ws');
 const fs = require('fs');
 const https = require('https');
 // must install sox for audio processing and transcription
const sox = require('sox');
const child_process = require('child_process');

// DNS name of instance, update this when you restart the AWS EC2 instance
const dnsInstance = 'ec2-52-207-221-188.compute-1.amazonaws.com';


 const app = express();

 app.use(express.json());
 app.use(bodyParser.urlencoded({ extended: true }));
 app.use(bodyParser.json());
 app.set('view engine', 'ejs');
 app.use(express.static(__dirname + '/views/public'));
 // file upload
app.use(fileUpload());
app.use('/audioclips',express.static('audioclips'));

let clientSockets = [];

// use a heartbeat check to close unused sockets
setInterval(() => {
    //Heartbeat Check code....
}, 5000); // Check Every 5 Seconds


// state changer
app.post("/request", (req, res) => {
    //console.log(req.body);
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

//file upload and transcription happens here
app.post('/upload', function(req, res) {
    //console.log(req);
    if(Object.keys(req.files).length == 0) {
        return res.status(400).send('No files were uploaded.');
    }

    // The name of input field
    let sampleFile = req.files.sampleFile;
    let fileName = sampleFile.name;
    let meetingID = fileName.split('_')[0];

    sampleFile.mv('./audioclips/' + fileName, function(err) {
        if(err)
            return res.status(500).send(err);

        res.send('File uploaded!');

        
        // Transcription

        // resample the audio to 16000 bit, single channel wav for the transcription server
        // sox must be installed on the machine as well as the nodejs package sox
        //comment
        
        let tempFileName = fileName.split('_')[0] + 'temp'+ fileName.split('_')[1] ;
        //console.log(tempFileName);
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

        // Speech to text processing
        // Pocketsphinx and Sphinxbase must be install on the ubuntu machine
        var textFileName = fileName.split(".")[0] + '.txt';
        var runCP = child_process.exec('pocketsphinx_continuous -infile ./audioclips/' + tempFileName + ' -logfn /dev/null > ./audioclips/'
            + textFileName, function(error) {
                if(error) {
                    console.log(error.stack);
                    console.log('error code ' + error.code);
                }
        });

        // Delete temp file
        runCP.on('close', function() {
            fs.unlinkSync('./audioclips/' + tempFileName)
        });
       // fs.unlinkSync('./audioclips/' + tempFileName);

        // file is uploaded, push link to DB
        let URL = `https://` + dnsInstance +`:8443/audioclips/${fileName}`;

        //comment
        let txtURL = `https://` + dnsInstance +`:8443/audioclips/${textFileName}`;
        //let txtURL = 'placeholder';
        db_func.createAudio(meetingID, URL, txtURL);

    });
});


//JSON check
function isJSON(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

 // HTTPS turn these off when working locally
 // https variables
 var privateKey = fs.readFileSync('./key.pem');
 var certificate = fs.readFileSync('./cert.pem');
 var credentials = {key: privateKey, cert: certificate};

// httpsServer
var httpsServer = https.createServer(credentials, app);
httpsServer.listen(8443);
// END HTTPS

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


function guidGenerator() {
    var S4 = function() {

        return (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
    };
    return (S4());
}

// Hangzhi Pang
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
