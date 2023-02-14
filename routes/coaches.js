var express = require('express');
const multer = require('multer');
const fs = require('fs')
var router = express.Router();

// Image Upload
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads/coaches')
  },
  filename: function (req, file, cb) {
    let filename;
    try {
      if (fs.existsSync("./public/images/uploads/coaches/" + req.body.coachPictureName)) {
        return res.status(405).json({ error: true, message: "The image name already exists" })
      } else {
        cb(null, file.originalname)
      }
    } catch (e) {
      return res.status(405).json({ error: true, message: "The image name already exists" })
    }


  }
});

const imageUpload = multer({
  storage: imageStorage,
  onFileUploadStart: function (file, req, res) {

  }
})


// Get coaches
router.get('/', function (req, res, next) {

  // Query database
  const queryNames = req.db.from('coaches').select('*')
  const coaches = []

  // Throw error if there is a query in the URL
  if (Object.keys(req.query).length !== 0) {
    return res.status(400).json({ "error": true, "message": "Invalid query parameters. Query parameters are not permitted." })
  }

  // Put names into array
  queryNames.then((names) => {
    // Map into array
    names.map((nameObj) => {
      coaches.push(nameObj)
    })
  }).then(() => {
    return res.status(200).json(coaches)
  })
});

router.get('/:id', function (req, res, next) {

  // Get id
  const id = req.params.id;

  // Query database
  const queryCoaches = req.db.from('coaches').select('*').where("coachId", '=', id)

  // Throw error if there is a query in the URL
  if (Object.keys(req.query).length !== 0) {
    return res.status(400).json({ "error": true, "message": "Invalid query parameters. Query parameters are not permitted." })
  }

  // Put names into array
  queryCoaches.then((coach) => {
    return res.status(200).json(coach)
  })

});

router.post('/save', imageUpload.fields([{ name: 'coachPicture', maxCount: 1 }]), function (req, res, next) {
  const fields = {
    coachPictureName: req.body.coachPictureName,
    coachPicture: req.files.coachPicture,
    coachName: req.body.coachName,
    coachBio: req.body.coachBio,
    coachPosition: req.body.coachPosition,
  }
  const saveCoach = req.body.coachId ?
    (req.db('coaches').where('coachId', '=', req.body.coachId).update(
      fields
    ))
    :
    (req.db.insert(
      fields
    ).into('coaches'))


  if (req.files) {

    saveCoach.then(() => {
      return res.status(200).json({ message: 'Coach has been saved', error: false })
    })


  } else {
    return res.status(400).json({ message: 'Bad request, something must be wrong with the form.', error: 'true' })
  }
})

router.post('/delete', function (req, res, next) {
  console.log(req.body)
  if (!req.body.coachId) {
    return res.status(400).json({ error: true, message: "Bad request, a coach must be selected. It's possible something has gone wrong " })
  }

  const deleteCoach = req.db('coaches').where('coachId', '=', req.body.coachId).del()


  deleteCoach.then(() => {
    return res.status(200).json({ message: 'Coach has been deleted', error: false })
  })
})

module.exports = router;
