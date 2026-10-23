/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * Description: Sources employee information to Employee Compensation Change record after employee submission.
 * Converted from SuiteScript 1.0 to SuiteScript 2.1.
 */
define(['N/record', 'N/search', 'N/runtime', 'N/format', 'N/log'], (record, search, runtime, format, log) => {

    /**
     * Executes after an employee record is submitted.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     */
    const afterSubmit = (scriptContext) => {
        try {
            const { type, newRecord } = scriptContext;

            // Only run on create or edit operations
            if (type === scriptContext.UserEventType.DELETE) {
                return;
            }

            const customForm = newRecord.getValue({ fieldId: 'customform' });
            log.debug('afterSubmit', `Trigger type: ${type}, customform: ${customForm}`);

            if (String(customForm) !== '565') {
                return;
            }

            const recordId = newRecord.id;
            log.debug('afterSubmit', `Processing Employee recordId: ${recordId}`);

            const hasSubsidiaries = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });
            log.debug('Feature Check', `SUBSIDIARIES in effect: ${hasSubsidiaries}`);

            // Fetch comprehensive employee data
            const empData = searchEmployeeInfo(recordId);
            if (!empData) {
                log.debug('Employee Info', `No employee data found for ID: ${recordId}`);
                return;
            }

            let empSubsidiary = '';
            if (hasSubsidiaries) {
                empSubsidiary = empData.subsidiary || searchEmpSubsidiary(recordId);
            }

            log.debug('Employee Data Retrieved', {
                empId: empData.internalid,
                gender: empData.gender,
                empSubsidiary
            });

            // Find matching Employee Data Change (EDC) record
            const edcId = searchEmpDataChange(empData.internalid);
            log.debug('EDC Lookup', `EDCId: ${edcId}`);

            if (edcId) {
                const edcRecord = record.load({
                    type: 'customrecord_hris_employee_compen_change',
                    id: edcId,
                    isDynamic: false
                });

                // Mapping fields with validation
                setIfValid(edcRecord, 'custrecord_hris_empchange_department', empData.department);
                setIfValid(edcRecord, 'custrecord_hris_empchange_date_of_join', empData.doj, true);
                setIfValid(edcRecord, 'custrecord_hris_empchange_date_of_leave', empData.dol, true);
                setIfValid(edcRecord, 'custrecord_hris_empchange_grade', empData.grade);
                setIfValid(edcRecord, 'custrecord_hris_empchange_designation', empData.designation);
                setIfValid(edcRecord, 'custrecord_hris_empchange_business_area', empData.costCenter);
                setIfValid(edcRecord, 'custrecord_hris_empchange_subsidiary', empSubsidiary);
                setIfValid(edcRecord, 'custrecord_hris_empchange_marital_status', empData.maritalStatus);
                setIfValid(edcRecord, 'custrecord_hris_empchange_emp_status', empData.employeeStatus);
                setIfValid(edcRecord, 'custrecord_hris_empchange_emp_active_sts', empData.empActiveStatus);
                setIfValid(edcRecord, 'custrecord_hris_empchange_pt_appicable', empData.ptCheck);
                setIfValid(edcRecord, 'custrecord_hris_empchange_pt_location', empData.ptLoc);
                setIfValid(edcRecord, 'custrecord_hris_empchange_esic_applicabe', empData.esicCheck);
                setIfValid(edcRecord, 'custrecord_hris_empchange_esic_num', empData.esicNo);
                setIfValid(edcRecord, 'custrecord_hris_empchange_pf_number', empData.pfNumber);
                setIfValid(edcRecord, 'custrecord_hris_empchange_emp_code', empData.lmsEmployeeCode || empData.empCode);
                setIfValid(edcRecord, 'custrecord_hris_empchange_gender', empData.gender);
                setIfValid(edcRecord, 'custrecord_hris_empchange_pf_applicable', empData.pfApplicable);
                setIfValid(edcRecord, 'custrecord_hris_empchange_location', empData.loc);
                setIfValid(edcRecord, 'custrecord_hris_empchange_location_no', empData.oldLoc);
                setIfValid(edcRecord, 'custrecord_hris_empchange_gratuity_app', empData.gratuityApplicable);
                setIfValid(edcRecord, 'custrecord_hris_empchange_emp_legal_name', empData.employeeLegalName);
                setIfValid(edcRecord, 'custrecord_hris_empchange_bank_name', empData.bankName);
                setIfValid(edcRecord, 'custrecord_hris_empchange_iban_num', empData.ibanNumber);
                setIfValid(edcRecord, 'custrecord_hris_empchange_bank_route_no', empData.bankRoutingNo);
                setIfValid(edcRecord, 'custrecord_hris_empchange_bank_acc_no', empData.bankAccNo);
                setIfValid(edcRecord, 'custrecord_hris_empchange_social_insu_ap', empData.socialApplicable);
                setIfValid(edcRecord, 'custrecord_hris_empchange_labour_type', empData.labourCardType);
                setIfValid(edcRecord, 'custrecord_hris_empchange_visa_allow_fix', empData.fixedVisaAllocation);
                setIfValid(edcRecord, 'custrecord_hris_empchange_visa_allo_wps', empData.visaUnderSubsidiary);
                setIfValid(edcRecord, 'custrecord_hris_empchange_mol_id', empData.personalNo);
                setIfValid(edcRecord, 'custrecord_hris_empchange_air_tck_amt', empData.airTicketAmnt);

                const submittedId = edcRecord.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });
                log.debug('EDC Submitted', `Successfully updated EDC ID: ${submittedId}`);
            }
        } catch (e) {
            log.error('Error in afterSubmit', e);
        }
    };

    /**
     * Helper to safely set record values when valid and non-empty.
     * @param {Record} targetRec - Record to update
     * @param {string} fieldId - Field ID
     * @param {*} value - Field value
     * @param {boolean} [isDate=false] - Whether the field is a Date field
     */
    const setIfValid = (targetRec, fieldId, value, isDate = false) => {
        if (value !== '' && value !== null && value !== undefined && value !== 'undefined') {
            if (isDate) {
                let dateVal = value;
                if (!(dateVal instanceof Date)) {
                    try {
                        dateVal = format.parse({ value: String(value), type: format.Type.DATE });
                    } catch (err) {
                        dateVal = new Date(value);
                    }
                }
                if (dateVal && !isNaN(dateVal.getTime())) {
                    targetRec.setValue({ fieldId, value: dateVal });
                }
            } else {
                targetRec.setValue({ fieldId, value });
            }
        }
    };

    /**
     * Searches employee data by internal ID.
     * @param {number|string} recordId
     * @returns {Object|null}
     */
    const searchEmployeeInfo = (recordId) => {
        const columns = [
            'internalid',
            'custentity_hris_empdepartment_new',
            'custentity_hris_empdesignation',
            'class',
            'hiredate',
            'custentity_hirs_empdol',
            'custentity_emp_grade_',
            'maritalstatus',
            'custentity_hris_empmaritalstatus',
            'custentity_emp_employee_job_status',
            'employeestatus',
            'custentity_hris_empemploymentstatus',
            'custentity_hris_emp_isptapplicable',
            'custentity_hris_empptlocation',
            'custentity_hris_isesiapplicable',
            'custentity_hris_esinumber',
            'custentity_hris_pfnumber',
            'custentity_hris_empcode',
            'custentity_hris_empgender',
            'location',
            'custentity_hris_pfapplicable',
            'custentity_hris_emplegalname',
            'custentity_hris_empiseosapplicable',
            'custentity_hris_empbankname',
            'custentity_hris_empbankroutingno',
            'custentity_hris_empbankibanacctno',
            'custentity_hris_emp_bankaccno',
            'custentity_hris_empsocialinsurapplicable',
            'custentity_hris_emp_labcontract_type',
            'custentity_hris_empvisaallocationfixed',
            'custentity_hris_empvisaallocationmoltype',
            'custentity_hris_emp_molpersonid',
            'custentity_hris_empairticketamt',
            'custentity_hris_empdlocation_new',
            'subsidiary'
        ];

        const empSearch = search.create({
            type: search.Type.EMPLOYEE,
            filters: [
                ['internalid', 'anyof', recordId]
            ],
            columns: columns
        });

        const results = empSearch.run().getRange({ start: 0, end: 1 });
        if (!results || results.length === 0) {
            return null;
        }

        const res = results[0];
        return {
            internalid: res.getValue({ name: 'internalid' }),
            department: res.getValue({ name: 'custentity_hris_empdepartment_new' }),
            designation: res.getValue({ name: 'custentity_hris_empdesignation' }),
            costCenter: res.getValue({ name: 'class' }),
            doj: res.getValue({ name: 'hiredate' }),
            dol: res.getValue({ name: 'custentity_hirs_empdol' }),
            grade: res.getValue({ name: 'custentity_emp_grade_' }),
            maritalStatus: res.getValue({ name: 'custentity_hris_empmaritalstatus' }) || res.getValue({ name: 'maritalstatus' }),
            employeeStatus: res.getValue({ name: 'employeestatus' }) || res.getValue({ name: 'custentity_emp_employee_job_status' }),
            empActiveStatus: res.getValue({ name: 'custentity_hris_empemploymentstatus' }),
            ptCheck: res.getValue({ name: 'custentity_hris_emp_isptapplicable' }),
            ptLoc: res.getValue({ name: 'custentity_hris_empptlocation' }),
            esicCheck: res.getValue({ name: 'custentity_hris_isesiapplicable' }),
            esicNo: res.getValue({ name: 'custentity_hris_esinumber' }),
            pfNumber: res.getValue({ name: 'custentity_hris_pfnumber' }),
            empCode: res.getValue({ name: 'custentity_hris_empcode' }),
            gender: res.getValue({ name: 'custentity_hris_empgender' }),
            pfApplicable: res.getValue({ name: 'custentity_hris_pfapplicable' }),
            oldLoc: res.getValue({ name: 'location' }),
            loc: res.getValue({ name: 'custentity_hris_empdlocation_new' }),
            employeeLegalName: res.getValue({ name: 'custentity_hris_emplegalname' }),
            gratuityApplicable: res.getValue({ name: 'custentity_hris_empiseosapplicable' }),
            bankName: res.getValue({ name: 'custentity_hris_empbankname' }),
            bankRoutingNo: res.getValue({ name: 'custentity_hris_empbankroutingno' }),
            ibanNumber: res.getValue({ name: 'custentity_hris_empbankibanacctno' }),
            bankAccNo: res.getValue({ name: 'custentity_hris_emp_bankaccno' }),
            socialApplicable: res.getValue({ name: 'custentity_hris_empsocialinsurapplicable' }),
            labourCardType: res.getValue({ name: 'custentity_hris_emp_labcontract_type' }),
            fixedVisaAllocation: res.getValue({ name: 'custentity_hris_empvisaallocationfixed' }),
            visaUnderSubsidiary: res.getValue({ name: 'custentity_hris_empvisaallocationmoltype' }),
            personalNo: res.getValue({ name: 'custentity_hris_emp_molpersonid' }),
            airTicketAmnt: res.getValue({ name: 'custentity_hris_empairticketamt' }),
            lmsEmployeeCode: res.getValue({ name: 'custentity_hris_empcode' }),
            subsidiary: res.getValue({ name: 'subsidiary' })
        };
    };

    /**
     * Searches subsidiary of employee.
     * @param {number|string} recordId
     * @returns {string}
     */
    const searchEmpSubsidiary = (recordId) => {
        let subsidiary = '';
        const empSearch = search.create({
            type: search.Type.EMPLOYEE,
            filters: [['internalid', 'anyof', recordId]],
            columns: ['subsidiary']
        });
        const results = empSearch.run().getRange({ start: 0, end: 1 });
        if (results && results.length > 0) {
            subsidiary = results[0].getValue({ name: 'subsidiary' });
        }
        return subsidiary;
    };

    /**
     * Searches for Employee Compensation Change record by Employee ID.
     * @param {number|string} empId
     * @returns {string|null}
     */
    const searchEmpDataChange = (empId) => {
        let edcId = null;
        const edcSearch = search.create({
            type: 'customrecord_hris_employee_compen_change',
            filters: [
                ['custrecord_hris_empchange_employee_nam', 'anyof', empId]
            ],
            columns: ['internalid']
        });
        const results = edcSearch.run().getRange({ start: 0, end: 1 });
        if (results && results.length > 0) {
            edcId = results[0].getValue({ name: 'internalid' });
        }
        return edcId;
    };

    return {
        afterSubmit
    };
});
