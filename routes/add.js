const express = require('express');
const router = express.Router();

router.get('/', function(req, res) {
    res.render('add', {title: 'Add'});
});

module.exports = router;