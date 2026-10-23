/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * Description: Synchronizes Employee Data Sourcing (EDS) record upon employee creation and edit.
 * Converted from SuiteScript 1.0 to SuiteScript 2.1.
 */
define(['N/record', 'N/search', 'N/format', 'N/log'], (record, search, format, log) => {

    /**
     * Executes after an employee record is submitted.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     */
    const afterSubmit = (scriptContext) => {
        try {
            const { type, newRecord } = scriptContext;

            // Only trigger on create or edit operations
            if (type !== scriptContext.UserEventType.CREATE && type !== scriptContext.UserEventType.EDIT) {
                return;
            }

            const empId = newRecord.id;
            const customForm = newRecord.getValue({ fieldId: 'customform' });
            log.debug('afterSubmit', `empId: ${empId}, customform: ${customForm}, type: ${type}`);

            if (String(customForm) !== '565') {
                return;
            }

            // Retrieve employee field values
            const empWeeklyOff = newRecord.getValue({ fieldId: 'custentity_hris_empweeklyoffs' }) || [];
            const empHoliday = newRecord.getValue({ fieldId: 'custentity_hris_empholidays' }) || [];
            const empLocation = newRecord.getValue({ fieldId: 'location' }) || '';
            const empEmail = newRecord.getValue({ fieldId: 'email' }) || '';
            const hod = newRecord.getValue({ fieldId: 'custentity_hris_emphod' }) || '';
            const lineMgr = newRecord.getValue({ fieldId: 'custentity_hris_emplinemanger' }) || '';
            const leaveAdmin = newRecord.getValue({ fieldId: 'supervisor' }) || '';
            const doj = newRecord.getValue({ fieldId: 'hiredate' });

            log.debug('Employee Field Values', {
                empId,
                empWeeklyOff,
                empHoliday,
                empLocation,
                empEmail,
                hod,
                lineMgr,
                leaveAdmin,
                doj
            });

            // Parse Date if doj is string, or keep Date object
            let parsedDoj = null;
            if (doj) {
                if (doj instanceof Date) {
                    parsedDoj = doj;
                } else {
                    try {
                        parsedDoj = format.parse({ value: String(doj), type: format.Type.DATE });
                    } catch (dateErr) {
                        parsedDoj = new Date(doj);
                    }
                }
            }

            // Search for existing active Employee Data Sourcing record
            const edSearch = search.create({
                type: 'customrecord_hris_employeedatasourcing',
                filters: [
                    ['custrecord_hris_eds_employee', 'anyof', empId],
                    'AND',
                    ['isinactive', 'is', 'F']
                ],
                columns: ['internalid']
            });

            const searchResults = edSearch.run().getRange({ start: 0, end: 1 });

            if (searchResults && searchResults.length > 0) {
                const edRecordId = searchResults[0].getValue({ name: 'internalid' });
                const edRecord = record.load({
                    type: 'customrecord_hris_employeedatasourcing',
                    id: edRecordId,
                    isDynamic: false
                });

                edRecord.setValue({ fieldId: 'custrecord_hris_eds_employeeholidays', value: empHoliday });
                edRecord.setValue({ fieldId: 'custrecord_hris_eds_employeeweeklyoff', value: empWeeklyOff });
                edRecord.setValue({ fieldId: 'custrecord_hris_eds_employeelocation', value: empLocation });
                edRecord.setValue({ fieldId: 'custrecord_hris_eds_employeeemaill', value: empEmail });
                edRecord.setValue({ fieldId: 'custrecord_hris_eds_headofdepartment', value: hod });
                edRecord.setValue({ fieldId: 'custrecord_hris_eds_supervisor', value: lineMgr });
                edRecord.setValue({ fieldId: 'custrecord_hris_eds_leaveadmin', value: leaveAdmin });
                if (parsedDoj) {
                    edRecord.setValue({ fieldId: 'custrecord_hris_eds_hiredate', value: parsedDoj });
                }

                const existingEDRecord = edRecord.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });
                log.debug('existingEDRecord updated', existingEDRecord);
            } else {
                const edRecord = record.create({
                    type: 'customrecord_hris_employeedatasourcing',
                    isDynamic: false
                });

                edRecord.setValue({ fieldId: 'custrecord_hris_eds_employee', value: empId });
                if (empHoliday && (Array.isArray(empHoliday) ? empHoliday.length > 0 : empHoliday !== '')) {
                    edRecord.setValue({ fieldId: 'custrecord_hris_eds_employeeholidays', value: empHoliday });
                }
                if (empWeeklyOff && (Array.isArray(empWeeklyOff) ? empWeeklyOff.length > 0 : empWeeklyOff !== '')) {
                    edRecord.setValue({ fieldId: 'custrecord_hris_eds_employeeweeklyoff', value: empWeeklyOff });
                }
                if (empLocation) {
                    edRecord.setValue({ fieldId: 'custrecord_hris_eds_employeelocation', value: empLocation });
                }
                if (empEmail) {
                    edRecord.setValue({ fieldId: 'custrecord_hris_eds_employeeemaill', value: empEmail });
                }
                if (hod) {
                    edRecord.setValue({ fieldId: 'custrecord_hris_eds_headofdepartment', value: hod });
                }
                if (lineMgr) {
                    edRecord.setValue({ fieldId: 'custrecord_hris_eds_supervisor', value: lineMgr });
                }
                if (leaveAdmin) {
                    edRecord.setValue({ fieldId: 'custrecord_hris_eds_leaveadmin', value: leaveAdmin });
                }
                if (parsedDoj) {
                    edRecord.setValue({ fieldId: 'custrecord_hris_eds_hiredate', value: parsedDoj });
                }

                const createdEDRecord = edRecord.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });
                log.debug('Created ED Record', createdEDRecord);
            }
        } catch (e) {
            log.error('Error in employeeDataRecordCreation afterSubmit', e);
        }
    };

    return {
        afterSubmit
    };
});
