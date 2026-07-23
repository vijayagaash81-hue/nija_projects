/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @Description Client script for setting legal name, job confirmation date, rotational leave, and mobile access validation on Employee Record.
 */
define(['N/record', 'N/log', 'N/format'], (record, log, format) => {

    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - Mode in which the record is loaded ('create', 'edit', etc.)
     */
    const pageInit = (scriptContext) => {
        try {
            const currentObjRecord = scriptContext.currentRecord;
            log.debug('scriptContext mode', scriptContext.mode);

            const customform = currentObjRecord.getValue({ fieldId: 'customform' });
            log.debug('customform', customform);

            if (customform == 167) {
                const employeecheck = currentObjRecord.getValue({ fieldId: 'custentity_hris_emp_employeecheck' });
                log.debug('Employee check', employeecheck);
                currentObjRecord.setValue({ fieldId: 'custentity_hris_emp_employeecheck', value: true });
            } else {
                const employeecheck = currentObjRecord.getValue({ fieldId: 'custentity_hris_emp_employeecheck' });
                log.debug('Employee check', employeecheck);
                currentObjRecord.setValue({ fieldId: 'custentity_hris_emp_employeecheck', value: false });
            }
        } catch (e) {
            log.error('Error in pageInit', e.message);
        }
    };

    /**
     * Function to be executed when a field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.line - Line number (1-indexed)
     * @param {number} scriptContext.column - Column number
     */
    const fieldChanged = (scriptContext) => {
        try {
            const currentObjRecord = scriptContext.currentRecord;
            const fieldId = (scriptContext.fieldId || '').trim();
            const customform = currentObjRecord.getValue({ fieldId: 'customform' });
            log.debug('customform', customform);

            if (customform == 167) {
                // Setting the legal name & standard name fields
                if (fieldId === 'custentity_hris_empfname' || fieldId === 'custentity_hris_empmname' || fieldId === 'custentity_hris_emplname') {
                    const firstName = currentObjRecord.getValue({ fieldId: 'custentity_hris_empfname' }) || '';
                    log.debug('First Name', firstName);

                    const middleName = currentObjRecord.getValue({ fieldId: 'custentity_hris_empmname' }) || '';
                    log.debug('Middle Name', middleName);

                    const lastName = currentObjRecord.getValue({ fieldId: 'custentity_hris_emplname' }) || '';
                    log.debug('Last Name', lastName);

                    const fullNameParts = [];
                    if (firstName) fullNameParts.push(firstName);
                    if (middleName) fullNameParts.push(middleName);
                    if (lastName) fullNameParts.push(lastName);

                    const fullName = fullNameParts.join(' ');
                    log.debug('Full Name', fullName);

                    currentObjRecord.setValue({ fieldId: 'firstname', value: firstName });
                    currentObjRecord.setValue({ fieldId: 'middlename', value: middleName });
                    currentObjRecord.setValue({ fieldId: 'lastname', value: lastName });
                    currentObjRecord.setValue({ fieldId: 'custentity_hris_emplegalname', value: fullName });
                }

                // Auto calculate job confirmation date according to probation days
                if (fieldId === 'custentity_hris_empprobationperiod') {
                    const probationdaysText = currentObjRecord.getText({ fieldId: 'custentity_hris_empprobationperiod' }) || '0';
                    const probationdays = parseInt(probationdaysText, 10) || 0;
                    log.debug('probationdays', probationdays);

                    const hireDate = currentObjRecord.getValue({ fieldId: 'hiredate' });

                    if (hireDate) {
                        let jobdate;
                        if (hireDate instanceof Date) {
                            jobdate = new Date(hireDate.getTime());
                            jobdate.setDate(jobdate.getDate() + probationdays);
                        } else {
                            jobdate = format.parse({
                                value: hireDate,
                                type: format.Type.DATE
                            });
                            jobdate.setDate(jobdate.getDate() + probationdays);
                        }

                        currentObjRecord.setValue({
                            fieldId: 'custentity_hris_empjobconfirmationdt',
                            value: jobdate,
                            ignoreFieldChange: true,
                            forceSyncSourcing: true
                        });
                    }
                }

                // Handle rotational leave application logic
                if (fieldId === 'custentity_hris_emp_rotationalleave_appl') {
                    const rosterleave = currentObjRecord.getValue({ fieldId: 'custentity_hris_emp_rotationalleave_appl' });
                    const rotationField = currentObjRecord.getField({ fieldId: 'custentity_hris_emprotationlvecatagory' });

                    if (rotationField) {
                        if (rosterleave === true) {
                            rotationField.isDisabled = false;
                            rotationField.isMandatory = true;
                        } else {
                            rotationField.isDisabled = true;
                            rotationField.isMandatory = false;
                        }
                    }

                    currentObjRecord.setValue({
                        fieldId: 'custentity_hris_emprotationlvecatagory',
                        value: '',
                        ignoreFieldChange: true,
                        forceSyncSourcing: true
                    });
                }

                // Handle mobile access logic
                if (fieldId === 'custentity_hris_emp_accesstomobile') {
                    const accessmobile = currentObjRecord.getValue({ fieldId: 'custentity_hris_emp_accesstomobile' });

                    const userField = currentObjRecord.getField({ fieldId: 'custentity_hris_mobile_user_name' });
                    const passField = currentObjRecord.getField({ fieldId: 'custentity_hris_mobile_password' });
                    const emailField = currentObjRecord.getField({ fieldId: 'custentity_hris_empmobileemail' });

                    const isMobileAccess = (accessmobile === true);

                    if (userField) {
                        userField.isDisabled = !isMobileAccess;
                        userField.isMandatory = isMobileAccess;
                    }
                    if (passField) {
                        passField.isDisabled = !isMobileAccess;
                        passField.isMandatory = isMobileAccess;
                    }
                    if (emailField) {
                        emailField.isDisabled = !isMobileAccess;
                        emailField.isMandatory = isMobileAccess;
                    }
                }
            }
        } catch (e) {
            log.error('Error in fieldChanged', e.message);
        }
    };

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid to save
     */
    const saveRecord = (scriptContext) => {
        try {
            const currentObjRecord = scriptContext.currentRecord;
            const customform = currentObjRecord.getValue({ fieldId: 'customform' });
            log.debug('saveRecord customform', customform);

            if (customform == 167) {
                const accessmobile = currentObjRecord.getValue({ fieldId: 'custentity_hris_emp_accesstomobile' });
                if (accessmobile === true) {
                    const empemail = currentObjRecord.getValue({ fieldId: 'custentity_hris_empmobileemail' }) || '';
                    if (!empemail.toString().trim()) {
                        alert('Please Enter Mobile E-Mail');
                        return false;
                    }
                }
            }
            return true;
        } catch (e) {
            log.error('Error in saveRecord', e.message);
            return true;
        }
    };

    return {
        pageInit,
        fieldChanged,
        saveRecord
    };
});
