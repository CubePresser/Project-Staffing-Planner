const express = require('express');
const router = express.Router();
const query_driver = require('./query-driver.js');

//Relates a single entity to multiple others
function relate_entities(res, mysql, options, callback) {
    //Need Relation table name, two id attribute names, single entity table name, single entity name, array of other entity ids
    var rows = options.entities.length;
    var count = 0;
    var status = true;

    sql = "insert into " + options.r_table + " (" + options.id_1 + ", " + options.id_2 + ") values ((select id from " + options.entity + " where name = ?), ?)";
    options.entities.forEach(function(item) {
        let inserts = [options.entity_name, item];
        mysql.pool.query(sql, inserts, function(error, results, fields) {
            if(query_driver.isSQLError(res, error))
            {
                status = false;
            }

            count++;

            if(count >= rows)
            {
                callback(status);
            }
        });
    });
}

function add_role(req, res, mysql, callback)
{
    var sql = `
        insert into role (name, salary) values (?, ?)
    `;

    //Validate user input
    if(req.body.salary >= 0) //Make sure that user has entered a valid salary that is greater than 0
    {
        var inserts = [req.body.name, req.body.salary];
        mysql.pool.query(sql, inserts, function(error, results, fields) {
            if(!query_driver.isSQLError(res, error))
            {
                res.write(req.body.name);
                if(req.body.hasOwnProperty("company")) //If companies have been selected
                {
                    relate_entities(res, mysql, {
                        r_table     : "role_company",
                        id_1        : "role_id",
                        id_2        : "company_id",
                        entity      : "role",
                        entity_name : req.body.name,
                        entities    : (req.body.company.length == 1 ? [req.body.company] : req.body.company)
                    }, callback);
                }
                else
                {
                    callback(true); //No companies selected but query is good so return with a success value
                }
            }
            else
            {
                callback(false);
            }
        });    
    }
    else
    {
        res.write("Please enter a valid salary");
        callback(false);
    }
    
}

function add_location(req, res, mysql, callback)
{
    var sql = `
        insert into location (name) values (?)
    `;
    var inserts = [req.body.name];
    mysql.pool.query(sql, inserts, function(error, results, fields) {
        if(!query_driver.isSQLError(res, error))
        {
            res.write(req.body.name);
            if(req.body.hasOwnProperty("company")) //If companies have been selected
            {
                relate_entities(res, mysql, {
                    r_table     : "company_location",
                    id_1        : "location_id",
                    id_2        : "company_id",
                    entity      : "location",
                    entity_name : req.body.name,
                    entities    : (req.body.company.length == 1 ? [req.body.company] : req.body.company)
                }, callback);

            }
            else
            {
                callback(true); //No companies selected but query is good so return with a success value
            }
        }
        else
        {
            callback(false);
        }
    });    
}

function add_company(req, res, mysql, callback)
{
    var sql = `
        insert into company (name) values (?)
    `;
    var inserts = [req.body.name];
    mysql.pool.query(sql, inserts, function(error, results, fields) {
        if(!query_driver.isSQLError(res, error))
        {
            res.write(req.body.name);
            
            var count = 0;

            relate_entities(res, mysql, {
                r_table     : "company_location",
                id_1        : "company_id",
                id_2        : "location_id",
                entity      : "company",
                entity_name : req.body.name,
                entities    : (req.body.location.length == 1 ? [req.body.location] : req.body.location)
            }, complete);

            relate_entities(res, mysql, {
                r_table     : "role_company",
                id_1        : "company_id",
                id_2        : "role_id",
                entity      : "company",
                entity_name : req.body.name,
                entities    : (req.body.role.length == 1 ? [req.body.role] : req.body.role)
            }, complete);

            function complete(success) {
                count++;
                if(count >= 2)
                {
                    callback(success);
                }
            }
        }
        else //Query failed
        {
            callback(false);
        }
    });
}

router.get('/', function(req, res) {
    var mysql = req.app.get('mysql');

    var callbackCount = 0; //Counter to ensure that all callbacks have returned before rendering

    var status = true; //Keeps track of the error status

    var context = {}; //Handlebars info
    context.title = "Add";
    context.scripts = ["add-events.js", "form-handler.js"];

    query_driver.getProjectRolesList(res, mysql, context, complete);
    //Gets project table to fill dropdown
    query_driver.getTable(
        "select * from project order by name",
        res, mysql, context, "project", complete
    );
    //Gets team table to fill dropdown
    query_driver.getTable(
        "select * from team order by name",
        res, mysql, context, "team", complete
    );
    //Gets role table to fill dropdown
    query_driver.getTable(
        "select * from role order by name",
        res, mysql, context, "role", complete
    );
    //Gets company table to fill dropdown
    query_driver.getTable(
        "select * from company order by name",
        res, mysql, context, "company", complete
    );
    //Gets location table to fill dropdown
    query_driver.getTable(
        "select * from location order by name",
        res, mysql, context, "location", complete
    );

    //Waits for the completion of all callback functions then renders the page
    function complete(success) {
        if(!success)
            status = false;

        callbackCount++;
        if(callbackCount >= 6) //Wait for all callbacks to finish
        {
            //Check for errors
            if(status) //No errors
            {
                res.render('add', context);
            }
            else //Error has occured
            {
                res.status(400);
                res.end();
            }
            
        }
    }
});

router.post('/add_project', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        insert into project (name) values (?)
    `;
    var inserts = [req.body.name];
    mysql.pool.query(sql, inserts, function(error, results, fields) {
        if(query_driver.isSQLError(res, error))
        {
            res.status(400);
            res.end();
        }
        else
        {
            res.write(req.body.name);
            res.status(200);
            res.end();
        }
    });
});

router.post('/add_team', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        insert into team (name) values (?)
    `;
    var inserts = [req.body.name];
    mysql.pool.query(sql, inserts, function(error, results, fields) {
        if(query_driver.isSQLError(res, error))
        {
            res.status(400);
            res.end();
        }
        else
        {
            res.write(req.body.name);
            res.status(200);
            res.end();
        }
    });
});



router.post('/add_role', function(req, res) {
    var mysql = req.app.get('mysql');
    add_role(req, res, mysql, function(success) {
        if(success)
        {
            res.status(200);
            res.end();  
        }
        else
        {
            res.status(400);
            res.end();
        }
    });
});

router.post('/add_role-company', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        insert into role_company (role_id, company_id) values (?, ?)
    `;
    mysql.pool.query(sql, [req.body.role, req.body.company], function(error, result, fields) {
        if(query_driver.isSQLError(res, error))
        {
            res.status(400);
            res.end();
        }
        else
        {
            res.write("relationship");
            res.status(200);
            res.end();
        }
    });
});

router.post('/add_location', function(req, res) {
    var mysql = req.app.get('mysql');
    add_location(req, res, mysql, function(success) {
        if(success)
        {
            res.status(200);
            res.end();  
        }
        else
        {
            res.status(400);
            res.end();
        }
    });
});

router.post('/add_company', function(req, res) {
    var mysql = req.app.get('mysql');
    add_company(req, res, mysql, function(success) {
        if(success)
        {
            res.status(200);
            res.end();  
        }
        else
        {
            res.status(400);
            res.end();
        }
    });
});

module.exports = router;