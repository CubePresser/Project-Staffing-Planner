-- Remove project

delete from project where id = [project id selected from dropdown];

-- Remove Team

delete from team where id = [team id selected from dropdown];

-- Remove Role

delete from role where id = [role id selected from dropdown];

-- Remove Role-Company relationship

delete from role_company where role_id = [role id selected from dropdown] and company_id = [company id selected from dropdown];

-- Remove location

delete from location where id = [location id selected from dropdown];

-- Remove company

delete from company where id = [company id selected from dropdown];

-- Remove a company-location relationship

delete from company_location where company_id = [company id selected from dropdown] and location_id = [location id selected from dropdown];

-- Remove a project role

delete from project_role where id = [project role id selected from dropdown];