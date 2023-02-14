var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
var nodemailer = require('nodemailer')


// Get users
router.get('/', function (req, res, next) {

  // Query database
  const queryUsers = req.db.from('users').select('userId', 'userName', 'userEmail', 'userContact', 'userFirstName', 'userLastName',)
  const users = []

  // Throw error if there is a query in the URL
  if (Object.keys(req.query).length !== 0) {
    return res.status(400).json({ "error": true, "message": "Invalid query parameters. Query parameters are not permitted." })
  }

  // Put names into array
  queryUsers.then((user) => {
    // Map into array
    user.map((userObj) => {
      users.push(userObj)
    })
  }).then(() => {
    return res.status(200).json(users)
  })
});


// Signup
router.post('/signup', function (req, res, next) {

  // Test request params
  if (!req.body.username || !req.body.firstName || !req.body.lastName || !req.body.contact || !req.body.email || !req.body.password) {
    return res.status(400).json({
      "error": true,
      "message": "Request body incomplete, username, contact, email and password are required"
    })
  }

  // Otherwise assign variables from request body
  const username = req.body.username;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  const contact = req.body.contact;

  // Salt password for security
  const saltRounds = 10;
  const hash = bcrypt.hashSync(req.body.password, saltRounds);

  // prep db query for users and to insert user
  const queryUsers = req.db.from('users').select('*').where("userName", "=", username)
  const insertUser = req.db.insert({ 'userName': username, 'userFirstName': firstName, 'userLastName': lastName, 'userContact': contact, "userEmail": email, "userPassword": hash }).into('users')

  // Throw error if there is a query in the URL
  // if (Object.keys(req.query).length !== 0) {
  //   return res.status(400).json({ "error": true, "message": "Invalid query parameters. Query parameters are not permitted." })
  // }

  console.log(req.body)

  queryUsers.then((users) => {
    // If user does not exist insert user
    if (users.length === 0) {
      insertUser.then(() => {
        return res.status(201).json({ "message": "User created" })
      })
    }
    // User already exists, throw error
    else {
      return res.status(409).json({
        "error": true,
        "message": "User already exists"
      })
    }
  }).then(() => {
    console.log("Successfully inserted user")
  })


});
// Get updates
router.post('/login', function (req, res, next) {

  // Test request params
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({
      "error": true,
      "message": "Request body incomplete, username and password are required"
    })
  }

  // Otherwise assign variables from request body
  const username = req.body.username;

  // Salt password for security
  const saltRounds = 10;
  const hash = bcrypt.hashSync(req.body.password, saltRounds);

  // prep db query for users and to insert user
  const queryUsers = req.db.from('users').select('*').where("userName", "=", username)

  queryUsers.then((users) => {
    // If user does not exist insert user
    if (users.length === 0) {
      return res.status(409).json({
        "error": true,
        "message": "User doesn't exists"
      })
    }
    // User exists, test if passwords are the same
    else {
      const user = users[0];
      let match = bcrypt.compare(req.body.password, user.userPassword)
      match.then((match) => {
        // if no match
        if (!match) {
          console.log("Passwords don't match");
          return res.status(401).json({
            "error": true,
            "message": "Incorrect username or password"
          })
        }

        // else passwords match
        const expires_in = 60 * 60 * 24;
        const exp = Date.now() + expires_in * 1000
        const token = jwt.sign({ username, exp }, res.locals.secretKey)

        console.log(user.userIsAdmin === 1, user.userIsSuperAdmin === 1)
        return res.status(200).json({ token_type: "Bearer", token, expires_in, messsage: "Successfully logged in", isAdmin: (user.userIsAdmin === 1), isSuperAdmin: (user.userIsSuperAdmin === 1) })
      })
    }
  }).then(() => {
    console.log("Successfully inserted user")
  })


});
// Get updates
router.post('/changePassword', function (req, res, next) {

  // Test request params
  if (!req.body.username || !req.body.email) {
    return res.status(400).json({
      "error": true,
      "message": "Request body incomplete, username and email are required"
    })
  }

  // Otherwise assign variables from request body
  const username = req.body.username;
  const email = req.body.email;
  // prep db query for users and to insert user
  const queryUsers = req.db.from('users').select('*').where("userName", "=", username)

  queryUsers.then((users) => {
    // If user does not exist insert user
    if (users.length === 0) {
      return res.status(409).json({
        "error": true,
        "message": "User doesn't exists"
      })
    }
    // User exists, test if emails are the same
    else {
      const user = users[0];

      if (user.userName === username && user.userEmail === email) {
        // Create transporter for email, insert code into DB
        let transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'wobblywheelsreset@gmail.com',
            pass: 'cgctxhfiuicogsuo'
          }
        })

        // Create reset code (6 digit)
        let code = Math.floor(100000 + Math.random() * 900000)
        console.log(code)

        // Reset code needs to be saved in db table with user creds
        // Check if already code for that username, delete it and ensure only one in there
        // Create queries
        // Delete all previous entried where username is the same
        const deletePrevious = req.db('passwordreset').where('userName', '=', username).del('*')
        // Insert code into db
        const allocateCode = req.db.insert({ 'resetCode': code, 'userName': username, "userEmail": email }).into('passwordreset')


        deletePrevious.then(() => {

          // Insert code then send mail
          allocateCode.then(() => {

            // Create email 
            let mailOptions = {
              from: 'wobblywheelsreset@gmail.com',
              to: 'ollieregan1@gmail.com',
              subject: 'Password Reset',
              html: `<div>
            <h1>${code}</h1>
            <h4><a href='http://localhost:3000/changePassword/code'>Click here to reset your password</a></h4>
            </div>`
            }

            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                console.log(error);
                return res.status(400).json({ error: true, message: info.response })
              } else {
                console.log('Email Sent: ' + info.response)
                return res.status(200).json({ error: false, message: 'Password reset message has been sent' })
              }
            })


          }).catch(() => {
            return res.status(400).json({ error: true, message: 'Serverside error inputing password reset code' })

          })
        })

      } else {
        // details dont match
        return res.status(401).json({
          "error": true,
          "message": "Username and email address do not match"
        })
      }
    }
  }).then(() => {
    console.log("Successfully reset password")
  })


});
// Get password code and send auth
router.post('/changePassword/code', function (req, res, next) {

  // Test request params
  if (!req.body.username || !req.body.email) {
    return res.status(400).json({
      "error": true,
      "message": "Request body incomplete, username, email and code are required"
    })
  }

  // Otherwise assign variables from request body
  const username = req.body.username;
  const email = req.body.email;
  const code = req.body.code;
  // prep db query for users and to insert user
  const queryChangePassword = req.db.from('passwordreset').select('*').where("userName", "=", username)

  queryChangePassword.then((details) => {
    // If user does not exist insert user
    if (details.length === 0) {
      return res.status(409).json({
        "error": true,
        "message": "Entry doesn't exists"
      })
    }
    // User exists, test if emails are the same
    else {
      const detail = details[0];

      if (detail.userName == username && detail.userEmail == email && detail.resetCode == code) {

        // Send back confirmation that details are correct and code is correct
        return res.status(200).json({ error: false, message: 'Details match the entry, authorized to change password', details: req.body })

      } else {
        // details dont match
        return res.status(401).json({
          "error": true,
          "message": "Details don't match"
        })
      }
    }
  }).then(() => {
    console.log("Successfully validated")
  })


});
// Handle reset of password
router.post('/changePassword/change', function (req, res, next) {

  // Test request params
  if (!req.body.password || req.body.details == {}) {
    return res.status(400).json({
      "error": true,
      "message": "Request body incomplete need a password"
    })
  }

  // Otherwise assign variables from request body
  const details = req.body.details


  // Salt password for security
  const saltRounds = 10;
  const hash = bcrypt.hashSync(req.body.password, saltRounds);

  // prep db query for users and to insert user
  const queryChangePassword = req.db('users').where("userName", "=", details.username).update({ 'userPassword': hash })

  // Prep checking query
  const checkCode = req.db.from('passwordreset').select('*').where('userName', '=', details.username)

  // Check if details are still in table
  checkCode.then(detailList => {

    let tableDetail = detailList[0]
    console.log(tableDetail, details)

    // Check details match
    if (details.username == tableDetail.userName && details.email == tableDetail.userEmail && details.code == tableDetail.resetCode) {

      // details match, reset password

      queryChangePassword.then(() => {

        // If all good send good resolution
        return res.status(200).json({ 'error': false, 'message': 'Password has been changed' })

      }).catch(() => {
        return res.status(500).json({ 'error': true, 'message': 'Server side error resetting your password. Please get in touch if this happens again' })
      })

    } else {

      return res.status(400).json({ 'error': true, 'message': 'Details do not match, cannot reset password' })

    }


  }).then(() => {
    console.log("Successfully validated")
  })


});
// Get Profile
router.get('/profile', function (req, res, next) {

  const jwt = req.headers.authorization;
  const username = res.locals.tokenState[0]

  // Check authorization and respond accordingly
  // If 1 then they are authorized
  if (res.locals.tokenState[1] === 1) {
    // prep db query for users and to insert user
    const queryUsers = req.db.from('users').select('*').where("userName", "=", username)
    queryUsers.then((users) => {
      // If user does not exist insert user
      if (users.length === 0) {
        return res.status(409).json({
          "error": true,
          "message": "User doesn't exist"
        })
      }
      // User exists, Get data and return
      else {

        const user = users[0];

        const querySkaters = req.db.from('skaters').select('*').where("skaterAssociatedUserId", '=', user.userId)

        querySkaters.then((skaters) => {
          console.log(skaters)

          return res.status(200).json({ "username": user.userName, "email": user.userEmail, "contact": user.userContact, "skaters": skaters })

        })

      }
    }).then(() => {
      console.log("Successfully inserted user")
    })
  } else {
    return res.status(403).json({ "error": true, "message": "Unauthorized" })
  }

});
// Update Profile
router.post('/profile/update', function (req, res, next) {

  const username = res.locals.tokenState[0]

  // Check authorization and respond accordingly
  // If 1 then they are authorized
  if (res.locals.tokenState[1] === 1) {

    // prep db query for users=
    const queryUsers = req.db.from('users').select('*').where("userName", "=", username)

    queryUsers.then((users) => {
      // Ensure list is not empty
      if (users.length > 0) {

        let type = req.body.type
        let data = req.body.data
        let updateUser;
        // Build query based on data
        if (type === 'username') {
          updateUser = req.db('users').where('userName', '=', username).update({
            userName: data
          })

          // Check to make sure the new username won't be a problem
          const queryNewUserName = req.db.from('users').select('*').where('userName', '=', data);

          queryNewUserName.then((users) => {
            // If user already exists then return 403 status and do nothing
            if (users.length > 0) {
              return res.status(403).json({ 'error': true, 'message': 'A user with that username already exists' })
            } else {
              // Do nothing
            }

          })


        } else if (type === 'email') {
          updateUser = req.db('users').where('userName', '=', username).update({
            userEmail: data
          })
        } else if (type === 'contact') {
          updateUser = req.db('users').where('userName', '=', username).update({
            userContact: data
          })
        }

        // Update data
        updateUser.then(() => {
          // IF ALL IS WELL RETURN 200
          return res.status(200).json({ 'error': false, 'message': 'Profile updated' })
        }).catch((e) => {
          return res.status(400).json({ 'error': true, 'message': e })
        })

      }

    })
  } else {
    return res.status(403).json({ "error": true, "message": "Unauthorized" })
  }

});




// Delete Skater
router.post('/profile/deleteSkater', function (req, res, next) {

  console.log(req.body)

  // Check authorization and respond accordingly
  // If 1 then they are authorized
  if (res.locals.tokenState[1] === 1) {
    console.log(req.body)
    const skater = req.body
    // Build query
    const deleteSkater = req.db.from('skaters').where('skaterId', '=', req.body.skaterId).del();

    // As security, check right profile for skater
    // Build query
    // const checkProfile = req.db.from 
    const checkSkaterProfile = req.db.from('users').select('userId').where('userName', '=', res.locals.tokenState[2].username)

    checkSkaterProfile.then((userId) => {
      // Check skater profile ID matches current user ID
      if (userId[0].userId == skater.skaterAssociatedUserId) {
        // Process
        deleteSkater.then(() => {
          return res.status(200).json({ 'error': false, 'message': 'Skater deleted' })
        })
      } else {
        return res.status(406).json({ 'error': true, 'message': "Sorry that cannot be done at this time" })
      }
    })


  } else {
    return res.status(403).json({ "error": true, "message": "Unauthorized" })
  }

});
// Delete Skater
router.post('/profile/updateSkater', function (req, res, next) {


  // Check authorization and respond accordingly
  // If 1 then they are authorized
  if (res.locals.tokenState[1] === 1) {
    const skater = req.body
    // Build query
    // Fix this+===========================================
    console.log(req.body)
    const updateSkater = req.db('skaters').where('skaterId', '=', req.body.id).update({
      skaterName: skater.firstName,
      skaterLastName: skater.lastName,
      skaterDOB: skater.dob,
      skaterEmergencyContact: skater.contact

    });

    const checkSkaterProfile = req.db.from('users').select('userId').where('userName', '=', res.locals.tokenState[2].username)
    console.log(req.body)

    checkSkaterProfile.then((userId) => {
      // Check skater profile ID matches current user ID
      console.log(skater.skaterAssociatedUserId, userId, res.locals.tokenState[2].username)
      if (userId[0].userId == skater.associatedUserId) {
        // Process
        console.log('get to query')
        console.log(req.body)

        updateSkater.then((skaterstuff) => {
          console.log(skaterstuff)
          return res.status(200).json({ 'error': false, 'message': 'Skater updated' })
        }).catch((e) => { console.log(e) })
      } else {
        return res.status(406).json({ 'error': true, 'message': "Sorry that cannot be done at this time" })
      }
    })


  } else {
    return res.status(403).json({ "error": true, "message": "Unauthorized" })
  }

});


// Get updates
router.post('/profile/addSkater', function (req, res, next) {

  // Test authentication
  if (!req.headers.authorization) {
    return res.status(400).json({
      "error": true,
      "message": "Request header incomplete, authorization required"
    })
  }
  const username = res.locals.tokenState[0]
  // Check authorization and respond accordingly
  // If 1 then they are authorized
  if (res.locals.tokenState[1] === 1) {
    // prep db query for users and to insert user

    const queryUsers = req.db.from('users').select('userId').where("userName", "=", username)


    queryUsers.then((users) => {
      const addSkater = req.db.insert({ 'skaterName': req.body.firstName, 'skaterLastName': req.body.lastName, "skaterDOB": req.body.dob, "skaterAssociatedUserId": users[0].userId, "skaterEmergencyContact": req.body.contact }).into('skaters')


      addSkater.then((skater) => {
        return res.status(200).json({ "error": false, "message": "Skater added successfully" })
      })

    })

  } else {
    return res.status(403).json({ "error": true, "message": "Unauthorized" })
  }

});

// Get skaters
router.get('/getSkaters', function (req, res, next) {

  // Test authentication
  if (!req.headers.authorization) {
    return res.status(400).json({
      "error": true,
      "message": "Request header incomplete, authorization required"
    })
  }
  const username = res.locals.tokenState[0]
  // Check authorization and respond accordingly
  // If 1 then they are authorized
  if (res.locals.tokenState[1] === 1) {
    // prep db query for users and to insert user

    const queryUsers = req.db.from('users').select('userId').where("userName", "=", username)


    queryUsers.then((users) => {
      const getSkaters = req.db.from('skaters').select('*').where('skaterAssociatedUserId', '=', users[0].userId)


      getSkaters.then((skaters) => {
        return res.status(200).json({ "error": false, skaters })
      })

    })

  } else {
    return res.status(403).json({ "error": true, "message": "Unauthorized" })
  }

});

module.exports = router;