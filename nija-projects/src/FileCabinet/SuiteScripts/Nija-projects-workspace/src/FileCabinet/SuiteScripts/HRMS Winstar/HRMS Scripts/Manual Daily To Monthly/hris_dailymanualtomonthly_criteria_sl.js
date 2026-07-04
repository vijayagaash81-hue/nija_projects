/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(["N/ui/serverWidget", "N/search", "N/log", "N/task", "N/redirect", "N/record", "N/runtime", "N/format", "N/query", "N/currentRecord", "N/https", "N/url"],
    function (serverWidget, search, log, task, redirect, record, runtime, format, query, currentRecord, https, urlMod) {
        // Define the main function for handling requests
        function onRequest(context) {
           // Create a form
           var form = serverWidget.createForm({
            title: "Employee Daily Attendance To Monthly Attendance",
        });

        // Add fields to the form
        var monthField = form.addField({
            id: "custpage_month",
            type: serverWidget.FieldType.SELECT,
            label: "Month",
            source: "customlist_hris_month_list",
        });
          monthField.isMandatory = true;

        var yearField = form.addField({
            id: "custpage_year",
            type: serverWidget.FieldType.SELECT,
            label: "Year",
            source: "customlist_hris_year_master",
        });
          yearField.isMandatory = true;

        // var projectField = form.addField({
        //     id: "custpage_project",
        //     type: serverWidget.FieldType.SELECT,
        //     label: "Project",
        //     source: "customrecord_cseg_njt_seg_proj",
        // });
        // projectField.isMandatory = true; // Make the field mandatory
        
        // var projectsegField = form.addField({
        //     id: "custpage_projectseg",
        //     type: serverWidget.FieldType.SELECT,
        //     label: "Project Site",
        //     source: "customrecord_cseg_njt_seg_pros",
        // });
        // projectsegField.isMandatory = true; // Make the field mandatory
        var subsidiaryfield=form.addField({
                id: "custpage_subsi",
            type: serverWidget.FieldType.SELECT,
            label: "Subsidairy",
            source: "subsidiary",
        });
        subsidiaryfield.isMandatory = true; // Make the field mandatory
        
       /*   var departmentfield=form.addField({
                id: "custpage_department",
            type: serverWidget.FieldType.SELECT,
            label: "Department",
            source: "customrecord_cseg_hris_empdept",
        });
        departmentfield.isMandatory = true; */

      /*   var locationfield=form.addField({
                id: "custpage_location",
            type: serverWidget.FieldType.SELECT,
            label: "Location",
            source: "customrecord_cseg_hris_emploc",
        });
      
            locationfield.isMandatory=true; */
          var processgroup=form.addField({
                id: "custpage_processgroup",
            type: serverWidget.FieldType.SELECT,
            label: "Pay Group",
            source: "customrecord_hris_process_groupmaster",
        });
      
           processgroup.isMandatory=true;  
            var ot_type=form.addField({
                id: "custpage_ottype",
            type: serverWidget.FieldType.SELECT,
            label: "OT Type",
            source: "customrecord_hris_ottype_list",
        });
      
           ot_type.isMandatory=true;  
           
           var employee = form.addField({
                id: "custpage_employee",
            type: serverWidget.FieldType.SELECT,
            label: "Employee",
            source: "employee",
        });
        // Add a submit button
         form.clientScriptModulePath = "./hris_dailymanualtomonthly_validation_cs.js";
        form.addSubmitButton({
            label: "Submit",
        });
               // Link the client script to the form
         //   form.clientScriptModulePath = './employee daily attendance cs.js'; // Adjust the path as necessary
            if (context.request.method === "GET") {
                context.response.writePage(form);
            } else if (context.request.method === "POST") {
                var monthField = context.request.parameters.custpage_month;
              log.debug("monthField",monthField);
              var yearField = context.request.parameters.custpage_year;
              log.debug("yearField",yearField);
               var employee = context.request.parameters.custpage_employee; 
             /*  var locationField = context.request.parameters.custpage_location;
              log.debug("locationField",locationField); */
           
            //   var projectField = context.request.parameters.custpage_project;
            //   log.debug("projectField",projectField);
            //   var projectsegField = context.request.parameters.custpage_projectseg;
            //   log.debug("projectsegField",projectsegField);
              var subsidiaryfield = context.request.parameters.custpage_subsi;
              log.debug("subsidiaryfield",subsidiaryfield);
              var paygroup =  context.request.parameters.custpage_processgroup
              var ottype= context.request.parameters.custpage_ottype;
                // Redirect to the second Suitelet with manager and date values as parameters
                redirect.toSuitelet({
                   scriptId: 'customscript_hris_dailymanmonth_proce_sl',
                    deploymentId: 'customdeploy_hris_dailymanmonth_proce_sl',
                    parameters: {
                        custparam_month: monthField,
                        custparam_year:yearField,
                        // custparam_project: projectField,
                        // custparam_projectseg: projectsegField,
                        custparam_subsi:subsidiaryfield,
                        custparam_paygroup:paygroup,
                        custparam_employee:employee,
                        custparam_ottype:ottype
                        //custparam_department:departmentField,
                        //custparam_location:locationField,
                    },
                });
            }
        }

        return {
            onRequest: onRequest,
        };
    });
