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
                        entities    : (Array.isArray(req.body.company) ? req.body.company : [req.body.company])
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
                    entities    : (Array.isArray(req.body.company) ? req.body.company : [req.body.company])
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
                entities    : (Array.isArray(req.body.location) ? req.body.location : [req.body.location])
            }, complete);

            relate_entities(res, mysql, {
                r_table     : "role_company",
                id_1        : "company_id",
                id_2        : "role_id",
                entity      : "company",
                entity_name : req.body.name,
                entities    : (Array.isArray(req.body.role) ? req.body.role : [req.body.role])
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

function add_manpower(req, res, mysql, prid, callback) {
    var sql = `
        insert into projectrole_month (project_role_id, month_id, manpower)
        values
            (?, 1, ?),
            (?, 2, ?),
            (?, 3, ?),
            (?, 4, ?),
            (?, 5, ?),
            (?, 6, ?),
            (?, 7, ?),
            (?, 8, ?),
            (?, 9, ?),
            (?, 10, ?),
            (?, 11, ?),
            (?, 12, ?);
    `;
    var inserts = [
        prid, req.body.January,
        prid, req.body.February,
        prid, req.body.March,
        prid, req.body.April,
        prid, req.body.May,
        prid, req.body.June,
        prid, req.body.July,
        prid, req.body.August,
        prid, req.body.September,
        prid, req.body.October,
        prid, req.body.November,
        prid, req.body.December
    ];
    mysql.pool.query(sql, inserts, function(error, result, fields) {
        if(query_driver.isSQLError(res, error))
        {
            callback(false);
        }
        else
        {
            callback(true);
        }
    });
}

function getPRID(inserts, res, mysql, callback) {
    var sql = `
        select id 
        from project_role -- This will get the automatically generated project id that above query generated
        where
            project_id = ? and
            team_id = ? and
            role_id = ? and
            company_id = ? and
            location_id = ?
    `;
    mysql.pool.query(sql, inserts, function(error, result, fields) {
        if(query_driver.isSQLError(res, error))
        {
            callback({ success : false });
        }
        else
        {
            callback({success : true, id : result[0].id});
        }
    });
}

function add_project_role(req, res, mysql, callback)
{
    sql = `
        insert into project_role (project_id, team_id, role_id, company_id, location_id)
        values (?, ? ,? ,? ,?);
    `;
    var inserts = [
        req.body.project,
        req.body.team,
        req.body.role,
        req.body.company,
        req.body.location
    ];
    mysql.pool.query(sql, inserts, function(error, result, fields) {
        if(query_driver.isSQLError(res, error))
        {
            callback(false);
        }
        else
        {
            getPRID(inserts, res, mysql, function(results) {
                if(results.success)
                {
                    add_manpower(req, res, mysql, results.id, function(status) {
                        callback(status);
                    });
                }
                else
                {
                    callback(false);
                }
            });
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

router.post('/add_team-project', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        insert into team_project (team_id, project_id) values (?, ?)
    `;
    mysql.pool.query(sql, [req.body.team, req.body.project], function(error, result, fields) {
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

router.post('/add_company-location', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        insert into company_location (company_id, location_id) values (?, ?)
    `;
    mysql.pool.query(sql, [req.body.company, req.body.location], function(error, result, fields) {
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

router.post('/add_project_role', function(req, res) {
    var mysql = req.app.get('mysql');
    add_project_role(req, res, mysql, function(success) {
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