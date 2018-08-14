$(document).ready(function() {
    var searchBar = $('#search_projects');
    $(searchBar).keyup(function(event) {
        var search_text = searchBar.val().toLowerCase();
        console.log(search_text);
        var tables = document.querySelectorAll('.project_table');
        tables.forEach(function(table) {
            if(table.querySelector('.project_name').innerHTML.toLowerCase().includes(search_text))
            {
                table.classList.remove("hidden") 
            }
            else
            {
                table.classList.add("hidden");
            }
        })
    });
});