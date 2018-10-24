/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills
 * nodejs skill development kit.
 * This sample supports multiple lauguages. (en-US, en-GB, de-DE).
 * The Intent Schema, Custom Slots and Sample Utterances for this skill, as well
 * as testing instructions are located at https://github.com/alexa/skill-sample-nodejs-fact
 **/

'use strict';
const Alexa = require('alexa-sdk');
const request = require('request');


var APP_ID = "amzn1.ask.skill.ff319860-94a6-4b0e-99d8-08001b6753da";

function buildHandlers(event){
    var handlers = {
        'LaunchRequest': function () {
            this.emit(':tell','I am ready to record');
    
        },
        'MarkImportantIntent': function () {
            this.emit(':tell','It is marked important');
        },
        'StartRecordingIntent': function () {
            // post request comes from here
            request.post(
            'http://ec2-54-227-212-237.compute-1.amazonaws.com:8080/request',
            { json: { ID: 'a42f', state: 'Start' } },
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log(body)
        }
    }
);
            this.emit(':tell','I am starting to record');
        },
        'SetRoomIDIntent': function () {
            const roomID = event.request.intent.slots.RoomID.value;
            // need to store this value so that other commands can post to that room code
            this.emit(':tell','your code is ' + roomID);
        },
        'GetRoomIDIntent': function () {
            //const roomID = event.request.intent.slots.RoomID.value;
            this.emit(':tell','your code is ' + RoomID);
        },
        'AMAZON.HelpIntent': function () {
            // triggered when asking for help
            this.emit(':tell','Hello');
    
        },
        'AMAZON.CancelIntent': function () {
            // triggered when intent cancelled
    
        },
        'AMAZON.StopIntent': function () {
            // triggered when asked to stop
            this.emit(':tell','Voice tracer is closed');
    
        },
    };
    return handlers;
}


exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);
    alexa.appId = APP_ID;
    alexa.registerHandlers(buildHandlers(event));
    alexa.execute();
};
