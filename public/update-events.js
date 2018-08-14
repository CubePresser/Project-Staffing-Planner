//This script handles the form submissions for the add page

function updateWebpage(response, options) {
    alert("Updated " + options.type + " " + response);
    window.location.reload(true);
}

//Ensure that event listeners are added once all DOM elements of the webpage are available (This is essentially 'main')
$(document).ready(function() {
    form_handler($('#project_form'), updateWebpage, {type : "project"});
    form_handler($('#team_form'), updateWebpage, {type : "team"});
    form_handler($('#role_form'), updateWebpage, {type : "role"});
    form_handler($('#location_form'), updateWebpage, {type : "location"});
    form_handler($('#company_form'), updateWebpage, {type : "company"});
    form_handler($('#project_role_form'), updateWebpage, {type : "project_role"});
});