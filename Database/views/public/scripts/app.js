// set up basic variables for app
//const db_func = require('../../../database/db_connection.js')
// db_func.createAudio(mtg_id, audio_url)
var record = document.querySelector('.record');
var stop = document.querySelector('.stop');
var hold = document.querySelector('.hold');
var clip30 = document.querySelector('.clip30');
var clip60 = document.querySelector('.clip60');
var soundClips = document.querySelector('.sound-clips');
var canvas = document.querySelector('.visualizer');
var mainSection = document.querySelector('.main-controls');
// get meeting id
var meetID = document.getElementById('mtg_id').innerText.split(": ")[1];

// disable stop button while not recording

stop.disabled = true;

// visualiser setup - create web audio api context and canvas

var audioCtx = new (window.AudioContext || webkitAudioContext)();
var canvasCtx = canvas.getContext("2d");

// Convert an AudioBuffer to a Blob using WAVE representation
function bufferToWave(abuffer, len) {
  var numOfChan = abuffer.numberOfChannels,
      length = len * numOfChan * 2 + 44,
      buffer = new ArrayBuffer(length),
      view = new DataView(buffer),
      channels = [], i, sample,
      offset = 0,
      pos = 0;

  // write WAVE header
  setUint32(0x46464952);                         // "RIFF"
  setUint32(length - 8);                         // file length - 8
  setUint32(0x45564157);                         // "WAVE"

  setUint32(0x20746d66);                         // "fmt " chunk
  setUint32(16);                                 // length = 16
  setUint16(1);                                  // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2);                      // block-align
  setUint16(16);                                 // 16-bit (hardcoded in this demo)

  setUint32(0x61746164);                         // "data" - chunk
  setUint32(length - pos - 4);                   // chunk length

  // write interleaved data
  for(i = 0; i < abuffer.numberOfChannels; i++)
    channels.push(abuffer.getChannelData(i));

  while(pos < length) {
    for(i = 0; i < numOfChan; i++) {             // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; // scale to 16-bit signed int
      view.setInt16(pos, sample, true);          // write 16-bit sample
      pos += 2;
    }
    offset++                                     // next source sample
  }

  // create Blob
  return new Blob([buffer], {type: 'audio/wav'});

  function setUint16(data) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}

//main block for doing the audio recording
if (navigator.mediaDevices.getUserMedia) {
  console.log('getUserMedia supported.');

  var constraints = { audio: true };
  var chunks = [];
  // the number of the clip that sessions
  var clipNumber = 1;

  // if we get here it means that we have sound through the device
  var onSuccess = function(stream) {
    var mediaRecorder = new MediaRecorder(stream);
    var recordState = document.querySelector('#state');
    visualize(stream);

    // start recording
    mediaRecorder.start();

    hold.onmousedown = function() {
      recordState.innerHTML = "HoldDown";
    }
    
    hold.onmouseup = function() {
      recordState.innerHTML = "HoldUp";
    }

    clip30.onclick = function() {
      recordState.innerHTML = "Clip30";
    }

    clip60.onclick = function() {
      recordState.innerHTML = "Clip60";
    }

    // observer can be used for an event listener
    var observerOptions = {
      childList: true,
      attributes: true,
      subtree: true
    }

    // event handling
    var observer = new MutationObserver(function(mutations) {
        let state = recordState.innerHTML;
        if(state == "HoldDown") {
          holdDown();
          console.log(state);
        }
        if(state == "HoldUp") {
          // holdUp();
          // changed to clip one hour so we can send to sox processor
          clipSec(3600); 
          console.log(state);
        }
          
        if(state == "Clip30") {
          clipSec(30);
          console.log(state);
        }
        if(state == "Clip60") {
          clipSec(60);
          console.log(state);
        }
    });
    observer.observe(recordState, observerOptions);
   
    // state functions
    
    function clipSec(sec) {
      if(mediaRecorder.state == 'recording'){
        mediaRecorder.stop();

        mediaRecorder.onstop = function(e) {
          console.log("data available after MediaRecorder.stop() called.");
    
          //var clipName = prompt('Enter a name for your sound clip?','My unnamed clip');
          var clipName = 'clip'+ clipNumber++;
          console.log(clipName);
          var clipContainer = document.createElement('article');
          var clipLabel = document.createElement('p');
          var audio = document.createElement('audio');
          var deleteButton = document.createElement('button');
         
          clipContainer.classList.add('clip');
          audio.setAttribute('controls', '');
          deleteButton.textContent = 'Delete';
          deleteButton.className = 'delete';
    
          if(clipName === null) {
            clipLabel.textContent = 'My unnamed clip';
          } else {
            clipLabel.textContent = clipName;
          }
    
          clipContainer.appendChild(audio);
          clipContainer.appendChild(clipLabel);
          clipContainer.appendChild(deleteButton);
          soundClips.appendChild(clipContainer);
    
          audio.controls = true;
          var blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });      
          
          chunks = [];
          // this creates the audio file
          var audioURL = window.URL.createObjectURL(blob);
          
          //clip here
          var audioContext = new AudioContext();
          var analyser = audioContext.createAnalyser();
          var source = audioContext.createBufferSource();
        
          var xhr = new XMLHttpRequest();
          xhr.open('GET', audioURL);
          xhr.responseType = 'arraybuffer';
          xhr.onerror = handleError;
          xhr.onload = function() {
            if (xhr.status === 200) {
              handleBuffer(xhr.response);
            } else {
              console.error(xhr.statusText);
            }
          };
          xhr.send();
        
          function handleError(error) {
            console.error(error);
          }
        
          function handleBuffer(audioData) {
            audioContext.decodeAudioData(audioData, decodeDone);
          }
        
          function decodeDone(buffer) {
            var begin;
            var end;
            if(sec > buffer.duration){
              begin = 0;
              end = buffer.duration * 1000;
            } else {
              var secConvert = sec * 1000;
              begin = buffer.duration * 1000 - secConvert;
              end = buffer.duration * 1000;
            }
         
    
            audioBufferSlice(buffer, begin, end, function(error, slicedAudioBuffer) {
              if (error) {
                console.error(error);
              } else {
                source.buffer = slicedAudioBuffer;
    
                var wavBlob = bufferToWave(source.buffer, source.buffer.length)
                var newWav = new File([wavBlob], meetID + '_' + clipName + '.wav');
                var formData = new FormData();
                formData.append('sampleFile', newWav);

                var request = new XMLHttpRequest();
                request.open('POST', 'http://localhost:8080/upload');
                request.send(formData);
    
                var newAudioURL = window.URL.createObjectURL(newWav);
    
        
                audio.src = newAudioURL;
              }

              deleteButton.onclick = function(e) {
                evtTgt = e.target;
                evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
              }
        
              clipLabel.onclick = function() {
                var existingName = clipLabel.textContent;
                var newClipName = prompt('Enter a new name for your sound clip?');
                if(newClipName === null) {
                  clipLabel.textContent = existingName;
                } else {
                  clipLabel.textContent = newClipName;
                }
              }
            });
            
          }
        }
      }
      mediaRecorder.start();
      recordState.innerHTML = 'Ready';
    }

    function holdDown(){
      if(mediaRecorder.state == 'recording'){
        mediaRecorder.stop();
        mediaRecorder.onstop = function (e) {
          var blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
          chunks = [];
        }
      }
      mediaRecorder.start();
    }

    function holdUp(){
      mediaRecorder.stop();
      mediaRecorder.onstop = function(e) {
        console.log("data available after MediaRecorder.stop() called.");
  
        //var clipName = prompt('Enter a name for your sound clip?','My unnamed clip');
        var clipName = 'clip'+ clipNumber++;
        console.log(clipName);
        var clipContainer = document.createElement('article');
        var clipLabel = document.createElement('p');
        var audio = document.createElement('audio');
        var deleteButton = document.createElement('button');
       
        clipContainer.classList.add('clip');
        audio.setAttribute('controls', '');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete';
  
        if(clipName === null) {
          clipLabel.textContent = 'My unnamed clip';
        } else {
          clipLabel.textContent = clipName;
        }
  
        clipContainer.appendChild(audio);
        clipContainer.appendChild(clipLabel);
        clipContainer.appendChild(deleteButton);
        soundClips.appendChild(clipContainer);
  
        audio.controls = true;
        var blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
        chunks = [];
        // this creates the audio file
        var audioURL = window.URL.createObjectURL(blob);
        audio.src = audioURL;

        var newOgg = new File([blob], meetID + '_' + clipName + '.wav');
        var formData = new FormData();
        formData.append('sampleFile', newOgg);
                
        var request = new XMLHttpRequest();
        request.open('POST', 'http://localhost:8080/upload');
        request.send(formData);

        deleteButton.onclick = function(e) {
          evtTgt = e.target;
          evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
        }
  
        clipLabel.onclick = function() {
          var existingName = clipLabel.textContent;
          var newClipName = prompt('Enter a new name for your sound clip?');
          if(newClipName === null) {
            clipLabel.textContent = existingName;
          } else {
            clipLabel.textContent = newClipName;
          }
        }
      
      }
      mediaRecorder.start();
      recordState.innerHTML = 'Ready';
    }

    mediaRecorder.ondataavailable = function(e) {
      chunks.push(e.data);
    }
  }

  var onError = function(err) {
    console.log('The following error occured: ' + err);
  }

  navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);

} else {
   console.log('getUserMedia not supported on your browser!');
}


// for oscilator visualization
function visualize(stream) {
  var source = audioCtx.createMediaStreamSource(stream);

  var analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  var bufferLength = analyser.frequencyBinCount;
  var dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);
  //analyser.connect(audioCtx.destination);

  draw()

  function draw() {
    WIDTH = canvas.width
    HEIGHT = canvas.height;

    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    canvasCtx.beginPath();

    var sliceWidth = WIDTH * 1.0 / bufferLength;
    var x = 0;


    for(var i = 0; i < bufferLength; i++) {
 
      var v = dataArray[i] / 128.0;
      var y = v * HEIGHT/2;

      if(i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height/2);
    canvasCtx.stroke();

  }
}

window.onresize = function() {
  canvas.width = mainSection.offsetWidth;
}

window.onresize();