/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */

define(['N/search', 'N/query', 'N/format', 'N/record', 'N/log','N/ui/serverWidget','N/runtime'], (search, query, format, record, log,serverWidget, runtime) => {


    const beforeLoad = (scriptContext) => {
        const form = scriptContext.form;
        form.clientScriptModulePath = './hris_leave_cancel_cs.js';
        const currentrecord = scriptContext.newRecord;
        const Leaverecordid = currentrecord.id;
        log.debug(' Leaverecordid',  Leaverecordid);
        const currentUser = runtime.getCurrentUser();
        const userRole = currentUser.role;
        log.debug('Current User Role', userRole);

        const approvalstatus = currentrecord.getValue({
            fieldId: 'custrecord_hris_lve_hrmsapprovalstatus'
        });
        log.debug('Approval Status',approvalstatus);
        const cancelstatus = currentrecord.getValue({
            fieldId: 'custrecord_hris_lve_cancel_leavestatus'
        })||1;
        log.debug('Cancel Status',cancelstatus);
        const cancelcheck = currentrecord.getValue({
            fieldId: 'custrecord_hris_lve_cancellation'
        });
              log.debug('Cancel Check',cancelcheck);
              const settlecheck =currentrecord.getValue({
                fieldId:'custrecord_hris_lve_leavesettlement'
              });
              log.debug('Settle check',settlecheck);
              const settlementrefid =currentrecord.getValue({
                fieldId:'custrecord_hris_lve_settlerefno'
              })||'';
             /*  const settlementid =currentrecord.getValue({
                fieldId:'custrecord_hris_lve_settlement_refno'
              })||''; */
              
              const workresumecheck = currentrecord.getValue({
                fieldId: 'custrecord_hris_lve_workresume'
            });
                  log.debug('workresumecheck',workresumecheck);     
        if ( Leaverecordid) {
            const LeaveRecord = record.load({
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

            if (scriptContext.type == 'view' && approvalstatus == 2 && cancelcheck == false && settlecheck==true && settlementrefid=='') {                 
                form.addButton({
                    id: 'custpage_settle',
                    label: 'Leavesettlement',
                    functionName: 'Settlementclick()' //upload CS Function name
                });
            }
            
           

      

        }



    }
   

    return {
        beforeLoad: beforeLoad
    };

});