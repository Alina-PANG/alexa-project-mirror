  const { Pool, Client } = require('pg');
   const pool = new Pool({
      user: 'alexa_admin',
      host: 'alexainstance.cl7vk3upzn2l.us-east-2.rds.amazonaws.com',
      database: 'Alexa_Recording',
      password: 'infmatx117',
      port: 5432,
    });

exports.showAllMtg = function(callback){
  const query_show_all_mtg = {
    text: 'SELECT * FROM meeting'
    }

    pool.query(query_show_all_mtg, (err, res) => {
      if (err) {
        console.log("error in pool"+err.stack)
      } else {
        console.log("successed in retrieving all meetings from the Database.")
        // console.log(res);
        callback(res);
      }
    });
}

exports.createMtg = function (mtg_name, callback){
     const moment = require('moment-timezone');
     var now = moment().tz("America/Los_Angeles").format();

     const uuidv1 = require('uuid/v1');
     var mtg_id = uuidv1(); 

     const query_insert_mtg = {
      text: 'INSERT INTO meeting(id, mtg_time, name, user_id, mtg_code) VALUES($1, $2, $3, $4, $5)',
      values: [mtg_id, now, mtg_name, 1, 'test'],
    };
    
    pool.query(query_insert_mtg, (err, res) => {
      if (err) {
        console.log("error in pool"+err.stack)
      } else {
        console.log("successed in inserting meeting with ID: "+mtg_id+", Name: "+mtg_name+" into the Database.")
        callback(mtg_name);
      }
    });
};




