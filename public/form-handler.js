//Sets up an event handler for a form and gets its result for querying via ajax to the sql database without updating the entire page
function form_handler(form, success_func, options) {
    $(form).submit(function(event) {
        event.preventDefault(); //Prevent the submit from executing its default refresh action

        var formData = $(form).serialize(); //Serialize the form data for transmission

        //Use AJAX to send form data such that the page does not have to do a full refresh
        $.ajax({
            type: $(form).attr('method'), //Get the HTTP type of the form request (GET, POST, ect..)
            url: $(form).attr('action'),
            data: formData,
            success: function(response) {
                success_func(response, options);
            }
        });
    });
}