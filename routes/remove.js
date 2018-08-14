const express = require('express');
const router = express.Router();
const query_driver = require('./query-driver.js');

router.get('/', function(req, res) {
    var mysql = req.app.get('mysql');

    var callbackCount = 0; //Counter to ensure that all callbacks have returned before rendering

    var status = true; //Keeps track of the error status

    var context = {}; //Handlebars info
    context.title = "Remove";
    context.scripts = ["remove-events.js", "form-handler.js"];

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
                res.render('remove', context);
            }
            else //Error has occured
            {
                res.status(400);
                res.end();
            }
            
        }
    }
});

router.post('/remove_project', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        delete from project where id = ?;
    `;
    mysql.pool.query(sql, [req.body.project], function(error, results, fields) {
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

router.post('/remove_team', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        delete from team where id = ?;
    `;
    mysql.pool.query(sql, [req.body.team], function(error, results, fields) {
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

router.post('/remove_team-project', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        delete from team_project where team_id = ? and project_id = ?;
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

router.post('/remove_role', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        delete from role where id = ?;
    `;
    mysql.pool.query(sql, [req.body.role], function(error, results, fields) {
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

router.post('/remove_role-company', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        v
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

router.post('/remove_location', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        delete from location where id = ?;
    `;
    mysql.pool.query(sql, [req.body.location], function(error, result, fields) {
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

router.post('/remove_company', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        delete from company where id = ?;
    `;
    mysql.pool.query(sql, [req.body.company], function(error, result, fields) {
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


router.post('/remove_company-location', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        delete from company_location where company_id = ? and location_id = ?;
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

router.post('/remove_project_role', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        delete from project_role where id = ?;
    `;
    mysql.pool.query(sql, [req.body.project_role], function(error, result, fields) {
        if(query_driver.isSQLError(res, error))
        {
            res.status(400);
            res.end();
        }
        else
        {
            res.write(req.body.project_role);
            res.status(200);
            res.end();
        }
    });
});

module.exports = router;