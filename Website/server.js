/**
 * @author KillerDucks <https://github.com/KillerDucks>
 */

const express = require('express');
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

app.use(express.json());
app.post("/request", (req, res) => {
    console.log(req.body);
    clientSockets.forEach((socket) => {
        console.log('socket ID: ' + socket.ID + ', body.ID: ' + req.body.ID) + '\n';
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
