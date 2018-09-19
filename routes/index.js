var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/tool', function(req, res, next) {
  res.render('tool', { title: 'Express' });
});

router.get('/tool_simple', function(req, res, next) {
  res.render('tool_simple', { title: 'Express' });
});

router.get('/amt', function(req, res, next) {
  res.render('amt', { title: 'Express' });
});

router.get('/', function(req, res, next) {
  res.redirect('tool?id=00000000');
  // res.render('index', { title: 'Express' });
});

module.exports = router;
