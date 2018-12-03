var express = require('express')
const db_func = require('../../database/db_connection.js')
var router = express.Router()

// // middleware that is specific to this router
// router.use(function timeLog (req, res, next) {
//   console.log('Time: ', Date.now())
//   next()
// })
// define the home page route
 router.get("/show_all_mtg", (req, res) => {
    let render_mtgs = function(mtgs){
        res.render("public/all_mtg", {meetings: mtgs});
    }
    db_func.showAllMtg(render_mtgs);
});

 router.post("/create_mtg", (req, res) => {
    sanitizeBody('mtg_name').trim().escape(),
    body('mtg_name').isLength({ min: 1 }).trim().withMessage('Meeting Name Empty.')
    .isAlpha().withMessage('Meeting Name Must Be Alphabet Letters.');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(__dirname+": "+errors);
    }
    else {
        console.log(__dirname+': Saving meeting name to DB...')
        let render_mtg_name = function (mtg_name, mtg_id){
            res.render("public/mtg", {mtg_name: mtg_name, mtg_id:mtg_id});
        }
        db_func.createMtg(req.body.mtg_name, req.body.mtg_code, render_mtg_name);
    }
});
module.exports = router