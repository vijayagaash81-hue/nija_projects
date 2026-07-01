/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/url', 'N/currentRecord', 'N/format', 'N/ui/message'],

    function (url, currentrecord, format, message) {

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {
            //console.log('Inside pageInit');
        }



        function generateCustomerStatment() {
    debugger;
    try {
        var recordObj = currentrecord.get();

        var todate = recordObj.getValue({
            fieldId: 'custpage_todate'
        });

        var vendId = recordObj.getValue({
            fieldId: 'custpage_vendorid'
        });

        var Subid = recordObj.getValue({
            fieldId: 'custpage_subsidiaryid'
        });
        
        if (!todate || !vendId || !Subid) {
            message.create({
                title: 'Error',
                message: 'Please select Vendor, Subsidiary and To Date before printing.',
                type: message.Type.ERROR
            }).show({ duration: 5000 });
            return;
        }

        var formattedtoDate = format.format({ value: todate, type: format.Type.DATE });

        // Calling Print Suitelet
        var output = url.resolveScript({
            scriptId: 'customscript_njt_vendor_ledger_report_po',
            deploymentId: 'customdeploy_njt_vendor_ledger_report_po',
            returnExternalUrl: false
        });

        // Open Suitelet in new tab with required params only
        window.open(output + 
                    '&vendorvalue=' + vendId + 
                    '&toDate=' + formattedtoDate + 
                    '&Subid=' + Subid, '_blank');
    } catch (e) {
        console.log("Error :" + e.message);
    }
}

        return {
            pageInit: pageInit,
            generateCustomerStatment: generateCustomerStatment
        };

    });