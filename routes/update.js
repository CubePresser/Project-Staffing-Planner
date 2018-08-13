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

module.exports = router;