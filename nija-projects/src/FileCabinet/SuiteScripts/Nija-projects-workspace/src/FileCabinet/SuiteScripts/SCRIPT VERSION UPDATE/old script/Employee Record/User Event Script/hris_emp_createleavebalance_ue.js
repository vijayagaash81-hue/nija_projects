function afterSubmitRecord_createRecord(type){
  nlapiLogExecution('DEBUG', 'Function called');
	if (type == 'create' || type == 'edit') {
		var employeeID = nlapiGetRecordId();
      nlapiLogExecution('DEBUG', 'employeeID',employeeID);
		var employeeRecord = nlapiLoadRecord('employee', employeeID);
		var customform = employeeRecord.getFieldValue('customform');
		nlapiLogExecution('DEBUG','customform',customform);
		if (customform == 167) {
		var empType = employeeRecord.getFieldValue('custentity_hris_empcategory');
		nlapiLogExecution('DEBUG', 'empType',empType);
		var param = {};
		param.custscript_hrisempidtocreateleaves = employeeID;
		
		var status = nlapiScheduleScript('customscript_hris_emp_leavecredit', 'customdeploy_hris_emp_leavecredit',param);
		nlapiLogExecution('DEBUG', 'Scheduler status 1 : ', status);
		nlapiLogExecution('DEBUG','param',param);
		if (status == 'INQUEUE' || status == 'INPROGRESS' || status == 'SCHEDULED') {
			status = nlapiScheduleScript('customscript_hris_emp_leavecredit', 'customdeploy_hris_emp_leavecredit',param);
		}
		nlapiLogExecution('DEBUG', 'Scheduler status 2 : ', status);
		
		var DOC = nlapiGetFieldValue('')
	}
	}
}
