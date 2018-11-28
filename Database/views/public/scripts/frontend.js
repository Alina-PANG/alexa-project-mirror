/**
 * @author KillerDucks <https://github.com/KillerDucks>
 */

// Create WebSocket connection.
const socket = new WebSocket('ws://ec2-54-210-24-104.compute-1.amazonaws.com:7070');

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