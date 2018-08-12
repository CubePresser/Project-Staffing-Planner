////////////////////////////////////////////////////////
// Jonathan Jones - jonesjonathan {GitHub}
// Project Staffing Planner - ./routes/home.js
////////////////////////////////////////////////////////

//Get the express router
var express = require('express');
var router = express.Router();

/*************************************************
 * Function: isSQLError
 * Description: Checks for an sql error from the argument passed in.
 * Params: Response object, error object from sql query
 * Returns: True if an error has occured, false otherwise
 * Pre-conditions: SQL Query has already run and returned an error object to evaluate.
 * Post-conditions: Error object has been evaluated, messages written if needed and error status returned. Preferably, the server remains operational after this error and it is handled accordingly.
 * **********************************************/
function isSQLError(res, error) {
    if(error)
    {
        let message = "SQL Error: " + error.sqlMessage;
        console.log(message);
        res.write(message);
        return true;
    }
    else 
    {
        return false;
    }
}


function getMonthsManpower(res, pr, mysql, callback) {
    sql = `
        select month.id, ifnull(projectrole_month.manpower, 0) as mp
        from month
        left join projectrole_month on projectrole_month.month_id = month.id and projectrole_month.project_role_id = ?
        order by month.id;
    `;
    mysql.pool.query(sql, [pr.id], function(error, mp_result, fields) {
        if(isSQLError(res, error)) 
        {
           callback(false);
        }
        else 
        {
            pr.manpower = mp_result;
            callback(true);
        }
    });
}

function getListOfProjectRoles(res, mysql, project, callback) {
    sql = `
        select project_role.id as id, team.name as team_name, role.name as role_name, company.name as company_name, location.name as location_name
        from project_role
        inner join team on team.id = project_role.team_id
        inner join role on role.id = project_role.role_id
        inner join company on company.id = project_role.company_id
        inner join location on location.id = project_role.location_id
        where project_role.project_id = ?
        order by id;
    `;
    mysql.pool.query(sql, [project.id], function(error, project_roles, fields) {
        if(isSQLError(res, error))
        {
            callback(false);
        }
        else
        {
            var len = project_roles.length;
            var count = 0;
            var status = true;
            
            if(len == 0) //If there are no project roles associated with the current project
            {
                callback(true);
            }
            else 
            {
                project_roles.forEach(function(pr) {
                    getMonthsManpower(res, pr, mysql, function(success) {
                        if(!success)
                            status = false;

                        count++;
                        if(count >= len)
                        {
                            project.project_role = project_roles;
                            callback(status);
                        }
                    });
                });    
            }
        }
        
    });
}

/*************************************************
 * Function: 
 * Description: 
 * Params: 
 * Returns: 
 * Pre-conditions: 
 * Post-conditions: 
 * **********************************************/
function getProjectRolesList(res, mysql, context, complete) {
    sql = `
        select distinct project.id as id, project.name as name 
        from project 
        inner join project_role on project_role.project_id = project.id
    `;
    mysql.pool.query(sql, function(error, projects, fields) {
        if(isSQLError(res, error))
        {
            complete(false);
        }
        else
        {
            var len = projects.length;
            var count = 0;
            var status = true;

            if(len == 0) //If there are no projects
            {
                complete(true);
            }
            else 
            {
                projects.forEach(function(project) 
                { 
                    getListOfProjectRoles(res, mysql, project, function(success) {
                        if(!success)
                            status = false;

                        count++;
                        if(count >= len)
                        {
                            context.project_name = projects;
                            complete(status);
                        }
                    }); 
                });  
            }  
        }
        
    });
}

function getTable(sql, res, mysql, context, item_name, complete)
{
    mysql.pool.query(sql, function(error, results, fields) {
        if(isSQLError(res, error))
        {
            complete(false);
        }
        else
        {
            context[item_name] = results;
            complete(true);
        }
        
    });
}

function totalCostResponse(res, mysql, sql, inserts, callback) {
    mysql.pool.query(sql, inserts, function(error, results, fields) {
        if(isSQLError(res, error))
        {
            callback(false);
        }
        else
        {
            var total_cost = results[0].total_cost;
            res.write("Total Cost: $" + (total_cost == null ? 0 : total_cost));
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

    getProjectRolesList(res, mysql, context, complete);
    //Gets project table to fill dropdown
    getTable(
        "select * from project order by name",
        res, mysql, context, "project", complete
    );
    //Gets team table to fill dropdown
    getTable(
        "select * from team order by name",
        res, mysql, context, "team", complete
    );
    //Gets role table to fill dropdown
    getTable(
        "select * from role order by name",
        res, mysql, context, "role", complete
    );
    //Gets company table to fill dropdown
    getTable(
        "select * from company order by name",
        res, mysql, context, "company", complete
    );
    //Gets location table to fill dropdown
    getTable(
        "select * from location order by name",
        res, mysql, context, "location", complete
    );
    //Gets project_role table to fill dropdown
    getTable(
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
        
    `;
    var inserts = [];
    mysql.pool.query(sql, inserts, function(error, results, fields) {
        if(isSQLError(res, error))
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

//Query 4: Companies associated with a single role
router.post('/q4', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        
    `;
    var inserts = [];
    mysql.pool.query(sql, inserts, function(error, results, fields) {
        if(isSQLError(res, error))
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

//Query 5: Average manpower over the year for a single project role
router.post('/q5', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        
    `;
    var inserts = [];
    mysql.pool.query(sql, inserts, function(error, results, fields) {
        if(isSQLError(res, error))
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

//Query 6: Projects that a team is working on
router.post('/q6', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        
    `;
    var inserts = [];
    mysql.pool.query(sql, inserts, function(error, results, fields) {
        if(isSQLError(res, error))
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

//Query 7: Teams that are working on a project
router.post('/q7', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        
    `;
    var inserts = [];
    mysql.pool.query(sql, inserts, function(error, results, fields) {
        if(isSQLError(res, error))
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