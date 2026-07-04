/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/ui/serverWidget', 'N/search', 'N/query', 'N/runtime','N/format'], function (record, serverWidget, search, query,runtime,format) {

    /**
     * Entry point to add buttons or modify the UI layout before it displays
     */
    function beforeLoad(scriptContext) {
        // Leave Cancel / Leave Settlement  Before Load
        var form = scriptContext.form;
        form.clientScriptModulePath = './hris_resign_cs.js';
        var currentrecord = scriptContext.newRecord;
        var Resignid = currentrecord.id;
        log.debug('Resignid',  Resignid);
        var currentUser = runtime.getCurrentUser();
        var userRole = currentUser.role;
        log.debug('Current User Role', userRole);
        var user = runtime.getCurrentUser().id;
        var approvalstatus = currentrecord.getValue({
            fieldId: 'custrecord_hris_res_approvalstatus'
        });
        log.debug('Approval Status',approvalstatus);
        var exitcheck = currentrecord.getValue({
            fieldId: ' custrecord_hris_res_exitcheck'
        })||false;
     
        var EmpName = currentrecord.getValue('custrecord_hris_res_employee_code');
       
             
             
              var exitformid=currentrecord.getValue({
                fieldId:'custrecord_hris_res_exitinterlink'
              })||'';
              
           
              


        if ( Resignid && approvalstatus ==2 && scriptContext.type == 'view' && exitformid=='' && exitcheck ==false) {
          
           form.addButton({
                    id: 'custpage_exit_form',
                    label: 'Exit Form',
                    // JavaScript execution path on click: attempts to go back in history, or falls back to employee list
                    functionName: 'Exitclick()'
                });

      

        }

   

    }


    /**
     * Entry point to handle backend calculations and child record synchronization
     */
    function afterSubmit(context) {
        try {
            var currentRecord = context.newRecord;
            var currentRecordId = currentRecord.id;

            var currentRecLookup = search.lookupFields({
                type: currentRecord.type,
                id: currentRecordId,
                columns: [
                    'custrecord_hris_res_employee_code',
                    'custrecord_hris_res__type',
                    'custrecord_hris_res_approvalstatus',
                    'custrecord_hris_res_resignation_date'
                ]
            });

            var employeeId = currentRecLookup.custrecord_hris_res_employee_code[0]?.value;
            var employmentStatus = currentRecLookup.custrecord_hris_res__type[0]?.value || currentRecLookup.custrecord_hris_res__type;
            var employmentStatusText = currentRecLookup.custrecord_hris_res__type[0]?.text || currentRecLookup.custrecord_hris_res__type;
      /*            var employmentStatus = currentRecLookup.custrecord_hris_res__type[0]?.value || currentRecLookup.custrecord_hris_res__type;
            var employmentStatusText = currentRecLookup.custrecord_hris_res__type[0]?.text || currentRecLookup.custrecord_hris_res__type;
       */
            var employeeApproval = currentRecLookup.custrecord_hris_res_approvalstatus[0]?.value;
           // var resigndate = currentRecLookup.custrecord_hris_res_resignation_date[0]?.value;
           var resigndate = '';
if (currentRecLookup.custrecord_hris_res_resignation_date) {
    resigndate = currentRecLookup.custrecord_hris_res_resignation_date[0]?.value || currentRecLookup.custrecord_hris_res_resignation_date;
}

            log.debug('Employee ID', employeeId);
            log.debug('Employment Status', employmentStatus);
            log.debug('employmentStatusText',employmentStatusText)
            log.debug("employeeApproval", employeeApproval);
            log.emergency("resigndate",resigndate);
            // Update Employee Record
            if (employeeId && employeeApproval == "2") {
                log.debug("entered emp", employeeId);
                log.debug("entered emp", employeeApproval);
                
           /*      record.submitFields({
                    type: record.Type.EMPLOYEE,
                    id: employeeId,
                    values: {
                        custentity_hris_empemploymentstatus: employmentStatus
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                }); */
                // 1. Load the Employee Record
var employeeRecord = record.load({
    type: record.Type.EMPLOYEE,
    id: employeeId,
    isDynamic: true // Set to true to mimic UI behavior and sourcing, or false for standard mode
});

// 2. Set the Employment Status Field value
employeeRecord.setValue({
    fieldId: 'custentity_hris_empemploymentstatus',
    value: employmentStatus
});
/* employeeRecord.setText({
    fieldId: 'custentity_hris_empemploymentstatus',
    value: employmentStatus
}); */
if(resigndate){

    var parsedResignDate = format.parse({
        value: resigndate,
        type: format.Type.DATE
    });
    
    log.debug('Parsed Date Object for Field', parsedResignDate);
  employeeRecord.setValue({
    fieldId: 'custentity_hirs_empdol',
    value: parsedResignDate
});  
}

// 3. Save the Employee Record
employeeRecord.save({
    enableSourcing: false,
    ignoreMandatoryFields: true
});

                log.debug('Employee Updated Successfully', employeeId);

                record.submitFields({
                    type: currentRecord.type,
                    id: currentRecordId,
                    values: {
                        'custrecord_hris_res_empupdatedcheck': true
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });
                log.debug('Current Record Check Field Updated', 'custrecord_hris_res_empupdatedcheck set to true');
                // ---

                // Search Employee Compensation Change Records
                var employeeCompChangeSearch = search.create({
                    type: 'customrecord_hris_employee_compen_change',
                    filters: [
                        ['custrecord_hris_empchange_employee_nam', 'anyof', employeeId]
                    ],
                    columns: ['internalid']
                });

                var searchResult = employeeCompChangeSearch.run().getRange({
                    start: 0,
                    end: 1000
                });

                searchResult.forEach(function (result) {
                    var empSalaryStructId = result.getValue({
                        name: 'internalid'
                    });

                    log.debug('empSalaryStructId', empSalaryStructId);
                    if(resigndate){

    var parsedResignDate = format.parse({
        value: resigndate,
        type: format.Type.DATE
    });
                    }
                    // Update Employee Salary Structure
                    if (empSalaryStructId) {
                        record.submitFields({
                            type: 'customrecord_hris_employee_compen_change',
                            id: empSalaryStructId,
                            values: {
                                custrecord_hris_empchange_emp_active_sts: employmentStatus,
                                custrecord_hris_empchange_date_of_leave:parsedResignDate
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });

                       log.debug('Employee Compensation Record Updated', empSalaryStructId);
                        // 1. Load the Employee Compensation Change Record
            /* var employeeCompRecord = record.load({
                type: 'customrecord_hris_employee_compen_change',
                id: empSalaryStructId,
                isDynamic: true // Set to true to mimic UI behavior and text sourcing
            });

            // 2. Set the field using the TEXT string (e.g., "Resigned" or "Active")
            employeeCompRecord.setText({
                fieldId: 'custrecord_hris_empchange_emp_active_sts',
                text: employmentStatusText // Make sure this variable holds the text string from your lookup
            });

            // 3. Save the record
            var updatedId = employeeCompRecord.save({
                enableSourcing: false,
                ignoreMandatoryFields: true
            });

            log.debug('Employee Compensation Record Updated via setText', updatedId); */
                    }
                });
            }

        } catch (e) {
            log.error({
                title: 'After Submit Script Error',
                details: e
            });
        }
    }

    return {
        beforeLoad: beforeLoad,
        afterSubmit: afterSubmit
    };

});