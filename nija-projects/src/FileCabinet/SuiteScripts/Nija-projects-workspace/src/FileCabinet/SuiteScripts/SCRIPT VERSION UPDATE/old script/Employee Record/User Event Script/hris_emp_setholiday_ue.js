function SourceValueFromEmployeeAfterSubmit(type) {

	try {
		var recordId = nlapiGetRecordId()
		//nlapiLogExecution('DEBUG', 'after Submit', 'recordId->=' + recordId);

		o_employee = nlapiLoadRecord('employee', recordId)
		var customform = o_employee.getFieldValue('customform');
		nlapiLogExecution('DEBUG', 'customform', customform);
		if (customform == 167) {
			var emp_location = o_employee.getFieldValue('custentity_hris_empworkinglocation')
			var holidayList = new Array()
			holidayList = SearchHoildays(emp_location);
			nlapiLogExecution('DEBUG', 'after Submit', 'holidayList->=' + holidayList);
			o_employee.setFieldValues('custentity_hris_empholidays', holidayList)
			nlapiSubmitRecord(o_employee, false, true);

			return true;
		}
	}
	catch (e) {
		nlapiLogExecution('DEBUG', 'In Search', 'e.getDetails()' + e.getDetails());
	}


}


function SearchHoildays(emp_location) {

	var HolidayList = new Array();
	var HolidayLt = new Array();
	nlapiLogExecution('DEBUG', 'In Search', 'emp_location=' + emp_location);
	/* var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_holi_region', null, 'anyof', emp_location));
	Filters.push(new nlobjSearchFilter('isinactive',"is","F"));
	
	var Column = new Array();
	Column.push(new nlobjSearchColumn('internalid'));
	// Column.push(new nlobjSearchColumn('entityid'));	 

	var EmpSearchResult = nlapiSearchRecord('customrecord_hris_holiday_master', null, Filters, Column);
	// nlapiLogExecution('DEBUG', 'In Search', 'EmpSearchResult=' + EmpSearchResult.length);
	 */

	var EmpSearchResult = nlapiSearchRecord("customrecord_hris_holiday_master", null,
		[
			["isinactive", "is", "F"],
			"AND",
			["custrecord_hris_holi_region", "anyof", emp_location]
		],
		[
			new nlobjSearchColumn("internalid")
		]
	);
	if (EmpSearchResult != null) {
		for (HoL = 0; HoL < EmpSearchResult.length; HoL++) {
			HolidayList = EmpSearchResult[HoL].getValue('internalid');
			nlapiLogExecution('DEBUG', 'after Submit', 'HolidayList->=' + HolidayList);
			HolidayLt.push(HolidayList)
		}
	}
	return HolidayLt;
}
