 
exports.createMtg = function (mtg_name){
  const { Pool, Client } = require('pg');
  const moment = require('moment');
  
     const pool = new Pool({
      user: 'alexa_admin',
      host: 'alexainstance.cl7vk3upzn2l.us-east-2.rds.amazonaws.com',
      database: 'Alexa_Recording',
      password: 'infmatx117',
      port: 5432,
    });
   
     var now = moment().format();
     // var formatted = now.format('YYYY-MM-DD HH:mm:ss Z');

     const uuidv1 = require('uuid/v1');
     var mtg_id = uuidv1(); 

     const query = {
      text: 'INSERT INTO meeting(id, mtg_time, name) VALUES($1, $2, $3)',
      values: [mtg_id, now, mtg_name],
    };
    
    pool.query(query, (err, res) => {
      if (err) {
        console.log("error in pool"+err.stack)
      } else {
        console.log("successed in writing data to database")
      }
    });
};




