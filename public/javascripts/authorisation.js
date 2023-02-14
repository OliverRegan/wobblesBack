const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Authorisation function
// 0 for invalid/unauthorised
// 1 for authorised
// 2 for expired
async function authorise(req, res, next) {

    // Get JWT from request
    const auth = req.headers.authorization
    let token = null
    // If no auth, pass to next function
    if (auth === undefined) {
        res.locals.tokenState = ['noToken', 0, 0]
        next()
        return;
    }

    // Get and split token
    if (auth) {
        // Split 'Bearer' from token itself
        token = auth
    }
    // Check validity of token
    // 0 unauthorised
    // 1 authorised
    // 2 expired/invalid authorisation
    // Send decoded token too
    try {
        // Decode token
        const decodedToken = jwt.verify(token, res.locals.secretKey)
        // If token is expired, catch and return 2
        if (decodedToken.exp < Date.now()) {
            res.locals.tokenState = ['Authorization expired', 2, '']
            next()
            return;
        }
        // Otherwise token is valid - get admin level
        // const queryUserAdmin = req.db.from('users').select('userIsAdmin', 'userIsSuperAdmin').where('userName', '=', decodedToken.username);

        // let adminStatus = 0;

        // queryUserAdmin.then((user) => {
        //     user.map((userObj) => {

        //         // Add 1 for each admin status
        //         console.log('hello');

        //     })
        // })

        res.locals.tokenState = [decodedToken.username, 1, decodedToken]
        next()
        return;

    } catch (e) {
        // Check if unauthorised or if invalid token
        if (auth === undefined) {
            // No auth, unauthorised
            res.locals.tokenState = ['Unauthorised', 0, '']
            next()
            return;
        }
        // Invalid token
        else {
            res.locals.tokenState = ["Authorization header is malformed", 2, '']
            next()
            return
        }

    }

}

module.exports = authorise;