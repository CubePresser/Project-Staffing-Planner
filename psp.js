//Initialize server tools
const express = require('express');
const handlebars = require('express-handlebars');
const bodyParser = require('body-parser');
const mysql = require('./dbcon.js')({
    host     : process.argv[2],
    user     : process.argv[3],
    password : process.argv[4],
    database : process.argv[5]
});

const app = express();

app.engine('handlebars', handlebars({defaultLayout: 'main'}));
app.use(bodyParser.urlencoded({extended:true}));
app.use('/static', express.static('public'));
app.set('view engine', 'handlebars');
app.set('mysql', mysql);

app.use('/home', require('./routes/home.js'));
app.use('/add', require('./routes/add.js'));
app.use('/remove', require('./routes/remove.js'));
app.use('/update', require('./routes/update.js'));

//Redirection to the 'home' url on default '/' url
app.get('/', function(req,res) {
    res.redirect('/home');
});

app.use(function(req, res) {
    res.status(404);
    res.render('404');
});

//Listen on port 42069
app.listen(42066, () => console.log('Server started listening on port 42066!'));