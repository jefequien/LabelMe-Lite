var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/tool', function(req, res, next) {
  res.render('tool', { title: 'Express' });
});

router.get('/tool_simple', function(req, res, next) {
  res.render('tool_simple', { title: 'Express' });
});

router.get('/tool_new', function(req, res, next) {
  res.render('tool_new', { title: 'LabelMe-Lite' });
});

router.get('/amt', function(req, res, next) {
  res.render('amt', { title: 'Express' });
});

router.get('/', function(req, res, next) {
  res.redirect('tool?project=ade20k_val&file_name=ADE_val_00000003.jpg');
  // res.render('index', { title: 'Express' });
});

module.exports = router;
