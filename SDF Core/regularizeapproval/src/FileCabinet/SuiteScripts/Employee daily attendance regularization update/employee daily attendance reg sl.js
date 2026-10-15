/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(["N/ui/serverWidget", "N/search", "N/log", "N/task", "N/redirect", "N/record", "N/runtime", "N/format", "N/query", "N/currentRecord", "N/https", "N/url"],
    function (serverWidget, searchModule, logModule, taskModule, redirectModule, recordModule, runtimeModule, formatModule, query, currentRecord, https, urlMod) {
        // Define the main function for handling requests
        function onRequest(context) {
            // Create a form
            var form = serverWidget.createForm({
                title: "Employee Daily Attendance Regularization And Approval",
            });

            // Add fields to the form
            
            var fromDate = form.addField({
                id: "custpage_fromdate",
                type: serverWidget.FieldType.DATE,
                label: "From Date",
            });
            fromDate.isMandatory = true;
            var toDate = form.addField({
                id: "custpage_todate",
                type: serverWidget.FieldType.DATE,
                label: "TO Date",
            });
            toDate.isMandatory = true;
            var employee = form.addField({
                id: "custpage_emp",
                type: serverWidget.FieldType.SELECT,
                label: "Employee",
                source: "employee",
            });
            // Add a submit button
            form.addSubmitButton({
                label: "Submit",
            });
               // Link the client script to the form
               form.clientScriptModulePath = "./pageint in reg cl.js";
            if (context.request.method === "GET") {
                context.response.writePage(form);
            } else if (context.request.method === "POST") {
            //var subsidiarypost = context.request.parameters.custpage_subsidiary;
            var emppost = context.request.parameters.custpage_emp;
                var fromdateValuePost = context.request.parameters.custpage_fromdate;
logModule.debug("fromdateValuePost",fromdateValuePost);
var todateValuePost = context.request.parameters.custpage_todate;
logModule.debug("todateValuePost",todateValuePost);
                // Redirect to the second Suitelet with manager and date values as parameters
                redirectModule.toSuitelet({
                    scriptId: 'customscript_hris_emp_reg_sl',
                    deploymentId: 'customdeploy_hris_emp_reg_sl',
                    parameters: {
                        // custparam_manager: managerValue,
                        // custparam_projectseg:projectsegValue,
                       // custparam_subsidiary:subsidiarypost,
                        custparam_employee:emppost,
                        custparam_fromdate: fromdateValuePost,
                        custparam_todate:todateValuePost
                    },
                });
            }
        }

        return {
            onRequest: onRequest,
        };
    });
