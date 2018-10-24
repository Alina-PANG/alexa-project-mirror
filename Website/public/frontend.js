/**
 * @author KillerDucks <https://github.com/KillerDucks>
 */

// Create WebSocket connection.
// change the host per server address... get DNS or use elastic IP
const socket = new WebSocket('ws://ec2-54-227-212-237.compute-1.amazonaws.com:7070');

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
        elem.innerHTML = "State: " + data.state
        console.log("changing")
    }
});



// Speech Code