function EmployeeButtonBeforeload(type, form) {
	var contextObj = nlapiGetContext();
	var role = nlapiGetRole()
	var Empid = nlapiGetRecordId();
	if (type == 'view') {
		if (role != 3) {
			var newType = contextObj.getExecutionContext();
			if (newType == 'userinterface') {

				if (Empid != null) {
					//Load settlemnt record
					var EmpObj = nlapiLoadRecord('employee', Empid);
					var customform = EmpObj.getFieldValue('customform');
					nlapiLogExecution('DEBUG', 'customform', customform);
					if (customform == 167) {
						var Emp_status = EmpObj.getFieldValue('isinactive')//T
						nlapiLogExecution('DEBUG', 'EmployeeButtonBeforeload()', 'Emp_status*****' + Emp_status);
						if (Emp_status == 'T') {
							var EditButtonOBJ = form.getButton('edit');
							EditButtonOBJ.setDisabled(true);



						}
					}
				}
			}
		}
	}

	if (type == 'edit') {
		if (role != 3) {
			var newType = contextObj.getExecutionContext();
			nlapiLogExecution('DEBUG', 'custpage_confsettlButton', 'newType  ==' + newType);
			if (newType == 'userinterface') {

				var EmpObj = nlapiLoadRecord('employee', Empid);
				var Emp_status = EmpObj.getFieldValue('isinactive')
				var customform = EmpObj.getFieldValue('customform');
				nlapiLogExecution('DEBUG', 'customform', customform);
				if (customform == 167) {
					nlapiLogExecution('DEBUG', 'EmployeeButtonBeforeload()', 'Emp_status*****' + Emp_status);
					if (Emp_status == 'T') {
						throw 'Confirm settlement has been done for this employee. You cannot edit this record';
					}
				}
			}
		}
	}
}
