var express = require('express');
var path = require('path');
var fs = require('fs');
var router = express.Router();

/* GET home page. */
router.get('/tool', function(req, res, next) {
  res.render('interface', { title: 'LabelMe-Lite' });
});

router.get('/', function(req, res, next) {
  res.redirect('tool');
});

router.get('/amt_edit', function(req, res, next) {
  res.render('amt_edit', { title: 'Amazon Mechanical Turk Edit Interface' });
});

router.get('/amt_yesno', function(req, res, next) {
  res.render('amt_yesno', { title: 'Amazon Mechanical Turk YesNo Interface' });
});

router.get('/amt_browser', function(req, res, next) {
  res.render('amt_browser', { title: 'Amazon Mechanical Turk Browser' });
});

module.exports = router;
