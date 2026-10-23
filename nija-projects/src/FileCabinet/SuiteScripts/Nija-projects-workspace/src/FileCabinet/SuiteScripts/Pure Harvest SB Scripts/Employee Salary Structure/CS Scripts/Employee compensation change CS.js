/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
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
  var ARRAYAA = [];
  var lineIndex = 0;
  var SublistArr = [];
  var isLineCommitted = false;
  var fieldchangeARR = [];

  function pageInit(scriptContext) {
    debugger;
    var currentObjRecord = scriptContext.currentRecord;
    // var empname = currentObjRecord.getValue({
    //     fieldId: "custrecord_hris_empchange_employee_nam",
    // });

    // log.debug("empname", empname);

    // if (empname) {
    //     var setsqlquery = "SELECT custentity_hris_empcategory FROM employee WHERE id=" + empname + ";";

    //     var queryResult = query.runSuiteQL({ query: setsqlquery });
    //     var tsResult = queryResult.asMappedResults();

    //     log.debug("tsResult", tsResult);
    //     log.debug("tsResult length", tsResult.length);

    //     // Loop through the results and set sublist values
    //     if (tsResult.length > 0) {
    //         var rec = tsResult[0];
    //         var paygrpid = rec.custentity_hris_empcategory;

    //         log.debug("vpaygrpid", paygrpid);

    //         currentObjRecord.setValue({
    //             fieldId: "custrecord_hris_empchange_emp_pay_pro_gp",
    //             value: paygrpid,
    //             ignoreFieldChange: true,
    //             forceSyncSourcing: true,
    //         });
    //     }
    // }

    
   
  }

  function fieldChanged(context) {
    debugger;
    var currentObjRecord = context.currentRecord;

    if (context.fieldId === "custrecord_hris_empchange_employee_nam") {
        var empname = currentObjRecord.getValue({
            fieldId: "custrecord_hris_empchange_employee_nam",
        });

        log.debug("empname", empname);

        if (empname) {
            var setsqlquery = "SELECT custentity_hris_empcategory FROM employee WHERE id=" + empname + ";";

            var queryResult = query.runSuiteQL({ query: setsqlquery });
            var tsResult = queryResult.asMappedResults();

            log.debug("tsResult", tsResult);
            log.debug("tsResult length", tsResult.length);

            // Loop through the results and set sublist values
            if (tsResult.length > 0) {
                var rec = tsResult[0];
                var paygrpid = rec.custentity_hris_empcategory;

                log.debug("vpaygrpid", paygrpid);

                currentObjRecord.setValue({
                    fieldId: "custrecord_hris_empchange_emp_pay_pro_gp",
                    value: paygrpid,
                    ignoreFieldChange: false,
                    forceSyncSourcing: false,
                });
            }
             var EmpcompChangeID = null; 

        var EmpCompensationSQL =
          "SELECT id FROM customrecord_hris_employee_compen_change WHERE custrecord_hris_empchange_employee_nam = " +
          empname;
        
        var resultSet = query.runSuiteQL({ query: EmpCompensationSQL });
        var tsResult = resultSet.asMappedResults();
        
        if (tsResult.length > 0 && tsResult[0].id) {
          EmpcompChangeID = tsResult[0].id;
          log.debug("EmpcompChangeID", EmpcompChangeID);
        }
        
        if (EmpcompChangeID) {
          alert('Employee Salary Structure is already defined for this employee')
             currentObjRecord.setValue({
                    fieldId: "custrecord_hris_empchange_employee_nam",
                    value: '',
                    ignoreFieldChange: false,
                    forceSyncSourcing: false,
                });
          return false;
        
        }



        }
    }
    if(context.fieldId==="custrecord_hris_empchange_emp_pay_pro_gp"){
        var currentObjRecord = context.currentRecord;

    var PayPRocess=currentObjRecord.getValue({
        fieldId:"custrecord_hris_empchange_emp_pay_pro_gp"
    });
    currentObjRecord.selectNewLine({
        sublistId: 'recmachcustrecord_hris_employee_comp_details_li'
    });
    currentObjRecord.setCurrentSublistValue({
        sublistId:"recmachcustrecord_hris_employee_comp_details_li",
        fieldId:"custrecord_hris_cde_process_group",
        value:PayPRocess,
        ignoreFieldChange:true,
        forceSyncSourcing:true
    });
    currentObjRecord.commitLine({
       sublistId: 'recmachcustrecord_hris_employee_comp_details_li'
    })
    }
}
function lineInit(context){
    debugger;
    var currentObjRecord = context.currentRecord;

    var PayPRocess=currentObjRecord.getValue({
        fieldId:"custrecord_hris_empchange_emp_pay_pro_gp"
    });
    currentObjRecord.setCurrentSublistValue({
        sublistId:"recmachcustrecord_hris_employee_comp_details_li",
        fieldId:"custrecord_hris_cde_process_group",
        value:PayPRocess,
        ignoreFieldChange:true,
        forceSyncSourcing:true
    });
}


  
  

 


 

  /**
   * Function to execute a SQL query and retrieve results
   * @param {string} sql - The SQL query to execute
   * @param {string} recordId - The ID of the record to filter the query
   * @returns {Array} - The result set of the query
   */
  function getResult(sql, recordId) {
    var queryResults = query.runSuiteQL({
      query: sql,
      params: [recordId],
    });

    return queryResults.asMappedResults();
  }

  function getUrlParameter(param) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split("=");
      if (pair[0] === param) {
        return decodeURIComponent(pair[1] || "");
      }
    }
    return "";
  }

  return {
    pageInit: pageInit,
    // getMatReqValues:getMatReqValues,
    // setSublistValues:setSublistValues,
    // addNextLine:addNextLine,
    fieldChanged: fieldChanged,
    // saveRecord: saveRecord,
    lineInit: lineInit,
    // executelineinitlogic: executelineinitlogic,
    // validateLine:validateLine
  };
});
