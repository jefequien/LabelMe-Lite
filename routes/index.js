var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/tool', function(req, res, next) {
  res.render('full', { title: 'LabelMe-Lite' });
});

router.get('/amt', function(req, res, next) {
  res.render('amt', { title: 'AMT' });
});

router.get('/yesno', function(req, res, next) {
  res.render('yesno', { title: 'YesNo Interface' });
});

router.get('/', function(req, res, next) {
  res.redirect('tool');
  // res.render('index', { title: 'Express' });
});

module.exports = router;
