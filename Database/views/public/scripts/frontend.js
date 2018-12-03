/**
 * @author KillerDucks <https://github.com/KillerDucks>
 */

// DNS name of instance, update this when you restart the AWS EC2 instance
const dnsInstanceFE = 'ec2-52-207-221-188.compute-1.amazonaws.com';

// Create WebSocket connection. turn off when working locally
const socket = new WebSocket('wss://' + dnsInstanceFE + ':8443');


//FLAG turn on when working locally
//const socket = new WebSocket('wss://localhost:7070');

// Connection opened
socket.addEventListener('open', function (event) {
    socket.send('Hello Server!');
    console.log("Sent to server");
});

socket.addEventListener('message', function(event) {
    console.log(event.data);
    let data = JSON.parse(event.data);
    if(data.type == "Initial"){
        var elem = document.querySelector('#changeME');
        var html = elem.innerHTML;
        elem.innerHTML = "Meeting ID: " + data.data
        
        console.log("update the code")
        // update DB
        var meetID = document.getElementById('mtg_id').innerText.split(": ")[1];
        socket.send(JSON.stringify(
            {
                type: "UpdateDB", 
                meetingID: meetID,
                code: data.data
            }
        ));
        
        console.log("changing");
    }

    if(data.type == "EchoRequest"){
        
        var elem = document.querySelector('#state');
        var html = elem.innerHTML;
        elem.innerHTML = "" + data.state
        console.log("changing")
    }
});