var express = require('express');
const multer = require('multer');
const fs = require('fs')
var router = express.Router();


// Image Upload
const imageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/uploads/updates')
    },
    filename: function (req, file, cb) {
        let filename;
        try {
            if (fs.existsSync("./public/images/uploads/updates/" + req.body.updatesPictureName)) {
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

// Get updates
router.get('/', function (req, res, next) {

    // Query database
    const queryUpdates = req.db.from('updates').select('*')
    const updates = []

    // Throw error if there is a query in the URL
    if (Object.keys(req.query).length !== 0) {
        return res.status(400).json({ "error": true, "message": "Invalid query parameters. Query parameters are not permitted." })
    }

    queryUpdates.then((update) => {
        // Map into array
        update.map((updateObj) => {
            updates.push(updateObj)
        })
    }).then(() => {
        return res.status(200).json(updates)
    })
});

router.post('/save', imageUpload.fields([{ name: 'updatePicture', maxCount: 1 }]), function (req, res, next) {
    const fields = {
        updatePictureName: req.body.updatePictureName,
        updatePicture: req.files.updatePicture,
        updateTitle: req.body.updateName,
        updateText: req.body.updateDescription,
        updateBookButton: req.body.updateBookButton
    }
    const saveUpdate = req.body.updateId ?
        (req.db('updates').where('updateId', '=', req.body.updateId).update(
            fields
        ))
        :
        (req.db.insert(
            fields
        ).into('updates'))


    if (req.files) {

        saveUpdate.then(() => {
            return res.status(200).json({ message: 'Update has been saved', error: false })
        })


    } else {
        return res.status(400).json({ message: 'Bad request, something must be wrong with the form.', error: 'true' })
    }
})

router.post('/delete', function (req, res, next) {
    console.log(req.body)
    if (!req.body.updateId) {
        return res.status(400).json({ error: true, message: "Bad request, a update must be selected. It's possible something has gone wrong " })
    }

    const deleteUpdate = req.db('updates').where('updateId', '=', req.body.updateId).del()


    deleteUpdate.then(() => {
        return res.status(200).json({ message: 'Update has been deleted', error: false })
    })
})

module.exports = router;