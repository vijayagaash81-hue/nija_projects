/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
var Email;
define(['N/ui/serverWidget', 'N/file', 'N/encode', 'N/query', 'N/runtime', 'N/format', 'N/email', 'N/record'],
    function (serverWidget, file, encode, query, runtime, format, email, record) {
        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        Email = email;
        function onRequest(context) {
            try {
                var method = context.request.method;
                if (method == 'GET') {
                    var form = serverWidget.createForm({
                        title: 'Vendor Statement'
                    });
                    form.addFieldGroup({
                        id: 'filterid',
                        label: 'Filters'
                    });

                    var toDateField = form.addField({
                        id: 'custpage_todate',
                        type: serverWidget.FieldType.DATE,
                        label: 'To Date',
                        container: 'filterid'
                    });
                    toDateField.isMandatory = true;

                    var customerField = form.addField({
                        id: 'custpage_vendorid',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Vendor',
                        source: 'vendor',
                        container: 'filterid'
                    });
                    customerField.isMandatory = true;

                    var subsidairyField = form.addField({
                        id: 'custpage_subsidiaryid',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Subsidiary',
                        source: 'subsidiary',
                        container: 'filterid'
                    });
                    subsidairyField.isMandatory = true;

                    form.addButton({
                        id: 'custpage_printbtn',
                        label: 'Print',
                        functionName: 'generateCustomerStatment()'
                    });
                    
                    form.clientScriptFileId = 2264;
                    context.response.writePage(form);
                }
            } catch (e) {
                log.error("Error in OnRequest", e.message);
            }
        }
        return {
            onRequest: onRequest
        };

    });