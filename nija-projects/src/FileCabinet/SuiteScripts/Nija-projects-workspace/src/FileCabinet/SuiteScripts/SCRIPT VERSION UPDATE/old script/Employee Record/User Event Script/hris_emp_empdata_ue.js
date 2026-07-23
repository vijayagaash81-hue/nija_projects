function employeeDataRecordCreation(type){
  try {
	  if(type=='create' || type=='edit'){
	  var empID = nlapiGetRecordId();
	  nlapiLogExecution('DEBUG', 'empID ',  empID );
	  var customform = nlapiGetFieldValue('customform');
	
	nlapiLogExecution('DEBUG','customform',customform);
	if (customform == 167) {
	  var empWeeklyOff = nlapiGetFieldValues('custentity_hris_empweeklyoffs');
	  if(!empWeeklyOff){
		  empWeeklyOff = '';
	  }
	  var empHoliday  =  nlapiGetFieldValues('custentity_hris_empholidays');
	  if(!empHoliday){
		  empHoliday = '';
	  }
	  nlapiLogExecution('DEBUG', ' empHoliday ',  empHoliday);
	  var empLocation  =  nlapiGetFieldValue('location');
	  if(!empLocation){
		  empLocation = '';
	  }
	  var empEmail  =  nlapiGetFieldValue('email');
	  if(!empEmail){
		  empEmail = '';
	  }
	  var hod  =  nlapiGetFieldValue('custentity_hris_emphod');
	  if(!hod){
		  hod = '';
	  }
	  var lineMgr  =  nlapiGetFieldValue('custentity_hris_emplinemanger');
	  if(!lineMgr){
		  lineMgr = '';
	  }
	  var leaveAdmin  =  nlapiGetFieldValue('supervisor');
	  if(!leaveAdmin){
		  leaveAdmin = '';
	  }
	  var doj  =  nlapiGetFieldValue('hiredate');
	  if(!doj){
		  doj = '';
	  }
	  
	  var filter = [];
	  var column = [];
	 
	 
	 filter.push(new nlobjSearchFilter('custrecord_hris_eds_employee', null, 'anyof', empID))
	 filter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'))
	 
	 column.push(new nlobjSearchColumn('internalid'));
	 column.push(new nlobjSearchColumn('custrecord_hris_eds_employee'));
	 column.push(new nlobjSearchColumn('custrecord_hris_eds_employeeholidays'));
	 column.push(new nlobjSearchColumn('custrecord_hris_eds_employeeweeklyoff'));
	 column.push(new nlobjSearchColumn('custrecord_hris_eds_employeelocation'));
	 
	 var ed_search = nlapiSearchRecord('customrecord_hris_employeedatasourcing', null, filter, column);
	 if(ed_search){
		 var edRecordID = ed_search[0].getValue('internalid');
		 var edRecord = nlapiLoadRecord('customrecord_hris_employeedatasourcing', edRecordID);
		 if(empHoliday)
		 {
		     edRecord.setFieldValue('custrecord_hris_eds_employeeholidays', empHoliday);
		 }
		 else
		 {
			 edRecord.setFieldValue('custrecord_hris_eds_employeeholidays', '');
		 }
		 if(empWeeklyOff)
		 {
		     edRecord.setFieldValue('custrecord_hris_eds_employeeweeklyoff', empWeeklyOff);
		 }
		 else
		 {
			 edRecord.setFieldValues('custrecord_hris_eds_employeeweeklyoff', '');
		 }
			 edRecord.setFieldValue('custrecord_hris_eds_employeelocation', empLocation)
			 edRecord.setFieldValue('custrecord_hris_eds_employeeemaill', empEmail)
			 edRecord.setFieldValue('custrecord_hris_eds_headofdepartment', hod)
			 edRecord.setFieldValue('custrecord_hris_eds_supervisor', lineMgr)
			 edRecord.setFieldValue('custrecord_hris_eds_leaveadmin', leaveAdmin)
			 edRecord.setFieldValue('custrecord_hris_eds_hiredate', doj)
		 
		     var existingEDRecord = nlapiSubmitRecord(edRecord);
		     nlapiLogExecution('DEBUG', 'existingEDRecord', existingEDRecord);
		     
		 
	 }
	 else{
		 var edRecord = nlapiCreateRecord('customrecord_hris_employeedatasourcing');
		 edRecord.setFieldValue('custrecord_hris_eds_employee', empID)
		  if(empHoliday || empHoliday =='')
		 {
		     edRecord.setFieldValue('custrecord_hris_eds_employeeholidays', empHoliday);
		 }
		 if(empWeeklyOff || empWeeklyOff =='')
		 {
		     edRecord.setFieldValue('custrecord_hris_eds_employeeweeklyoff', empWeeklyOff);
		 }
		 edRecord.setFieldValue('custrecord_hris_eds_employeelocation', empLocation)
		 edRecord.setFieldValue('custrecord_hris_eds_employeeemaill', empEmail)
	     edRecord.setFieldValue('custrecord_hris_eds_headofdepartment', hod)
	     edRecord.setFieldValue('custrecord_hris_eds_supervisor', lineMgr)
	     edRecord.setFieldValue('custrecord_hris_eds_leaveadmin', leaveAdmin)
		 edRecord.setFieldValue('custrecord_hris_eds_hiredate', doj)
		 
		 var createdEDRecord = nlapiSubmitRecord(edRecord);
		 nlapiLogExecution('DEBUG', 'Created ED Record', createdEDRecord);
	 
	 }//else{
	}
   } //if(type=='create' || type=='edit'){ 

  } catch (e) {
	nlapiLogExecution('DEBUG', 'ERROR', e.message);
  }
 }
