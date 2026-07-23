{   
    var Flag = 0;
    var context = nlapiGetContext();
    var i_subcontext = context.getFeature('SUBSIDIARIES');
    nlapiLogExecution('DEBUG', 'Test ', 'i_subcontext --> ' + i_subcontext)

    if (i_subcontext == false) {
        Flag = 1;
        nlapiLogExecution('DEBUG', 'In Search', 'Flag=' + Flag);
    }
}





function SourceValueFromEmployeeAfterSubmit(type) {
   
    //if(type=='create' || type=='edit')
    {
        var empSubsidary;
        var customform = nlapiGetFieldValue('customform');
        nlapiLogExecution('DEBUG','customform',customform);
  if (customform == 167) {

        var recordId = nlapiGetRecordId()
        nlapiLogExecution('DEBUG', 'after Submit', 'recordId->=' + recordId);

        var EmployeeId = SearchEmployeeInfo(recordId);
        var EMPDATA = EmployeeId.toString().split('#');
        if (Flag == 0) {
            empSubsidary = searchEmpSubsidary(recordId);

        } else {
            empSubsidary = '';
        }
        var EmpId = EMPDATA[0];
        var Dept = EMPDATA[1];
        var designation = EMPDATA[2];
        var costCenter = EMPDATA[3];
        var DOJ = EMPDATA[4];
        var DOL = EMPDATA[5];
        var grade = EMPDATA[6];
        var Maratil_status = EMPDATA[7];
        var employee_status = EMPDATA[8];
        var Emp_active_status = EMPDATA[9];
        var PT_Check = EMPDATA[10];
        var PT_Loc = EMPDATA[11];
        var ESIC_Check = EMPDATA[12];
        var ESIC_no = EMPDATA[13];
        var PF_Number = EMPDATA[14];
        var EMPCode = EMPDATA[15];
        var EMPGender = EMPDATA[16];
        var PFAppli = EMPDATA[17];
        var loc = EMPDATA[18];
        var EmployeeLegalName = EMPDATA[19];
        var gratuity_applicable = EMPDATA[20];
        var bankName = EMPDATA[21];
        var BankRoutingNo = EMPDATA[22];
        var IbanNumber = EMPDATA[23];
        var bankAccNo = EMPDATA[24];
        var soicalApplicable = EMPDATA[25];

        var labourcardtype = EMPDATA[26];
        var fixed_visaallocation = EMPDATA[27];
        var visaundersubsidiary = EMPDATA[28];
        var personalno = EMPDATA[29];
        var airticketamnt = EMPDATA[30];
        var lms_employeecode = EMPDATA[31];


        
        nlapiLogExecution('DEBUG', 'after Submit', 'EMPGender->=' + EMPGender);
        //Search internal id of employee from employee data change
        var EDCId = SearchEmpDataChange(EmpId);
      nlapiLogExecution('DEBUG', 'EDCId', 'EDCId->=' + EDCId);
        //Load Employee Data change
        if (EDCId != null && EDCId != '' && EDCId != 'undefined') {
            var o_employeeDataChange = nlapiLoadRecord('customrecord_hris_employee_compen_change', EDCId);

            if (Dept != '' && Dept != 'undefined' && Dept != null) {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_department', Dept);
            }
            if (DOJ != '' && DOJ != 'undefined' && DOJ != null) {
                o_employeeDataChange.setFieldValue('custrecord_apm_edc_doj', DOJ);
            }
            if (DOL != '' && DOL != 'undefined' && DOL != null) {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_date_of_leave', DOL);
            }
            if (grade != '' && grade != 'undefined' && grade != null) {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_grade', grade);
            }
            if (designation != '' && designation != 'undefined' && designation != null) {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_designation', designation);
            }
            if (costCenter != '' && costCenter != 'undefined' && costCenter != null) {
                o_employeeDataChange.setFieldValue('custrecord_apm_edc_cost_center', costCenter);
            }
            if (empSubsidary != '' && empSubsidary != 'undefined' && empSubsidary != null) {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_subsidiary', empSubsidary);
            }
            if (Maratil_status != '' && Maratil_status != 'undefined' && Maratil_status != null) {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_marital_status', Maratil_status);
            }
            if (employee_status != '' && employee_status != 'undefined' && employee_status != null) {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_emp_status', employee_status);
            }
            if (Emp_active_status != '' && Emp_active_status != 'undefined' && Emp_active_status != null) {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_emp_active_sts', Emp_active_status);
            }
            if (PT_Check != '' && PT_Check != 'undefined' && PT_Check != null) {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_pt_appicable', PT_Check);
            }
            if (PT_Loc != '' && PT_Loc != 'undefined' && PT_Loc != null) {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_pt_location', PT_Loc);
            }
            if (ESIC_Check != '' && ESIC_Check != 'undefined' && ESIC_Check != null) {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_esic_applicabe', ESIC_Check);
            }
            if (ESIC_no != '' && ESIC_no != 'undefined' && ESIC_no != null) {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_esic_num', ESIC_no);
            }
            if (PF_Number != '' && PF_Number != 'undefined' && PF_Number != null) {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_pf_number', PF_Number);
            }
            if (EMPCode != '' && EMPCode != 'undefined' && EMPCode != null) {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_emp_code', EMPCode);
            }
            if (EMPGender != '' && EMPGender != 'undefined' && EMPGender != null) {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_gender', EMPGender);
            }
            if (PFAppli != '' && PFAppli != 'undefined' && PFAppli != null) {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_pf_applicable', PFAppli);
            }
            if (loc != '' && loc != 'undefined' && loc != null) {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_location', loc);
            }
            if (gratuity_applicable != '' && gratuity_applicable != 'undefined' && gratuity_applicable != null) {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_gratuity_app', gratuity_applicable);
            }
            if (EmployeeLegalName != '' && EmployeeLegalName != 'undefined' && EmployeeLegalName != null) //Condition Added By Onkar
            {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_emp_legal_name', EmployeeLegalName);
            }
            if (bankName != '' && bankName != 'undefined' && bankName != null) //Condition Added By Onkar
            {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_bank_name', bankName);
            }
            if (IbanNumber != '' && IbanNumber != 'undefined' && IbanNumber != null) //Condition Added By Onkar
            {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_iban_num', IbanNumber);
            }
            if (BankRoutingNo != '' && BankRoutingNo != 'undefined' && BankRoutingNo != null) //Condition Added By Onkar
            {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_bank_route_no', BankRoutingNo);
            }
            if (bankAccNo != '' && bankAccNo != 'undefined' && bankAccNo != null) //Condition Added By Onkar
            {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_bank_acc_no', bankAccNo);
            }
            if (soicalApplicable != '' && soicalApplicable != 'undefined' && soicalApplicable != null) {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_social_insu_ap', soicalApplicable);
            }


            if (labourcardtype != '' && labourcardtype != 'undefined' && labourcardtype != null) {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_labour_type', labourcardtype);
            }
            if (fixed_visaallocation != '' && fixed_visaallocation != 'undefined' && fixed_visaallocation != null) {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_visa_allow_fix', fixed_visaallocation);
            }
            if (visaundersubsidiary != '' && visaundersubsidiary != 'undefined' && visaundersubsidiary != null) {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_visa_allo_wps', visaundersubsidiary);
            }
            if (personalno != '' && personalno != 'undefined' && personalno != null) {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_mol_id', personalno);
            }
            if (airticketamnt != '' && airticketamnt != 'undefined' && airticketamnt != null) {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_air_tck_amt', airticketamnt);
            }
            nlapiLogExecution('DEBUG', 'lms_employeecode', 'lms_employeecode=' + lms_employeecode);
            if (lms_employeecode != '' && lms_employeecode != 'undefined' && lms_employeecode != null) {
                o_employeeDataChange.setFieldValue('custrecord_hris_empchange_emp_code', lms_employeecode); //line added by narasimhulu 
            }
            nlapiSubmitRecord(o_employeeDataChange, false, true);
        }
    }

    return true;
    }
}

// END AFTER SUBMIT ===============================================




// BEGIN FUNCTION ===================================================
//Get Employee Information
function SearchEmployeeInfo(recordId) {
    nlapiLogExecution('DEBUG', 'In Search', 'recordId=' + recordId);
    var Filters = new Array();
    Filters.push(new nlobjSearchFilter('internalid', null, 'is', recordId));

    var Column = new Array();
    Column.push(new nlobjSearchColumn('internalid'));
    Column.push(new nlobjSearchColumn('entityid'));
    Column.push(new nlobjSearchColumn('department'));
    Column.push(new nlobjSearchColumn('custentity_hris_empdesignation'));
    Column.push(new nlobjSearchColumn('class'));
    Column.push(new nlobjSearchColumn('hiredate'));
    Column.push(new nlobjSearchColumn('custentity_hirs_empdol'));
    Column.push(new nlobjSearchColumn('custentity_emp_grade_'));
    Column.push(new nlobjSearchColumn('maritalstatus'));
    Column.push(new nlobjSearchColumn('employeestatus'));
    Column.push(new nlobjSearchColumn('custentity_hris_empemploymentstatus'));
    Column.push(new nlobjSearchColumn('custentity_hris_emp_isptapplicable'));
    Column.push(new nlobjSearchColumn('custentity_hris_empptlocation'));
    Column.push(new nlobjSearchColumn('custentity_hris_isesiapplicable'));
    Column.push(new nlobjSearchColumn('custentity_hris_esinumber'));
    Column.push(new nlobjSearchColumn('custentity_hris_pfnumber'));
    Column.push(new nlobjSearchColumn('custentity_hris_empcode'));
    Column.push(new nlobjSearchColumn('custentity_hris_empgender'));
    Column.push(new nlobjSearchColumn('location'));
    Column.push(new nlobjSearchColumn('custentity_hris_pfapplicable'));
    Column.push(new nlobjSearchColumn('custentity_hris_emplegalname'));
    Column.push(new nlobjSearchColumn('custentity_hris_empiseosapplicable')); //Column Added By Onkar
    Column.push(new nlobjSearchColumn('custentity_hris_empbankname'));
    Column.push(new nlobjSearchColumn('custentity_hris_empbankroutingno'));
    Column.push(new nlobjSearchColumn('custentity_hris_empbankibanacctno'));
    Column.push(new nlobjSearchColumn('custentity_hris_emp_bankaccno'));
    Column.push(new nlobjSearchColumn('custentity_hris_empsocialinsurapplicable'));

    Column.push(new nlobjSearchColumn('custentity_hris_emp_labcontract_type'));
    Column.push(new nlobjSearchColumn('custentity_hris_empvisaallocationfixed'));
    Column.push(new nlobjSearchColumn('custentity_hris_empvisaallocationmoltype'));
    Column.push(new nlobjSearchColumn('custentity_hris_emp_molpersonid'));
    Column.push(new nlobjSearchColumn('custentity_hris_empairticketamt'));
    Column.push(new nlobjSearchColumn('custentity_hris_empcode'));

    var EmpSearchResult = nlapiSearchRecord('employee', null, Filters, Column);
    if (EmpSearchResult != null) {
        var EmployeeId = EmpSearchResult[0].getValue('internalid');
        var department = EmpSearchResult[0].getValue('department');
        var designation = EmpSearchResult[0].getValue('custentity_hris_empdesignation');
        var costCenter = EmpSearchResult[0].getValue('class');
        var DOJ = EmpSearchResult[0].getValue('hiredate');
        var DOL = EmpSearchResult[0].getValue('custentity_hirs_empdol');
        var grade = EmpSearchResult[0].getValue('custentity_emp_grade_');
       // var martial_status = EmpSearchResult[0].getValue('maritalstatus');
       
        var martial_status = EmpSearchResult[0].getValue('custentity_hris_empmaritalstatus');
        var employee_status = EmpSearchResult[0].getValue('employeestatus');
        var Emp_active_status = EmpSearchResult[0].getValue('custentity_hris_empemploymentstatus');
        var pt_applicable = EmpSearchResult[0].getValue('custentity_hris_emp_isptapplicable');
        var pt_location = EmpSearchResult[0].getValue('custentity_hris_empptlocation');
        var esic_check = EmpSearchResult[0].getValue('custentity_hris_isesiapplicable');
        var esic_no = EmpSearchResult[0].getValue('custentity_hris_esinumber');
        var pf_no = EmpSearchResult[0].getValue('custentity_hris_pfnumber');
        var emp_code = EmpSearchResult[0].getValue('custentity_hris_empcode');
        var Gender = EmpSearchResult[0].getValue('custentity_hris_empgender');
        var PFApplicable = EmpSearchResult[0].getValue('custentity_hris_pfapplicable');
        var loc = EmpSearchResult[0].getValue('location');
        var gratuity_applicable = EmpSearchResult[0].getValue('custentity_hris_empiseosapplicable');
        var EmployeeLegalName = EmpSearchResult[0].getValue('custentity_hris_emplegalname'); //Code Added By Onkar
        var bankName = EmpSearchResult[0].getValue('custentity_hris_empbankname');
        var BankRoutingNo = EmpSearchResult[0].getValue('custentity_hris_empbankroutingno');
        var IbanNumber = EmpSearchResult[0].getValue('custentity_hris_empbankibanacctno');
        var bankAccNo = EmpSearchResult[0].getValue('custentity_hris_emp_bankaccno');
        var soicalApplicable = EmpSearchResult[0].getValue('custentity_hris_empsocialinsurapplicable');

        var labourcardtype = EmpSearchResult[0].getValue('custentity_hris_emp_labcontract_type');
        var fixed_visaallocation = EmpSearchResult[0].getValue('custentity_hris_empvisaallocationfixed');
        var visaundersubsidiary = EmpSearchResult[0].getValue('custentity_hris_empvisaallocationmoltype');
        var personalno = EmpSearchResult[0].getValue('custentity_hris_emp_molpersonid');
        var airticketamnt = EmpSearchResult[0].getValue('custentity_hris_empairticketamt');
        var _lms_employeecode = EmpSearchResult[0].getValue('custentity_hris_empcode');


    }
    return EmployeeId + "#" + department + "#" + designation + "#" + costCenter + "#" + DOJ + "#" + DOL + "#" + grade + "#" + martial_status + "#" + employee_status + "#" + Emp_active_status + "#" + pt_applicable + "#" + pt_location + "#" + esic_check + "#" + esic_no + "#" + pf_no + "#" + emp_code + "#" + Gender + "#" + PFApplicable + "#" + loc + "#" + EmployeeLegalName + "#" + gratuity_applicable + "#" + bankName + "#" + BankRoutingNo + "#" + IbanNumber + '#' + bankAccNo + "#" + soicalApplicable + "#" + labourcardtype + "#" + fixed_visaallocation + "#" + visaundersubsidiary + "#" + personalno + "#" + airticketamnt + "#" + _lms_employeecode;
}

function searchEmpSubsidary(recordId) {
    var subsidiary
    var Filters = new Array();
    Filters.push(new nlobjSearchFilter('internalid', null, 'is', recordId));
    var Column = new Array();
    Column.push(new nlobjSearchColumn('subsidiary'));
    var EmpSearchResult = nlapiSearchRecord('employee', null, Filters, Column);
    if (EmpSearchResult != null) {
        subsidiary = EmpSearchResult[0].getValue('subsidiary');
    }
    return subsidiary;
}

//Search for employee data change
function SearchEmpDataChange(EmpId) {
    var EmpDataChangeId;
    var Filters = new Array();
    Filters.push(new nlobjSearchFilter('custrecord_hris_empchange_employee_nam', null, 'is', EmpId));
    var Column = new Array();
    Column.push(new nlobjSearchColumn('internalid'));
    var EmpDataChangeSearchResult = nlapiSearchRecord('customrecord_hris_employee_compen_change', null, Filters, Column);
    if (EmpDataChangeSearchResult != null) {
        EmpDataChangeId = EmpDataChangeSearchResult[0].getValue('internalid');
    }
    return EmpDataChangeId;
}
// END FUNCTION =====================================================