-- Total cost of one project role over all the months it operates
SELECT project_role.id, SUM(manpower) * salary AS Total_Cost 
FROM project_role 
INNER JOIN projectrole_month ON project_role.id = projectrole_month.project_role_id 
INNER JOIN role ON project_role.role_id = role.id 
WHERE project_role.id = [Project Role ID selected from dropdown]

-- Total cost of one specified month for a project
SELECT SUM(cost) AS Total_Cost 
FROM (
    SELECT month_id, project_role.id AS prid, manpower, salary, manpower * salary AS cost 
    FROM project_role 
    INNER JOIN projectrole_month ON project_role.id = projectrole_month.project_role_id 
    INNER JOIN role ON project_role.role_id = role.id 
    WHERE projectrole_month.month_id = [month selected from dropdown] AND project_role.project_id = [project selected from dropdown]
    ) q0;

-- Total cost of all instances of a role in a single project
SELECT SUM(manpower) * salary AS Total_Cost
FROM (
    SELECT project_role.id, role.name, projectrole_month.month_id as month, manpower, salary 
    FROM project_role 
    INNER JOIN projectrole_month ON project_role.id = projectrole_month.project_role_id 
    INNER JOIN role ON project_role.role_id = role.id 
    WHERE role.id = [Role selected from dropdown] AND project_role.project_id = [Project selected from dropdown]
) t;

-- Total cost of a company for a single project
SELECT SUM(manpower) * salary AS Total_Cost
FROM (
    SELECT project_role.id, role.name, projectrole_month.month_id as month, manpower, salary 
    FROM project_role 
    INNER JOIN projectrole_month ON project_role.id = projectrole_month.project_role_id 
    INNER JOIN role ON project_role.role_id = role.id 
    WHERE project_role.company_id = [Company selected from dropdown] AND project_role.project_id = [Project selected from dropdown]
) t;

-- Roles associated with a single company
SELECT role.name AS associations 
FROM role_company 
INNER JOIN role ON role_company.role_id = role.id
WHERE company_id = [Company selected from dropdown]

-- Companies associated with a single role
SELECT company.name AS associations 
FROM role_company 
INNER JOIN company ON role_company.company_id = company.id
WHERE role_id = [Role selected from dropdown]

-- Average manpower over one single project role
SELECT AVG(manpower) AS average_manpower 
FROM projectrole_month 
INNER JOIN project_role ON projectrole_month.project_role_id = project_role.id 
WHERE project_role.id = [Project Role ID selected from dropdown];

-- Projects that a team is working on
SELECT project.name AS associations 
FROM team_project 
INNER JOIN project ON team_project.project_id = project.id
WHERE team_id = [Team selected from dropdown]

-- Teams that are working on a project
SELECT team.name AS associations 
FROM team_project 
INNER JOIN team ON team_project.team_id = team.id
WHERE project_id = [Project selected from dropdown]

