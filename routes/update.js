const express = require('express');
const router = express.Router();
const query_driver = require('./query-driver.js');

router.get('/', function(req, res) {
    var mysql = req.app.get('mysql');

    var callbackCount = 0; //Counter to ensure that all callbacks have returned before rendering

    var status = true; //Keeps track of the error status

    var context = {}; //Handlebars info
    context.title = "Update";
    context.scripts = ["update-events.js", "form-handler.js"];

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
    //Gets project_role table to fill dropdown
    query_driver.getTable(
        "select * from project_role order by id",
        res, mysql, context, "project_role", complete
    );

    //Waits for the completion of all callback functions then renders the page
    function complete(success) {
        if(!success)
            status = false;

        callbackCount++;
        if(callbackCount >= 7) //Wait for all callbacks to finish
        {
            //Check for errors
            if(status) //No errors
            {
                res.render('update', context);
            }
            else //Error has occured
            {
                res.status(400);
                res.end();
            }
            
        }
    }
});

router.post('/update_project', function(req, res) {
    var mysql = req.app.get('mysql');
    sql = `
        update project
        set name = ?
        where id = ?;
    `;
    mysql.pool.query(sql, [req.body.name, req.body.project], function(error, result, fields) {
        if(query_driver.isSQLError(res, error))
        {
            res.status(400);
            res.end();
        }
        else
        {
            res.status(200);
            res.end();
        }
    });
});

router.post('/update_team', function(req, res) {
    var mysql = req.app.get('mysql');
    sql = `
        update team
        set name = ?
        where id = ?;
    `;
    mysql.pool.query(sql, [req.body.name, req.body.team], function(error, result, fields) {
        if(query_driver.isSQLError(res, error))
        {
            res.status(400);
            res.end();
        }
        else
        {
            res.status(200);
            res.end();
        }
    });
});

router.post('/update_role', function(req, res) {
    var mysql = req.app.get('mysql');
    sql = `
        update role
        set name = ?, salary = ?
        where id = ?;
    `;
    mysql.pool.query(sql, [req.body.name, req.body.salary, req.body.role], function(error, result, fields) {
        if(query_driver.isSQLError(res, error))
        {
            res.status(400);
            res.end();
        }
        else
        {
            res.status(200);
            res.end();
        }
    });
});

router.post('/update_location', function(req, res) {
    var mysql = req.app.get('mysql');
    sql = `
        update location
        set name = ?
        where id = ?;
    `;
    mysql.pool.query(sql, [req.body.name, req.body.location], function(error, result, fields) {
        if(query_driver.isSQLError(res, error))
        {
            res.status(400);
            res.end();
        }
        else
        {
            res.status(200);
            res.end();
        }
    });
});

router.post('/update_company', function(req, res) {
    var mysql = req.app.get('mysql');
    sql = `
        update company
        set name = ?
        where id = ?;
    `;
    mysql.pool.query(sql, [req.body.name, req.body.company], function(error, result, fields) {
        if(query_driver.isSQLError(res, error))
        {
            res.status(400);
            res.end();
        }
        else
        {
            res.status(200);
            res.end();
        }
    });
});

router.post('/update_project_role', function(req, res) {
    var mysql = req.app.get('mysql');
    sql = `
        update projectrole_month
        set manpower = ?
        where project_role_id = ? and month_id = 1;
        
        update projectrole_month
        set manpower = ?
        where project_role_id = ? and month_id = 2;
        
        update projectrole_month
        set manpower = ?
        where project_role_id = ? and month_id = 3;
        
        update projectrole_month
        set manpower = ?
        where project_role_id = ? and month_id = 4;
        
        update projectrole_month
        set manpower = ?
        where project_role_id = ? and month_id = 5;
        
        update projectrole_month
        set manpower = ?
        where project_role_id = ? and month_id = 6;
        
        update projectrole_month
        set manpower = ?
        where project_role_id = ? and month_id = 7;
        
        update projectrole_month
        set manpower = ?
        where project_role_id = ? and month_id = 8;
        
        update projectrole_month
        set manpower = ?
        where project_role_id = ? and month_id = 9;
        
        update projectrole_month
        set manpower = ?
        where project_role_id = ? and month_id = 10;
        
        update projectrole_month
        set manpower = ?
        where project_role_id = ? and month_id = 11;
        
        update projectrole_month
        set manpower = ?
        where project_role_id = ? and month_id = 12;
    `;
    var inserts = [
        req.body.January, req.body.project_role,
        req.body.February, req.body.project_role,
        req.body.March, req.body.project_role,
        req.body.April, req.body.project_role,
        req.body.May, req.body.project_role,
        req.body.June, req.body.project_role,
        req.body.July, req.body.project_role,
        req.body.August, req.body.project_role,
        req.body.September, req.body.project_role,
        req.body.October, req.body.project_role,
        req.body.November, req.body.project_role,
        req.body.December, req.body.project_role,
    ];
    mysql.pool.query(sql, inserts, function(error, result, fields) {
        if(query_driver.isSQLError(res, error))
        {
            res.status(400);
            res.end();
        }
        else
        {
            res.status(200);
            res.end();
        }
    });
});

module.exports = router;