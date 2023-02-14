var express = require('express');
const multer = require('multer');
const fs = require('fs')
var router = express.Router();

// Image Upload
const imageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/uploads/lessons')
    },
    filename: function (req, file, cb) {
        let filename;
        try {
            if (fs.existsSync("./public/images/uploads/lessons/" + req.body.lessonPictureName)) {
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

// Get lessons
router.get('/', function (req, res, next) {


    // Query database
    const queryLessons = req.db.from('lessons').join('coaches', 'lessonCoachA', '=', 'coachId')
        .select('lessonId', 'lessonName', "lessonDescription", "lessonCoachA",
            'coachName as coachNameA', 'lessonCoachB', 'lessonDay',
            'lessonTime', 'lessonLocationA', 'lessonLocationB',
            'lessonCapacity', 'lessonPrice', 'lessonPictureName',
            'lessonPicture')
    const lessons = []

    // Throw error if there is a query in the URL
    if (Object.keys(req.query).length !== 0) {
        return res.status(400).json({ "error": true, "message": "Invalid query parameters. Query parameters are not permitted." })
    }

    // Put names into array
    queryLessons.then((lesson) => {
        // Map into array
        lesson.map((lessonObj) => {

            const queryCoachB = req.db.select('coachName', "coachId").from('coaches').where('coachId', '=', lessonObj.lessonCoachB)

            queryCoachB.then((coaches) => {


                coaches.map((coachB) => {
                    // Get second coach name
                    lessonObj['coachId'] = coachB.coachName;
                    lessonObj['coachnameB'] = coachB.coachName;
                })
            })

            let days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];


            // Conver day int to day string
            lessonObj.lessonDay = days[lessonObj.lessonDay - 1]
            lessons.push(lessonObj)
        })
    }).then(() => {
        console.log(lessons)

        return res.status(200).json(lessons)

    })
});

// multer().fields([{ name: 'lessonPicture', maxCount: 1 }])
// Handle update/ new lesson
router.post('/save', imageUpload.fields([{ name: 'lessonPicture', maxCount: 1 }]), function (req, res, next) {
    const fields = {
        lessonPictureName: req.body.lessonPictureName,
        lessonPicture: req.files.lessonPicture,
        lessonName: req.body.lessonName,
        lessonDescription: req.body.lessonDescription,
        lessonCoachA: req.body.lessonCoachA,
        lessonCoachA: req.body.lessonCoachA,
        lessonCoachB: req.body.lessonCoachB === '' ? null : req.body.lessonCoachB,
        lessonDay: req.body.lessonDay,
        lessonTime: req.body.lessonTime,
        lessonLocationA: req.body.lessonLocationA,
        lessonLocationB: req.body.lessonLocationB === '' ? null : req.body.lessonLocationB,
        lessonCapacity: req.body.lessonCapacity,
        lessonPrice: req.body.lessonPrice
    }
    const saveLesson = req.body.lessonId ?
        (req.db('lessons').where('lessonId', '=', req.body.lessonId).update(
            fields
        ))
        :
        (req.db.insert(
            fields
        ).into('lessons'))


    if (req.files) {

        saveLesson.then(() => {
            return res.status(200).json({ message: 'Lesson has been saved', error: false })
        })


    } else {
        return res.status(400).json({ message: 'Bad request, something must be wrong with the form.', error: 'true' })
    }
})

router.post('/delete', function (req, res, next) {
    console.log(req.body)
    if (!req.body.lessonId) {
        return res.status(400).json({ error: true, message: "Bad request, a lesson must be selected. It's possible something has gone wrong " })
    }

    const deleteLesson = req.db('lessons').where('lessonId', '=', req.body.lessonId).del()


    deleteLesson.then(() => {
        return res.status(200).json({ message: 'Lesson has been deleted', error: false })
    })
})

// Get lessons
router.get('/:id', function (req, res, next) {

    // Get id
    const id = req.params.id;

    // Query database
    const queryLessons = req.db.from('lessons').select('*').where("lessonId", '=', id)

    // Throw error if there is a query in the URL
    if (Object.keys(req.query).length !== 0) {
        return res.status(400).json({ "error": true, "message": "Invalid query parameters. Query parameters are not permitted." })
    }

    // Put names into array
    queryLessons.then((lesson) => {
        return res.status(200).json(lesson)
    })


});


module.exports = router;
