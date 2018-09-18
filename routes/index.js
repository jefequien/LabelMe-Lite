var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/labelme', function(req, res, next) {
  res.render('annotator', { title: 'Express' });
});

router.get('/', function(req, res, next) {
  res.redirect('labelme?task_id=00000000');
  // res.render('index', { title: 'Express' });
});

module.exports = router;
