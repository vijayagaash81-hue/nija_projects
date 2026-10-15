@echo off

for %%i in (
customlist_njt_hris_paymode
customlist_hris_request_type_for_vehic
customlist_hris_payroll_payment_mode
customlist_hris_posted_by_list
cseg_hris_emploc
cseg_hris_empsubdpt
cseg_hris_empdept
cseg_njt_seg_proj
cseg_njt_seg_emp
cseg_njt_seg_pros

) do (
    suitecloud object:import --type ALL --destinationfolder "/Objects" --scriptid %%i
)