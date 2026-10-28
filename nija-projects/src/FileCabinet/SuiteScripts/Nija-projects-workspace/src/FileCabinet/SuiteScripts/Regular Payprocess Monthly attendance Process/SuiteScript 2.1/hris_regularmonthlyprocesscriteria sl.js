/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @Description Suitelet to select criteria for Regular Payprocess Monthly Attendance Process.
 */
define(['N/ui/serverWidget', 'N/redirect', 'N/log'], (serverWidget, redirect, log) => {

    /**
     * Definition of the Suitelet script trigger point.
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     */
    const onRequest = (context) => {
        try {
            const { request, response } = context;

            // Create form
            const form = serverWidget.createForm({
                title: 'Regular Payprocess Monthly attendance Process'
            });

            // Add fields to the form
            const monthField = form.addField({
                id: 'custpage_month',
                type: serverWidget.FieldType.SELECT,
                label: 'Month',
                source: 'customlist_hris_month_list'
            });
            monthField.isMandatory = true;

            const yearField = form.addField({
                id: 'custpage_year',
                type: serverWidget.FieldType.SELECT,
                label: 'Year',
                source: 'customlist_hris_year_master'
            });
            yearField.isMandatory = true;

            const subsidiaryField = form.addField({
                id: 'custpage_subsi',
                type: serverWidget.FieldType.SELECT,
                label: 'Subsidiary',
                source: 'subsidiary'
            });
            subsidiaryField.isMandatory = true;

            form.addField({
                id: 'custpage_empcode',
                type: serverWidget.FieldType.SELECT,
                label: 'Employee Code'
            });

            // Link client script to the form
            form.clientScriptModulePath = './hris_regularpayattendanceprocess_cs.js';

            // Add submit button
            form.addSubmitButton({
                label: 'Submit'
            });

            if (request.method === 'GET') {
                response.writePage(form);
            } else if (request.method === 'POST') {
                const {
                    custpage_month: monthVal,
                    custpage_year: yearVal,
                    custpage_subsi: subsidiaryVal,
                    custpage_empcode: empCodeVal
                } = request.parameters;

                log.debug('POST Parameters', {
                    month: monthVal,
                    year: yearVal,
                    subsidiary: subsidiaryVal,
                    empCode: empCodeVal
                });

                // Redirect to the main processing Suitelet
                redirect.toSuitelet({
                    scriptId: 'customscript_hris_regpaymonproce_sl',
                    deploymentId: 'customdeploy_hris_regpaymonproce_sl',
                    parameters: {
                        custparam_month: monthVal,
                        custparam_year: yearVal,
                        custparam_empcode: empCodeVal,
                        custparam_subsi: subsidiaryVal
                    }
                });
            }
        } catch (e) {
            log.error({
                title: 'Error in criteria onRequest',
                details: e.message || e
            });
            context.response.write(`Error loading criteria form: ${e.message}`);
        }
    };

    return {
        onRequest
    };
});
