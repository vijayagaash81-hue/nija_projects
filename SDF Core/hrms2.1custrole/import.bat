@echo off

for %%i in (
customrole
customrole_hris_hr_admin
customrole_hris_admin_del
) do (
    suitecloud object:import --type ALL --destinationfolder "/Objects" --scriptid %%i
)