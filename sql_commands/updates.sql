-- Change project name

update project
set name = [User written name]
where id = [Project id selected from dropdown];

-- Change team name

update team
set name = [User written name]
where id = [Team id selected from dropdown];

-- Change role name/salary

update role
set name = [User written name], salary = [User written salary]
where id = [Role id selected from dropdown];

-- Change location name

update location
set name = [User written name]
where id = [Location id selected from dropdown];

-- Change company name
set name = [User written name]
where id = [Company id selected from dropdown];

-- Change project role manpower
update projectrole_month
set manpower = [User entered manpower for january]
where project_role_id = [Project role id selected from dropdown] and month_id = 1;

update projectrole_month
set manpower = [User entered manpower for february]
where project_role_id = [Project role id selected from dropdown] and month_id = 2;

update projectrole_month
set manpower = [User entered manpower for march]
where project_role_id = [Project role id selected from dropdown] and month_id = 3;

update projectrole_month
set manpower = [User entered manpower for april]
where project_role_id = [Project role id selected from dropdown] and month_id = 4;

update projectrole_month
set manpower = [User entered manpower for may]
where project_role_id = [Project role id selected from dropdown] and month_id = 5;

update projectrole_month
set manpower = [User entered manpower for june]
where project_role_id = [Project role id selected from dropdown] and month_id = 6;

update projectrole_month
set manpower = [User entered manpower for july]
where project_role_id = [Project role id selected from dropdown] and month_id = 7;

update projectrole_month
set manpower = [User entered manpower for august]
where project_role_id = [Project role id selected from dropdown] and month_id = 8;

update projectrole_month
set manpower = [User entered manpower for september]
where project_role_id = [Project role id selected from dropdown] and month_id = 9;

update projectrole_month
set manpower = [User entered manpower for october]
where project_role_id = [Project role id selected from dropdown] and month_id = 10;

update projectrole_month
set manpower = [User entered manpower for november]
where project_role_id = [Project role id selected from dropdown] and month_id = 11;

update projectrole_month
set manpower = [User entered manpower for december]
where project_role_id = [Project role id selected from dropdown] and month_id = 12;