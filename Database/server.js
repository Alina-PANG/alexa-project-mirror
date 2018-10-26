  var http = require("http");
  http.createServer(function (request, response) {
     // Send the HTTP header 
     // HTTP Status: 200 : OK
     // Content Type: text/plain
     response.writeHead(200, {'Content-Type': 'text/plain'});

     const { Pool, Client } = require('pg');

     const pool = new Pool({
      user: 'alexa_admin',
      host: 'alexainstance.cl7vk3upzn2l.us-east-2.rds.amazonaws.com',
      database: 'Alexa_Recording',
      password: 'infmatx117',
      port: 5432,
    });

     const moment = require('moment');
     var now = moment();
     var formatted = now.format('YYYY-MM-DD HH:mm:ss Z');

     const uuidv1 = require('uuid/v1');
     var mtg_id = uuidv1(); 

     const query = {
      text: 'INSERT INTO meeting(id, mtg_time, name) VALUES($1, $2, $3)',
      values: [mtg_id, formatted, 'test'],
    };

    pool.query(query, (err, res) => {
      if (err) {
        console.log(err.stack)
      } else {
        console.log(res.rows[0])
      }
    });
     // Send the response body as "Hello World"
     response.end('Hello World\n'+mtg_id);
   }).listen(8080);

  // Console will print the message
  console.log('Server running at http://127.0.0.1:8080/');


