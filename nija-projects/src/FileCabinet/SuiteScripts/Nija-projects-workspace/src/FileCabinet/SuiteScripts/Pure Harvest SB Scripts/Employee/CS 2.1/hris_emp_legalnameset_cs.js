/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 *
 * Description: Client Script for Employee record (Form 565):
 * 1. Synchronizes First/Middle/Last names to Legal Name.
 * 2. Calculates Job Confirmation Date based on Probation Days and Hire Date.
 * 3. Controls Rotational Leave category field availability and mandatory status.
 * 4. Manages Mobile Access email sourcing and validates duplicate Mobile Email on save.
 * Converted from SuiteScript 2.0 to SuiteScript 2.1.
 */
define(['N/search', 'N/format', 'N/log', 'N/ui/dialog'], (search, format, log, dialog) => {

    /**
     * Executes when the page completes loading or when the form is reset.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - Trigger mode ('create', 'copy', 'edit')
     */
    const pageInit = (scriptContext) => {
        try {
            const { currentRecord } = scriptContext;
            const customForm = currentRecord.getValue({ fieldId: 'customform' });
            log.debug('pageInit', `mode: ${scriptContext.mode}, customform: ${customForm}`);

            if (String(customForm) === '565') {
                currentRecord.setValue({
                    fieldId: 'custentity_hris_emp_employeecheck',
                    value: true
                });
            } else {
                currentRecord.setValue({
                    fieldId: 'custentity_hris_emp_employeecheck',
                    value: false
                });
            }
        } catch (e) {
            log.error('Error in pageInit', e);
        }
    };

    /**
     * Executes when a field is changed by a user or script.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.line - Line number (1-indexed)
     * @param {number} scriptContext.column - Column number
     */
    const fieldChanged = (scriptContext) => {
        try {
            const { currentRecord } = scriptContext;
            const fieldId = (scriptContext.fieldId || '').trim();
            const customForm = currentRecord.getValue({ fieldId: 'customform' });

            if (String(customForm) !== '565') {
                return;
            }

            // 1. Setting legal name and standard name fields
            if (fieldId === 'custentity_hris_empfname' || fieldId === 'custentity_hris_empmname' || fieldId === 'custentity_hris_emplname') {
                const firstName = (currentRecord.getValue({ fieldId: 'custentity_hris_empfname' }) || '').toString().trim();
                const middleName = (currentRecord.getValue({ fieldId: 'custentity_hris_empmname' }) || '').toString().trim();
                const lastName = (currentRecord.getValue({ fieldId: 'custentity_hris_emplname' }) || '').toString().trim();

                const nameParts = [];
                if (firstName) nameParts.push(firstName);
                if (middleName) nameParts.push(middleName);
                if (lastName) nameParts.push(lastName);

                const fullName = nameParts.join(' ');
                log.debug('Constructed Legal Name', fullName);

                currentRecord.setValue({ fieldId: 'firstname', value: firstName });
                currentRecord.setValue({ fieldId: 'middlename', value: middleName });
                currentRecord.setValue({ fieldId: 'lastname', value: lastName });
                currentRecord.setValue({ fieldId: 'custentity_hris_emplegalname', value: fullName });
            }

            // 2. Auto calculate job confirmation date according to probation days
            if (fieldId === 'custentity_hris_empprobationperiod') {
                const probationText = currentRecord.getText({ fieldId: 'custentity_hris_empprobationperiod' }) ||
                                      currentRecord.getValue({ fieldId: 'custentity_hris_empprobationperiod' }) || '0';
                const probationDays = parseInt(probationText, 10) || 0;
                log.debug('Probation Days', probationDays);

                const hireDate = currentRecord.getValue({ fieldId: 'hiredate' });

                if (hireDate) {
                    let jobDate;
                    if (hireDate instanceof Date) {
                        jobDate = new Date(hireDate.getTime());
                    } else {
                        jobDate = format.parse({
                            value: hireDate,
                            type: format.Type.DATE
                        });
                    }
                    jobDate.setDate(jobDate.getDate() + probationDays);

                    currentRecord.setValue({
                        fieldId: 'custentity_hris_empjobconfirmationdt',
                        value: jobDate,
                        ignoreFieldChange: true,
                        forceSyncSourcing: true
                    });
                }
            }

            // 3. Handle rotational leave application
            if (fieldId === 'custentity_hris_emp_rotationalleave_appl') {
                const rosterLeave = currentRecord.getValue({ fieldId: 'custentity_hris_emp_rotationalleave_appl' });
                const rotationField = currentRecord.getField({ fieldId: 'custentity_hris_emprotationlvecatagory' });

                if (rotationField) {
                    if (rosterLeave === true || String(rosterLeave) === 'T') {
                        rotationField.isDisabled = false;
                        rotationField.isMandatory = true;
                    } else {
                        rotationField.isDisabled = true;
                        rotationField.isMandatory = false;
                    }
                }

                currentRecord.setValue({
                    fieldId: 'custentity_hris_emprotationlvecatagory',
                    value: '',
                    ignoreFieldChange: true,
                    forceSyncSourcing: true
                });
            }

            // 4. Handle access to mobile
            if (fieldId === 'custentity_hris_emp_accesstomobile') {
                const accessMobile = currentRecord.getValue({ fieldId: 'custentity_hris_emp_accesstomobile' });

                if (accessMobile === true || String(accessMobile) === 'T') {
                    const companyMail = currentRecord.getValue({ fieldId: 'email' }) || '';
                    currentRecord.setValue({
                        fieldId: 'custentity_hris_empmobileemail',
                        value: companyMail,
                        ignoreFieldChange: true,
                        forceSyncSourcing: true
                    });
                } else {
                    currentRecord.setValue({
                        fieldId: 'custentity_hris_mobile_user_name',
                        value: '',
                        ignoreFieldChange: true,
                        forceSyncSourcing: true
                    });
                    currentRecord.setValue({
                        fieldId: 'custentity_hris_empmobileemail',
                        value: '',
                        ignoreFieldChange: true,
                        forceSyncSourcing: true
                    });
                }
            }
        } catch (e) {
            log.error('Error in fieldChanged', e);
        }
    };

    /**
     * Executes when the record is saved.
     * Validates mobile email and checks for duplicate mobile emails across active employees.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid to save, false to prevent saving
     */
    const saveRecord = (scriptContext) => {
        try {
            const { currentRecord } = scriptContext;
            const customForm = currentRecord.getValue({ fieldId: 'customform' });

            if (String(customForm) === '565') {
                const accessMobile = currentRecord.getValue({ fieldId: 'custentity_hris_emp_accesstomobile' });

                if (accessMobile === true || String(accessMobile) === 'T') {
                    const empEmail = (currentRecord.getValue({ fieldId: 'custentity_hris_empmobileemail' }) || '').toString().trim();

                    // 1. Mandatory check
                    if (!empEmail) {
                        alert('Please Enter Mobile E-Mail');
                        return false;
                    }

                    // 2. Duplication check
                    const employeeId = currentRecord.id;
                    const filters = [
                        ['custentity_hris_empmobileemail', 'is', empEmail],
                        'AND',
                        ['isinactive', 'is', 'F']
                    ];

                    if (employeeId) {
                        filters.push('AND');
                        filters.push(['internalid', 'noneof', employeeId]);
                    }

                    const duplicateSearch = search.create({
                        type: search.Type.EMPLOYEE,
                        filters,
                        columns: ['internalid', 'entityid']
                    });

                    const searchResultCount = duplicateSearch.runPaged().count;

                    if (searchResultCount > 0) {
                        alert(`Duplication Error: The Mobile Email "${empEmail}" is already assigned to another employee.`);
                        return false;
                    }
                }
            }

            return true;
        } catch (e) {
            log.error('Error in saveRecord', e);
            return true;
        }
    };

    return {
        pageInit,
        fieldChanged,
        saveRecord
    };
});
