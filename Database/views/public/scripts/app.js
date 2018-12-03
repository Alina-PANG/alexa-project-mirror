/**
 * @author Juwin Viray 
 * 
 * audiobuffer-slice
 * @author MiguelMota <https://github.com/miguelmota/audiobuffer-slice>
 * 
 * buffertoWAVE()
 * @author Russel Good <https://www.russellgood.com/how-to-convert-audiobuffer-to-audio-file/
 * 
 * audio recording
 * @author MDN <https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Using_the_MediaStream_Recording_API>
 */

// set up variables for app
var hold = document.querySelector('.hold');
var clip30 = document.querySelector('.clip30');
var clip60 = document.querySelector('.clip60');
var soundClips = document.querySelector('.sound-clips');
var canvas = document.querySelector('.visualizer');
var mainSection = document.querySelector('.main-controls');
var meetID = document.getElementById('mtg_id').innerText.split(": ")[1];

// DNS name of instance, update this when you restart the AWS EC2 instance
const dnsInstanceApp = 'ec2-52-207-221-188.compute-1.amazonaws.com';

// visualiser setup - create web audio api context and canvas
var audioCtx = new (window.AudioContext || webkitAudioContext)();
var canvasCtx = canvas.getContext("2d");

// helper function - Converts an AudioBuffer to a Blob/WAV
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

  // return Blob
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

// RECORDING HAPPENS HERE
// checks to see if it detects and has access to a microphone
if (navigator.mediaDevices.getUserMedia) {
  console.log('getUserMedia supported.');

  var constraints = { audio: true };
  var chunks = [];
  var clipNumber = 1;

  // if we get here it means that we have sound through the device
  var onSuccess = function(stream) {
    var mediaRecorder = new MediaRecorder(stream);
    var recordState = document.querySelector('#state');
    visualize(stream);

    // start recording
    mediaRecorder.start();

    // state changes based off of button input
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

    // event handling, state change calls appropriate function
    var observer = new MutationObserver(function(mutations) {
        let state = recordState.innerHTML;
        if(state == "HoldDown") {
          holdDown();
          console.log(state);
        }
        if(state == "HoldUp") {
          // releasing hold up button will clip up to an hour of sound
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
    
    // clipSec will clip the time in seconds passed in, if the duration of the recording is less than the amount of seconds
    // it will clip the entire buffer
    function clipSec(sec) {
      if(mediaRecorder.state == 'recording'){
        // stop recording
        mediaRecorder.stop();

        // process the chunks
        mediaRecorder.onstop = function(e) {
          console.log("data available after MediaRecorder.stop() called.");
    
          // TODO: possible future implementation to name clips
          //var clipName = prompt('Enter a name for your sound clip?','My unnamed clip');
          var clipName = 'clip'+ clipNumber++;
          
          // create DOM objects for webpage
          var clipContainer = document.createElement('article');
          var clipLabel = document.createElement('p');
          var audio = document.createElement('audio');
          var btnDiv = document.createElement('div');
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
    
          clipContainer.appendChild(clipLabel);
          clipContainer.appendChild(audio)
          clipContainer.appendChild(btnDiv);
          btnDiv.appendChild(deleteButton)
          soundClips.appendChild(clipContainer);
          btnDiv.classList.add('btn-div');
    
          audio.controls = true;
          var blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });      
          
          chunks = [];
          // this creates the audio file from the collected blob
          var audioURL = window.URL.createObjectURL(blob);
          
          //clipping happens here here
          var audioContext = new AudioContext();
          var analyser = audioContext.createAnalyser();
          var source = audioContext.createBufferSource();
        
          //this portion attempts to get the blob and process it, this can be refactored and written out later
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
        
          // this function decodes the audio data into a buffer that can be manipulated
          // this is where we set how long the clip should be
          function decodeDone(buffer) {
            // note: should be in miliseconds
            var begin; // begining of our new sound buffer
            var end; // end of where we want to clip, usually buffer.duration (the end of the buffer)

            // if the amount to clip is longer than duration, clip the entire buffer
            if(sec > buffer.duration){
              begin = 0;
              end = buffer.duration * 1000;
            } else {
              var secConvert = sec * 1000;
              begin = buffer.duration * 1000 - secConvert;
              end = buffer.duration * 1000;
            }
    
            // creates a new buffer that contains only the timeframe we're interested in
            audioBufferSlice(buffer, begin, end, function(error, slicedAudioBuffer) {
              if (error) {
                console.error(error);
              } else {
                // the buffer is now the time-sliced buffer
                source.buffer = slicedAudioBuffer;
    
                // create a new wav file
                var wavBlob = bufferToWave(source.buffer, source.buffer.length)
                var newWav = new File([wavBlob], meetID + '_' + clipName + '.wav');

                // upload the file into the server
                var formData = new FormData();
                formData.append('sampleFile', newWav);

                var request = new XMLHttpRequest();
                request.open('POST', 'https://' + dnsInstanceApp + ':8443/upload');
                request.send(formData);
    
                // update the webpage with the clipped source
                var newAudioURL = window.URL.createObjectURL(newWav);
                audio.src = newAudioURL;
              }

              // This does not delete the file from the server, only deletes the instance on the recording page
              // TODO: future implementation may have this delete file from DB and server
              deleteButton.onclick = function(e) {
                evtTgt = e.target;
                evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
              }
        
              // TODO: future implementation, clip renaming
              /*
              clipLabel.onclick = function() {
                var existingName = clipLabel.textContent;
                var newClipName = prompt('Enter a new name for your sound clip?');
                if(newClipName === null) {
                  clipLabel.textContent = existingName;
                } else {
                  clipLabel.textContent = newClipName;
                }
              }
              */

            });
            
          }
        }
      }

      // restart the recorder and reset the state to Ready
      mediaRecorder.start();
      recordState.innerHTML = 'Ready';
    }

    // clears out old chunk data
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

    // when data is recieved from microphone push into chunks
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