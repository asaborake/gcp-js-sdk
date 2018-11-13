const
 express = require('express'),
 createError = require('http-errors'),
 path = require('path'),
 cookieParser = require('cookie-parser'),
 logger = require('morgan'),
 cors = require('cors'),
 collectRouter = require('./routes/collect'),
 apiRouter = require('./routes/api'),
 functionName = process.env.FUNCTION_NAME;

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/collect', function(req, res, next){
  let hostname = req.query.hostname;
  hostname.match(/.*raksul\.com/i) === null ? res.send(400) : next();
}, collectRouter);
app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports[functionName] = app;
