/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(["N/log", "N/runtime", "N/record", "N/query", 'N/format'], function (log, runtime, record, query, format) {
    function getInputData() {
        var scriptObj = runtime.getCurrentScript();
        //  var recordId = scriptObj.getParameter({ name: "custscript_your_param" });
        var recordId = 2;
        var empCompChangeIds=[];
          var EmpCompensationSQL =
          "SELECT id FROM customrecord_hris_employee_compen_change WHERE id=1543 \
           and  custrecord_hris_empchange_emp_pay_pro_gp = 204 and isinactive='F'";
        log.debug('EmpCompensationSQL',EmpCompensationSQL)   
        
        var resultSet = query.runSuiteQL({ query: EmpCompensationSQL });
        var tsResult = resultSet.asMappedResults();
        
        if (tsResult.length > 0 && tsResult[0].id) {
             for (var i = 0; i < tsResult.length; i++) {
        var recId = tsResult[i].id;  // or tsResult[i].getValue('internalid') if it’s a search.Result
        empCompChangeIds.push(recId);
    }
            
        
          log.debug("EmpcompChangeID",  empCompChangeIds);
        }
        log.audit("getInputData - Received Record ID",  empCompChangeIds);

        return  empCompChangeIds;
    }

    function map(context) {
        try {
            var recordId = context.value;
            log.debug("map - Processing Record ID", recordId);

            // Load Employee Compensation History Record
            var loadedrec = record.load({
                type: "customrecord_hris_employee_compen_change",
                id: recordId,
                isDynamic: true,
            });

            var EmployeeId = loadedrec.getValue({
                fieldId: "custrecord_hris_empchange_employee_nam",
            });
            log.debug("EmployeeId", EmployeeId);

            var paygroup = loadedrec.getValue({
                fieldId: "custrecord_hris_empchange_emp_pay_pro_gp"
            });
            log.debug('paygroup', paygroup);
            paygroup =215; //203; // 4
            loadedrec.setValue({
                fieldId: 'custrecord_hris_empchange_emp_pay_pro_gp',
                value: paygroup,
                ignoreFieldChange: true
            });
            var Linecountcomp = loadedrec.getLineCount({
                sublistId: "recmachcustrecord_hris_employee_data_change"
            });
            log.audit('Linecountcomp', Linecountcomp)
            for (var t = 0; t < Linecountcomp; t++) {

                loadedrec.selectLine({
                    sublistId: "recmachcustrecord_hris_employee_data_change",
                    line: t
                });
                var component = loadedrec.getSublistValue({
                    sublistId: "recmachcustrecord_hris_employee_data_change",
                    fieldId: "custrecord_hris_cde_payroll_component",
                    line: t
                });
                log.debug('component', component)
                var componentseq = loadedrec.getSublistValue({
                    sublistId: "recmachcustrecord_hris_employee_data_change",
                    fieldId: "custrecord_hris_payroll_component_seq_no",
                    line: t
                });
                log.debug('componentseq', componentseq)
                var componentText = loadedrec.getSublistText({
                    sublistId: "recmachcustrecord_hris_employee_data_change",
                    fieldId: "custrecord_hris_cde_payroll_component",
                    line: t
                });
                log.debug('componentText', componentText)

                var lineInternalId = loadedrec.getSublistValue({
                    sublistId: "recmachcustrecord_hris_employee_data_change",
                    fieldId: "id",  // special field ID for subrecord internal ID
                    line: t
                });
            

                var componentsql =
                    "SELECT id FROM customrecord_hris_payroll_component WHERE  isinactive='F'\
           and custrecord_hris_pay_process_group="+paygroup+" and custrecord_hris__sequence_no_ = " +
                    componentseq;

                var resultSet = query.runSuiteQL({ query: componentsql });
                var tsResult = resultSet.asMappedResults();

                if (tsResult.length > 0 && tsResult[0].id) {
                    var paycomponent = tsResult[0].id;
                    log.debug("paycomponent", paycomponent);
                }
                    var childloadedrec = record.load({
                    type: "customrecord_hris_compensation_details_e",
                    id: lineInternalId,
                    isDynamic: true,
                });
                childloadedrec.setValue({
                    fieldId: 'custrecord_hris_cde_process_group',
                    value: paygroup,
                    ignoreFieldChange: false
                });
                childloadedrec.setValue({
                    fieldId: 'custrecord_hris_cde_payroll_component',
                    value: paycomponent,
                    ignoreFieldChange: false
                });


             var savedchildid = childloadedrec.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true,

                });
              
                log.debug("savedchildid", savedchildid);
                /*  loadedrec.setSublistText({
                     sublistId: 'recmachcustrecord_hris_employee_data_change',
                     fieldId: 'custrecord_hris_cde_payroll_component',
                     line: t,
                     text: componentText,
                     ignoreFieldChange: true
                 }); */




                /*   loadedrec.setCurrentSublistText({
                      sublistId: 'recmachcustrecord_hris_employee_data_change',
                      fieldId: 'custrecord_hris_cde_payroll_component',
                      text: componentText,
                      ignoreFieldChange: true
                  }); */

                /*  loadedrec.setSublistValue({
                     sublistId: 'recmachcustrecord_hris_employee_data_change',
                     fieldId: 'custrecord_hris_cde_process_group',
                     line: t,
                     value: 4,
                     ignoreFieldChange: false
                 }); */
                /*  loadedrec.setSublistText({
                     sublistId: 'recmachcustrecord_hris_employee_data_change',
                     fieldId: 'custrecord_hris_cde_payroll_component',
                     line: t,
                     text: componentText,
                     ignoreFieldChange: true
                 }); */
                loadedrec.commitLine({
                    sublistId: 'recmachcustrecord_hris_employee_data_change'
                });

            }
             var savedIdfornew = loadedrec.save({
                enableSourcing: true,
                ignoreMandatoryFields: true,

            }); 
           
           log.debug("Saved without sublist", savedIdfornew);
            // Pass both recordId and EmployeeId
        }
        catch (e) {
            log.error("Error in map Script", e.toString());
        }


    }



    return {
        getInputData: getInputData,
        map: map,

    };
});
