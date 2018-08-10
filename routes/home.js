var express = require('express');
var router = express.Router();

//TODO: Fill the project roles area (Get info from db) and render the page
router.get('/', function(req, res) {
    res.render('home', {
        title: 'Home',
        scripts: ["home-ajax.js"]
    });
});

//Query 0: Cost of a single month in a project
router.post('/q0', function(req, res) {
    var cost;
    res.write("Total Cost: $" + cost);
    res.end();
});

//Query 1: Total cost of all instances of a role in a single project
router.post('/q1', function(req, res) {
    var result;
    //TODO
    res.write(result);
    res.end();
});

//Query 2: Total cost of a company for a single project
router.post('/q2', function(req, res) {
    var result;
    //TODO
    res.write(result);
    res.end();
});

//Query 3: Roles associated with a single company
router.post('/q3', function(req, res) {
    var result;
    //TODO
    res.write(result);
    res.end();
});

//Query 4: Companies associated with a single role
router.post('/q4', function(req, res) {
    var result;
    //TODO
    res.write(result);
    res.end();
});

//Query 5: Average manpower over the year for a single project role
router.post('/q5', function(req, res) {
    var result;
    //TODO
    res.write(result);
    res.end();
});

//Query 6: Projects that a team is working on
router.post('/q6', function(req, res) {
    var result;
    //TODO
    res.write(result);
    res.end();
});

//Query 7: Teams that are working on a project
router.post('/q7', function(req, res) {
    var result;
    //TODO
    res.write(result);
    res.end();
});

module.exports = router;