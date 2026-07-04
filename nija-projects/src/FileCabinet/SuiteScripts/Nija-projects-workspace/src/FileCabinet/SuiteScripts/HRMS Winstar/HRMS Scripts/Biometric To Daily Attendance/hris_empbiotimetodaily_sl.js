/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(["N/ui/serverWidget", "N/search", "N/log", "N/task", "N/redirect", "N/record", "N/runtime", "N/format", "N/query", "N/currentRecord", "N/https", "N/url"],
    function (serverWidget, searchModule, log, task, redirect, record, runtime, format, query, currentRecord, https, urlMod) {
        // Define the main function for handling requests
        function onRequest(context) {
            // Create a form
            var form = serverWidget.createForm({
                title: "BIOMETRIC TO DAILY ATTENDANCE ",
            });

            // Add fields to the form
            var subsidiary = form.addField({
                id: 'custpage_subsidiary',
                type: serverWidget.FieldType.SELECT,
                label: 'Subsidiary',
                source: 'subsidiary'
            });
            subsidiary.isMandatory = true;
            
            var fromdate = form.addField({
                id: "custpage_fromdate",
                type: serverWidget.FieldType.DATE,
                label: "From Date",
                
            });
            fromdate.isMandatory = true;

               var todate = form.addField({
                id: "custpage_todate",
                type: serverWidget.FieldType.DATE,
                label: "ToDate",
                
            });
            todate.isMandatory = true;

            var empname = form.addField({
                id: "custpage_employee",
                type: serverWidget.FieldType.MULTISELECT,
                label: "Employee",
                source: "employee"
            });
            // Add a submit button
             
            form.addSubmitButton({
                label: "Submit",
            });
               // Link the client script to the form
               //form.clientScriptModulePath = "./pageint in reg cl.js";
            if (context.request.method === "GET") {
                context.response.writePage(form);
            } else if (context.request.method === "POST") {
                var resourceListArray =[];
            
                var fromdatepost = context.request.parameters.custpage_fromdate;
log.debug("fromdatepost",fromdatepost);
            var todatepost = context.request.parameters.custpage_todate;
log.debug("todatepost",todatepost);
var subsidiary = context.request.parameters.custpage_subsidiary;
var employee = context.request.parameters.custpage_employee;
log.debug("employeepost",employee);
                // Redirect to the second Suitelet with manager and date values as parameters
         

                  log.audit('Employee Multiselect',employee);
                if (employee) {
    //var employeeIds = employee.split(','); // Convert to array: ["123", "456", "789"]

   /*  // Push all values into selectedEmployees array
    selectedEmployees.push(...employeeIds);
 */
var employee = employee.replace(/\u0005/g, ',');
var employeeIds = '(' + employee + ')';
  log.audit('Employee employeeIds',employeeIds);
  
                resourceListArray.push({
                    //'payDate': payDate,
                    'fromdate': fromdatepost,
                    'todate':todatepost,
                     'employee':employeeIds,
                     'subsidiary':subsidiary
                });
                log.debug("resourceListArray", resourceListArray);
            }
else{

          var employeeIds = '';

                resourceListArray.push({
                    //'payDate': payDate,
                    'fromdate': fromdatepost,
                    'todate':todatepost,
                     'employee':employeeIds,
                     'subsidiary':subsidiary
                });
                log.debug("resourceListArray", resourceListArray);
           
}

            
            var mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: "customscript_hris_emp_biotodaily_mrs",
               // deploymentId: "customdeploy_hris_empbiotodailyupdat_mrs",
                params: {
                 
            
                        custscript_hris_biotimeemp : JSON.stringify(resourceListArray),
                                        }
            });
            var mrTaskId = mrTask.submit();
            log.debug("mrTaskId1", mrTaskId);  


             


            redirect.toSuitelet({
                scriptId: 'customscript_hris_emp_biotodaily_sta_sl',
                deploymentId: 'customdeploy_hris_emp_biotodaily_sta_sl',
                parameters: {
                        custscript_chqall_tskid: mrTaskId,
                       
                    }
            });
            }
        }
        function sleep(ms) {
            var start = new Date().getTime();
            while (new Date().getTime() < start + ms) { }
        }

        return {
            onRequest: onRequest,
        };
    });
