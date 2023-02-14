var express = require('express');
var router = express.Router();


// Get users
router.get('/', function (req, res, next) {



    // Query database
    const queryBookings = req.db.from('bookings').join('users', 'bookingUserId', '=', 'userId').join('lessons', 'bookingLessonId', '=', 'lessonId').select('bookingDate', 'bookingId', 'bookingName', 'bookingTime', 'lessonName', 'userFirstName', 'userLastName')
    const bookings = []

    // Throw error if there is a query in the URL
    if (Object.keys(req.query).length !== 0) {
        return res.status(400).json({ "error": true, "message": "Invalid query parameters. Query parameters are not permitted." })
    }

    // Put names into array
    queryBookings.then((booking) => {
        // Map into array
        booking.map((bookingObj) => {
            bookings.push(bookingObj)
        })
    }).then(() => {
        return res.status(200).json(bookings)
    })
});

// Get number of bookings for lesson ID
router.post('/numbers/:id', function (req, res, next) {

    // // Test authentication
    if (!req.headers.authorization) {
        return res.status(400).json({
            "error": true,
            "message": "Request header incomplete, authorization required"
        })
    }
    // Build query
    const queryBookings = req.db.from('bookings').select('bookingDate').where('bookingLessonId', '=', req.params.id).where('bookingTime', '=', req.body.time).where('bookingDate', '=', req.body.date)

    queryBookings.then(bookings => {
        return res.status(200).json({ 'error': false, 'bookings': bookings.length })
    }).catch(error => {
        return res.status(400).json({ 'error': true, 'message': error })
    })

});

// Post bookings
router.post('/:id', function (req, res, next) {
    // // Test authentication
    if (!req.headers.authorization) {
        return res.status(400).json({
            "error": true,
            "message": "Request header incomplete, authorization required"
        })
    }
    const username = res.locals.tokenState[0]

    const data = req.body;
    console.log(data)

    // // Build queries
    const queryBookings = req.db.from('bookings').select('*').where('bookingTime', '=', data.time).andWhere('bookingDate', '=', data.date)
    const queryLessons = req.db.from('lessons').select('lessonCapacity').where("lessonId", '=', req.params.id)
    const queryUsers = req.db.from('users').select('userId').where('userName', '=', data.user)

    // Throw error if there is a query in the URL
    if (Object.keys(req.query).length !== 0) {
        return res.status(400).json({ "error": true, "message": "Invalid query parameters. Query parameters are not permitted." })
    }


    // Check authorization and respond accordingly
    // If 1 then they are authorized
    if (res.locals.tokenState[1] === 1) {

        // Query bookings to see number of bookings
        queryBookings.then(bookings => {
            // cHECK TO MAKE SURE BOOKINGS HAVEN'T ALREADY BEEN MADE
            for (let i = 0; i < bookings.length; i++) {
                for (let j = 0; j < JSON.parse(data.skaters).length; j++) {


                    console.log(JSON.parse(data.skaters)[j])
                    if (bookings[i].bookingName == JSON.parse(data.skaters)[j]) {
                        // Cannot book, return error
                        return res.status(406).json({ 'error': true, 'message': "One of these skaters is already booked into this lesson" })
                    }
                }
            }
            // Get number of bookings
            let numBookings = bookings.length;
            // Query users
            queryUsers.then(user => {
                // Query lessons for the lesson capacity
                queryLessons.then(lesson => {

                    console.log(lesson[0])
                    // If number of bookings exceeds capacity, then return error
                    if (numBookings >= lesson[0].lessonCapacity) {
                        return res.status(400).json({ "error": true, "message": "lesson is already at maximum capacity" })
                    } else {
                        // Else continue with booking
                        // counter for number of inserts
                        let count = 0;
                        // Build insert query within loop
                        for (let i = 0; i < JSON.parse(data.skaters).length; i++) {
                            const insertBooking = req.db.insert({ 'bookingName': JSON.parse(data.skaters)[i], 'bookingUserId': user[0].userId, 'bookingLessonId': req.params.id, 'bookingTime': data.time, 'bookingDate': data.date }).into('bookings')
                            insertBooking.then(() => {
                                count += 1;
                            })
                        }
                        if (count = JSON.parse(data.skaters).length) {
                            return res.status(200).json({ 'error': false, 'message': 'Bookings made' })
                        }
                    }
                })
            })

        })
    } else {
        return res.status(403).json({ "error": true, "message": "Unauthorized" })
    }

});

module.exports = router;
