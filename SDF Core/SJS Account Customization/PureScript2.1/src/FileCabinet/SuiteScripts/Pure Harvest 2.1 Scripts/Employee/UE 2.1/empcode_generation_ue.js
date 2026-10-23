/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * Description: Generates automatic Employee Code based on Subsidiary prefix, Grade, and Unique Reference Number on create,
 * and hides sensitive salary fields for non-authorized roles on load.
 * Upgraded to SuiteScript 2.1.
 */
define(['N/record', 'N/ui/serverWidget', 'N/search', 'N/runtime', 'N/log'], (record, serverWidget, search, runtime, log) => {

    /**
     * Executes before a record is loaded into the user interface.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     */
    const beforeLoad = (scriptContext) => {
        try {
            const { form, newRecord } = scriptContext;
            const currentUser = runtime.getCurrentUser();
            const role = currentUser.role;

            const customForm = newRecord.getValue({ fieldId: 'customform' });
            log.debug('beforeLoad', `customform: ${customForm}, role: ${role}`);

            // Hide gross salary fields for form 565 if role is not authorized (role 1294)
            if (String(customForm) === '565' && String(role) !== '1294') {
                const monthlyGrossField = form.getField({ id: 'custentity_njt_monthly_gross_sal' });
                if (monthlyGrossField) {
                    monthlyGrossField.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                }

                const annualGrossField = form.getField({ id: 'custentity_njt_annual_gross_salary' });
                if (annualGrossField) {
                    annualGrossField.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                }
            }
        } catch (e) {
            log.error('Error in beforeLoad', e);
        }
    };

    /**
     * Executes before a record is saved to the database.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     */
    const beforeSubmit = (scriptContext) => {
        try {
            if (scriptContext.type !== scriptContext.UserEventType.CREATE) {
                return;
            }

            const currentRecord = scriptContext.newRecord;
            const customForm = currentRecord.getValue({ fieldId: 'customform' });
            log.debug('beforeSubmit', `customform: ${customForm}`);

            if (String(customForm) !== '565') {
                return;
            }

            // 1. Get Grade Name
            let gradeName = '';
            const gradeId = currentRecord.getValue({ fieldId: 'custentity_emp_grade_' });
            if (gradeId) {
                const gradeRec = record.load({
                    type: 'customrecordgrade_master',
                    id: gradeId,
                    isDynamic: false
                });
                gradeName = gradeRec.getValue({ fieldId: 'name' }) || '';
                log.debug('Grade Name', gradeName);
            }

            // 2. Get Subsidiary Prefix
            let autoPrefix = 'BD';
            const subsidiaryId = currentRecord.getValue({ fieldId: 'subsidiary' });
            log.debug('subsidiaryId', subsidiaryId);

            if (subsidiaryId) {
                const subsidiaryRec = record.load({
                    type: record.Type.SUBSIDIARY,
                    id: subsidiaryId,
                    isDynamic: false
                });
                const subsiPrefix = subsidiaryRec.getValue({ fieldId: 'tranprefix' });
                log.debug('subsidiary tranprefix', subsiPrefix);

                if (subsiPrefix) {
                    const match = String(subsiPrefix).match(/[A-Za-z]+/g);
                    autoPrefix = match ? match.join('') : 'BD';
                    log.debug('Alphabetic Prefix Only', autoPrefix);
                }
            }

            // 3. Get Base Record Type ID
            const recTypeId = currentRecord.getValue({ fieldId: 'baserecordtype' });
            if (!recTypeId) {
                log.error('Missing Record Type', 'baserecordtype field is empty or null');
                return;
            }

            // 4. Search Unique Reference Number Record
            const uniqueRefSearch = search.create({
                type: 'customrecord_hris_unique_reference_numbe',
                filters: [
                    ['custrecord_hris_record_type', 'anyof', recTypeId],
                    'AND',
                    ['isinactive', 'is', 'F']
                ],
                columns: [
                    search.createColumn({ name: 'custrecord_hris_unique_number', label: 'Unique Number' }),
                    search.createColumn({ name: 'internalid', label: 'Internal ID' })
                ]
            });

            const searchResults = uniqueRefSearch.run().getRange({ start: 0, end: 1 });
            if (searchResults && searchResults.length > 0) {
                const result = searchResults[0];
                const idUniqueRef = result.getValue({ name: 'internalid' });
                let uniqueNum = parseInt(result.getValue({ name: 'custrecord_hris_unique_number' }), 10) || 0;
                uniqueNum += 1;

                let zeros = '';
                const numStr = uniqueNum.toString();
                if (numStr.length === 1) {
                    zeros = '000';
                } else if (numStr.length === 2) {
                    zeros = '00';
                } else {
                    zeros = '';
                }

                const refNumber = zeros + uniqueNum;
                log.debug('refnumber', refNumber);

                const autoNumber = `${autoPrefix}-${gradeName}-${refNumber}`;
                log.debug('Generated Emp Code', autoNumber);

                currentRecord.setValue({
                    fieldId: 'custentity_hris_empcode',
                    value: autoNumber
                });

                record.submitFields({
                    type: 'customrecord_hris_unique_reference_numbe',
                    id: idUniqueRef,
                    values: {
                        custrecord_hris_unique_number: uniqueNum
                    }
                });
            }
        } catch (e) {
            log.error('Error in beforeSubmit', e);
        }
    };

    return {
        beforeLoad,
        beforeSubmit
    };
});
