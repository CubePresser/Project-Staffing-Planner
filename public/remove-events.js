//This script handles the form submissions for the add page

function updateWebpage(response, options) {
    alert("Removed " + options.type + " " + response + " from the database");
    window.location.reload(true);
}

//Ensure that event listeners are added once all DOM elements of the webpage are available (This is essentially 'main')
$(document).ready(function() {
    //formHandler call goes here
    //form_handler($('#id'), updateWebpage, {type : "project"});
});