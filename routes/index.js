var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/tool', function(req, res, next) {
  res.render('tool', { title: 'LabelMe-Lite' });
});

router.get('/amt', function(req, res, next) {
  res.render('amt', { title: 'Express' });
});

router.get('/game', function(req, res, next) {
  res.render('game', { title: 'Game interface' });
});

router.get('/', function(req, res, next) {
  res.redirect('game?dataset=ade20k_val&ann_source=maskrcnnc&file_name=validation/ADE_val_00000910.jpg');
  // res.render('index', { title: 'Express' });
});

module.exports = router;
