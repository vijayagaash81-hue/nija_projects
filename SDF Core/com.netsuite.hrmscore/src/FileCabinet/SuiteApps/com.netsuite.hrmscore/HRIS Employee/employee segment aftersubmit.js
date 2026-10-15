/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
 *@NModuleScope Public
*/
define(['N/record', 'N/log'], function(record, log) {
    function afterSubmit(context) {
        try {
            // Run only on CREATE mode
            if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.EDIT) {
                return;
            }

 
            var newRecord = context.newRecord;
            var empId = newRecord.id; // Get Employee Internal ID
            var empCode = newRecord.getValue('custentity_hris_empcode'); // Replace with actual field ID
            var empFullName = newRecord.getValue('custentity_hris_emplegalname'); // Employee Full Name (Change if needed)
             var employeesegment= newRecord.getValue('cseg_njt_seg_emp');
            if (!empCode || !empFullName) {
                log.error('Missing Data', 'Employee Code or Full Name is missing');
                return;
            }
 
            var concatenatedName = empCode + ' - ' + empFullName;
 
            // Create customrecord_cseg1
           /*  var customRecord = record.create({
                type: 'customrecord_cseg_njt_seg_emp',
                isDynamic: true
            }); */
             /* if(employeesegment){
                    var customRecord = record.load({
                    type: 'customrecord_cseg_njt_seg_emp',
                    id:employeesegment,
                    isDynamic: true
                });
                }
                else{
                    var customRecord = record.create({
                    type: 'customrecord_cseg_njt_seg_emp',
                    isDynamic: true
                });
                } */

               /*  if(employeesegment){
                    var customRecord = record.load({
                    type: 'customrecord_cseg_njt_seg_emp',
                    id:employeesegment,
                    isDynamic: true
                });
                } */
                if(!employeesegment){
                    var customRecord = record.create({
                    type: 'customrecord_cseg_njt_seg_emp',
                    isDynamic: true
                });
                }

 
            customRecord.setValue({ fieldId: 'name', value: concatenatedName });
 
            var customRecordId = customRecord.save();
            log.debug('Custom Record Created', 'ID: ' + customRecordId);
 
            if (customRecordId) {
                // Update Employee Record with the new ID in custentity_hris_empcategory
                record.submitFields({
                    type: record.Type.EMPLOYEE,
                    id: empId,
                    values: {
                        cseg_njt_seg_emp: customRecordId
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