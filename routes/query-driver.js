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

module.exports.isSQLError = isSQLError;
module.exports.queryLoopConnector = queryLoopConnector;
module.exports.getProjectRolesList = getProjectRolesList;
module.exports.getTable = getTable;