/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @Description User Event script to sync Employee record compensation & demographic details into Employee Compensation Change custom records.
 */
define(['N/record', 'N/search', 'N/runtime', 'N/log'], (record, search, runtime, log) => {

    /**
     * Function executed after a record is submitted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type (e.g. create, edit)
     */
    const afterSubmit = (scriptContext) => {
        try {
            const newRecord = scriptContext.newRecord;
            const recordId = newRecord.id;
            const customForm = newRecord.getValue({ fieldId: 'customform' });

            log.debug({ title: 'afterSubmit customform', details: customForm });

            if (String(customForm) === '167') {
                const isSubsidiariesEnabled = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });

                // Search internal id of customrecord_hris_employee_compen_change for this employee
                const edcSearch = search.create({
                    type: 'customrecord_hris_employee_compen_change',
                    filters: [
                        ['custrecord_hris_empchange_employee_nam', 'is', recordId]
                    ],
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

                    log.debug({ title: 'Updating EDC Record', details: { edcId, updateValues } });

                    if (Object.keys(updateValues).length > 0) {
                        record.submitFields({
                            type: 'customrecord_hris_employee_compen_change',
                            id: edcId,
                            values: updateValues,
                            options: {
                                enforceUniqueFields: false,
                                ignoreMandatoryFields: true
                            }
                        });
                    }
                }
            }
        } catch (e) {
            log.error({
                title: 'Error in SourceValueFromEmployeeAfterSubmit',
                details: e.message || e
            });
        }
    };

    return {
        afterSubmit
    };
});
