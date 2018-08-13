const express = require('express');
const router = express.Router();
const query_driver = require('./query-driver.js');

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

function add_role(req, res, mysql, callback)
{
    var status = false;
    var sql = `
        insert into role (name, salary) values (?, ?)
    `;
    var inserts = [req.body.name, req.body.salary];
    mysql.pool.query(sql, inserts, function(error, results, fields) {
        if(!query_driver.isSQLError(res, error))
        {
            res.write(req.body.name);
            status = true;
        }
    });

    //If companies were selected
    if(req.body.hasOwnProperty("company") && status)
    {
        var rows = req.body.company.length;
        var count = 0;
        sql = "insert into role_company (role_id, company_id) values ((select id from role where name = ?), ?)"
        req.body.company.forEach(function(item) {
            mysql.pool.query(sql, [req.body.name, item], function(error, results, fields) {
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
}

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

module.exports = router;