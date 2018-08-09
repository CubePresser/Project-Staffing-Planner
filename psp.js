const express = require('express');
const app = express();

//Initialize express application

app.get('/', function(req, res) {
    res.sendFile(__dirname + "/views/index.html");
});

//Listen on port 42069
app.listen(42069, () => console.log('Example app listening on port 42069!'));