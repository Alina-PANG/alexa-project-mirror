'use strict';

const Alexa = require('alexa-sdk');
const http = require('http');

exports.handler = (event, context) => {
    const alexa = Alexa.handler(event, context);
    alexa.appId = '';
    alexa.registerHandlers(main);
    alexa.execute();
};

const main = {
    'LaunchRequest': function() {
        this.attributes.inputHandler_originatingRequestId = this.event.request.requestId;
        this.attributes.meetingId = undefined;

        this.response.speak("Welcome to Kno Cap. Please set your meeting id");
        this.handler.response.response.shouldEndSession = false;

        this.emit(':responseReady');
    },
    'SetMeetingIdIntent': function() {
        if (!isNaN(this.event.request.intent.slots.id.value) && this.event.request.intent.slots.id.value.length == 4 && this.attributes.meetingId === undefined) {
            this.attributes.meetingId = this.event.request.intent.slots.id.value;
            this.response.speak("meeting id set to " + this.attributes.meetingId);
            delete this.handler.response.response.shouldEndSession;
            this.response._addDirective({
                "type": "GameEngine.StartInputHandler",
                "timeout": 90000,
                "recognizers": {
                    "button_down_recognizer": {
                        type: "match",
                        fuzzy: false,
                        anchor: "end",
                        "pattern": [{
                            "action": "down"
                        }]
                    },
                    "button_up_recognizer": {
                        type: "match",
                        fuzzy: false,
                        anchor: "end",
                        "pattern": [{
                            "action": "up"
                        }]
                    }
                },
                "events": {
                    "button_down_event": {
                        "meets": ["button_down_recognizer"],
                        "reports": "matches",
                        "shouldEndInputHandler": false
                    },
                    "button_up_event": {
                        "meets": ["button_up_recognizer"],
                        "reports": "matches",
                        "shouldEndInputHandler": false
                    },
                    "timeout": {
                        "meets": ["timed out"],
                        "reports": "history",
                        "shouldEndInputHandler": true
                    }
                }
            });
            this.emit(':responseReady');
        } else if (this.attributes.meetingId !== undefined) {
            this.response.speak('Click the echo button to save clips from the meeting');
            delete this.handler.response.response.shouldEndSession;
            this.emit(':responseReady');
        } else {
            this.response.speak('Set your meeting id using the four digit code given to you from the kno cap website.');
            this.handler.response.response.shouldEndSession = false;
            this.emit(':responseReady');
        }
    },
    'GameEngine.InputHandlerEvent': function() {
        let gameEngineEvents = this.event.request.events || [];
        for (let i = 0; i < gameEngineEvents.length; i++) {
            switch (gameEngineEvents[i].name) {
                case 'button_down_event':
                    var postData = JSON.stringify({
                        "ID": this.attributes.meetingId,
                        "state": "Clip30"
                    });

                    var options = {
                        hostname: 'ec2-52-207-221-188.compute-1.amazonaws.com',
                        port: 8080,
                        path: '/request',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Content-Length': Buffer.byteLength(postData)
                        }
                    };

                    var req = http.request(options, (res) => {
                        console.log('statusCode:', res.statusCode);
                        console.log('headers:', res.headers);

                        res.on('data', (d) => {
                            process.stdout.write(d);
                        });
                    });

                    req.on('error', (e) => {
                        console.error(e);
                    });

                    req.write(postData);
                    req.end();
                    this.response.speak('Hello ' + this.attributes.meetingId);
                    delete this.handler.response.response.shouldEndSession;
                    this.emit(':responseReady');
                    break;

                case 'button_up_event':
                    delete this.handler.response.response.shouldEndSession;
                    this.emit(':responseReady');
                    break;

                case 'timeout':
                    this.emitWithState("SilentIntent");
                    break;
            }
        }
    },
    'SilentIntent': function() {
        delete this.handler.response.response.shouldEndSession;
        this.response._addDirective({
            "type": "GameEngine.StartInputHandler",
            "timeout": 90000,
            "recognizers": {
                "button_down_recognizer": {
                    type: "match",
                    fuzzy: false,
                    anchor: "end",
                    "pattern": [{
                        "action": "down"
                    }]
                },
                "button_up_recognizer": {
                    type: "match",
                    fuzzy: false,
                    anchor: "end",
                    "pattern": [{
                        "action": "up"
                    }]
                }
            },
            "events": {
                "button_down_event": {
                    "meets": ["button_down_recognizer"],
                    "reports": "matches",
                    "shouldEndInputHandler": false
                },
                "button_up_event": {
                    "meets": ["button_up_recognizer"],
                    "reports": "matches",
                    "shouldEndInputHandler": false
                },
                "timeout": {
                    "meets": ["timed out"],
                    "reports": "history",
                    "shouldEndInputHandler": true
                }
            }
        });
        this.emit(':responseReady');
    },
    'AMAZON.HelpIntent': function() {
        if (this.attributes.meetingId === undefined) {
            this.response.speak('Set your meeting id using the four digit code given to you from the kno cap website.');
            this.handler.response.response.shouldEndSession = false;
            this.emit(':responseReady');
        } else {
            this.response.speak('Click the echo button to save clips from the meeting');
            delete this.handler.response.response.shouldEndSession;
            this.emit(':responseReady');
        }
    },
    'AMAZON.StopIntent': function() {
        this.response.speak('Thank you for using Kno Cap. Goodbye');
        if (this.attributes.inputHandler_originatingRequestId !== undefined) {
            this.response._addDirective(buttonStopInputHandlerDirective(this.attributes.inputHandler_originatingRequestId));
        }
        this.handler.response.response.shouldEndSession = true;
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function() {
        this.response.speak('Thank you for using Kno Cap. Goodbye');
        if (this.attributes.inputHandler_originatingRequestId !== undefined) {
            this.response._addDirective(buttonStopInputHandlerDirective(this.attributes.inputHandler_originatingRequestId));
        }
        this.handler.response.response.shouldEndSession = true;
        this.emit(':responseReady');
    },
    'Unhandled': function() {
        if (this.attributes.meetingId === undefined) {
            this.response.speak('Unhandled. Set your meeting id using the four digit code given to you from the kno cap website.');
            this.handler.response.response.shouldEndSession = false;
            this.emit(':responseReady');
        } else {
            this.response.speak('Click the echo button to save clips from the meeting');
            delete this.handler.response.response.shouldEndSession;
            this.emit(':responseReady');
        }
    }
};

const buttonStopInputHandlerDirective = function(inputHandlerOriginatingRequestId) {
    return {
        "type": "GameEngine.StopInputHandler",
        "originatingRequestId": inputHandlerOriginatingRequestId
    }
};