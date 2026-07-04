/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
var Email;
define(['N/log', 'N/search', 'N/record', 'N/runtime', 'N/ui/serverWidget','N/query','N/redirect','N/task','N/url','N/email'], 
    function(log, search, record, runtime, serverWidget,query,redirect,task,url,email) {
        Email = email;
        function onRequest(context) {
			if (context.request.method === 'GET') {
				var sublistArray = [];

                

				var Emp_List = serverWidget.createForm({
                    title: 'Employee Daily Attendance Creation'
                });

            
                var Pay_Month = Emp_List.addField({
                    id: 'custpage_paymonth',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Month',
                    source: 'customlist_hris_month_list'
                });
               /*  Pay_Month.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                }); */
                Pay_Month.isMandatory = true;
                var Pay_Year = Emp_List.addField({
                    id: 'custpage_payyear',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Year',
                    source: 'customlist_hris_year_master'
                });
                /* Pay_Year.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                }); */
              Pay_Year.isMandatory = true;
               /*  var Employee = Emp_List.addField({
                    id: 'custpage_employee',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Employee',
                    source: 'employee'
                    
                }); */

              var Employee = Emp_List.addField({
    id: 'custpage_employee',
    type: serverWidget.FieldType.MULTISELECT,
    label: 'Employee',
    source: 'employee'
});  
             //Employee.isMandatory = true;
               Emp_List.addSubmitButton({
                label: 'Start Daily Attendance Creation'
            });
          //  Emp_List.clientScriptModulePath = './hris_payrollprocess_cl';
            context.response.writePage(Emp_List);
                     
             
			}
			if (context.request.method == 'POST') {
                var param = {};
              
                var resourceListArray=[];
               
               // var payDate = context.request.parameters.custpage_paydate

				var paymonth = context.request.parameters.custpage_paymonth
                var payyear =context.request.parameters.custpage_payyear
                var employee=context.request.parameters.custpage_employee||''
                log.audit('Employee Multiselect',employee);
                if (employee !='') {
    //var employeeIds = employee.split(','); // Convert to array: ["123", "456", "789"]

   /*  // Push all values into selectedEmployees array
    selectedEmployees.push(...employeeIds);
 */
var employee = employee.replace(/\u0005/g, ',');
var employeeIds = '(' + employee + ')';
  log.audit('Employee employeeIds',employeeIds);
  
                resourceListArray.push({
                    //'payDate': payDate,
                    'paymonth': paymonth,
                    'payyear': payyear,
                    'employee':employeeIds
                });
                log.debug("resourceListArray", resourceListArray);
            }
                    else {
   
var employeeIds = ''
  log.audit('Employee employeeIds',employeeIds);
  
                resourceListArray.push({
                    //'payDate': payDate,
                    'paymonth': paymonth,
                    'payyear': payyear,
                    'employee':employeeIds
                });
                log.debug("resourceListArray", resourceListArray);
            }
            var mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: "customscript_njt_mr_daily_attendance",
               // deploymentId: "customdeploy_njt_mr_daily_attendance",
                params: {
                 
            
                        custscript_hris_dailyemplist : JSON.stringify(resourceListArray),
                                        }
            });
            var mrTaskId = mrTask.submit();
            log.debug("mrTaskId1", mrTaskId);  

            /* redirect.toSuitelet({
                scriptId: 'customscript_hris_emp_daily_attend_filte',
                deploymentId: 'customdeploy_hris_emp_daily_attend_filte'
            }); */

               redirect.toSuitelet({
                    scriptId: "customscript_hris_dailyattenmrstatus_sl",
                    deploymentId: "customdeploy_hris_dailyattenmrstatus_sl",
                    parameters: {
                        custscript_chqall_tskid: mrTaskId,
                       
                    }
                });
        }         
            
            
        }

       

        function _logValidation(value) {
            return (value !== 'null' && value !== null && value !== '' && value !== undefined && value !== 'undefined' && !isNaN(value));
        }

        return {
            onRequest: onRequest
        };
    }
);
