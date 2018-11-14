var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/tool', function(req, res, next) {
  res.render('tool', { title: 'LabelMe-Lite' });
});

router.get('/amt', function(req, res, next) {
  res.render('amt', { title: 'Express' });
});

router.get('/labelme', function(req, res, next) {
  res.render('labelme', { title: 'LabelMe interface' });
});


router.get('/', function(req, res, next) {
  res.redirect('tool');
  // res.render('index', { title: 'Express' });
});

module.exports = router;
