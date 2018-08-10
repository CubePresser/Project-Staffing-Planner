//Initialize server tools
const express = require('express');
const handlebars = require('express-handlebars');
const bodyParser = require('body-parser');

const app = express();

app.engine('handlebars', handlebars({defaultLayout: 'main'}));
app.use(bodyParser.urlencoded({extended:true}));
app.use('/static', express.static('public'));
app.set('view engine', 'handlebars');

app.use('/home', require('./routes/home.js'));
app.use('/add', require('./routes/add.js'));
app.use('/remove', require('./routes/remove.js'));
app.use('/update', require('./routes/update.js'));

//Redirection to the 'home' url on default '/' url
app.get('/', function(req,res) {
    res.redirect('/home');
});

//Listen on port 42069
app.listen(42069, () => console.log('Server started listening on port 42069!'));