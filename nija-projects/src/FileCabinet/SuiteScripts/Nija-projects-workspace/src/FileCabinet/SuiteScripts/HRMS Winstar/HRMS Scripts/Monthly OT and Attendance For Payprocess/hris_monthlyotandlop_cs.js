/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(["N/record", "N/currentRecord", "N/query", "N/format"], function (
    record,
    currentrecord,
    query,
    format
) {
    function pageInit(scriptContext) {
          debugger;
      var recordObj = currentrecord.get();
      var statusQuery = "select custrecord_hris_mr_sts,BUILTIN.DF(custrecord_hris_mr_sts)as name from customrecord_hris_mr_status_bar_rec where id =14";
      var queryResults = query.runSuiteQL({
          query: statusQuery
      });
      var records = queryResults.asMappedResults();
      var mrStatus = recordObj.getField('custpage_mr_status');
      mrStatus.removeSelectOption({ value: null });
      if (records.length > 0) {
          for (var r = 0; r < records.length; r++) {
              var record = records[r];
              var name = record.name;
              var id = record.custrecord_hris_mr_sts;

              mrStatus.insertSelectOption({
                  value: id,
                  text: name,
                  isSelected: true
              });


          }
      }
      var status = recordObj.getValue('custpage_mr_status');
      if (status == 2) {
          refreshPayProcess();
      };
    }

 function refreshPayProcess()
    {
       // var Refreshtime=10000;  
        alert('Please wait for some times Employee Allocation in progressing.....');
        location.reload(true);
    
    }
    return {
        pageInit: pageInit,
    };
});
