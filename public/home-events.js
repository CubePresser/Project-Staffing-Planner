//This script handles the form submissions for the home page

//Runs on AJAX success and displays result of computation to webpage
function writeResult(response, options) {
    $(options.result).text(response); //Fill the form's result with the response from the server
}

//Ensure that event listeners are added once all DOM elements of the webpage are available (This is essentially 'main')
$(document).ready(function() {
    for(i = 0; i < 10; i++)
    {
        let queryNum = '#q' + i;
        form_handler($(queryNum + '_form'), writeResult, {result : $(queryNum + '_result')});
    }
});