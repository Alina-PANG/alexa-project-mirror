/**
* @author Hangzhi Pang
*/

  const { Pool, Client } = require('pg');
   const pool = new Pool({
      user: 'alexa_admin',
      host: 'alexainstance.cl7vk3upzn2l.us-east-2.rds.amazonaws.com',
      database: 'Alexa_Recording',
      password: 'infmatx117',
      port: 5432,
    });


exports.deleteAudio = function(audio_id, callback){
  const query_cancel_mtg = {
    text: "DELETE FROM recorded_audio WHERE id= '"+audio_id+"';"
  };
    pool.query(query_cancel_mtg, (err, res) => {
      if (err) {
        console.log(__dirname+": error in pool: "+err.stack)
      } else {
        console.log(__dirname+": successed in deleting audio with ID "+audio_id+".")
        callback(res);
      }
    });
}

exports.showAllMtg = function(callback) {
  const query_show_all_mtg = {
    text: "SELECT id, mtg_code, name, TO_CHAR(mtg_time AT TIME ZONE 'PST', 'Mon DD, YYYY|HH24:MI') mtg_timing FROM meeting ORDER BY mtg_time DESC;"
    }

    pool.query(query_show_all_mtg, (err, res) => {
      if (err) {
        console.log(__dirname+": error in pool"+err.stack)
      } else {
        console.log(__dirname+": successed in retrieving all meetings from the Database.")
        // console.log(res);
        callback(res);
      }
    });
}

exports.createAudio = function(mtg_id, audio_url, text_url){
  const query_insert_audio = {
    text: 'INSERT INTO recorded_audio(mtg_id, audio_url, text_url) VALUES($1, $2, $3)',
    values: [mtg_id, audio_url, text_url]
  };
    pool.query(query_insert_audio, (err, res) => {
      if (err) {
        console.log(__dirname+": error in pool"+err.stack)
      } else {
        console.log(__dirname+": successed in inserting audio with url: "+audio_url+" into the Database.")
        // callback(audio_url);
      }
    });
}

exports.cancelMtg = function(mtg_id, callback){
  const query_cancel_mtg = {
    text: "DELETE FROM meeting WHERE id= '"+mtg_id+"';"
  };
    pool.query(query_cancel_mtg, (err, res) => {
      if (err) {
        console.log(__dirname+": error in pool: "+err.stack)
      } else {
        console.log(__dirname+": successed in deleting meeting with ID "+mtg_id+".")
        callback(res);
      }
    });
}

exports.showAllAudio = function(mtg_id, callback){
  const query_show_all_audio = {
    text: "SELECT * FROM recorded_audio WHERE mtg_id= '"+mtg_id+"';"
  };
    pool.query(query_show_all_audio, (err, res) => {
      if (err) {
        console.log(__dirname+": error in pool"+err.stack)
      } else {
        console.log(__dirname+": successed in retrieving audios from the Database.")
        callback(res);
      }
    });
}

exports.createMtg = function (mtg_name, mtg_code, callback){
     const moment = require('moment');
     var now = moment().format();

     const uuidv1 = require('uuid/v1');
     var mtg_id = uuidv1();

     const query_insert_mtg = {
      text: 'INSERT INTO meeting(id, mtg_time, name, mtg_code) VALUES($1, $2, $3, $4)',
      values: [mtg_id, now, mtg_name, mtg_code],
    };

    pool.query(query_insert_mtg, (err, res) => {
      if (err) {
        console.log(__dirname+": error in pool"+err.stack)
      } else {
        console.log(__dirname+": successed in inserting meeting with ID: "+mtg_id+", Name: "+mtg_name+", code: "+mtg_code+" into the Database.")
        callback(mtg_name, mtg_id, mtg_code);
      }
    });
};

// Juwin
exports.editMtgCode = function(mtg_id, mtg_code) {
  const query_edit_code = {
    text: "UPDATE meeting SET mtg_code = '"+mtg_code+"' WHERE id= '"+mtg_id+"';",
    //text: 'INSERT INTO meeting(mtg_id, mtg_code) VALUES($1, $2)',
    //values: [mtg_id, mtg_code],
  };
    pool.query(query_edit_code, (err, res) => {
      if (err) {
        console.log(__dirname+": error in pool"+err.stack)
      } else {
        console.log(__dirname+": successed in code with url: "+mtg_code+" into the Database.")
      }
    });

}
