var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/tool', function(req, res, next) {
  res.render('tool', { title: 'LabelMe-Lite' });
});

router.get('/amt', function(req, res, next) {
  res.render('amt', { title: 'Express' });
});

router.get('/', function(req, res, next) {
  res.redirect('tool?proj_name=ade20k_val_predictions&file_name=validation/ADE_val_00001519.jpg');
  // res.render('index', { title: 'Express' });
});

module.exports = router;
