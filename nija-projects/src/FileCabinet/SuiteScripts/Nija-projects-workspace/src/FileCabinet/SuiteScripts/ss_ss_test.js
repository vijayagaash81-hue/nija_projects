/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */
define(['N/runtime'], function (runtime) {

    function execute(context) {
        try {
            var scriptObj = runtime.getCurrentScript();

            // Get parameters
            var recordId = scriptObj.getParameter({ name: 'custscript_param_record_id' });
            var employee = scriptObj.getParameter({ name: 'custscript_param_employee' });
            var gender = scriptObj.getParameter({ name: 'custscript_param_gender' });
            var maritalStatus = scriptObj.getParameter({ name: 'custscript_param_maritalstatus' });
            var height = scriptObj.getParameter({ name: 'custscript_param_height' });
            var weight = scriptObj.getParameter({ name: 'custscript_param_weight' });

            // Log values
            log.debug('Received Record ID', recordId);
            log.debug('Received Employee', employee);
            log.debug('Received Gender', gender);
            log.debug('Received Marital Status', maritalStatus);
            log.debug('Received Height', height);
            log.debug('Received Weight', weight);

        } catch (e) {
            log.error('Error in Scheduled Script', e);
        }
    }

    return {
        execute: execute
    };
});