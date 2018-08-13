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

/*************************************************
 * Function: queryLoopConnector
 * Description: Executes an SQL query then runs a loop of subsequent queries on the data obtained from the initial SQL query
 * Params: response, mysql module, object with options {sql query, inserts, query to append data to, name of key for appended data, query to run on initial SQL query, callback function that gets a boolean success value}
 * Returns: none
 * Pre-conditions: Must provide everything but the inserts (if your query does not need it)
 * Post-conditions: All callbacks have finished before this function has completed and all sql data obtained
 * **********************************************/
function queryLoopConnector(res, mysql, options)
{
    //Run query from options
    mysql.pool.query(options.sql, options.inserts, function(error, table, fields) {
        if(isSQLError(res, error)) //Check for sql errors
        {
            options.callback(false); //Callback with a failure status on SQL error
        }
        else //If no SQL errors
        {
            var rows = table.length; //How many rows need to be evaluated?
            var count = 0; //Keeps track of how many rows have been evaluated
            var status = true; //True if no errors, false otherwise

            if(rows == 0) //If the table returned is empty
            {
                options.callback(true); //No useful data was obtained but no errors occured so callback with success
            }
            else 
            {
                //Enumerate through the rows of the returned SQL query and run the 'next' query on that returned data
                table.forEach(function(row) 
                { 
                    //For each enumeration, run the 'next' query on that data
                    options.next(res, mysql, row, function(success) {
                        if(!success) //If an error occured for any one of the 'next' queries, status to false (Errors occurred)
                            status = false;

                        count++; //Update number of rows evaluated

                        //If all rows have been evaluated
                        if(count >= rows)
                        {
                            options.key_container[options.key_name] = table; //Update key_container with a new key_name that references the queried data
                            options.callback(status);
                        }
                    }); 
                });  
            }  
        }
        
    });
}

/*************************************************
 * Function: getMonthsManpower
 * Description: Gets the manpower over the year for the project role passed in
 * Params: response, mysql module, project role data (individual), callback function that gets a boolean success value
 * Returns: none
 * Pre-conditions: Valid project role object should be passed in or error will be thrown
 * Post-conditions: If successful, appends queried data to project role
 * **********************************************/
function getMonthsManpower(res, mysql, pr, callback) {
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
            pr.manpower = mp_result; //Append month data to project role object
            callback(true);
        }
    });
}

/*************************************************
 * Function: getListOfProjectRoles
 * Description: Queries for a list of all project roles for the specified project and their total cost over the year
 * Params: Response, mysql module, project data (individual)
 * Returns: none
 * Pre-conditions: Valid project object should be passed in or error will be thrown 
 * Post-conditions: If successful, appends queried data to project role
 * **********************************************/
function getListOfProjectRoles(res, mysql, project, callback) {
    sql = `
        select project_role.id as id, team.name as team_name, role.name as role_name, company.name as company_name, location.name as location_name, costs.total_cost as total_cost
        from project_role
        inner join team on team.id = project_role.team_id
        inner join role on role.id = project_role.role_id
        inner join company on company.id = project_role.company_id
        inner join location on location.id = project_role.location_id
        inner join
        (
            -- Total cost of each project role over all the months that it operates
            select project_role.id as prid, ifnull(sum(manpower) * salary, 0) as total_cost
            from project_role
            left join projectrole_month on projectrole_month.project_role_id = project_role.id
            inner join role on role.id = project_role.role_id
            group by project_role.id
        ) costs on costs.prid = project_role.id
        where project_role.project_id = ?
        order by id;
    `;

    //Get the yearly manpower for each project role obtained from the above query
    queryLoopConnector(res, mysql, {
        sql           : sql,
        inserts       : [project.id], 
        key_container : project, 
        key_name      : "project_role", 
        next          : getMonthsManpower, 
        callback      : callback
    });
}

/*************************************************
 * Function: getProjectRolesList
 * Description: Obtains data necessary to fill the table at the top of each page on the website. This function first obtains a list of all projects that have project roles then runs a series of queries on them to obtain the necessary information.
 * Params: Response, mysql module, handlebars contextual object for filling variables, callback to complete (For the '/' get)
 * Returns: none
 * Pre-conditions: Page has not yet been rendered. Connection to SQL server established.
 * Post-conditions: Handlebars contextual object has been filled with all the successful data
 * **********************************************/
function getProjectRolesList(res, mysql, context, complete) {
    sql = `
        select distinct project.id as id, project.name as name 
        from project 
        inner join project_role on project_role.project_id = project.id
    `;
    queryLoopConnector(res, mysql, {
        sql           : sql,
        key_container : context, 
        key_name      : "project_name", 
        next          : getListOfProjectRoles, 
        callback      : complete
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
        SELECT company.name AS company_name, role.name AS role_name 
        FROM role_company 
        INNER JOIN role ON role_company.role_id = role.id
        INNER JOIN company on company.id = role_company.company_id
        WHERE role_company.company_id = ?
    `;
    var inserts = [req.body.company];
    mysql.pool.query(sql, inserts, function(error, results, fields) {
        if(isSQLError(res, error))
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
        if(isSQLError(res, error))
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
        if(isSQLError(res, error))
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
        if(isSQLError(res, error))
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
        if(isSQLError(res, error))
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