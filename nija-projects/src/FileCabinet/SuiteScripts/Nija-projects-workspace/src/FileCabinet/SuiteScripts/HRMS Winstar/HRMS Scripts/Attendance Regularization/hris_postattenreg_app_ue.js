/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/format', 'N/log', './moment.js','N/task'], function (record, search, format, log, moment,task) {
    var MOMENT = moment;
    function afterSubmit(context) {
        try {
            var newRecord = context.newRecord;
            var attenRegID = newRecord.id;
            log.debug("attenRegID", attenRegID);
            var actualworkinghrs = 0;
            // Assuming this script is for customrecord_njt_emp_daily_atten_ch
            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
                var regularDateValue = newRecord.getValue('custrecord_hr_attend_regular_date');
                log.debug("regularDateValue", regularDateValue);

                if (!regularDateValue) {
                    log.error("Missing Date", "The custrecord_hr_attend_regular_date field is empty or not found.");
                    return;
                }

                var regularDate = format.format({
                    value: new Date(regularDateValue),
                    type: format.Type.DATE
                });
                log.debug("formatted regularDate", regularDate);

                var regularEmployee = newRecord.getValue('custrecord_hr_attend_reg_employee');
                var regularIn = newRecord.getValue('custrecord_hr_attend_regular_reg_in');
                var regularOut = newRecord.getValue('custrecord_hr_attend_regular_reg_out');
                var id = newRecord.getValue('custrecord_hr_attend_reg_daily_id');
                var approvalSts = newRecord.getValue('custrecord_hr_attend_reg_approve_status');

                var regularstartdate = newRecord.getValue('custrecord_hr_attend_regularstartdate') || '';
                var regularenddate = newRecord.getValue('custrecord_hr_attend_regularenddate') || '';
                var dailycheck=newRecord.getValue('custrecord_hr_attend_dailyupdated')||false;
                log.debug("regularEmployee", regularEmployee);
                log.debug("regularIn", regularIn);
                log.debug("regularOut", regularOut);
                log.debug("approvalSts", approvalSts);

                
                
              //  if(id && approvalSts==2 && dailycheck==false ){
              if(id && dailycheck==false ){
                   //  if( approvalSts==2 && dailycheck==false ){
                    var scriptTask = task.create({
                        taskType: task.TaskType.SCHEDULED_SCRIPT,
                        scriptId: 'customscript_hris_post_attd_reg_appr_par',
                       // deploymentId: 'customdeploy_hris_post_attd_reg_appr_par',
                        params: {
                            custscript_hris_regattenid: attenRegID,
                            
                        }
                    });

                    var scriptTaskId = scriptTask.submit();
                    log.debug("Script Task ID", scriptTaskId);

                }




            }
        } catch (e) {
            log.error({
                title: 'Error in afterSubmit function',
                details: e.toString()
            });
        }
    }



    return {
        afterSubmit: afterSubmit
    };

});
