/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
var QUERY;
define(['N/record', 'N/ui/serverWidget', 'N/search','N/query'], function (record, serverWidget, search,query) {
  QUERY = query;
    function afterSubmit(context) {
        try {
            var newRecord = context.newRecord;

            // Get the value of 'custrecord_hris_lve_workresume'
            var workResume = newRecord.getValue('custrecord_hris_lve_workresume');

            if (workResume) {
                // Fetch 'custrecord_hris_lve_actualresumedate' and 'custrecord_hris_lve_employeename'
                var actualResumeDate = newRecord.getValue('custrecord_hris_lve_actualresumedate');
                var employeeId = newRecord.getValue('custrecord_hris_lve_employeename');

                if (actualResumeDate && employeeId) {
                    var employeeRecord = record.load({
                        type: record.Type.EMPLOYEE,
                        id: employeeId,
                        isDynamic: true
                    });

                    // Set the rejoin date
                    employeeRecord.setValue({
                        fieldId: 'custentity_hris_rejoin_date',
                        value: actualResumeDate
                    });
                    employeeRecord.setValue({
                        fieldId: 'custentity_hris_empemploymentstatus',
                        value: 1,
                        ignoreFieldChange: true
                      });
                    // Save the record ignoring mandatory fields
                    employeeRecord.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    
                    log.debug({
                        title: 'Employee Record Updated',
                        details: 'Employee ID: ' + employeeId + ', Rejoin Date: ' + actualResumeDate
                    });
                    var empcompensql ="select * from customrecord_hris_employee_compen_change \
                    where custrecord_hris_empchange_employee_nam ="+employeeId+" and isinactive ='F'"  
      
                    log.debug('empcompensql', empcompensql);
                 
                    var empcompensqlrecords = getResult(empcompensql);
                   
                    if (empcompensqlrecords.length > 0) {
                      var compenid = empcompensqlrecords[0].id;
                      var EmployeecompenID = record.submitFields({
                        type: 'customrecord_hris_employee_compen_change',
                        id: compenid,
                        values: {
                          'custrecord_hris_empchange_emp_active_sts': 1
                        }
                      });
      
                    }  
                    log.debug("Info", "EmployeeCompensationStatus also Updated. Internal ID : " + EmployeecompenID);
                } else {
                    log.error({
                        title: 'Missing Data',
                        details: 'Actual Resume Date or Employee ID is missing.'
                    });
                }
            }
        } catch (error) {
            log.error({
                title: 'Error in After Submit',
                details: error.message
            });
        }
    }
    function getResult(pSQL) {
        // log.debug("QUERY", pSQL);
        var queryResults = QUERY.runSuiteQL({
            query: pSQL
        });
        var records = queryResults.asMappedResults();
        return records;
    }

    return {
        afterSubmit: afterSubmit
    };
});
