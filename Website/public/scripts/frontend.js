/**
 * @author KillerDucks <https://github.com/KillerDucks>
 */

// Create WebSocket connection.
const socket = new WebSocket('wss://localhost:8443');

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
        console.log("changing")
    }

    if(data.type == "EchoRequest"){

        var elem = document.querySelector('#state');
        var html = elem.innerHTML;
        elem.innerHTML = "" + data.state
        console.log("changing")
    }
});



// Speech Code
