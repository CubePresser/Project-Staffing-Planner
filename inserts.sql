-- Add a project role and its manpower for the year

    insert into project_role (project_id, team_id, role_id, company_id, location_id)
    values
        (
            [project id from dropdown],
            [team id from dropdown],
            [role id from dropdown],
            [company id from dropdown],
            [location id from dropdown]
        );

    select id 
    from project_role -- This will get the automatically generated project id that above query generated
    where
        project_id = [project id from dropdown] and
        team_id = [team id from dropdown] and
        role_id = [role id from dropdown] and
        company_id = [company id from dropdown] and
        location_id = [location id from dropdown]

    insert into projectrole_month (project_role_id, month_id, manpower)
    values
        ([project role id stored in variable], 1, [User entered manpower value]),
        ([project role id stored in variable], 2, [User entered manpower value]),
        ([project role id stored in variable], 3, [User entered manpower value]),
        ([project role id stored in variable], 4, [User entered manpower value]),
        ([project role id stored in variable], 5, [User entered manpower value]),
        ([project role id stored in variable], 6, [User entered manpower value]),
        ([project role id stored in variable], 7, [User entered manpower value]),
        ([project role id stored in variable], 8, [User entered manpower value]),
        ([project role id stored in variable], 9, [User entered manpower value]),
        ([project role id stored in variable], 10, [User entered manpower value]),
        ([project role id stored in variable], 11, [User entered manpower value]),
        ([project role id stored in variable], 12, [User entered manpower value])


-- Add project

    insert into project (name) values ([User specified name])

-- Add team

    insert into team (name) values ([User specified name])

-- Add role

    insert into role (name, salary) values ([User specified name], [User specified salary])

-- Add company

    insert into company (name) values ([User specified name])
    -- Initial insert also requires a relationship to be added with a location and a role
    -- Getting the new company id
    select id from company where name = [User specified name] 

-- Relate company to role

    insert into role_company (role_id, company_id) values ([Role id selected from dropdown], [Company id selected from dropdown or provided via query])

-- Relate company to location

    insert into company_location (company_id, location_id) values ([Company id selected from dropdown or provided via query], [Location id selected from dropdown])

-- Relate team to project

    insert into team_project (team_id, project_id) values ([Team id selected from dropdown], [Project id selected from dropdown])