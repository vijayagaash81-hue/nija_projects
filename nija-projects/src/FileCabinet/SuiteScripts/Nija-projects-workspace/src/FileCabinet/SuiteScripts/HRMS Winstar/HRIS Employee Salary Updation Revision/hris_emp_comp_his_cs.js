/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */

define([
    "N/search",
    "N/query",
    "N/format",
    "N/email",
    "N/record",
    "N/currentRecord",
    "N/url",
    "N/runtime",
    "N/ui/dialog",
], function (
    search,
    query,
    format,
    email,
    record,
    currentRecord,
    url,
    runtime,
    dialog
) {

   function pageInit(context) {
    debugger;
        
 
        
    }
    
    function fieldChanged(context) {
        debugger;
        var currentRecord = context.currentRecord;
        if (context.fieldId == "custrecord_hris_employee_name_") {
            var EmployeID = currentRecord.getValue({
                fieldId: "custrecord_hris_employee_name_"
            })||'';

            // Checking already pending compensation change is there
            if (EmployeID !='') {
                var EmpcompChangehistoryID = null;
                var EmpCompensationhistorySQL =
                    "SELECT * FROM customrecord_hris_employee_compensation WHERE custrecord_hris_emphis_approvalstatus =1 and isinactive='F' and custrecord_hris_employee_name_ = " +
                    EmployeID;

                var resultSet = query.runSuiteQL({ query: EmpCompensationhistorySQL });
                var tsResult = resultSet.asMappedResults();

                if (tsResult.length > 0 && tsResult[0].id) {
                    EmpcompChangehistoryID = tsResult[0].id;


                    log.debug("EmpcompChangehistoryID", EmpcompChangehistoryID);
                }
                if (EmpcompChangehistoryID) {
                    alert('A salary compensation update or revision is already pending approval.')
                    currentRecord.setValue({
                        fieldId: "custrecord_hris_employee_name_",
                        value: '',
                        ignoreFieldChange: false
                    });
                    return false;
                }


                //
                var EmpcompChangeID = null;
                var EmpCompensationSQL =
                    "SELECT * FROM customrecord_hris_employee_compen_change WHERE isinactive='F' and custrecord_hris_empchange_employee_nam = " +
                    EmployeID;

                var resultSet = query.runSuiteQL({ query: EmpCompensationSQL });
                var tsResult = resultSet.asMappedResults();

                if (tsResult.length > 0 && tsResult[0].id) {
                    EmpcompChangeID = tsResult[0].id;
                    var emppaygroup = tsResult[0].custrecord_hris_empchange_emp_pay_pro_gp;

                    log.debug("EmpcompChangeID", EmpcompChangeID);
                }
                if (EmpcompChangeID && emppaygroup) {

                    currentRecord.setValue({
                        fieldId: "custrecord_hris_employee_pay_process_gro",
                        value: emppaygroup,
                        ignoreFieldChange: false
                    });
                }
                else{

                     currentRecord.setValue({
                        fieldId: "custrecord_hris_employee_pay_process_gro",
                        value: '',
                        ignoreFieldChange: false
                    });
                }


            }

        }

        if (context.fieldId == "custrecord_hris_employee_pay_process_gro") {

            var paygroup = currentRecord.getValue({
                fieldId: "custrecord_hris_employee_pay_process_gro"
            });
            var EmployeID = currentRecord.getValue({
                fieldId: "custrecord_hris_employee_name_"
            });
            
            var subsidiary = currentRecord.getValue({
                fieldId: "custrecord_hris__subsidiary_"
            });
           
               var department = currentRecord.getValue({
                fieldId: " custrecord_hris__department_o"
            });
            var EmpcompChangeID = null;

            var EmpCompensationSQL =
                "SELECT id FROM customrecord_hris_employee_compen_change WHERE custrecord_hris_empchange_employee_nam = " +
                EmployeID;

            var resultSet = query.runSuiteQL({ query: EmpCompensationSQL });
            var tsResult = resultSet.asMappedResults();

            if (tsResult.length > 0 && tsResult[0].id) {
                EmpcompChangeID = tsResult[0].id;
                log.debug("EmpcompChangeID", EmpcompChangeID);
            }
            var lineCount = currentRecord.getLineCount({
                sublistId: "recmachcustrecord_hris_comhis_compenhistoryid"
            });
            if (lineCount > 0) {
                for (var i = lineCount - 1; i >= 0; i--) {
                    currentRecord.removeLine({
                        sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                        line: i,
                        ignoreRecalc: true // optional, improves performance if you don't need recalculation
                    });
                }
            }
            if (EmpcompChangeID && paygroup ) {
                // var payrollcompsql = 
                // "SELECT " +
                // "  a.custrecord_hris_empchange_emp_pay_pro_gp AS paygroup, " +
                // "  b.custrecord_hris_cde_payroll_component AS name, " +
                // "  BUILTIN.DF(b.custrecord_hris_cde_payroll_component) AS shortname, " +
                // "  b.custrecord_hris_cde_monthly AS monthly, " +
                // "  b.custrecord_hris_cde_annually AS annually, " +
                // "  b.custrecord_hris_payroll_component_seq_no AS sequenceno " +
                // "FROM customrecord_hris_employee_compen_change a " +
                // "INNER JOIN customrecord_hris_compensation_details_e b " +
                // "  ON a.id = b.custrecord_hris_employee_data_change " +
                // "WHERE a.id = "+EmpcompChangeID+"";

                var payrollcompsql =
                    "SELECT " +
                    "  pc.id AS component_id, " +
                    "  pc.name, " +
                    "  pc.custrecord_hris__sequence_no_ AS sequenceno, " +
                    "  pc.custrecord_hris_component_short_name AS shortname, " +
                    "  empcomp.custrecord_hris_cde_monthly AS monthly, " +
                    "  empcomp.custrecord_hris_cde_annually AS annually " +
                    "FROM ( " +
                    "  SELECT MIN(id) AS id " +
                    "  FROM customrecord_hris_payroll_component " +
                    "  WHERE custrecord_hris__ctc = 'T' " +
                    "    AND custrecord_hris_pay_process_group = " + paygroup + " " +
                    "    AND custrecord_hris_payroll_calculation_type IN (1, 3) " +
                    "    AND custrecord_hris_pay_frequency = 1 " +
                    "  GROUP BY custrecord_hris__sequence_no_ " +
                    ") AS filtered " +
                    "INNER JOIN customrecord_hris_payroll_component pc " +
                    "  ON pc.id = filtered.id " +
                    "LEFT JOIN customrecord_hris_compensation_details_e empcomp " +
                    "  ON pc.id = empcomp.custrecord_hris_cde_payroll_component " +
                    "  AND empcomp.custrecord_hris_employee_data_change = " + EmpcompChangeID + " " +
                    "ORDER BY pc.custrecord_hris__sequence_no_";



                // var resultSet = query.runSuiteQL({ query: payrollcompsql });
              log.debug('payrollcompsql',payrollcompsql)
                var resultSet = getResult(payrollcompsql);
                // var resultSet = getResult(payrollcompsql);
                var componentsArray = [];
                for (var i = 0; i < resultSet.length; i++) {
                    var row = resultSet[i];
                    var name = row.component_id;
                    var Id = row.id;
                    var sequenceNo = row.sequenceno;
                    var shortName = row.shortname;
                    // var paygroup=row.paygroup;
                    var monthly = row.monthly || 0;
                    var annually = row.annually || 0;
                    var empid =EmployeID;
                    var subsidiary = subsidiary;
                    var department =department;

                    log.debug("Component", "Name: " + name +
                        ", Sequence No: " + sequenceNo +
                        ", Short Name: " + shortName);

                    componentsArray.push({
                        Id: Id,
                        name: name,
                        sequenceNo: sequenceNo,
                        shortName: shortName,
                        paygroup: paygroup,
                        monthly: monthly,
                        annually: annually,
                        empid:EmployeID,
                        subsidiary:subsidiary,
                        department:department
                    });
                }
            
                for (var comp = 0; comp < componentsArray.length; comp++) {


                    currentRecord.selectNewLine({
                        sublistId: "recmachcustrecord_hris_comhis_compenhistoryid"
                    });

                    currentRecord.setCurrentSublistValue({
                        sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                        fieldId: "custrecord_hris_comhis_processgroup",
                        value: componentsArray[comp].paygroup,
                        ignoreFieldChange: true // important if dependent
                    });

                    currentRecord.setCurrentSublistValue({
                        sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                        fieldId: "custrecord_hris_comhis_payrollcomponent",
                        value: componentsArray[comp].name, // make sure this is internal ID
                        ignoreFieldChange: true
                    });
                    currentRecord.setCurrentSublistValue({
                        sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                        fieldId: "custrecord_hris_comhis_prev_monthlyamt",
                        value: componentsArray[comp].monthly,
                        ignoreFieldChange: true
                    });

                    currentRecord.setCurrentSublistValue({
                        sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                        fieldId: "custrecord_hris_comhis_monthlyamount",
                        value: componentsArray[comp].monthly,
                        ignoreFieldChange: true
                    });

                    currentRecord.setCurrentSublistValue({
                        sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                        fieldId: "custrecord_hris_comhis_annuallyamount",
                        value: componentsArray[comp].annually,
                        ignoreFieldChange: true
                    });

                    currentRecord.setCurrentSublistValue({
                        sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                        fieldId: "custrecord_hris_comhis_payrollseqno",
                        value: componentsArray[comp].sequenceNo,
                        ignoreFieldChange: true
                    });
                        currentRecord.setCurrentSublistValue({
                        sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                        fieldId: "custrecord_hris_comhis_empname",
                        value: componentsArray[comp].empid,
                        ignoreFieldChange: false,
                         forceSyncSourcing:true
                    });
                    /*  currentRecord.setCurrentSublistValue({
                        sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                        fieldId: "custrecord_hris_comhis_subsidiary",
                        value: componentsArray[comp].subsidiary,
                        ignoreFieldChange: true
                    });
                     currentRecord.setCurrentSublistValue({
                        sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                        fieldId: "custrecord_hris_comhis_department",
                        value: componentsArray[comp].department,
                        ignoreFieldChange: true
                    }); */
                    

                    currentRecord.commitLine({
                        sublistId: "recmachcustrecord_hris_comhis_compenhistoryid"
                    });
                }
            }
            else if(paygroup){
                var payrollcompsql = "SELECT name, id, " +
                    "custrecord_hris__sequence_no_, " +
                    "custrecord_hris_component_short_name " +
                    "FROM customrecord_hris_payroll_component " +
                    "WHERE id IN ( " +
                    "SELECT MIN(id) " +
                    "FROM customrecord_hris_payroll_component " +
                    "WHERE custrecord_hris__ctc = 'T' " +
                    "AND custrecord_hris_pay_process_group = " + paygroup + " " +
                    "AND custrecord_hris_payroll_calculation_type IN (1, 3) " +
                    "AND custrecord_hris_pay_frequency = 1 " +
                    "GROUP BY custrecord_hris__sequence_no_ " +
                    ") " +
                    "ORDER BY custrecord_hris__sequence_no_";
 log.debug('payrollcompsql',payrollcompsql)

                // var resultSet = query.runSuiteQL({ query: payrollcompsql });
                var resultSet = getResult(payrollcompsql);
                // var resultSet = getResult(payrollcompsql);
                var componentsArray = [];
                for (var i = 0; i < resultSet.length; i++) {
                    var row = resultSet[i];
                    var name = row.name;
                    var Id = row.id;
                    var sequenceNo = row.custrecord_hris__sequence_no_;
                    var shortName = row.custrecord_hris_component_short_name;
                      var subsidiary = subsidiary;
                    var department =department;

                    log.debug("Component", "Name: " + name +
                        ", Sequence No: " + sequenceNo +
                        ", Short Name: " + shortName);
                       var empid =EmployeID;   
                    componentsArray.push({
                        Id: Id,
                        name: name,
                        sequenceNo: sequenceNo,
                        shortName: shortName,
                        paygroup: paygroup,
                        empid:EmployeID,
                        subsidiary:subsidiary,
                        department:department
                    });
                }
                for (var comp = 0; comp < componentsArray.length; comp++) {


                    currentRecord.selectNewLine({
                        sublistId: "recmachcustrecord_hris_comhis_compenhistoryid"
                    });

                    currentRecord.setCurrentSublistValue({
                        sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                        fieldId: "custrecord_hris_comhis_processgroup",
                        value: componentsArray[comp].paygroup,
                        ignoreFieldChange: true // important if dependent
                    });

                    currentRecord.setCurrentSublistValue({
                        sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                        fieldId: "custrecord_hris_comhis_payrollcomponent",
                        value: componentsArray[comp].Id, // make sure this is internal ID
                        ignoreFieldChange: true
                    });
                    currentRecord.setCurrentSublistValue({
                        sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                        fieldId: "custrecord_hris_comhis_prev_monthlyamt",
                        value: 0,
                        ignoreFieldChange: true
                    });
                    currentRecord.setCurrentSublistValue({
                        sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                        fieldId: "custrecord_hris_comhis_monthlyamount",
                        value: 0,
                        ignoreFieldChange: true
                    });

                    currentRecord.setCurrentSublistValue({
                        sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                        fieldId: "custrecord_hris_comhis_annuallyamount",
                        value: 0,
                        ignoreFieldChange: true
                    });

                    currentRecord.setCurrentSublistValue({
                        sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                        fieldId: "custrecord_hris_comhis_payrollseqno",
                        value: componentsArray[comp].sequenceNo,
                        ignoreFieldChange: true
                    });
                     currentRecord.setCurrentSublistValue({
                        sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                        fieldId: "custrecord_hris_comhis_empname",
                        value: componentsArray[comp].empid,
                        ignoreFieldChange:true
                    });
                      currentRecord.setCurrentSublistValue({
                        sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                        fieldId: "custrecord_hris_comhis_empname",
                        value: componentsArray[comp].empid,
                        ignoreFieldChange: false,
                        forceSyncSourcing:true
                    });
                    /*  currentRecord.setCurrentSublistValue({
                        sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                        fieldId: "custrecord_hris_comhis_subsidiary",
                        value: componentsArray[comp].subsidiary,
                        ignoreFieldChange: true
                    });
                     currentRecord.setCurrentSublistValue({
                        sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                        fieldId: "custrecord_hris_comhis_department",
                        value: componentsArray[comp].department,
                        ignoreFieldChange: true
                    }); */
                    

                    currentRecord.commitLine({
                        sublistId: "recmachcustrecord_hris_comhis_compenhistoryid"
                    });
                }


            }
            // if(context.sublistId == "recmachcustrecord_hris_comhis_compenhistoryid" && context.fieldId =="custrecord_hris_comhis_monthlyamount"){
            //     var Linecount
            // }

        }
    }

    // Using validate line only for that annua amynt caluclation based on monthly
    function validateLine(context) {
        var currentRecord = context.currentRecord;

        if (context.sublistId === 'recmachcustrecord_hris_comhis_compenhistoryid') {
            var monthlyAmount = currentRecord.getCurrentSublistValue({
                sublistId: 'recmachcustrecord_hris_comhis_compenhistoryid',
                fieldId: 'custrecord_hris_comhis_monthlyamount'
            });

            if (monthlyAmount) {
                var annualAmount = parseFloat(monthlyAmount) * 12;

                currentRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_hris_comhis_compenhistoryid',
                    fieldId: 'custrecord_hris_comhis_annuallyamount',
                    value: annualAmount,
                    ignoreFieldChange: true
                });
            }
        }

        return true;
    }
    function saveRecord(context) {
        debugger;
        var currentRecord = context.currentRecord;
        var sublistId = 'recmachcustrecord_hris_comhis_compenhistoryid';
        var lineCount = currentRecord.getLineCount({ sublistId: sublistId });

        var totalMonthly = 0;
        var totalAnnual = 0;
        var CTC = 0;

        for (var i = 0; i < lineCount; i++) {
            var monthlyAmount = parseFloat(currentRecord.getSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord_hris_comhis_monthlyamount',
                line: i
            })) || 0;

            var annualAmount = parseFloat(currentRecord.getSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord_hris_comhis_annuallyamount',
                line: i
            })) || 0;

            totalMonthly += monthlyAmount;
            totalAnnual += annualAmount;
        }

        CTC = CTC + parseFloat(totalAnnual)
        currentRecord.setValue({
            fieldId: 'custrecord_hris_monthly_gross_salary',
            value: totalMonthly
        });

        currentRecord.setValue({
            fieldId: 'custrecord_hris_annual_gross_salary',
            value: totalAnnual
        });
        currentRecord.setValue({
            fieldId: "custrecord_hris_ctc",
            value: CTC
        })

        return true;
    }



    /**
   * Executes a SuiteQL query and returns results as a mapped array.
   * @param {string} pSQL The SQL query string.
   * @returns {Array} Query results as mapped objects.
   */
    function getResult(pSQL) {
        var queryResults = query.runSuiteQL({ query: pSQL });
        return queryResults.asMappedResults();
    }


    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        validateLine: validateLine,
        saveRecord: saveRecord

    }
});
