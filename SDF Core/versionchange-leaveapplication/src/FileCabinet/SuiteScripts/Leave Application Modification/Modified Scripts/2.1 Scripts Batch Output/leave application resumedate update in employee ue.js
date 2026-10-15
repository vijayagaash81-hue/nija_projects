/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
var QUERY;
define(['N/record', 'N/ui/serverWidget', 'N/search','N/query'], (record, serverWidget, search,query) => {
  QUERY = query;
    const afterSubmit = (context) => {
        try {
            const newRecord = context.newRecord;

            // Get the value of 'custrecord_hris_lve_workresume'
            const workResume = newRecord.getValue('custrecord_hris_lve_workresume');

            if (workResume) {
                // Fetch 'custrecord_hris_lve_actualresumedate' and 'custrecord_hris_lve_employeename'
                const actualResumeDate = newRecord.getValue('custrecord_hris_lve_actualresumedate');
                const employeeId = newRecord.getValue('custrecord_hris_lve_employeename');

                if (actualResumeDate && employeeId) {
                    const employeeRecord = record.load({
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
                        details: `Employee ID: ${employeeId}, Rejoin Date: ` + actualResumeDate
                    });
                    const empcompensql ="select * from customrecord_hris_employee_compen_change \
                    where custrecord_hris_empchange_employee_nam ="+employeeId+" and isinactive ='F'"  
      
                    log.debug('empcompensql', empcompensql);
                 
                    const empcompensqlrecords = getResult(empcompensql);
                   
                    if (empcompensqlrecords.length > 0) {
                      const compenid = empcompensqlrecords[0].id;
                      const EmployeecompenID = record.submitFields({
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
        const queryResults = QUERY.runSuiteQL({
            query: pSQL
        });
        const records = queryResults.asMappedResults();
        return records;
    }

    return {
        afterSubmit: afterSubmit
    };
});
