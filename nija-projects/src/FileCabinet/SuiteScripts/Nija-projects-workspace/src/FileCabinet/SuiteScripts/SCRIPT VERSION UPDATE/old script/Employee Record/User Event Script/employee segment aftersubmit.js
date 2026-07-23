/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
*/
define(['N/record', 'N/log'], function(record, log) {
    function afterSubmit(context) {
        try {
            // Run only on CREATE mode
            if (context.type !== context.UserEventType.CREATE) {
                return;
            }
 
            var newRecord = context.newRecord;
            var empId = newRecord.id; // Get Employee Internal ID
            var empCode = newRecord.getValue('custentity_hris_empcode'); // Replace with actual field ID
            var empFullName = newRecord.getValue('custentity_hris_emplegalname'); // Employee Full Name (Change if needed)
            if (!empCode || !empFullName) {
                log.error('Missing Data', 'Employee Code or Full Name is missing');
                return;
            }
 
            var concatenatedName = empCode + ' - ' + empFullName;
 
            // Create customrecord_cseg1
            var customRecord = record.create({
                type: 'customrecord_cseg_njt_seg_emp',
                isDynamic: true
            });
 
            customRecord.setValue({ fieldId: 'name', value: concatenatedName });
 
            var customRecordId = customRecord.save();
            log.debug('Custom Record Created', 'ID: ' + customRecordId);
 
            if (customRecordId) {
                // Update Employee Record with the new ID in custentity_hris_empcategory
                record.submitFields({
                    type: record.Type.EMPLOYEE,
                    id: empId,
                    values: {
                        custentity_hris_empsegment: customRecordId
                    }
                });
                log.debug('Employee Record Updated', 'Set custentity_hris_empcategory to ' + customRecordId);
            }
 
        } catch (error) {
            log.error('Error in afterSubmit', error);
        }
    }
 
    return {
        afterSubmit: afterSubmit
    };
 
});