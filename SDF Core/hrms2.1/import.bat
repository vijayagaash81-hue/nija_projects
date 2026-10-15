@echo off

for %%i in (
    customrecord_attach_docs
    customrecord_hris_asset_req_form
    customrecord_hris_dependent_documents
    customrecord_hris_emp_employee_dependent
    customrecord_hris_emp_id_info
    customrecord_hris_emp_payslip_monh
    customrecord_hris_emp_qualification
    customrecord_hris_emp_skill
    customrecord_hris_empallocationtransfer
    customrecord_hris_empchange_loan_applicn
    customrecord_hris_empdependentiddetails
    customrecord_hris_empdocumentmanagement
    customrecord_hris_employee_compen_change
    customrecord_hris_employee_compensation
    customrecord_hris_leavebalance
    customrecord_hris_lveapprovalhistory
    customrecord_hris_monthlysalinput
    customrecord_hris_staff_employee_eva
    customrecord_hris_staff_evaluation_form
    customrecord_hris_unpaid_arrear_entry
    customrecord_hris_unpaid_leave_entry
    customrecord_hris_work_expirence
    custentity_hris_employeepaymentmode
    custsublist_9_2772245_869
    cseg_hris_empdeptt_
) do (
    suitecloud object:import --type ALL --destinationfolder "/Objects" --scriptid %%i
)