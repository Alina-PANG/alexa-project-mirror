'use strict';
const Alexa = require('alexa-sdk');
const AWS = require('aws-sdk');
const request = require('request');

const APP_ID = 'amzn1.ask.skill.f869513d-3316-442e-ad55-a22c938f4ca1';

const handlers = {
    'LaunchRequest': function () {
        var userId = this.event.session.user.userId;
        var sessionId = this.event.session.sessionId;
        var docClient = new AWS.DynamoDB.DocumentClient();
        var params = {
            TableName: "KnoCap",
            Key:{
                "SessionId": sessionId
            },
            UpdateExpression: "set MeetingId = :m, UserId = :u",
            ExpressionAttributeValues: {
                ":m":"undefined",
                ":u":userId
            }
        };

        docClient.update(params, (() => {
            this.response._addDirective({
           "type": "GameEngine.StartInputHandler",
           "timeout": 30000,
           "recognizers": {
             "button_down_recognizer": {
               "type": "match",
               "fuzzy": false,
               "anchor": "end",
               "pattern": [{
                 "action": "down"
               }]
             },
             "button_up_recognizer": {
               "type": "match",
               "fuzzy": false,
               "anchor": "end",
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
         this.response.speak("welcome to kno cap. please set meeting id");
         this.handler.response.response.shouldEndSession = 'false';
         this.emit(':responseReady');
        }));
    },
    'GameEngine.InputHandlerEvent': function() {

     let gameEngineEvents = this.event.request.events || [];
     for (let i = 0; i < gameEngineEvents.length; i++) {
       switch (gameEngineEvents[i].name) {
         case 'button_down_event':
           this.handler.response.response.shouldEndSession ='false';
           this.emit(':responseReady');
           break;

         case 'button_up_event':
            this.emitWithState("ClipThirtyIntent");
            break;

         case 'timeout':
            this.handler.response.response.shouldEndSession = true;
            this.emitWithState("SilentIntent");
            break;
       }
     }
   },
   'SilentIntent': function () {
    this.response._addDirective({
       "type": "GameEngine.StartInputHandler",
       "timeout": 30000,
       "recognizers": {
         "button_down_recognizer": {
           "type": "match",
           "fuzzy": false,
           "anchor": "end",
           "pattern": [{
             "action": "down"
           }]
         },
         "button_up_recognizer": {
           "type": "match",
           "fuzzy": false,
           "anchor": "end",
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
    this.handler.response.response.shouldEndSession = 'false';
    this.emit(':responseReady');
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':tell', 'set meeting id or clip');
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', 'bye bye, have a nice day');
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', 'bye bye, have a nice day');
    },
    'SetMeetingIdIntent': function () {
        var meetingId = this.event.request.intent.slots.id.value;
        var userId = this.event.session.user.userId;
        var sessionId = this.event.session.sessionId;
        var docClient = new AWS.DynamoDB.DocumentClient();
        var params = {
            TableName: "KnoCap",
            Key:{
                "SessionId": sessionId
            },
            UpdateExpression: "set MeetingId = :m, UserId = :u",
            ExpressionAttributeValues: {
                ":m":meetingId,
                ":u":userId
            }
        };

        docClient.update(params, (() => {
            this.emit(':ask', 'meeting id set to ' + meetingId);
        }));
    },
    'GetMeetingIdIntent': function () {
        var userId = this.event.session.user.userId;
        var sessionId = this.event.session.sessionId;
        var docClient = new AWS.DynamoDB.DocumentClient();
        var params = {
            TableName: "KnoCap",
            Key:{
                "SessionId": sessionId,
            }
        };

        docClient.get(params, ((err, data) => {
            if(data.Item.MeetingId.toString() == "undefined"){
                this.emit(':ask', 'please set your meeting id first');
            } else {
                this.emit(':ask', 'your meeting id is ' + data.Item.MeetingId);
            }
        }));

    },
    'StartRecordingIntent': function () {
        var sessionId = this.event.session.sessionId;
        var docClient = new AWS.DynamoDB.DocumentClient();
        var params = {
            TableName: "KnoCap",
            Key:{
                "SessionId": sessionId,
            }
        };

        docClient.get(params, ((err, data) => {
            if(data.Item.MeetingId.toString() == "undefined"){
                this.emit(':ask', 'please set your meeting id first');
            } else {
              request.post(
                'http://ec2-54-210-24-104.compute-1.amazonaws.com:8080/request',
                { json: { ID: data.Item.MeetingId, state: 'Start' } },
                function (error, response, body) {
                  if (!error && response.statusCode == 200) {
                    console.log(body)
                  }
                });
                this.emit(':ask', 'recording started');
            }
        }));
    },
    'StopRecordingIntent': function () {
      var sessionId = this.event.session.sessionId;
      var docClient = new AWS.DynamoDB.DocumentClient();
      var params = {
          TableName: "KnoCap",
          Key:{
              "SessionId": sessionId,
          }
      };

      docClient.get(params, ((err, data) => {
          if(data.Item.MeetingId.toString() == "undefined"){
              this.emit(':ask', 'please set your meeting id first');
          } else {
            request.post(
              'http://ec2-54-210-24-104.compute-1.amazonaws.com:8080/request',
              { json: { ID: data.Item.MeetingId, state: 'Stop' } },
              function (error, response, body) {
                if (!error && response.statusCode == 200) {
                  console.log(body)
                }
              });
              this.emit(':ask', 'recording stopped');
          }
      }));
    },
    'ClipThirtyIntent': function () {
      var sessionId = this.event.session.sessionId;
      var docClient = new AWS.DynamoDB.DocumentClient();
      var params = {
          TableName: "KnoCap",
          Key:{
              "SessionId": sessionId,
          }
      };

      docClient.get(params, ((err, data) => {
          if(data.Item.MeetingId.toString() == "undefined"){
              this.emit(':ask', 'please set your meeting id first');
          } else {
            request.post(
              'http://ec2-54-210-24-104.compute-1.amazonaws.com:8080/request',
              { json: { ID: data.Item.MeetingId, state: 'Clip30' } },
              function (error, response, body) {
                if (!error && response.statusCode == 200) {
                  console.log(body)
                }
              });
              this.emit(':ask', 'clip 30');
          }
      }));
    },
    'ClipSixtyIntent': function () {
      var sessionId = this.event.session.sessionId;
      var docClient = new AWS.DynamoDB.DocumentClient();
      var params = {
          TableName: "KnoCap",
          Key:{
              "SessionId": sessionId,
          }
      };

      docClient.get(params, ((err, data) => {
          if(data.Item.MeetingId.toString() == "undefined"){
              this.emit(':ask', 'please set your meeting id first');
          } else {
            request.post(
              'http://ec2-54-210-24-104.compute-1.amazonaws.com:8080/request',
              { json: { ID: data.Item.MeetingId, state: 'Clip60' } },
              function (error, response, body) {
                if (!error && response.statusCode == 200) {
                  console.log(body)
                }
              });
              this.emit(':ask', 'clip 60');
          }
      }));
    }
};

exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
