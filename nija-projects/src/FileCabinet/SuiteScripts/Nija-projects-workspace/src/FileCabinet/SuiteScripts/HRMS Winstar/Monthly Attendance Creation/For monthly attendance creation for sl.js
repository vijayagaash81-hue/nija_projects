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
                    title: 'Process Monthly Attendance'
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
                 var Pay_subsidiary = Emp_List.addField({
                    id: 'custpage_subsidiary',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Subsidiary',
                    //source: 'subsidiary'
                });
               Pay_subsidiary.isMandatory = true;
                var Pay_Group = Emp_List.addField({
                    id: 'custpage_paygroup',
                    type: serverWidget.FieldType.SELECT,
                    label: 'PayGroup',
                   // source: 'customrecord_hris_process_groupmaster'
                });
               /*  Pay_Month.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                }); */
                Pay_Group.isMandatory = true;
                var empCategory = Emp_List.addField({
                    id: 'custpage_empcategory',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Employee Category',
                    source: 'customrecord_hris_employeecategory'
                });
                 var employee = Emp_List.addField({
                    id: 'custpage_employee',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Employee',
                    source: 'employee'
                });


               Emp_List.addSubmitButton({
                label: 'Process Monthly Attendance'
            });
            Emp_List.clientScriptModulePath = './for monthly atendance creation cs.js';
            context.response.writePage(Emp_List);
                     
             
			}
			if (context.request.method == 'POST') {
                var param = {};
              
                var resourceListArray=[];
               
               // var payDate = context.request.parameters.custpage_paydate

				var paymonth = context.request.parameters.custpage_paymonth
                var payyear =context.request.parameters.custpage_payyear
                var Paysubsidiary = context.request.parameters.custpage_subsidiary
                var paygroup = context.request.parameters.custpage_paygroup
                var empcategory = context.request.parameters.custpage_empcategory
                var employee = context.request.parameters.custpage_employee
               // log.audit('Employee Multiselect',employee);

                resourceListArray.push({
                    //'payDate': payDate,
                    'paymonth': paymonth,
                    'payyear': payyear,
                    'Paysubsidiary': Paysubsidiary,
                    'paygroup': paygroup,
                    'empcategory': empcategory,
                    'employee': employee
                });
                log.debug("resourceListArray", resourceListArray);

           /*  var mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: "customscript_njt_mr_month_attendance",
                deploymentId: "customdeploy_njt_mr_month_attendance",
                params: {

                        custscript_hris_dailyemplist : JSON.stringify(resourceListArray),
                                        }
            });
            var mrTaskId = mrTask.submit();
            log.debug("mrTaskId1", mrTaskId);   */

           redirect.toSuitelet({
    scriptId: 'customscript_hris_post_monthly_create',
    deploymentId: 'customdeploy_hris_post_monthly_create',
    parameters: {
        'custparam_paymonth': paymonth,
        'custparam_payyear': payyear,
        'custparam_paygroup': paygroup,
        'custparam_empcategory': empcategory,
        'custparam_subsidiary':Paysubsidiary,
        'custparam_employee':employee
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
