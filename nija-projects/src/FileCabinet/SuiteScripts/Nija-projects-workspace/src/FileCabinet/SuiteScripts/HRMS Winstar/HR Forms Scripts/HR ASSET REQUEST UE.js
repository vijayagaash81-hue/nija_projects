/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define([
  "N/record",
  "N/log",
  "N/search",
  "N/query",
  "N/email",
  "N/runtime",

], function (record, log, search, query, email, runtime) {
  function beforeLoad(context) {
    var form = context.form;

    var currentRecord = context.newRecord;
    var id = currentRecord.id; // Get the internal ID of the current record
    form.clientScriptModulePath ='./HR ASSET REQUEST  CS.js';
    var Department=currentRecord.getValue({
      fieldId:"custrecord_hris_asset_department"
    });
    log.debug("Department",Department);
    var ApprovalStatus=currentRecord.getValue({
      fieldId:"custrecord_hris_asset_approval_status"
    });
    log.debug("ApprovalStatus",ApprovalStatus);
    
    if(context.type=="view"){
      // if(Department=="1"|| Department=="9" ||Department=="12" || Department=="17" && ApprovalStatus=="3" ){
      
      if(ApprovalStatus=="2" ){
        form.addButton({
        id: "custpage_assetrq_button",
        label: "ASSET ISSUE",
        functionName: "assetissue()",
      });
     }
  }
//   form.clientScriptModulePath =
//   "SuiteScripts/HR Scripts/HR ASSET REQUEST CS.js";
//form.clientScriptFileId = 2873; 

//form.clientScriptModulePath ="./HR ASSET REQUEST CS.js"

  }

  function getResult(s_SQL) {
    try {
      var queryResults = query.runSuiteQL({ query: s_SQL }).asMappedResults();
      return queryResults;
    } catch (error) {
      log.error("Error executing query", error);
      return [];
    }
  }

  return {
    beforeLoad: beforeLoad
    // beforeSubmit: beforeSubmit,
  };
});
