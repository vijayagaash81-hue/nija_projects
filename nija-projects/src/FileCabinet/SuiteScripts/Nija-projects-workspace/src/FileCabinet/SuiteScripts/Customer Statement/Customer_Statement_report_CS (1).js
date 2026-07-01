/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/url', 'N/currentRecord', 'N/search', 'N/email', 'N/query', 'N/format'],

    function (record, url, currentrecord, search, email, query, format) {

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
                var fromdate = recordObj.getValue({
                    fieldId: 'custpage_fromdate'
                });
                console.log('fromdate : ' + fromdate);
                var formattedDate = '';
                if (fromdate) {
                    formattedDate = format.format({ value: fromdate, type: format.Type.DATE });
                }

                console.log('formattedDate : ' + formattedDate);
                var todate = recordObj.getValue({
                    fieldId: 'custpage_todate'
                });
                console.log('todate : ' + todate);
                var formattedtoDate = '';
                if (todate) {
                    formattedtoDate = format.format({ value: todate, type: format.Type.DATE });
                }


                console.log('formattedtoDate : ' + formattedtoDate);
                var vendId = recordObj.getValue({
                    fieldId: 'custpage_vendorid'
                });
                console.log('vendId : ' + vendId);
                var Subid = recordObj.getValue({
                    fieldId: 'custpage_subsidiaryid'
                });
                console.log('Subid : ' + Subid);
                // Calling Print SL
                var output = url.resolveScript({
                    scriptId: 'customscript_njt_cust_ledger_report',
                    deploymentId: 'customdeploy_njt_cust_ledger_report',
                    returnExternalUrl: false
                });

                //window.open(output + '&empId=' + empId + '&payPeriod=' + payPeriod, '_blank');
                window.open(output + '&vendorvalue=' + vendId + '&fromDate=' + formattedDate + '&toDate=' + formattedtoDate + '&Subid=' + Subid, '_blank');
            }
            catch (e) {
                console.log("Error :" + e.message);
            }
        }
        return {
            pageInit: pageInit,
            generateCustomerStatment: generateCustomerStatment
        };

    });