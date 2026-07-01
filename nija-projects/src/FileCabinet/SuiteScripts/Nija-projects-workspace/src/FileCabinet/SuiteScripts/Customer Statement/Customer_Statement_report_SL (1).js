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
                var form = serverWidget.createForm({
                    title: 'Customer Statement'
                });
                form.addFieldGroup({
                    id: 'filterid',
                    label: 'Filters'
                });
                /* var fromDateField = form.addField({
                    id: 'custpage_fromdate',
                    type: serverWidget.FieldType.DATE,
                    label: 'From Date',
                    container: 'filterid'
                });
                fromDateField.isMandatory = true; */

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
                    label: 'customer',
                    source: 'customer',
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

                // var checkboxField = form.addField({
                //     id: 'custpage_checkboxid',
                //     type: serverWidget.FieldType.CHECKBOX,
                //     label: 'Open Transaction',
                //     container: 'filterid'
                // });

                //  form.addSubmitButton({
                //      label: 'Submit'
                //  });
                //  form.addButton({
                //      id: 'custpage_excel_export',
                //      label: 'Export to Excel'
                //  });
                //  form.addSubtab({
                //      id: 'reportgrp',
                //      label: 'Customer Statement Report'
                //  });
                form.addButton({
                    id: 'custpage_printbtn',
                    label: 'Print',
                    functionName: 'generateCustomerStatment()'
                });
                var inlineField = form.addField({
                    id: 'custpage_inventory_status_report',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: 'Text',
                    container: 'reportgrp'
                });
                form.clientScriptFileId = 3599;
                addScriptToForm(form, serverWidget);
                if (method == 'GET') {
                    context.response.writePage(form);
                } else {
                }
            } catch (e) {
                log.error("Error in OnRequest", e.message);
            }
        }
        return {
            onRequest: onRequest
        };

    });
var addScriptToForm = function (pForm, serverWidgetModule) {
    var clientScript = '<script>\r\n';
    clientScript += 'window.jQuery = window.$ = jQuery;\r\n' +
        "$('#custpage_excel_export').click(function(e) {\r\n" +
        " excelexport();\r\n" +
        " });\r\n" +
        "function excelexport() {\r\n" +
        "  $('#main_form').append('<input type=\"hidden\" name=\"excelexport\" value=\"yes\" />');\r\n" +
        "  $('#main_form').submit();\r\n " +
        "} \r\n" +
        "</script>\r\n";
    //clientScript += '</script>\r\n';
    log.debug("Client Script", clientScript);
    var scriptfield = pForm.addField({
        id: 'clientscript',
        label: 'Client Script',
        type: serverWidgetModule.FieldType.INLINEHTML
    });
    scriptfield.defaultValue = clientScript;
}