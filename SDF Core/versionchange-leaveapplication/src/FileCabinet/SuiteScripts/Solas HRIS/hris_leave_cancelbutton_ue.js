/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */

define(['N/search', 'N/query', 'N/format', 'N/record', 'N/log','N/ui/serverWidget','N/runtime'], function (search, query, format, record, log,serverWidget, runtime) {


    function beforeLoad(scriptContext) {
        var form = scriptContext.form;
        form.clientScriptModulePath = './hris_leave_cancel_cs.js';
        var currentrecord = scriptContext.newRecord;
        var Leaverecordid = currentrecord.id;
        log.debug(' Leaverecordid',  Leaverecordid);
        var currentUser = runtime.getCurrentUser();
        var userRole = currentUser.role;
        log.debug('Current User Role', userRole);

        var approvalstatus = currentrecord.getValue({
            fieldId: 'custrecord_hris_lve_hrmsapprovalstatus'
        });
        log.debug('Approval Status',approvalstatus);
        var cancelstatus = currentrecord.getValue({
            fieldId: 'custrecord_hris_lve_cancel_leavestatus'
        })||1;
        log.debug('Cancel Status',cancelstatus);
        var cancelcheck = currentrecord.getValue({
            fieldId: 'custrecord_hris_lve_cancellation'
        });
              log.debug('Cancel Check',cancelcheck);
              var settlecheck =currentrecord.getValue({
                fieldId:'custrecord_hris_lve_leavesettlement'
              });
              log.debug('Settle check',settlecheck);
              var settlementrefid=currentrecord.getValue({
                fieldId:'custrecord_hris_lve_settlerefno'
              })||'';
              var settlementid=currentrecord.getValue({
                fieldId:'custrecord_hris_lve_settlement_refno'
              })||'';
              
              var workresumecheck = currentrecord.getValue({
                fieldId: 'custrecord_hris_lve_workresume'
            });
                  log.debug('workresumecheck',workresumecheck);     
        if ( Leaverecordid) {
            var LeaveRecord = record.load({
                type: 'customrecord_hris_leaveapplication',
                id:Leaverecordid,
                isDynamic: true
            });

        //  if (scriptContext.type == 'view' && approvalstatus == 2 && cancelstatus == 1) {    
            if (scriptContext.type == 'view' && approvalstatus == 2 && cancelcheck == false && settlecheck==false && workresumecheck == false) {                 
                form.addButton({
                    id: 'custpage_cancel',
                    label: 'Leavecancel',
                    functionName: 'Cancelclick()' //upload CS Function name
                });
            }

            if (scriptContext.type == 'view' && approvalstatus == 2 && cancelcheck == false && settlecheck==true && settlementrefid=='' && (userRole ==1000 || userRole ==3)) {                 
                form.addButton({
                    id: 'custpage_settle',
                    label: 'Leavesettlement',
                    functionName: 'Settlementclick()' //upload CS Function name
                });
            }
            if (scriptContext.type == 'view' && approvalstatus == 2 && cancelcheck == false && settlecheck==true && settlementid=='' && (userRole ==1008 || userRole ==3)) {                 
                form.addButton({
                    id: 'custpage_settle',
                    label: 'Leavesettlement',
                    functionName: 'Processsettlement()' //upload CS Function name
                });
            }
           

      

        }



    }
   

    return {
        beforeLoad: beforeLoad
    };

});