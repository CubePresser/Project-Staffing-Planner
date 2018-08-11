var express = require('express');
var router = express.Router();

function errorCheck(res, error) {
    if(error)
    {
        res.write(JSON.stringify(error));
        res.end();
    }
}

/*
function getMonthsManpower(res, pr, callback)
{
    sql = `
        select month.id, ifnull(projectrole_month.manpower, 0) as mp
        from month
        left join projectrole_month on projectrole_month.month_id = month.id and projectrole_month.project_role_id = ?
        order by month.id;
    `;
    mysql.pool.query(sql, [pr.id], function(error, mp_result, fields) {
        errorCheck(res, error);
        pr.manpower = mp_result;
        callback();
    });
}
*/

function getProjectRolesList(res, mysql, context, complete) {
    mysql.pool.query("select * from project", function(error, projects, fields) {
        errorCheck(res, error);
        //TODO: Loop through the project names and query their matching project roles for each one
        projects.forEach(function(project) {
            /***
            project_roles_function(params, function() {
                context.project_name = projects;
                complete();
            });
            ***/
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
                errorCheck(res, error);
                project_roles.forEach(function(pr) {
                    sql = `
                    select month.id, ifnull(projectrole_month.manpower, 0) as mp
                    from month
                    left join projectrole_month on projectrole_month.month_id = month.id and projectrole_month.project_role_id = ?
                    order by month.id;
                    `;
                    mysql.pool.query(sql, [pr.id], function(error, mp_result, fields) {
                        errorCheck(res, error);
                        pr.manpower = mp_result;
                    });
                });
                project.project_role = project_roles;
            });
        });
        context.project_name = projects;
        complete();
    });
}

function getProjects(res, mysql, context, complete) {
    mysql.pool.query("select * from project", function(error, results, fields) {
        errorCheck(res, error);
        context.project = results;
        complete();
    });
}

function getTeams(res, mysql, context, complete) {
    mysql.pool.query("select * from team", function(error, results, fields) {
        errorCheck(res, error);
        context.team = results;
        complete();
    });
}

function getRoles(res, mysql, context, complete) {
    mysql.pool.query("select * from role", function(error, results, fields) {
        errorCheck(res, error);
        context.role = results;
        complete();
    });
}

function getCompanies(res, mysql, context, complete) {
    mysql.pool.query("select * from company", function(error, results, fields) {
        errorCheck(res, error);
        context.company = results;
        complete();
    });
}

function getLocations(res, mysql, context, complete) {
    mysql.pool.query("select * from location", function(error, results, fields) {
        errorCheck(res, error);
        context.location = results;
        complete();
    });
}

function getProjectRoles(res, mysql, context, complete) {
    mysql.pool.query("select * from project_role order by id", function(error, results, fields) {
        errorCheck(res, error);
        context.project_role = results;
        complete();
    });
}

function totalCostResponse(res, mysql, sql, inserts) {
    mysql.pool.query(sql, inserts, function(error, results, fields) {
        errorCheck(res, error);
        var total_cost = results[0].total_cost;
        res.write("Total Cost: $" + (total_cost == null ? 0 : total_cost));
        res.end();
    });
}

//TODO: Fill the project roles area (Get info from db) and render the page
router.get('/', function(req, res) {
    var mysql = req.app.get('mysql');

    var callbackCount = 0; //Counter to ensure that all callbacks have returned before rendering

    var context = {}; //Handlebars info
    context.title = "Home";
    context.scripts = ["home-ajax.js"];

    getProjectRolesList(res, mysql, context, complete);
    getProjects(res, mysql, context, complete);
    getTeams(res, mysql, context, complete);
    getRoles(res, mysql, context, complete);
    getCompanies(res, mysql, context, complete);
    getLocations(res, mysql, context, complete);
    getProjectRoles(res, mysql, context, complete);

    //Waits for the completion of all callback functions then renders the page
    function complete() {
        callbackCount++;
        if(callbackCount >= 7)
        {
            res.render('home', context);
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
    totalCostResponse(res, mysql, sql, inserts);
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
    totalCostResponse(res, mysql, sql, inserts);
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
    totalCostResponse(res, mysql, sql, inserts);
});

//Query 3: Roles associated with a single company
router.post('/q3', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        
    `;
    var inserts = [];
    mysql.pool.query(sql, inserts, function(error, results, fields) {
        if(error)
        {
            res.write(JSON.stringify(error));
            res.end();
        }
        res.write(results);
        res.end();
    });
});

//Query 4: Companies associated with a single role
router.post('/q4', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        
    `;
    var inserts = [];
    mysql.pool.query(sql, inserts, function(error, results, fields) {
        if(error)
        {
            res.write(JSON.stringify(error));
            res.end();
        }
        res.write(results);
        res.end();
    });
});

//Query 5: Average manpower over the year for a single project role
router.post('/q5', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        
    `;
    var inserts = [];
    mysql.pool.query(sql, inserts, function(error, results, fields) {
        if(error)
        {
            res.write(JSON.stringify(error));
            res.end();
        }
        res.write(results);
        res.end();
    });
});

//Query 6: Projects that a team is working on
router.post('/q6', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        
    `;
    var inserts = [];
    mysql.pool.query(sql, inserts, function(error, results, fields) {
        if(error)
        {
            res.write(JSON.stringify(error));
            res.end();
        }
        res.write(results);
        res.end();
    });
});

//Query 7: Teams that are working on a project
router.post('/q7', function(req, res) {
    var mysql = req.app.get('mysql');
    var sql = `
        
    `;
    var inserts = [];
    mysql.pool.query(sql, inserts, function(error, results, fields) {
        if(error)
        {
            res.write(JSON.stringify(error));
            res.end();
        }
        res.write(results);
        res.end();
    });
});

module.exports = router;