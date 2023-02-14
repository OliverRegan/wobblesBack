var express = require('express');
const multer = require('multer');
const fs = require('fs')
var router = express.Router();

// Image Upload
const imageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/uploads/gallery')
    },
    filename: function (req, file, cb) {
        let filename;
        try {
            if (fs.existsSync("./public/images/uploads/gallery/" + req.body.galleryPictureName)) {
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

router.get('/', function (req, res, next) {

    // Query database
    const queryGallery = req.db.from('gallery').select('*')
    const gallery = []

    // Throw error if there is a query in the URL
    if (Object.keys(req.query).length !== 0) {
        return res.status(400).json({ "error": true, "message": "Invalid query parameters. Query parameters are not permitted." })
    }

    // Put names into array
    queryGallery.then((posts) => {
        // Map into array
        posts.map((postObj) => {
            gallery.push(postObj)
        })
    }).then(() => {
        return res.status(200).json(gallery)
    })
});
router.post('/save', imageUpload.fields([{ name: 'galleryPicture', maxCount: 1 }]), function (req, res, next) {
    const fields = {
        galleryPictureName: req.body.galleryPictureName,
        galleryPicture: req.files.galleryPicture,
        galleryTitle: req.body.galleryTitle,
        galleryDescription: req.body.galleryDescription,
    }
    const savePost = req.body.galleryId ?
        (req.db('gallery').where('galleryId', '=', req.body.galleryId).update(
            fields
        ))
        :
        (req.db.insert(
            fields
        ).into('gallery'))


    if (req.files) {

        savePost.then(() => {
            return res.status(200).json({ message: 'Post has been saved', error: false })
        })


    } else {
        return res.status(400).json({ message: 'Bad request, something must be wrong with the form.', error: 'true' })
    }
})

router.post('/delete', function (req, res, next) {
    console.log(req.body)
    if (!req.body.galleryId) {
        return res.status(400).json({ error: true, message: "Bad request, a gallery must be selected. It's possible something has gone wrong " })
    }

    const deleteGallery = req.db('gallerys').where('galleryId', '=', req.body.galleryId).del()


    deleteGallery.then(() => {
        return res.status(200).json({ message: 'Gallery has been deleted', error: false })
    })
})

module.exports = router;
