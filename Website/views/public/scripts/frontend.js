/**
 * @author KillerDucks <https://github.com/KillerDucks>
 * @author Juwin Viray
 */

// DNS name of instance, update this when you restart the AWS EC2 instance
const dnsInstanceFE = 'ec2-52-207-221-188.compute-1.amazonaws.com';

// Create WebSocket connection. comment when working locally
const socket = new WebSocket('wss://' + dnsInstanceFE + ':8443');


//FLAG uncomment when working locally
//const socket = new WebSocket('wss://localhost:7070');

// Connection opened
socket.addEventListener('open', function (event) {
    socket.send('Hello Server!');
    console.log("Sent to server");
});

socket.addEventListener('message', function(event) {
    //console.log(event.data);
    let data = JSON.parse(event.data);

    // Initial page setup, fills in meeting ID from DB and meeting code generated from websoeckt server
    if(data.type == "Initial"){
        var elem = document.querySelector('#changeME');
        elem.innerHTML = "Meeting Code: " + data.data
        
        // provides 4 digit meeting code to database
        var meetID = document.getElementById('mtg_id').innerText.split(": ")[1];
        socket.send(JSON.stringify(
            {
                type: "UpdateDB", 
                meetingID: meetID,
                code: data.data
            }
        ));
    }

    // updates webpage based off state request changes sent to webserver
    if(data.type == "EchoRequest"){
        
        var elem = document.querySelector('#state');
        elem.innerHTML = "" + data.state
        console.log("changing")
    }
});