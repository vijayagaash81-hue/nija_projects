/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @Description Consolidated User Event script for Employee Record, combining all 9 individual UE scripts into a single entry point script.
 * 
 * Included Scripts:
 * 1. hris_emp_disableedit_ue.js          (beforeLoad: disables Edit button & throws error for inactive employees)
 * 2. hris_emp_empleave_ue.js             (beforeLoad: attaches client script in VIEW mode)
 * 3. hris_emp_genempcode_ue.js           (beforeSubmit: auto-generates formatted 5-digit unique Employee Code)
 * 4. employee segment aftersubmit.js     (afterSubmit: creates custom segment record & links to employee)
 * 5. hris_emp_createleavebalance_ue.js   (afterSubmit: triggers leave credit scheduled task)
 * 6. hris_emp_empdata_ue.js              (afterSubmit: syncs customrecord_hris_employeedatasourcing)
 * 7. hris_emp_inactiveedcrecord_ue.js   (afterSubmit: syncs inactive status across 4 custom child records)
 * 8. hris_employeetoemployeecompensationchange_ue.js (afterSubmit: syncs 30+ compensation fields to custom EDC record)
 * 9. hris_emp_setholiday_ue.js           (afterSubmit: sources location-based holidays from Holiday Master)
 */
define(['N/record', 'N/search', 'N/runtime', 'N/task', 'N/log'], (record, search, runtime, task, log) => {

    /**
     * Function executed before a record is loaded.
     * 
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - Loaded record
     * @param {string} scriptContext.type - Trigger type (e.g. view, edit, create)
     * @param {Form} scriptContext.form - Current UI Form
     */
    const beforeLoad = (scriptContext) => {
        try {
            const executionContext = runtime.executionContext;

            // 1. Process Disable Edit for Inactive Employees (hris_emp_disableedit_ue.js)
            if (executionContext === runtime.ContextType.USER_INTERFACE) {
                const newRecord = scriptContext.newRecord;
                const isInactive = newRecord.getValue({ fieldId: 'isinactive' });

                if (isInactive === true || isInactive === 'T') {
                    if (scriptContext.type === scriptContext.UserEventType.VIEW) {
                        const editButton = scriptContext.form.getButton({ id: 'edit' });
                        if (editButton) {
                            editButton.isDisabled = true;
                            log.debug({ title: 'beforeLoad', details: 'Edit button disabled for inactive employee.' });
                        }
                    } else if (scriptContext.type === scriptContext.UserEventType.EDIT) {
                        log.error({ title: 'beforeLoad', details: 'Attempted edit on inactive employee.' });
                        throw new Error('User is inactive, so you cannot edit the record. Contact administrator to activate.');
                    }
                }
            }

            // 2. Attach Leave Client Script in VIEW mode (hris_emp_empleave_ue.js)
            if (scriptContext.type === scriptContext.UserEventType.VIEW) {
                scriptContext.form.clientScriptFileId = 'customscript_hris_empleave_cs';
                log.debug({ title: 'beforeLoad', details: 'Attached Client Script customscript_hris_empleave_cs' });
            }

        } catch (e) {
            log.error({ title: 'Error in Consolidated beforeLoad', details: e.message || e });
            throw e;
        }
    };

    /**
     * Function executed before a record is submitted to the database.
     * 
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - Record being saved
     * @param {string} scriptContext.type - Trigger type (e.g. create, edit)
     */
    const beforeSubmit = (scriptContext) => {
        try {
            // 1. Generate Unique Employee Code on CREATE (hris_emp_genempcode_ue.js)
            if (scriptContext.type === scriptContext.UserEventType.CREATE) {
                const newRecord = scriptContext.newRecord;
                const customForm = newRecord.getValue({ fieldId: 'customform' });

                if (String(customForm) === '167') {
                    log.debug({ title: 'beforeSubmit', details: 'Generating Unique Employee Code...' });

                    const refSearch = search.create({
                        type: 'customrecord_hris_unique_reference_numbe',
                        filters: [
                            ['isinactive', 'is', 'F']
                        ],
                        columns: [
                            search.createColumn({ name: 'internalid', sort: search.Sort.DESC }),
                            'custrecord_hris_unique_number'
                        ]
                    }).run().getRange({ start: 0, end: 1 });

                    if (refSearch && refSearch.length > 0) {
                        const uniqueRefId = refSearch[0].id;
                        const currentUniqueNum = parseFloat(refSearch[0].getValue('custrecord_hris_unique_number')) || 0;
                        const nextUniqueNum = currentUniqueNum + 1;
                        const formattedEmpCode = String(nextUniqueNum).padStart(5, '0');

                        // Set emp code on new employee record
                        newRecord.setValue({
                            fieldId: 'custentity_hris_empcode',
                            value: formattedEmpCode
                        });

                        // Update reference counter record
                        record.submitFields({
                            type: 'customrecord_hris_unique_reference_numbe',
                            id: uniqueRefId,
                            values: {
                                custrecord_hris_unique_number: nextUniqueNum
                            },
                            options: {
                                enforceUniqueFields: false,
                                ignoreMandatoryFields: true
                            }
                        });

                        log.debug({
                            title: 'Employee Code Generated',
                            details: { formattedEmpCode, nextUniqueNum, uniqueRefId }
                        });
                    }
                }
            }
        } catch (e) {
            log.error({ title: 'Error in Consolidated beforeSubmit', details: e.message || e });
        }
    };

    /**
     * Function executed after a record is submitted to the database.
     * 
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - Submitted record
     * @param {string} scriptContext.type - Trigger type (e.g. create, edit)
     */
    const afterSubmit = (scriptContext) => {
        const newRecord = scriptContext.newRecord;
        const recordId = newRecord.id;
        const customForm = String(newRecord.getValue({ fieldId: 'customform' }));
        const executionContext = runtime.executionContext;

        log.debug({
            title: 'Consolidated afterSubmit Execution',
            details: { recordId, customForm, type: scriptContext.type, executionContext }
        });

        // ------------------------------------------------------------------
        // TASK A: Create Employee Segment Record on CREATE (employee segment aftersubmit.js)
        // ------------------------------------------------------------------
        if (scriptContext.type === scriptContext.UserEventType.CREATE) {
            try {
                const empCode = newRecord.getValue({ fieldId: 'custentity_hris_empcode' });
                const empFullName = newRecord.getValue({ fieldId: 'custentity_hris_emplegalname' });

                if (empCode && empFullName) {
                    const concatenatedName = `${empCode} - ${empFullName}`;

                    const segmentRecord = record.create({
                        type: 'customrecord_cseg_njt_seg_emp',
                        isDynamic: true
                    });
                    segmentRecord.setValue({ fieldId: 'name', value: concatenatedName });

                    const segmentId = segmentRecord.save();
                    log.debug({ title: 'Created Employee Segment Record', details: 'ID: ' + segmentId });

                    if (segmentId) {
                        record.submitFields({
                            type: record.Type.EMPLOYEE,
                            id: recordId,
                            values: { custentity_hris_empsegment: segmentId },
                            options: { enforceUniqueFields: false, ignoreMandatoryFields: true }
                        });
                    }
                }
            } catch (e) {
                log.error({ title: 'Error in Employee Segment Creation', details: e.message || e });
            }
        }

        // ------------------------------------------------------------------
        // TASK B: Trigger Leave Credit Scheduled Script on CREATE (hris_emp_createleavebalance_ue.js)
        // ------------------------------------------------------------------
        if (scriptContext.type === scriptContext.UserEventType.CREATE && customForm === '167') {
            try {
                const empCategory = newRecord.getValue({ fieldId: 'custentity_hris_empcategory' });
                const scriptParams = {
                    custscript_hris_emp_id: recordId,
                    custscript_hris_emp_category: empCategory
                };

                log.debug({ title: 'Scheduling Leave Credit Task', details: scriptParams });

                const scheduledTask = task.create({
                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                    scriptId: 'customscript_hris_emp_leavecredit',
                    deploymentId: 'customdeploy_hris_emp_leavecredit',
                    params: scriptParams
                });

                const taskId = scheduledTask.submit();
                log.debug({ title: 'Leave Credit Task Submitted', details: 'Task ID: ' + taskId });
            } catch (e) {
                log.error({ title: 'Error Scheduling Leave Credit Task', details: e.message || e });
            }
        }

        // ------------------------------------------------------------------
        // TASK C: Sync Employee Data Sourcing Record (hris_emp_empdata_ue.js)
        // ------------------------------------------------------------------
        if (customForm === '167') {
            try {
                const isSubsidiariesEnabled = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });
                const edSearch = search.create({
                    type: 'customrecord_hris_employeedatasourcing',
                    filters: [['custrecord_hris_eds_employee_name', 'is', recordId]],
                    columns: ['internalid']
                }).run().getRange({ start: 0, end: 1 });

                if (!edSearch || edSearch.length === 0) {
                    // Create new sourcing record
                    const edRecord = record.create({
                        type: 'customrecord_hris_employeedatasourcing',
                        isDynamic: true
                    });

                    edRecord.setValue({ fieldId: 'custrecord_hris_eds_employee_name', value: recordId });
                    edRecord.setValue({ fieldId: 'custrecord_hris_eds_emp_code', value: newRecord.getValue({ fieldId: 'custentity_hris_empcode' }) });
                    edRecord.setValue({ fieldId: 'custrecord_hris_eds_date_of_joining', value: newRecord.getValue({ fieldId: 'hiredate' }) });
                    edRecord.setValue({ fieldId: 'custrecord_hris_eds_designation', value: newRecord.getValue({ fieldId: 'custentity_hris_empdesignation' }) });
                    edRecord.setValue({ fieldId: 'custrecord_hris_eds_department', value: newRecord.getValue({ fieldId: 'department' }) });
                    edRecord.setValue({ fieldId: 'custrecord_hris_eds_location', value: newRecord.getValue({ fieldId: 'location' }) });
                    edRecord.setValue({ fieldId: 'custrecord_hris_eds_employee_category', value: newRecord.getValue({ fieldId: 'custentity_hris_empcategory' }) });
                    edRecord.setValue({ fieldId: 'custrecord_hris_eds_gender', value: newRecord.getValue({ fieldId: 'custentity_hris_empgender' }) });

                    if (isSubsidiariesEnabled) {
                        edRecord.setValue({ fieldId: 'custrecord_hris_eds_subsidiary', value: newRecord.getValue({ fieldId: 'subsidiary' }) });
                    }

                    const savedEdsId = edRecord.save();
                    log.debug({ title: 'Created Employee Data Sourcing Record', details: 'ID: ' + savedEdsId });
                } else {
                    // Update existing sourcing record via submitFields
                    const edsId = edSearch[0].id;
                    const updateVals = {
                        custrecord_hris_eds_emp_code: newRecord.getValue({ fieldId: 'custentity_hris_empcode' }),
                        custrecord_hris_eds_date_of_joining: newRecord.getValue({ fieldId: 'hiredate' }),
                        custrecord_hris_eds_designation: newRecord.getValue({ fieldId: 'custentity_hris_empdesignation' }),
                        custrecord_hris_eds_department: newRecord.getValue({ fieldId: 'department' }),
                        custrecord_hris_eds_location: newRecord.getValue({ fieldId: 'location' }),
                        custrecord_hris_eds_employee_category: newRecord.getValue({ fieldId: 'custentity_hris_empcategory' }),
                        custrecord_hris_eds_gender: newRecord.getValue({ fieldId: 'custentity_hris_empgender' })
                    };

                    if (isSubsidiariesEnabled) {
                        updateVals.custrecord_hris_eds_subsidiary = newRecord.getValue({ fieldId: 'subsidiary' });
                    }

                    record.submitFields({
                        type: 'customrecord_hris_employeedatasourcing',
                        id: edsId,
                        values: updateVals,
                        options: { enforceUniqueFields: false, ignoreMandatoryFields: true }
                    });
                    log.debug({ title: 'Updated Employee Data Sourcing Record', details: 'ID: ' + edsId });
                }
            } catch (e) {
                log.error({ title: 'Error in Employee Data Sourcing Sync', details: e.message || e });
            }
        }

        // ------------------------------------------------------------------
        // TASK D: Sync Inactive Status Across Custom Child Records (hris_emp_inactiveedcrecord_ue.js)
        // ------------------------------------------------------------------
        if (executionContext === runtime.ContextType.USER_INTERFACE && customForm === '167') {
            try {
                const isInactive = newRecord.getValue({ fieldId: 'isinactive' });
                const isEmployeeInactive = (isInactive === true || isInactive === 'T');
                const searchFilterVal = isEmployeeInactive ? 'F' : 'T';

                const childRecordConfigs = [
                    { type: 'customrecord_hris_employee_compen_change', field: 'custrecord_hris_empchange_employee_nam' },
                    { type: 'customrecord_hris_leavebalance', field: 'custrecord_hris_lv_emp_name' },
                    { type: 'customrecord_hris_employeedatasourcing', field: 'custrecord_hris_eds_employee_name' },
                    { type: 'customrecord_hris_employee_compensation', field: 'custrecord_hris_empcomp_emp_name' }
                ];

                childRecordConfigs.forEach(cfg => {
                    const childSearch = search.create({
                        type: cfg.type,
                        filters: [
                            [cfg.field, 'is', recordId],
                            'AND',
                            ['isinactive', 'is', searchFilterVal]
                        ],
                        columns: ['internalid']
                    }).run().getRange({ start: 0, end: 1000 });

                    if (childSearch && childSearch.length > 0) {
                        childSearch.forEach(res => {
                            record.submitFields({
                                type: cfg.type,
                                id: res.id,
                                values: { isinactive: isEmployeeInactive },
                                options: { enforceUniqueFields: false, ignoreMandatoryFields: true }
                            });
                        });
                        log.debug({ title: 'Synced Child Inactive Status', details: { type: cfg.type, count: childSearch.length } });
                    }
                });
            } catch (e) {
                log.error({ title: 'Error Syncing Inactive Status', details: e.message || e });
            }
        }

        // ------------------------------------------------------------------
        // TASK E: Sync Demographic & Compensation Fields to Custom EDC Record (hris_employeetoemployeecompensationchange_ue.js)
        // ------------------------------------------------------------------
        if (customForm === '167') {
            try {
                const isSubsidiariesEnabled = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });
                const edcSearch = search.create({
                    type: 'customrecord_hris_employee_compen_change',
                    filters: [['custrecord_hris_empchange_employee_nam', 'is', recordId]],
                    columns: ['internalid']
                }).run().getRange({ start: 0, end: 1 });

                if (edcSearch && edcSearch.length > 0) {
                    const edcId = edcSearch[0].id;
                    const updateValues = {};

                    const fieldMap = [
                        { emp: 'department', edc: 'custrecord_hris_empchange_department' },
                        { emp: 'hiredate', edc: 'custrecord_apm_edc_doj' },
                        { emp: 'custentity_hirs_empdol', edc: 'custrecord_hris_empchange_date_of_leave' },
                        { emp: 'custentity_emp_grade_', edc: 'custrecord_hris_empchange_grade' },
                        { emp: 'custentity_hris_empdesignation', edc: 'custrecord_hris_empchange_designation' },
                        { emp: 'class', edc: 'custrecord_apm_edc_cost_center' },
                        { emp: 'custentity_hris_empmaritalstatus', edc: 'custrecord_hris_empchange_marital_status' },
                        { emp: 'employeestatus', edc: 'custrecord_hris_empchange_emp_status' },
                        { emp: 'custentity_hris_empemploymentstatus', edc: 'custrecord_hris_empchange_emp_active_sts' },
                        { emp: 'custentity_hris_emp_isptapplicable', edc: 'custrecord_hris_empchange_pt_appicable' },
                        { emp: 'custentity_hris_empptlocation', edc: 'custrecord_hris_empchange_pt_location' },
                        { emp: 'custentity_hris_isesiapplicable', edc: 'custrecord_hris_empchange_esic_applicabe' },
                        { emp: 'custentity_hris_esinumber', edc: 'custrecord_hris_empchange_esic_num' },
                        { emp: 'custentity_hris_pfnumber', edc: 'custrecord_hris_empchange_pf_number' },
                        { emp: 'custentity_hris_empcode', edc: 'custrecord_hris_empchange_emp_code' },
                        { emp: 'custentity_hris_empgender', edc: 'custrecord_hris_empchange_gender' },
                        { emp: 'custentity_hris_pfapplicable', edc: 'custrecord_hris_empchange_pf_applicable' },
                        { emp: 'location', edc: 'custrecord_hris_empchange_location' },
                        { emp: 'custentity_hris_empiseosapplicable', edc: 'custrecord_hris_empchange_gratuity_app' },
                        { emp: 'custentity_hris_emplegalname', edc: 'custrecord_hris_empchange_emp_legal_name' },
                        { emp: 'custentity_hris_empbankname', edc: 'custrecord_hris_empchange_bank_name' },
                        { emp: 'custentity_hris_empbankibanacctno', edc: 'custrecord_hris_empchange_iban_num' },
                        { emp: 'custentity_hris_empbankroutingno', edc: 'custrecord_hris_empchange_bank_route_no' },
                        { emp: 'custentity_hris_emp_bankaccno', edc: 'custrecord_hris_empchange_bank_acc_no' },
                        { emp: 'custentity_hris_empsocialinsurapplicable', edc: 'custrecord_hris_empchange_social_insu_ap' },
                        { emp: 'custentity_hris_emp_labcontract_type', edc: 'custrecord_hris_empchange_labour_type' },
                        { emp: 'custentity_hris_empvisaallocationfixed', edc: 'custrecord_hris_empchange_visa_allow_fix' },
                        { emp: 'custentity_hris_empvisaallocationmoltype', edc: 'custrecord_hris_empchange_visa_allo_wps' },
                        { emp: 'custentity_hris_emp_molpersonid', edc: 'custrecord_hris_empchange_mol_id' },
                        { emp: 'custentity_hris_empairticketamt', edc: 'custrecord_hris_empchange_air_tck_amt' }
                    ];

                    if (isSubsidiariesEnabled) {
                        fieldMap.push({ emp: 'subsidiary', edc: 'custrecord_hris_empchange_subsidiary' });
                    }

                    fieldMap.forEach(mapping => {
                        const val = newRecord.getValue({ fieldId: mapping.emp });
                        if (val !== null && val !== undefined && val !== '') {
                            updateValues[mapping.edc] = val;
                        }
                    });

                    if (Object.keys(updateValues).length > 0) {
                        record.submitFields({
                            type: 'customrecord_hris_employee_compen_change',
                            id: edcId,
                            values: updateValues,
                            options: { enforceUniqueFields: false, ignoreMandatoryFields: true }
                        });
                        log.debug({ title: 'Updated Custom Compensation Change Record', details: { edcId, count: Object.keys(updateValues).length } });
                    }
                }
            } catch (e) {
                log.error({ title: 'Error Syncing EDC Compensation Fields', details: e.message || e });
            }
        }

        // ------------------------------------------------------------------
        // TASK F: Source Location-Based Holidays from Holiday Master (hris_emp_setholiday_ue.js)
        // ------------------------------------------------------------------
        if (executionContext === runtime.ContextType.USER_INTERFACE && customForm === '167') {
            try {
                const empLocation = newRecord.getValue({ fieldId: 'custentity_hris_empworkinglocation' });

                if (empLocation) {
                    const holidaySearch = search.create({
                        type: 'customrecord_hris_holiday_master',
                        filters: [
                            ['custrecord_hris_lhol_location', 'is', empLocation],
                            'AND',
                            ['isinactive', 'is', 'F']
                        ],
                        columns: ['internalid']
                    }).run().getRange({ start: 0, end: 1000 });

                    if (holidaySearch && holidaySearch.length > 0) {
                        const holidayIds = holidaySearch.map(res => res.id);
                        log.debug({ title: 'Sourced Location Holidays', details: { empLocation, count: holidayIds.length } });

                        record.submitFields({
                            type: record.Type.EMPLOYEE,
                            id: recordId,
                            values: {
                                custentity_hris_empholidays: holidayIds
                            },
                            options: { enforceUniqueFields: false, ignoreMandatoryFields: true }
                        });
                    }
                }
            } catch (e) {
                log.error({ title: 'Error Sourcing Location Holidays', details: e.message || e });
            }
        }
    };

    return {
        beforeLoad,
        beforeSubmit,
        afterSubmit
    };
});
