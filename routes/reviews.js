var express = require('express');
var router = express.Router();

// Get reviews
router.get('/', function (req, res, next) {

    // Query database
    const queryReviews = req.db.from('reviews').select()
    const queryUsers = req.db.from('users').select('userName', 'userId')
    const reviews = []
    const users = []

    // Throw error if there is a query in the URL
    if (Object.keys(req.query).length !== 0) {
        return res.status(400).json({ "error": true, "message": "Invalid query parameters. Query parameters are not permitted." })
    }

    queryUsers.then((userData) => {
        userData.map((user) => {
            users.push(user)
        })
    })

    queryReviews.then((review) => {
        // Map into array
        review.map((reviewObj) => {
            let rev = reviewObj
            // Find username
            users.forEach(user => {
                if (reviewObj.reviewUserId == user.userId) {
                    rev["reviewUserName"] = user.userName
                }
            });
            // Push review to array
            reviews.push(rev)
        })

    }).then(() => {
        console.log(reviews)
        return res.status(200).json(reviews)
    })
});


// Post lessons
router.post('/', function (req, res) {

    console.log(req.headers)

    // Check for erros
    if (!req.body.user || !req.body.bodyText || !req.body.stars) {
        return res.status(400).json({
            "error": true,
            "message": "Request body missing data"
        })
    }

    // get data
    const text = req.body.bodyText;
    const starNum = req.body.stars;
    const userId = req.body.userId;

    const getUsers = req.db.select('*').from('users').where('userName', '=', req.body.user)

    // Get date
    const date = new Date();
    let dateString = date.toISOString().split('T')[0];


    // Define stuff

    getUsers.then((users) => {

        let user = users[0]

        const insertReview = req.db.insert({ "reviewUserId": user.userId, "reviewStars": starNum, "reviewText": text, "reviewDate": dateString }).into('reviews')


        insertReview.then(() => {
            return res.status(201).json({ "message": "Review Created" })
        })
    })



});

router.post('/delete', function (req, res, next) {
    if (!req.body.reviewId) {
        return res.status(400).json({ error: true, message: "Bad request, a coach must be selected. It's possible something has gone wrong " })
    }

    const deleteReview = req.db('reviews').where('reviewId', '=', req.body.reviewId).del()


    deleteReview.then(() => {
        return res.status(200).json({ message: 'Review has been deleted', error: false })
    })
})

module.exports = router;