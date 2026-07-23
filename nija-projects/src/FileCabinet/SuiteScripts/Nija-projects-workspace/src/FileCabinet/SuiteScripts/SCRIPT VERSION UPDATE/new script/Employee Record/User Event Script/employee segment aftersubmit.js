/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @Description User Event script to create Employee Segment custom record and link it to the Employee record upon creation.
 */
define(['N/record', 'N/log'], (record, log) => {

    /**
     * Function executed after a record is submitted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type (e.g. create, edit)
     */
    const afterSubmit = (scriptContext) => {
        try {
            // Run only on CREATE mode
            if (scriptContext.type !== scriptContext.UserEventType.CREATE) {
                return;
            }

            const newRecord = scriptContext.newRecord;
            const empId = newRecord.id;
            const empCode = newRecord.getValue({ fieldId: 'custentity_hris_empcode' });
            const empFullName = newRecord.getValue({ fieldId: 'custentity_hris_emplegalname' });

            if (!empCode || !empFullName) {
                log.error({
                    title: 'Missing Data',
                    details: 'Employee Code or Full Name is missing for Employee ID: ' + empId
                });
                return;
            }

            const concatenatedName = `${empCode} - ${empFullName}`;

            // Create customrecord_cseg_njt_seg_emp record
            const customRecord = record.create({
                type: 'customrecord_cseg_njt_seg_emp',
                isDynamic: true
            });

            customRecord.setValue({ fieldId: 'name', value: concatenatedName });

            const customRecordId = customRecord.save();
            log.debug({ title: 'Custom Segment Record Created', details: 'ID: ' + customRecordId });

            if (customRecordId) {
                // Update Employee Record with the new segment ID
                record.submitFields({
                    type: record.Type.EMPLOYEE,
                    id: empId,
                    values: {
                        custentity_hris_empsegment: customRecordId
                    },
                    options: {
                        enforceUniqueFields: false,
                        ignoreMandatoryFields: true
                    }
                });
                log.debug({ title: 'Employee Record Updated', details: 'Set custentity_hris_empsegment to ' + customRecordId });
            }

        } catch (error) {
            log.error({
                title: 'Error in afterSubmit employee segment',
                details: error.message || error
            });
        }
    };

    return {
        afterSubmit
    };
});
