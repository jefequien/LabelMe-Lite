var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/labelme', function(req, res, next) {
  res.render('annotator', { title: 'Express' });
});

router.get('/', function(req, res, next) {
  res.redirect('labelme?folder=examples&image=1.jpg');
  // res.render('index', { title: 'Express' });
});

module.exports = router;
