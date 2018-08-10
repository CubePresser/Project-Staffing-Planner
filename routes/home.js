var express = require('express');
var router = express.Router();

//TODO: Fill the project roles area (Get info from db) and render the page
router.get('/', function(req, res) {
    res.render('home', {title: 'Home'});
});

//TODO: QUERY HANDLING

//Query 0
router.post('/q0', function(req, res) {
    console.log(req.body);
    res.redirect('/home');
});

module.exports = router;