var express = require('express');
var router = express.Router();

// Get lessons
router.get('/', function (req, res, next) {


    // Query database
    const querySkaters = req.db('skaters').join('users', 'skaterAssociatedUserId', '=', 'userId').select('skaterId', 'skaterName', 'skaterLastName', 'skaterEmergencyContact', 'userName')
    const skaterArr = []

    // Throw error if there is a query in the URL
    if (Object.keys(req.query).length !== 0) {
        return res.status(400).json({ "error": true, "message": "Invalid query parameters. Query parameters are not permitted." })
    }



    // Put names into array
    querySkaters.then((skaters) => {
        // Map into array
        skaters.map((skatersObj) => {
            skaterArr.push(skatersObj)
        })

    }).then(() => {

        return res.status(200).json(skaterArr);
    })
});

// Get coaches
router.get('/:id', function (req, res, next) {

    // Get id
    const id = req.params.id;

    // Query database
    const querySkaters = req.db.from('skaters').select('*').where("skaterId", '=', id)

    // Throw error if there is a query in the URL
    if (Object.keys(req.query).length !== 0) {
        return res.status(400).json({ "error": true, "message": "Invalid query parameters. Query parameters are not permitted." })
    }

    // Put names into array
    querySkaters.then((skater) => {
        return res.status(200).json(skater)
    })


});


module.exports = router;
