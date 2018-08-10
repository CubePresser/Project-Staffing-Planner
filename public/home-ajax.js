//This script handles the form submissions for the home page

//Sets up an event handler for a form and gets its result for querying via ajax to the sql database without updating the entire page
function form_handler(form, result) {
    $(form).submit(function(event) {
        event.preventDefault(); //Prevent the submit from executing its default refresh action

        var formData = $(form).serialize(); //Serialize the form data for transmission

        //Use AJAX to send form data such that the page does not have to do a full refresh
        $.ajax({
            type: $(form).attr('method'),
            url: $(form).attr('action'),
            data: formData,
            success: function(response) {
                $(result).text(response); //Fill the form's result with the response from the server
            }
        });
    });
}

//Ensure that event listeners are added once all DOM elements of the webpage are available (This is essentially 'main')
$(document).ready(function() {
    for(i = 0; i < 8; i++)
    {
        let queryNum = '#q' + i;
        form_handler($(queryNum + '_form'), $(queryNum + '_result'));
    }
    //form_handler($('#q0_form'), $('#q0_result'));
});