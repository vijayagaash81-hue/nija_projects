/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 *@NModuleScope Public
 */
define(['N/ui/dialog', 'N/currentRecord', 'N/url'], function (dialog, currentrecord, url) {

    function pageInit(context) {
        // Your pageInit code here
    }

    function printSelectedTemplate() {
      debugger;
        var recordObj = currentrecord.get();
        var id = recordObj.id;
        var suiteletURL = url.resolveScript({
            scriptId: 'customscript_hris_lve_sett_layout_sut',
            deploymentId: 'customdeploy_hris_lve_sett_layout_sut',
            params: {
                customRecordId: id,
            }
        });

        // Open the Suitelet URL in a new tab/window
        window.open(suiteletURL, '_blank');
    }
    function validateLine(context) {
        debugger;
        var currentRecord = context.currentRecord;
        var grsamttotal=0;
        if (context.sublistId === "item") {
          var Grsamt = currentRecord.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "grossamt",
          });
    
          log.debug("Debit Value", Grsamt);
    
          if (Grsamt) {
            
    
            grsamttotal += parseFloat(Grsamt);
    
            currentRecord.setValue({
              fieldId: "custbody_njt_total",
              value: grsamttotal.toFixed(2),
              ignoreFieldChange: true,
            });
          }
        }
    
        return true; 
      }
    return {
        pageInit: pageInit,
        printSelectedTemplate: printSelectedTemplate,
        validateLine:validateLine
    };
});