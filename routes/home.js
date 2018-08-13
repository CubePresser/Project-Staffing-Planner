////////////////////////////////////////////////////////
// Jonathan Jones - jonesjonathan {GitHub}
// Project Staffing Planner - ./routes/home.js
////////////////////////////////////////////////////////

//Get the express router
var express = require('express');
var router = express.Router();
var query_driver = require('./query-driver.js');

function totalCostResponse(res, mysql, sql, inserts, callback) {
    mysql.pool.query(sql, inserts, function(error, results, fields) {
        if(query_driver.isSQLError(res, error))
        {
            callback(false);
        }
        else
        {
            if(results.length != 0)
            {
                var total_cost = results[0].total_cost;
                res.write("Total Cost: $" + (total_cost == null ? 0 : total_cost));
            }
            callback(true);
        }
        
    });
}

router.get('/', function(req, res) {
    var mysql = req.app.get('mysql');

    var callbackCount = 0; //Counter to ensure that all callbacks have returned before rendering

    var status = true; //Keeps track of the error status

    var context = {}; //Handlebars info
    context.title = "Home";
    context.scripts = ["home-ajax.js"];

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
                res.render('home', context);
            }
            else //Error has occured
            {
                res.status(400);
                res.end();
            }
            
        }
    }
});

//Query 0: Cost of a single month in a project
router.post('/q0', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        select sum(project_role_costs.cost) as total_cost
        from
        (
        select project.name as project_name, project_role.id as prid, manpower, salary, manpower * salary as cost
        from project
        inner join project_role on project_role.project_id = project.id and project.id = ?
        inner join projectrole_month on projectrole_month.project_role_id = project_role.id and projectrole_month.month_id = ?
        inner join role on role.id = project_role.role_id
        ) project_role_costs
    `;
    var inserts = [req.body.project, req.body.month];
    totalCostResponse(res, mysql, sql, inserts, function(success) {
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

//Query 1: Total cost of all instances of a role in a single project
router.post('/q1', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        select sum(pr_cost) as total_cost
        from
        (
            select project_role.id as prid, project_role.project_id as pr_pid, project_role.role_id as pr_rid, ifnull(sum(manpower) * salary, 0) as pr_cost
            from project_role
            left join projectrole_month on projectrole_month.project_role_id = project_role.id
            inner join role on role.id = project_role.role_id
            group by project_role.id
        ) project_role_costs
        where pr_pid = ? and pr_rid = ?
    `;
    var inserts = [req.body.project, req.body.role];
    totalCostResponse(res, mysql, sql, inserts, function(success) {
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

//Query 2: Total cost of a company for a single project
router.post('/q2', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        select pr_pid as pid, pr_cid as cid, sum(pr_cost) as total_cost
        from
        (
            select project_role.id as prid, project_role.project_id as pr_pid, project_role.company_id as pr_cid, ifnull(sum(manpower) * salary, 0) as pr_cost
            from project_role
            left join projectrole_month on projectrole_month.project_role_id = project_role.id
            inner join role on role.id = project_role.role_id
            group by project_role.id
        ) project_role_costs
        where pr_pid = ? and pr_cid = ?
    `;
    var inserts = [req.body.project, req.body.company];
    totalCostResponse(res, mysql, sql, inserts, function(success) {
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

//Query 3: Roles associated with a single company
router.post('/q3', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        SELECT company.name AS company_name, role.name AS role_name 
        FROM role_company 
        INNER JOIN role ON role_company.role_id = role.id
        INNER JOIN company on company.id = role_company.company_id
        WHERE role_company.company_id = ?
    `;
    var inserts = [req.body.company];
    mysql.pool.query(sql, inserts, function(error, results, fields) {
        if(query_driver.isSQLError(res, error))
        {
            res.status(400);
            res.end();
        }
        else //Success!
        {
            if(results.length != 0)
            {
                res.write(results[0].company_name + " has the roles:");
                results.forEach(function(row) {
                    res.write("\t" + row.role_name + ",");
                }); 
            }
            
            res.status(200);
            res.end();
        }
        
    });
});

//Query 4: Companies associated with a single role
router.post('/q4', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        SELECT company.name AS company_name, role.name as role_name 
        FROM role_company 
        INNER JOIN company ON role_company.company_id = company.id
        INNER JOIN role ON role_company.role_id = role.id
        WHERE role_id = ?
    `;
    var inserts = [req.body.role];
    mysql.pool.query(sql, inserts, function(error, results, fields) {
        if(query_driver.isSQLError(res, error))
        {
            res.status(400);
            res.end();
        }
        else
        {
            if(results.length != 0)
            {
                res.write(results[0].role_name + "s are available at:");
                results.forEach(function(row) {
                    res.write("\t" + row.company_name + ",");
                }); 
            }
            
            res.status(200);
            res.end();
        }
    });
});

//Query 5: Average manpower over the year for a single project role
router.post('/q5', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        SELECT AVG(manpower) AS average_manpower 
        FROM projectrole_month 
        INNER JOIN project_role ON projectrole_month.project_role_id = project_role.id 
        WHERE project_role.id = ?;
    `;
    var inserts = [req.body.project_role];
    mysql.pool.query(sql, inserts, function(error, results, fields) {
        if(query_driver.isSQLError(res, error))
        {
            res.status(400);
            res.end();
        }
        else
        {
            if(results.length != 0)
            {
                var avg_manpower = results[0].average_manpower;
                res.write("Average Manpower: " + (avg_manpower == null ? 0 : avg_manpower));
            }
            
            res.status(200);
            res.end();
        }
    });
});

//Query 6: Projects that a team is working on
router.post('/q6', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        SELECT project.name as project_name, team.name as team_name
        FROM team_project 
        INNER JOIN project ON team_project.project_id = project.id
        INNER JOIN team ON team.id = team_project.team_id
        WHERE team_id = ?
    `;
    var inserts = [req.body.team];
    mysql.pool.query(sql, inserts, function(error, results, fields) {
        if(query_driver.isSQLError(res, error))
        {
            res.status(400);
            res.end();
        }
        else
        {
            if(results.length != 0)
            {
                res.write(results[0].team_name + " is currently working on:");
                results.forEach(function(row) {
                    res.write("\t" + row.project_name + ",");
                }); 
            }
            
            res.status(200);
            res.end();
        }
    });
});

//Query 7: Teams that are working on a project
router.post('/q7', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        SELECT team.name as team_name, project.name as project_name
        FROM team_project 
        INNER JOIN team ON team_project.team_id = team.id
        INNER JOIN project ON team_project.project_id = project.id
        WHERE project_id = ?
    `;
    var inserts = [req.body.project];
    mysql.pool.query(sql, inserts, function(error, results, fields) {
        if(query_driver.isSQLError(res, error))
        {
            res.status(400);
            res.end();
        }
        else
        {
            if(results.length != 0)
            {
                res.write(results[0].project_name + " is being developed by:");
                results.forEach(function(row) {
                    res.write("\t" + row.team_name + ",");
                }); 
            }
            
            res.status(200);
            res.end();
        }
    });
});

module.exports = router;