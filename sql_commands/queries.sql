-- Total cost of each project role over all the months that it operates
select project_role.id as prid, ifnull(sum(manpower) * salary, 0) as total_cost
from project_role
left join projectrole_month on projectrole_month.project_role_id = project_role.id
inner join role on role.id = project_role.role_id
group by project_role.id

-- Total cost of each project role in a project over all the months that it operates
select project_role.id as prid, ifnull(sum(manpower) * salary, 0) as total_cost
from project_role
left join projectrole_month on projectrole_month.project_role_id = project_role.id
inner join role on role.id = project_role.role_id
where project_role.project_id = (select id from project where name = [Project name])
group by project_role.id

-- Total cost of one specified month for a project
select sum(project_role_costs.cost) as total_cost
from
(
select project.name as project_name, project_role.id as prid, manpower, salary, manpower * salary as cost
from project
inner join project_role on project_role.project_id = project.id and project.id = [project id selected from dropdown]
inner join projectrole_month on projectrole_month.project_role_id = project_role.id and projectrole_month.month_id = [month id selected from dropdown]
inner join role on role.id = project_role.role_id
) project_role_costs

-- Total cost of every month for each project
select month.id as mid, month.name as month_name, project_role_month_costs.pid, sum(project_role_month_costs.cost) as total_cost
from month
inner join
(
    select project_role.project_id as pid, project_role.id as prid, projectrole_month.month_id as month_id, manpower * salary as cost
    from project_role
    inner join projectrole_month on projectrole_month.project_role_id = project_role.id
    inner join role on role.id = project_role.role_id
    order by pid
) project_role_month_costs on project_role_month_costs.month_id = month.id
group by mid, pid

-- Total cost of all types of roles in every project
select pr_pid as pid, pr_rid as rid, sum(pr_cost) as total_cost
from
(
    select project_role.id as prid, project_role.project_id as pr_pid, project_role.role_id as pr_rid, ifnull(sum(manpower) * salary, 0) as pr_cost
    from project_role
    left join projectrole_month on projectrole_month.project_role_id = project_role.id
    inner join role on role.id = project_role.role_id
    group by project_role.id
) project_role_costs
group by pid, rid

-- Total cost of a single role type in a single project
select sum(pr_cost) as total_cost
from
(
    select project_role.id as prid, project_role.project_id as pr_pid, project_role.role_id as pr_rid, ifnull(sum(manpower) * salary, 0) as pr_cost
    from project_role
    left join projectrole_month on projectrole_month.project_role_id = project_role.id
    inner join role on role.id = project_role.role_id
    group by project_role.id
) project_role_costs
where pr_pid = [project id selected from dropdown] and pr_rid = [role id selected from dropdown]

-- Total cost of all companies in every project
select pr_pid as pid, pr_cid as cid, sum(pr_cost) as total_cost
from
(
    select project_role.id as prid, project_role.project_id as pr_pid, project_role.company_id as pr_cid, ifnull(sum(manpower) * salary, 0) as pr_cost
    from project_role
    left join projectrole_month on projectrole_month.project_role_id = project_role.id
    inner join role on role.id = project_role.role_id
    group by project_role.id
) project_role_costs
group by pid, cid

-- Total cost of a company in a project
select pr_pid as pid, pr_cid as cid, sum(pr_cost) as total_cost
from
(
    select project_role.id as prid, project_role.project_id as pr_pid, project_role.company_id as pr_cid, ifnull(sum(manpower) * salary, 0) as pr_cost
    from project_role
    left join projectrole_month on projectrole_month.project_role_id = project_role.id
    inner join role on role.id = project_role.role_id
    group by project_role.id
) project_role_costs
where pr_pid = [project id selected from dropdown] and pr_cid = [company id selected from dropdown]

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

-- Project role manpower (full year listing)
select month.id, ifnull(manpower, 0)
from projectrole_month
left join month on month.id = projectrole_month.month_id
where projectrole_month.project_role_id = [Specific project_role_id]
order by month.id