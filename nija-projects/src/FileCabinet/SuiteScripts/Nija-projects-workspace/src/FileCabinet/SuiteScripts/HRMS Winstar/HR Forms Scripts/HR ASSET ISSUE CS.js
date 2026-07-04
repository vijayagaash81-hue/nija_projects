/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
  *@NModuleScope Public
 */

define([
  "N/search",
  "N/query",
  "N/format",
  "N/email",
  "N/record",
  "N/currentRecord",
  "N/url",
  // "./moment.js",
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
  // moment,
  runtime,
  dialog
) {
  function pageInit(scriptContext) {
    debugger;
    var currentObjRecord = scriptContext.currentRecord;
    log.debug("scriptcontext", scriptContext.mode);
      
     if (scriptContext.mode == "create"){
        var RequestId=getUrlParameter("custscript_recordid")||"";
        var EmployeeCode=getUrlParameter("custscript_empcode")||"";
        var AssetType=getUrlParameter("custscript_assettype")||"";
        var Empname=getUrlParameter("custscript_empname")||"";
        var Location=getUrlParameter("custscript_location")||"";
        var Remarks=getUrlParameter("custscript_remarks")||"";
        var Department=getUrlParameter("custscript_dept")||"";
        var Subdepartmet=getUrlParameter("custscript_Subdept")||"";
        var Assetname=getUrlParameter("custscript_assetname")||"";
        var Date=getUrlParameter("custscript_parsedToDate")||"";
        


        log.debug("RequestId",RequestId);
        if(RequestId){
          currentObjRecord.setValue({
            fieldId: "custrecord_hris_aset_req_id",
            value: RequestId,
            ignoreFieldChange: true,
          });
        }
        if(EmployeeCode){
            currentObjRecord.setValue({
              fieldId: "custrecord_hris_asset_emplo_code",
              value: EmployeeCode,
              ignoreFieldChange: true,
            });
        }
        if(AssetType){
            currentObjRecord.setValue({
              fieldId: "custrecord_hris_asset_ass_type",
              value: AssetType,
              ignoreFieldChange: true,
            });
        }
        
        if(Location){
            currentObjRecord.setValue({
              fieldId: "custrecord_hris_asset_locations_",
              value: Location,
              ignoreFieldChange: true,
            });
        }
        if(Empname){
            currentObjRecord.setValue({
                fieldId: "custrecord_hris_asset_employee_name",
                value: Empname,
                ignoreFieldChange: true,
              });
        }
        if(Remarks){
            currentObjRecord.setValue({
              fieldId: "custrecord_hris_aset_remarks",
              value: Remarks,
              ignoreFieldChange: true,
            });
        }
        if (Department) {
            currentObjRecord.setValue({
              fieldId: "custrecord_hris_asset_issues_form_dept_n",
              value: Department,
              ignoreFieldChange: false,
              forceSyncSourcing: true,
            });
          }
    
          if (Subdepartmet) {
            currentObjRecord.setValue({
              fieldId: "custrecord_hris_asset_sub_department_",
              value: Subdepartmet,
              ignoreFieldChange: true,
              forceSyncSourcing: true,
            });
          }
          if(Assetname){
            currentObjRecord.setValue({
                fieldId: "custrecord_hris_asset_ass_name",
                value: Assetname,
                ignoreFieldChange: true,
              });
          }
          if (Date) {
            
            var parsedDate = format.parse({
                value: Date,
                type: format.Type.DATE
            });
        
            currentObjRecord.setValue({
                fieldId: "custrecord_hris_assst_request_date",
                value: parsedDate,
                ignoreFieldChange: true,
            });
        }
    

        


     }
    
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
    // debugger;
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split("=");
      if (pair[0] == param) {
        return decodeURIComponent(pair[1]);
      }
    }
    return false;
  }
  return {
    pageInit: pageInit
  
  };
});
