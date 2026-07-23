/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @Description User Event script to create or update Employee Data Sourcing custom records on Employee save.
 */
define(['N/record', 'N/search', 'N/log'], (record, search, log) => {

    /**
     * Function executed after a record is submitted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type (e.g. create, edit)
     */
    const afterSubmit = (scriptContext) => {
        try {
            const triggerType = scriptContext.type;

            if (triggerType === scriptContext.UserEventType.CREATE || triggerType === scriptContext.UserEventType.EDIT) {
                const newRecord = scriptContext.newRecord;
                const empID = newRecord.id;

                log.debug({ title: 'empID', details: empID });

                const customForm = newRecord.getValue({ fieldId: 'customform' });
                log.debug({ title: 'customform', details: customForm });

                if (String(customForm) === '167') {
                    let empWeeklyOff = newRecord.getValue({ fieldId: 'custentity_hris_empweeklyoffs' }) || '';
                    let empHoliday = newRecord.getValue({ fieldId: 'custentity_hris_empholidays' }) || '';
                    const empLocation = newRecord.getValue({ fieldId: 'location' }) || '';
                    const empEmail = newRecord.getValue({ fieldId: 'email' }) || '';
                    const hod = newRecord.getValue({ fieldId: 'custentity_hris_emphod' }) || '';
                    const lineMgr = newRecord.getValue({ fieldId: 'custentity_hris_emplinemanger' }) || '';
                    const leaveAdmin = newRecord.getValue({ fieldId: 'supervisor' }) || '';
                    const doj = newRecord.getValue({ fieldId: 'hiredate' }) || '';

                    log.debug({ title: 'empHoliday', details: empHoliday });

                    // Search for existing customrecord_hris_employeedatasourcing record
                    const edSearch = search.create({
                        type: 'customrecord_hris_employeedatasourcing',
                        filters: [
                            ['custrecord_hris_eds_employee', 'anyof', empID],
                            'AND',
                            ['isinactive', 'is', 'F']
                        ],
                        columns: ['internalid']
                    }).run().getRange({ start: 0, end: 1 });

                    if (edSearch && edSearch.length > 0) {
                        const edRecordID = edSearch[0].getValue({ name: 'internalid' });

                        const edRecord = record.load({
                            type: 'customrecord_hris_employeedatasourcing',
                            id: edRecordID,
                            isDynamic: true
                        });

                        edRecord.setValue({ fieldId: 'custrecord_hris_eds_employeeholidays', value: empHoliday });
                        edRecord.setValue({ fieldId: 'custrecord_hris_eds_employeeweeklyoff', value: empWeeklyOff });
                        edRecord.setValue({ fieldId: 'custrecord_hris_eds_employeelocation', value: empLocation });
                        edRecord.setValue({ fieldId: 'custrecord_hris_eds_employeeemaill', value: empEmail });
                        edRecord.setValue({ fieldId: 'custrecord_hris_eds_headofdepartment', value: hod });
                        edRecord.setValue({ fieldId: 'custrecord_hris_eds_supervisor', value: lineMgr });
                        edRecord.setValue({ fieldId: 'custrecord_hris_eds_leaveadmin', value: leaveAdmin });
                        edRecord.setValue({ fieldId: 'custrecord_hris_eds_hiredate', value: doj });

                        const updatedRecordId = edRecord.save();
                        log.debug({ title: 'Updated existing ED Record', details: updatedRecordId });
                    } else {
                        const edRecord = record.create({
                            type: 'customrecord_hris_employeedatasourcing',
                            isDynamic: true
                        });

                        edRecord.setValue({ fieldId: 'custrecord_hris_eds_employee', value: empID });
                        edRecord.setValue({ fieldId: 'custrecord_hris_eds_employeeholidays', value: empHoliday });
                        edRecord.setValue({ fieldId: 'custrecord_hris_eds_employeeweeklyoff', value: empWeeklyOff });
                        edRecord.setValue({ fieldId: 'custrecord_hris_eds_employeelocation', value: empLocation });
                        edRecord.setValue({ fieldId: 'custrecord_hris_eds_employeeemaill', value: empEmail });
                        edRecord.setValue({ fieldId: 'custrecord_hris_eds_headofdepartment', value: hod });
                        edRecord.setValue({ fieldId: 'custrecord_hris_eds_supervisor', value: lineMgr });
                        edRecord.setValue({ fieldId: 'custrecord_hris_eds_leaveadmin', value: leaveAdmin });
                        edRecord.setValue({ fieldId: 'custrecord_hris_eds_hiredate', value: doj });

                        const createdRecordId = edRecord.save();
                        log.debug({ title: 'Created new ED Record', details: createdRecordId });
                    }
                }
            }
        } catch (e) {
            log.error({ title: 'Error in afterSubmit', details: e.message || e });
        }
    };

    return {
        afterSubmit
    };
});
