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
            title: "Employee Regular Monthly attendance",
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
        var locationfield=form.addField({
                id: "custpage_location",
            type: serverWidget.FieldType.SELECT,
            label: "Location",
            source: "customrecord_cseg_hris_emploc",
        });
      
            locationfield.isMandatory=true;
        // Add a submit button
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
            /*    var departmentField = context.request.parameters.custpage_deparment;
              log.debug("departmentField",departmentField);
            */   
              var locationField = context.request.parameters.custpage_location;
              log.debug("locationField",locationField);
           
            //   var projectField = context.request.parameters.custpage_project;
            //   log.debug("projectField",projectField);
            //   var projectsegField = context.request.parameters.custpage_projectseg;
            //   log.debug("projectsegField",projectsegField);
              var subsidiaryfield = context.request.parameters.custpage_subsi;
              log.debug("subsidiaryfield",subsidiaryfield);
                // Redirect to the second Suitelet with manager and date values as parameters
                redirect.toSuitelet({
                   scriptId: 'customscript_hris_dailytomon_process_sl',
                    deploymentId: 'customdeploy_hris_dailytomon_process_sl',
                    parameters: {
                        custparam_month: monthField,
                        custparam_year:yearField,
                        // custparam_project: projectField,
                        // custparam_projectseg: projectsegField,
                        custparam_subsi:subsidiaryfield,
                        //custparam_department:departmentField,
                        custparam_location:locationField,
                    },
                });
            }
        }

        return {
            onRequest: onRequest,
        };
    });
