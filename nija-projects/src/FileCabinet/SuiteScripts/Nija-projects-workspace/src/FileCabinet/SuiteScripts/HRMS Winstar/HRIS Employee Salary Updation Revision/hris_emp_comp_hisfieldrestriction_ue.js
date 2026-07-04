/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget', 'N/runtime'], function(serverWidget, runtime) {

    function beforeLoad(context) {
        var form = context.form;
        var role = runtime.getCurrentUser().role;

        // Example: hide "custbody_secret" field if not Admin
       
        if (role != '1059') { // 3 = Administrator role ID
            form.getField({id: 'custrecord_hris_monthly_gross_salary'}).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            form.getField({id: 'custrecord_hris_ctc'}).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            form.getField({id: 'custrecord_hris_annual_gross_salary'}).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
           
             form.getField({id: 'custrecord_hris_monthly_gross_salary_in'}).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
             form.getField({id: 'custrecord_hris_annual_gross_salary_in_b'}).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            

             var sublist = form.getSublist({id: 'recmachcustrecord_hris_comhis_compenhistoryid'});
        if (sublist) {
            sublist.getField({id: 'custrecord_hris_comhis_monthlyamoun'}).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
             sublist.getField({id: 'custrecord_hris_comhis_annuallyamount'}).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
             sublist.getField({id: 'custrecord_hris_comhis_prev_monthlyamt'}).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

        }
     
          
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});
