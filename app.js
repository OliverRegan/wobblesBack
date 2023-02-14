// Init dependencies
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser')
const cors = require('cors');
const authorisation = require("./public/javascripts/authorisation")
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs')

// Create routes
const coachesRouter = require('./routes/coaches');
const lessonsRouter = require('./routes/lessons');
const updatesRouter = require('./routes/updates');
const galleryRouter = require('./routes/gallery');
const usersRouter = require('./routes/users');
const reviewsRouter = require('./routes/reviews');
const bookingsRouter = require('./routes/bookings');
const skatersRouter = require('./routes/skaters');

// Logging
logger.token('req', (req, res) => JSON.stringify(req.headers))
logger.token('res', (req, res) => {
  const headers = {}
  res.getHeaderNames().map(h => headers[h] = res.getHeader(h))
  return JSON.stringify(headers)
})

// Init express app
const app = express();
app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


// Link dependencies and app
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json())



// Link Knex
const options = require('./knex.js');
const knex = require('knex')(options);
app.use((req, res, next) => {
  res.locals.secretKey = "WibbleWobbles"
  req.db = knex
  next()
})

// Link routes
app.use('/coaches', coachesRouter);
app.use('/lessons', lessonsRouter);
app.use('/updates', updatesRouter);
app.use('/gallery', galleryRouter);
app.use('/skaters', authorisation, skatersRouter);
app.use('/users', authorisation, usersRouter);
app.use('/reviews', authorisation, reviewsRouter);
app.use('/bookings', authorisation, bookingsRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  console.log(err.message, err)
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
