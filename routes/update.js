const express = require('express');
const router = express.Router();

router.get('/', function(req, res) {
    res.render('update', {title: 'Update'});
});

module.exports = router;