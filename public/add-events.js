//This script handles the form submissions for the add page

function updateWebpage(response, options) {
    alert("Added " + options.type + " " + response + " to the database");
    window.location.reload(true);
}

//Ensure that event listeners are added once all DOM elements of the webpage are available (This is essentially 'main')
$(document).ready(function() {
    //formHandler call goes here
    form_handler($('#project_form'), updateWebpage, {type : "project"});
    form_handler($('#team_form'), updateWebpage, {type : "team"});
    form_handler($('#role_form'), updateWebpage, {type : "role"});
});