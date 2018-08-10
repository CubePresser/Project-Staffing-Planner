module.exports = function(auth) {
    var module = {};
    var mysql = require('mysql');
    var pool = mysql.createPool({
    connectionLimit : 10,
    host            : auth.host, 
    user            : auth.user,
    password        : auth.password, 
    database        : auth.database
    });
    module.pool = pool;
    return module;
}