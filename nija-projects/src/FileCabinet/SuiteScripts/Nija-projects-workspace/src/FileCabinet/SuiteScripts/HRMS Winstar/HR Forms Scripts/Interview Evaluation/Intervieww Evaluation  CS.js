/**

* @NApiVersion 2.x

* @NScriptType ClientScript

*/

define(['N/ui/dialog', 'N/currentRecord', 'N/url'], function (dialog, currentrecord, url) {
 
    function pageInit(context) {

        // Your pageInit code here

    }
 
    function printSelectedTemplate(){

      debugger;

        var recordObj = currentrecord.get();

        var id = recordObj.id;

        //var fileId = 1321156;

        // Create the URL to the Suitelet

        var suiteletURL = url.resolveScript({

            scriptId: 'customscript_hris_interview_eval_sut_dep',

            deploymentId:'customdeploy_hris_interview_eval_sut_dep',

            params: {

                customRecordId: id,

            }

        });
 
        // Open the Suitelet URL in a new tab/window

        window.open(suiteletURL, '_blank');

    }
 
    return {

        pageInit: pageInit,

        printSelectedTemplate: printSelectedTemplate

    };

});
 