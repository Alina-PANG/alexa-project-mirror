/**
 * @author KillerDucks <https://github.com/KillerDucks>
 */

const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();

const WebSocket = require('ws');

let clientSockets = [];
 
setInterval(() => {
    //Heartbeat Check code....
}, 5000); // Check Every 5 Seconds 

const wss = new WebSocket.Server({
  port: 7070
});

app.use(express.static('public'));

app.get("/", (req, res) => {
    res.sendFile(`${__dirname}/public/index.html`);
});

// state changer
app.use(express.json());
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

// file upload
app.use(fileUpload());
app.use(express.static('audioclips'));

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

app.listen("8080", () => {
    console.log("listening")
});

// websocket server, on connection generate ID and send display on front end
wss.on('connection', function connection(ws) {
    const id = guidGenerator();
    let tmp = {
        ID: id,
        WebSocket: ws
    };
    clientSockets.push(tmp);
    ws.on('message', function incoming(message) {
      console.log('received: %s', message);
    });
    console.log("connected client")
    ws.send(JSON.stringify(
        {
            type: "Initial", 
            state: null,
            data: id
        }
    ));
    console.log(clientSockets);
});

function guidGenerator() {
    var S4 = function() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4());
}