/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */

define(['N/ui/serverWidget', 'N/search', 'N/log', 'N/task', 'N/redirect', 'N/record', 'N/runtime', 'N/format', 'N/query', 'N/currentRecord', 'N/https', 'N/url', './moment.js'],

    function (serverWidget, search, log, task, redirect, record, runtime, format, query, currentRecord, https, url, moment) {


        function onRequest(context, response) {

            var method = context.request.method;
            var parameters = context.request.parameters;
            var objcurrentRecord = context.record;
            var userObj = runtime.getCurrentUser();
            //  var empName = parameters.custpage_employee;
            var lineManager = parameters.custpage_linemanager;
            var prevproject = parameters.custpage_prevproject;
            var prevprojectseg = parameters.custpage_prevprojectseg;

            var currproject = parameters.custpage_currproject;
            var currprojectseg = parameters.custpage_currentprojectseg;

            log.debug('currproject', currproject);
            log.debug('currproject seg', currprojectseg);
            var from_date = parameters.custpage_from_date;
            var to_date = parameters.custpage_to_date;
            var filtfromdate = parameters.custpage_filterfromdate;
            var filttodate = parameters.custpage_filtertodate;
            var alltype = parameters.custpage_allocationtype;
            var alltypeid = parameters.custpage_allocationtypeid;
            var allremarks = parameters.custpage_remark;
            //  var approval_sts = parameters.custpage_approval_status;
            var apply_status_chk = parameters.custpage_applystatus;

            var currentUser = runtime.getCurrentUser();

            // Access user information
            var userId = currentUser.id;
            var userName = currentUser.name;
            var userRoleId = currentUser.role;

            // Log user information
            log.debug('Current User ID:', userId);
            log.debug('Current User Name:', userName);
            log.debug('Current User Role ID:', userRoleId);
            var form = serverWidget.createForm({
                title: 'Employee Deployment/Employee Undeployment'
            });
            form.addSubmitButton({
                label: 'Submit'
            });
            var userObj = runtime.getCurrentUser();
            form.addFieldGroup({
                id: 'filterid',
                label: 'Filters'
            });

            /*  var employeeField = form.addField({
                 id: 'custpage_employee',
                 type: serverWidget.FieldType.SELECT,
                 label: 'Employee',
                 source: 'employee',
                 container: 'filterid',
                // functionName: 'fieldChanged()'
             });
             employeeField.isMandatory = true;
             employeeField.defaultValue = empName; */
             var previousproject = form.addField({
                id: 'custpage_prevproject',
                type: serverWidget.FieldType.SELECT,
                label: 'Project',
                source: 'customrecord_cseg_njt_seg_proj',
                container: 'filterid',
                // functionName: 'fieldChanged()'
            });
            //previousproject.isMandatory = true;
            previousproject.defaultValue = prevproject;
        
            var previousprojectseg = form.addField({
                id: 'custpage_prevprojectseg',
                type: serverWidget.FieldType.SELECT,
                label: 'Project Segment',
                source: 'customrecord_cseg_njt_seg_pros',
                container: 'filterid',
                // functionName: 'fieldChanged()'
            });
            //previousproject.isMandatory = true;
            previousprojectseg.defaultValue = prevprojectseg;
            var filterfromdate = form.addField({
                id: 'custpage_filterfromdate',
                type: serverWidget.FieldType.DATE,
                label: 'From Date',
                container: 'filterid'
            });
            filterfromdate.defaultValue = filtfromdate;

            var filtertodate = form.addField({
                id: 'custpage_filtertodate',
                type: serverWidget.FieldType.DATE,
                label: 'To Date',
                container: 'filterid'
            });
            filtertodate.defaultValue = filttodate;
            var linemanagerField = form.addField({
                id: 'custpage_linemanager',
                type: serverWidget.FieldType.SELECT,
                label: 'Line Manager',
                source: 'employee',
                container: 'filterid',
                // functionName: 'fieldChanged()'
            });
            //  linemanagerField.isMandatory = true;
            linemanagerField.defaultValue = lineManager;
            form.addField({
                id: 'space2',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'space2',
                container: 'filterid'
            }).defaultValue = '<div style="height: 0px;width: 15px;"></div>'; // Adjust the height as needed

          

            form.addFieldGroup({
                id: 'deploy',
                label: 'Deploy/Transfer/UnDeploy'
            });
            var allocationtype = form.addField({
                id: 'custpage_allocationtype',
                type: serverWidget.FieldType.SELECT,
                label: 'Allocation Type',
                source: 'customrecord_hris_empalloctype_list',
                container: 'deploy',
                // functionName: 'fieldChanged()'
            });
            // allocationtype.isMandatory=true;
            allocationtype.defaultValue = alltype
            var allocationtypeid = form.addField({
                id: 'custpage_allocationtypeid',
                type: serverWidget.FieldType.INTEGER,
                label: 'Allocation Typeid',
                // source: 'customrecord_hris_empalloctype_list',
                container: 'deploy',
                // functionName: 'fieldChanged()'
            });
            allocationtypeid.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN,
            });
            //  allocationtypeid.defaultValue=allocationtypeid
            var currentproject = form.addField({
                id: 'custpage_currproject',
                type: serverWidget.FieldType.SELECT,
                label: 'Current Project',
                source: 'customrecord_cseg_njt_seg_proj',
                container: 'deploy',
                // functionName: 'fieldChanged()'
            });
            // currentproject.isMandatory = true;
            currentproject.defaultValue = currproject;
            var currentprojectseg = form.addField({
                id: 'custpage_currentprojectseg',
                type: serverWidget.FieldType.SELECT,
                label: 'Current Project Segment',
                source: 'customrecord_cseg_njt_seg_pros',
                container: 'deploy',
                // functionName: 'fieldChanged()'
            });
            //previousproject.isMandatory = true;
            currentprojectseg.defaultValue = currprojectseg;
            form.addField({
                id: 'space1',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'space1',
                container: 'deploy'
            }).defaultValue = '<div style="height: 0px;width: 15px;"></div>'; // Adjust the height as needed

            var fromDate = form.addField({
                id: 'custpage_from_date',
                type: serverWidget.FieldType.DATE,
                label: 'From',
                container: 'deploy'
            });
            fromDate.defaultValue = from_date;
            //  fromDate.isMandatory = true;
            var toDate = form.addField({
                id: 'custpage_to_date',
                type: serverWidget.FieldType.DATE,
                label: 'To',
                container: 'deploy'
            });
            toDate.defaultValue = to_date;
            //  toDate.isMandatory = true;
            form.addField({
                id: 'space3',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'space3',
                container: 'deploy'
            }).defaultValue = '<div style="height: 0px;width: 15px;"></div>'; // Adjust the height as needed

            var remark = form.addField({
                id: 'custpage_remark',
                type: serverWidget.FieldType.TEXTAREA,
                label: 'Remark',
                container: 'deploy'
            });
            /* remark.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN,
            }); */

            var apply_status = form.addField({
                id: 'custpage_applystatus',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'Apply Allocation',
                container: 'deploy'
            });


            var mrStatus = form.addField({
                id: 'custpage_mr_status',
                type: serverWidget.FieldType.SELECT,
                label: 'Status Field'
            });
            mrStatus.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED,
            });

            log.debug('method', method);

            form.clientScriptModulePath = "./hris_empallocationtransfer_cs.js";
            if (context.request.method == 'GET') {
                var statusMr = 1
                log.debug("statusMr", statusMr);
                var sublist = createSublist(form, serverWidget);
                context.response.writePage(form);

            } else if (context.request.method == 'POST') {
                var statusQuery = "select custrecord_hris_mr_sts,BUILTIN.DF(custrecord_hris_mr_sts)as name from customrecord_hris_mr_status_bar_rec where id=1";
                var queryResults = query.runSuiteQL({
                    query: statusQuery
                });
                var records = queryResults.asMappedResults();

                if (records.length > 0) {
                    for (var r = 0; r < records.length; r++) {
                        var record = records[r];
                        var name = record.name;
                        var id = record.custrecord_hris_mr_sts; // Assuming 'id' is the value you want to set

                        mrStatus.addSelectOption({
                            value: id,
                            text: name,
                            isSelected: true
                        });


                    }
                }

                var statusMr = context.request.parameters.custpage_mr_status;
                log.debug("statusMrpost", statusMr);

                var sublist = createSublist(form, serverWidget);
                if (statusMr == 1) {

                    setSublistvalue(sublist, query, lineManager, from_date, to_date, apply_status_chk, prevproject, format, filtfromdate, filttodate, allremarks,prevprojectseg);
                }
                var rowArray = parameters.employeedetailsdata.split('\u0002');
                log.debug('rowArray', rowArray);
                log.debug('rowArray.length', rowArray.length);
                var resourceListArray = [];
                var employeeid = [];
                var prevproject = '';
                var lineManager = parameters.custpage_linemanager;
                prevproject = parameters.custpage_prevproject;
                var currproject = parameters.custpage_currproject;
                log.debug('currproject', currproject);
                var currprojectseg= parameters.custpage_currentprojectseg;
                log.debug('current Project seg ',currprojectseg)
                var from_date = parameters.custpage_from_date;
                var to_date = parameters.custpage_to_date;
                var apply_status_chk = parameters.custpage_applystatus;
                var alltype = parameters.custpage_allocationtype;
                var alltypeid = parameters.custpage_allocationtypeid;
                var allremarks = parameters.custpage_remark;
                log.debug("Allocation status", apply_status_chk);
                for (var line = 0; line < rowArray.length; line++) {

                    var columnArray = rowArray[line].split('\u0001');
                    //log.debug('columnArray', JSON.stringify(columnArray));
                    var selectchk = columnArray[0];
                    log.debug("selectchk", selectchk);

                    if (selectchk == 'T' && apply_status_chk == 'T') {

                        var empid = columnArray[1];
                        log.debug(" before parseintempid", empid);
                        empid = parseInt(empid)
                        log.debug("empid", empid);
                       /*  var position = columnArray[3];
                        log.debug("Position id", position);
                        var projectsegment = columnArray[5];
                        log.debug("project segment", projectsegment); */
                        // resourceListArray.push(empid);
                        employeeid.push(empid);
                        log.debug('Employee Id ', employeeid);
                        log.audit("currprojectseg",currprojectseg)
                        resourceListArray.push({
                            'empid': empid,
                            'lineManager': lineManager,
                            'projectsegment': currprojectseg,
                            'prevproject': prevproject,
                            'currproject': currproject,
                            'fromdate': from_date,
                            'todate': to_date,
                            'alltype': alltype,
                            'alltypeid': alltypeid,
                            'allremarks': allremarks,
                            
                            
                        });
                        log.debug("resourceListArray", resourceListArray);



                    }
                    else if (selectchk == 'F' && apply_status_chk == 'T') {
                        log.audit('Inside');
                        context.response.write('No Employees are selected to proceed for Allocation.');

                    }


                }

                if (apply_status_chk == 'T' && resourceListArray && resourceListArray.length != 0) {
                    var mrTask = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: "customscript_hris_emp_alloctrans_mrs",
                        deploymentId: "customdeploy_hris_emp_alloctrans_mrs",
                        params: {
                            custscript_hris_parametre: JSON.stringify(resourceListArray),
                        },
                    });
                    var mrTaskId = mrTask.submit();
                    log.debug("mrTaskId", mrTaskId);
                    redirect.toSuitelet({
                        scriptId: "customscript_hris_empallocationtrans_sl",
                        deploymentId: "customdeploy_hris_empallocationtrans_sl",
                    });
                }

                /*  record.submitFields({
                     type: "customrecord_hris_mr_status_bar_rec",
                     id: 1,
                     values: {
                         custrecord_hris_mr_sts: 2
                     },
                     options: {
                         enableSourcing: false,
                         ignoreMandatoryFields: true
                     }
                 }); */



                //  if(statusMr ==1){
                //}
                context.response.writePage(form);



            }






        }




        return {
            onRequest: onRequest,


        };

    });


function createSublist(form, serverWidget) {
    var employeeSublist = form.addSublist({
        id: 'employeedetails',
        type: serverWidget.SublistType.LIST,
        label: 'Employee Details'
    });
    employeeSublist.addMarkAllButtons();
    employeeSublist.addRefreshButton();

    var selectchk = employeeSublist.addField({
        id: 'chkselect',
        type: serverWidget.FieldType.CHECKBOX,
        label: 'Select'
    });
    var internal_id = employeeSublist.addField({
        id: 'internalid',
        type: serverWidget.FieldType.TEXT,
        label: 'INTERNAL ID'
    });
    /* var internal_id_chk=employeeSublist.addField({
        id: 'internalidchk',
        type: serverWidget.FieldType.TEXT,
        label: 'INTERNAL ID CHK'
    }); */
    internal_id.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });
    var employee = employeeSublist.addField({
        id: "employee",
        type: serverWidget.FieldType.SELECT,
        label: "Employee Name",
        source: "employee"
    });
    employee.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED
    });
    var employeecode = employeeSublist.addField({
        id: "employeecode",
        type: serverWidget.FieldType.TEXT,
        label: "Employee Code"
    });
    employeecode.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED
    });
    /*  var department =employeeSublist.addField({
         id: "department",
         type: serverWidget.FieldType.TEXT,
         label: "Department",
         // source: "employee"
     });
     department.updateDisplayType({
         displayType: serverWidget.FieldDisplayType.DISABLED
     });
     var subdepartment=employeeSublist.addField({
         id: "subdepartment",
         type: serverWidget.FieldType.TEXT,
         label: "Sub Department",
         //source: "employee"
     });
     subdepartment.updateDisplayType({
         displayType: serverWidget.FieldDisplayType.DISABLED
     }); */
    var position = employeeSublist.addField({
        id: "position",
        type: serverWidget.FieldType.SELECT,
        label: "Position",
        source: "customrecord_hris_corporatetitle"
    });
    position.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED
    });
    var project = employeeSublist.addField({
        id: "project",
        type: serverWidget.FieldType.SELECT,
        label: "Project",
       // source: "classification"
        source: "customrecord_cseg_njt_seg_proj"
      
    });
    project.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED
    });

    var projectsegment = employeeSublist.addField({
        id: "projectsegment",
        type: serverWidget.FieldType.SELECT,
        label: "Project Segment",
        source: "customrecord_cseg_njt_seg_pros"
    });
    projectsegment.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED
    });
    var fromdate = employeeSublist.addField({
        id: 'fromdate',
        type: serverWidget.FieldType.DATE,
        label: 'Active From Date'
    });
    fromdate.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED
    });
    var todate = employeeSublist.addField({
        id: 'todate',
        type: serverWidget.FieldType.DATE,
        label: 'Active To Date'
    });
    todate.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED
    });


    return employeeSublist;
}

function setSublistvalue(sublist, query, lineManager, from_date, to_date, apply_status_chk, prevproject, format, filtfromdate, filttodate, alltype, alltypeid, allremarks,prevprojectseg) {

    /*   if (prevproject) {
          var empallocsql = "select  b.id as empid,b.custentity_hris_empcode as empcode,BUILTIN.DF(b.custentity_hris_empdepartment_new) as department,BUILTIN.DF(b.custentity_hris_empsubdepartment) as subdepartment,\
                          a.custrecord_hris_alloc_startdate as startdate,a.custrecord_hris_alloc_proposedenddate as enddate,\
                          a.custrecord_hris_alloc_projectsegment as project from customrecord_hris_empallocationtransfer a join employee b on a.custrecord_hris_alloc_empid=b.id\
                          where a.custrecord_hris_alloc_projectsegment ='"+ prevproject + "'  and a.custrecord_hris_alloc_linemanager = '" + lineManager + "'and a.custrecord_hris_alloc_actualenddate is null\
                          and a.custrecord_hris_alloc_empalloc_sts=1\
                          union all\
                          select  b.id as empid,b.custentity_hris_empcode as empcode,BUILTIN.DF(b.custentity_hris_empdepartment_new) as department,BUILTIN.DF(b.custentity_hris_empsubdepartment) as subdepartment ,\
                         null as startdate,null as denddate,null as project \
                          from customrecord_hris_empallocationtransfer a  right outer join employee b on a.custrecord_hris_alloc_empid=b.id \
                          where b.custentity_hris_emplinemanger = '"+ lineManager + "' and a.custrecord_hris_alloc_linemanager  is null"
  
         
  
                          var empallocsql = "select  b.id as empid,b.custentity_hris_empcode as empcode,BUILTIN.DF(b.custentity_hris_empdepartment_new) as department,BUILTIN.DF(b.custentity_hris_empsubdepartment) as subdepartment,\
                          a.custrecord_hris_alloc_startdate as startdate,a.custrecord_hris_alloc_proposedenddate as enddate,\
                          a.custrecord_hris_alloc_projectsegment as project from customrecord_hris_empallocationtransfer a join employee b on a.custrecord_hris_alloc_empid=b.id\
                          where  a.custrecord_hris_alloc_linemanager = '" + lineManager + "'and a.custrecord_hris_alloc_actualenddate is null\
                          and a.custrecord_hris_alloc_empalloc_sts=1{{alloccondition}}"
                         
      } */
    /* else {
       var empallocsql = " select b.id as empid,b.custentity_hris_empcode as empcode,BUILTIN.DF(b.custentity_hris_empdepartment_new) as department,BUILTIN.DF(b.custentity_hris_empsubdepartment) as subdepartment from employee b \
                     where b.custentity_hris_emplinemanger = '"+ lineManager + "' "*/
    /*  var empallocsql = "select  b.id as empid,b.custentity_hris_empcode as empcode,BUILTIN.DF(b.custentity_hris_empdepartment_new) as department,BUILTIN.DF(b.custentity_hris_empsubdepartment) as subdepartment,\
     a.custrecord_hris_alloc_startdate as startdate,a.custrecord_hris_alloc_proposedenddate as enddate,\
     a.custrecord_hris_alloc_projectsegment as project from customrecord_hris_empallocationtransfer a join employee b on a.custrecord_hris_alloc_empid=b.id\
     where  a.custrecord_hris_alloc_linemanager = '" + lineManager + "'and a.custrecord_hris_alloc_actualenddate is null and a.custrecord_hris_alloc_empalloc_sts=1\
     union all\
     select  b.id as empid,b.custentity_hris_empcode as empcode,BUILTIN.DF(b.custentity_hris_empdepartment_new) as department,BUILTIN.DF(b.custentity_hris_empsubdepartment) as subdepartment ,\
    null as startdate,null as denddate,null as project \
     from customrecord_hris_empallocationtransfer a  right outer join employee b on a.custrecord_hris_alloc_empid=b.id \
     where b.custentity_hris_emplinemanger = '"+ lineManager + "' and a.custrecord_hris_alloc_linemanager  is null"
 
 

} */


    /*      var empallocsql = "select  b.id as empid,b.custentity_hris_empcode as empcode,BUILTIN.DF(b.custentity_hris_empdepartment_new) as department,BUILTIN.DF(b.custentity_hris_empsubdepartment) as subdepartment,\
         a.custrecord_hris_alloc_startdate as startdate,a.custrecord_hris_alloc_proposedenddate as enddate,\
         a.custrecord_hris_alloc_projectsegment as project from customrecord_hris_empallocationtransfer a join employee b on a.custrecord_hris_alloc_empid=b.id\
         where  a.custrecord_hris_alloc_linemanager = '" + lineManager + "'and a.custrecord_hris_alloc_actualenddate is null\
         and a.custrecord_hris_alloc_empalloc_sts=1{{alloccondition}}"
        log.debug('empallocsql', empallocsql);

if(prevproject && filtfromdate && filttodate){
empallocsql = empallocsql.replace(/{{alloccondition}}/gi, " and  a.custrecord_hris_alloc_projectsegment ='"+ prevproject + "'and (a.custrecord_hris_alloc_startdate >='"+filtfromdate+"' and a.custrecord_hris_alloc_startdate <='"+filttodate+"')");


}
else if(prevproject){
empallocsql = empallocsql.replace(/{{alloccondition}}/gi, " and  a.custrecord_hris_alloc_projectsegment ='"+ prevproject + "'");

}
else if(filtfromdate && filttodate){
empallocsql = empallocsql.replace(/{{alloccondition}}/gi, " and (a.custrecord_hris_alloc_startdate >='"+filtfromdate+"' and a.custrecord_hris_alloc_startdate <='"+filttodate+"')");
}
else{
var empallocsql = "select  b.id as empid,b.custentity_hris_empcode as empcode,BUILTIN.DF(b.custentity_hris_empdepartment_new) as department,BUILTIN.DF(b.custentity_hris_empsubdepartment) as subdepartment,\
a.custrecord_hris_alloc_startdate as startdate,a.custrecord_hris_alloc_proposedenddate as enddate,\
a.custrecord_hris_alloc_projectsegment as project from customrecord_hris_empallocationtransfer a join employee b on a.custrecord_hris_alloc_empid=b.id\
where  a.custrecord_hris_alloc_linemanager = '" + lineManager + "'and a.custrecord_hris_alloc_actualenddate is null and a.custrecord_hris_alloc_empalloc_sts=1\
union all\
select  b.id as empid,b.custentity_hris_empcode as empcode,BUILTIN.DF(b.custentity_hris_empdepartment_new) as department,BUILTIN.DF(b.custentity_hris_empsubdepartment) as subdepartment ,\
null as startdate,null as denddate,null as project \
from customrecord_hris_empallocationtransfer a  right outer join employee b on a.custrecord_hris_alloc_empid=b.id \
where b.custentity_hris_emplinemanger = '"+ lineManager + "' and a.custrecord_hris_alloc_linemanager  is null"


} */

    // Changed according to vanitha mam told 08/11/2024 
    var alloccondition = '';
    var empallocsql = "select  a.custrecord_njt_emp_allocation_project_se as projectsegment,a.custrecord_njt_empall_position as position,b.id as empid,b.custentity_hris_empcode as empcode,BUILTIN.DF(b.custentity_hris_empdepartment_new) as department,BUILTIN.DF(b.custentity_hris_empsubdepartment) as subdepartment,\
        a.custrecord_hris_alloc_startdate as startdate,a.custrecord_hris_alloc_proposedenddate as enddate,\
        a.custrecord_hris_alloc_projectsegment as project from customrecord_hris_empallocationtransfer a join employee b on a.custrecord_hris_alloc_empid=b.id\
        where   a.custrecord_hris_alloc_actualenddate is null\
        and a.custrecord_hris_alloc_empalloc_sts=1"
    log.debug('empallocsql', empallocsql);
    if(prevprojectseg){
       empallocsql+=" and custrecord_njt_emp_allocation_project_se =  " + prevprojectseg+"";

    }

    if (prevproject && filtfromdate && filttodate && lineManager) {
        empallocsql += " and a.custrecord_hris_alloc_linemanager = '" + lineManager + "'and a.custrecord_hris_alloc_projectsegment ='" + prevproject + "'and (a.custrecord_hris_alloc_startdate >='" + filtfromdate + "' and a.custrecord_hris_alloc_startdate <='" + filttodate + "')";
    }
    else if (prevproject && filtfromdate && filttodate) {
        empallocsql += " and  a.custrecord_hris_alloc_projectsegment ='" + prevproject + "'and (a.custrecord_hris_alloc_startdate >='" + filtfromdate + "' and a.custrecord_hris_alloc_startdate <='" + filttodate + "')";

    }
    else if (prevproject && lineManager) {
        empallocsql += " and a.custrecord_hris_alloc_linemanager = '" + lineManager + "' and  a.custrecord_hris_alloc_projectsegment ='" + prevproject + "'";
    }
    else if (filtfromdate && filttodate && lineManager) {
        empallocsql += "and a.custrecord_hris_alloc_linemanager = '" + lineManager + "' and (a.custrecord_hris_alloc_startdate >='" + filtfromdate + "' and a.custrecord_hris_alloc_startdate <='" + filttodate + "')";
    }
    else if (prevproject) {
        empallocsql += " and  a.custrecord_hris_alloc_projectsegment ='" + prevproject + "'";

    }
    else if (filtfromdate && filttodate) {
        empallocsql += " and (a.custrecord_hris_alloc_startdate >='" + filtfromdate + "' and a.custrecord_hris_alloc_startdate <='" + filttodate + "')";
    }

    var queryResult = query.runSuiteQL({
        query: empallocsql
    });
    var tsResult = queryResult.asMappedResults();
    //log.debug("tsResult", tsResult.length);
    var arrResults = [];
    //log.debug("arrResults",arrResults);
    for (var loop = 0; loop < tsResult.length; loop++) {
        log.debug("tsResult[loop]", tsResult[loop]);
        //log.debug("tsResult[loop]", tsResult[loop]);
        var rec = tsResult[loop];

        var empid = rec.empid;
        log.debug('empid', empid);
        var empcode = rec.empcode || '';
        var department = rec.department || '';
        log.debug('Department', department);
        var subdepartment = rec.subdepartment || '';
        log.debug('subdepartment', subdepartment);
        var startdate = rec.startdate || '';
        var enddate = rec.enddate || '';
        var project = rec.project || '';
        var projectsegment = rec.projectsegment || '';
        var position = rec.position || '';
        /*   sublist.setSublistValue({
              id: 'internalid',
              line: loop,
              value: parseInt(intidchk)
          });
           */
      if(empid){
        sublist.setSublistValue({
            id: 'internalid',
            line: loop,
            value: empid
        });
      }
        if(empid){
          sublist.setSublistValue({
            id: 'employee',
            line: loop,
            value: empid
        });
        }
        if (empcode != '') {
            sublist.setSublistValue({
                id: 'employeecode',
                line: loop,
                value: empcode
            });
        }
        if (position != '') {
            sublist.setSublistValue({
                id: 'position',
                line: loop,
                value: position
            });
        }
        if (projectsegment != '') {
            sublist.setSublistValue({
                id: 'projectsegment',
                line: loop,
                value: projectsegment
            });
        }
        if (startdate != '') {
            /*  startdate = format.parse({
                 value: startdate,
                 type: format.Type.DATE
             })  */
            sublist.setSublistValue({
                id: 'fromdate',
                line: loop,
                value: startdate
            });
        }
        if (enddate != '') {
            /*    enddate = format.parse({
                   value: enddate,
                   type: format.Type.DATE
               })   */
            sublist.setSublistValue({
                id: 'todate',
                line: loop,
                value: enddate
            });
        }
        if (project != '') {
            sublist.setSublistValue({
                id: 'project',
                line: loop,
                value: project
            });
        }

    }



}







