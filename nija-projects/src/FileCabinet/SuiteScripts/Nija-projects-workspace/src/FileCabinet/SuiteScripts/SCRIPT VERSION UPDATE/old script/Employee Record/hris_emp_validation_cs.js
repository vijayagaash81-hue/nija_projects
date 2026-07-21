function leaving_date_saveRecord() {
    debugger;
    var emp_status = nlapiGetFieldValue('employeestatus')
    var customform = nlapiGetFieldValue('customform');
    nlapiLogExecution('DEBUG', 'customform', customform);

    if (customform == 131) {
        if (emp_status == 6 || emp_status == 7) {
            var date_leaving = nlapiGetFieldValue('custentity_hirs_empdol')

            if (date_leaving == '' || date_leaving == 'undefined' || date_leaving == null) {
                alert('Please enter the date of leaving of employee')
                return false
            }
        }
        var PT_Check = nlapiGetFieldValue('custentity_hris_emp_isptapplicable');

        if (PT_Check == 'T') {
            var PT_Loc = nlapiGetFieldValue('custentity_hris_empptlocation');

            if (PT_Loc == '' || PT_Loc == 'undefined' || PT_Loc == null) {
                alert('Please enter PT Location');
                return false;
            }

        }

        else {
            return true;
        }
    }
    else {
        return true;
    }
}

function searchEmployeeIdduplicate(employeeIdcheck) {


    var EmpName;
    var PFNo;
    var Filters = new Array();
    Filters.push(new nlobjSearchFilter('custentity_hris_empcode', null, 'is', employeeIdcheck));
    var Colm = new Array();
    Colm.push(new nlobjSearchColumn('internalid'));
    Colm.push(new nlobjSearchColumn('custentity_hris_empcode'));
    var searchEmpRec = nlapiSearchRecord('employee', null, Filters, Colm);

    {
        var empId = searchEmpRec[0].getValue('custentity_hris_empcode')
        alert('empId====searchEmpRec' + empId + '  ' + searchEmpRec);
        return searchEmpRec;
    }

}



