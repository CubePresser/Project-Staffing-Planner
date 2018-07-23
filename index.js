function add_team() 
{
    var name = document.getElementById("team_name").value;
    alert("Added team " + name + " to database");
}

//Written with help from https://stackoverflow.com/questions/5866169/how-to-get-all-selected-values-of-a-multiple-select-box
function parse_mult_select(select_container)
{
    var results = [];
    var options = select_container && select_container.options;
    var opts_len = options.length;
    var opt;

    for(var i = 0; i < opts_len; i++)
    {
        opt = options[i];

        if(opt.selected) {
            results.push(opt.text);
        }
    }

    return results;
}

function add_company()
{
    var name = document.getElementById("company_name").value;
    var locations = parse_mult_select(document.getElementById("company_locations"));
    var roles = parse_mult_select(document.getElementById("company_roles"));



    alert("Added company " + name + " with locations at " + locations + " and roles " + roles);
}