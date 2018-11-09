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

router.get('/game_amt', function(req, res, next) {
  res.render('game_amt', { title: 'Game interface for AMT' });
});

router.get('/', function(req, res, next) {
  res.redirect('game');
  // res.render('index', { title: 'Express' });
});

module.exports = router;
