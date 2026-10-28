/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * @Description Map/Reduce script for Regular Payprocess Monthly Attendance processing and unpaid leave entry creation.
 */
define(['N/record', 'N/log', 'N/format', 'N/runtime', 'N/query'], (record, log, format, runtime, query) => {

    /**
     * Executes a SuiteQL query and returns results as a mapped array.
     * @param {string} pSQL The SQL query string.
     * @returns {Array<Object>} Query results as mapped objects.
     */
    const getResult = (pSQL) => {
        const queryResults = query.runSuiteQL({ query: pSQL });
        return queryResults.asMappedResults();
    };

    /**
     * Retrieves Wage Period details for a Pay Group.
     * @param {string|number} payGroup Pay Group.
     * @returns {string|null} Wage details as "EndDate#StartDate#Month#Year" or null if not found.
     */
    const searchWagePeriod = (payGroup) => {
        try {
            const wagePeriodSql = `
                SELECT * 
                FROM customrecord_hris_wage_period_details 
                WHERE custrecord_hris_pay_group = ${payGroup} 
                  AND isinactive = 'F'
            `;
            const records = getResult(wagePeriodSql);
            log.debug('searchWagePeriod records', records);
            if (records && records.length > 0) {
                const endDate = records[0].custrecord_hris_end_date;
                const startDate = records[0].custrecord_hris_start_date;
                const month = records[0].custrecord_hris_month;
                const year = records[0].custrecord_hris_year;
                return `${endDate}#${startDate}#${month}#${year}`;
            }
            return null;
        } catch (e) {
            log.error({
                title: 'Error in searchWagePeriod',
                details: e.message || e
            });
            return null;
        }
    };

    /**
     * Retrieves Leave Wage Period details for a Pay Group.
     * @param {string|number} payGroup Pay Group.
     * @returns {string|null} Wage details as "EndDate#StartDate#Month#Year" or null if not found.
     */
    const otsearchWagePeriod = (payGroup) => {
        try {
            const wagePeriodSql = `
                SELECT * 
                FROM customrecord_hris_lvewage_period_details 
                WHERE custrecord_hris_lvepay_group = ${payGroup} 
                  AND isinactive = 'F'
            `;
            const records = getResult(wagePeriodSql);
            if (records && records.length > 0) {
                const endDate = records[0].custrecord_hris_lveend_date;
                const startDate = records[0].custrecord_hris_lvestart_date;
                const month = records[0].custrecord_hris_lvemonth;
                const year = records[0].custrecord_hris_lveyear;
                return `${endDate}#${startDate}#${month}#${year}`;
            }
            return null;
        } catch (e) {
            log.error({
                title: 'Error in otsearchWagePeriod',
                details: e.message || e
            });
            return null;
        }
    };

    /**
     * Retrieves the Pay Group for an employee.
     * @param {number} empId Employee ID.
     * @returns {string|null} Pay Group or null if not found.
     */
    const getPayGroup = (empId) => {
        try {
            const empCompSql = `
                SELECT * 
                FROM customrecord_hris_employee_compen_change 
                WHERE custrecord_hris_empchange_employee_nam = ${empId} 
                  AND isinactive = 'F'
            `;
            const records = getResult(empCompSql);
            return records.length > 0 ? records[0].custrecord_hris_empchange_emp_pay_pro_gp : null;
        } catch (e) {
            log.error({
                title: 'Error in getPayGroup',
                details: e.message || e
            });
            return null;
        }
    };

    /**
     * Retrieves Payroll Component based on paygroup and overtime sequence.
     * @param {string|number} paygroup
     * @param {string|number} otsequence
     * @returns {number|string|null}
     */
    const getPayrollcomponent = (paygroup, otsequence) => {
        try {
            const paycompsql = `
                SELECT * 
                FROM customrecord_hris_payroll_component 
                WHERE custrecord_hris__sequence_no_ = 38 
                  AND isinactive = 'F' 
                  AND custrecord_hris_overtime_type_seq_no = ${otsequence} 
                  AND custrecord_hris_pay_process_group = ${paygroup}
            `;
            const records = getResult(paycompsql);
            return records.length > 0 ? records[0].id : null;
        } catch (e) {
            log.error({
                title: 'Error in getPayrollcomponent',
                details: e.message || e
            });
            return null;
        }
    };

    /**
     * Retrieves basic pay for overtime calculation.
     * @param {string|number} empid
     * @returns {number}
     */
    const getbasicpay = (empid) => {
        try {
            const empcompensql = `
                SELECT SUM(b.custrecord_hris_cde_monthly) AS monthlyamt 
                FROM customrecord_hris_employee_compen_change a 
                JOIN customrecord_hris_compensation_details_e b 
                  ON a.id = b.custrecord_hris_employee_data_change 
                JOIN customrecord_hris_payroll_component c 
                  ON b.custrecord_hris_cde_payroll_component = c.id 
                WHERE a.custrecord_hris_empchange_employee_nam = ${empid} 
                  AND c.isinactive = 'F' 
                  AND c.custrecord_hris_overtime_calculation = 'T'
            `;
            log.debug('empcompensql', empcompensql);
            const records = getResult(empcompensql);
            let basicpay = 1;
            if (records && records.length > 0 && records[0].monthlyamt != null) {
                basicpay = records[0].monthlyamt;
            }
            return basicpay;
        } catch (e) {
            log.error({
                title: 'Error in getbasicpay',
                details: e.message || e
            });
            return 1;
        }
    };

    /**
     * Retrieves weekly overtime rate.
     * @param {string|number} paycomponent
     * @returns {string|number}
     */
    const getweeklyotrate = (paycomponent) => {
        try {
            const overtimesql = `
                SELECT * 
                FROM customrecord_hris_overtime_type 
                WHERE custrecord_hris_overtime_sequence_no = 1 
                  AND custrecord_hris_overtime_paycomponent = ${paycomponent} 
                  AND isinactive = 'F'
            `;
            const records = getResult(overtimesql);
            log.debug('recordsgetweklyotrate', records);
            if (records && records.length > 0) {
                const otrate = records[0].custrecord_hris_overtime_value_cal || 1;
                const overtimeid = records[0].id;
                return `${otrate}#${overtimeid}`;
            }
            return 1;
        } catch (e) {
            log.error({
                title: 'Error in getweeklyotrate',
                details: e.message || e
            });
            return 1;
        }
    };

    /**
     * Retrieves holiday overtime rate.
     * @param {string|number} paycomponent
     * @returns {string|number}
     */
    const getholidayottate = (paycomponent) => {
        try {
            const overtimesql = `
                SELECT * 
                FROM customrecord_hris_overtime_type 
                WHERE custrecord_hris_overtime_sequence_no = 2 
                  AND custrecord_hris_overtime_paycomponent = ${paycomponent} 
                  AND isinactive = 'F'
            `;
            const records = getResult(overtimesql);
            if (records && records.length > 0) {
                const otrate = records[0].custrecord_hris_overtime_value_cal || 1;
                const overtimeid = records[0].id;
                return `${otrate}#${overtimeid}`;
            }
            return 1;
        } catch (e) {
            log.error({
                title: 'Error in getholidayottate',
                details: e.message || e
            });
            return 1;
        }
    };

    /**
     * Retrieves ROT rate.
     * @param {string|number} paycomponent
     * @returns {string|number}
     */
    const getrotrate = (paycomponent) => {
        try {
            const overtimesql = `
                SELECT * 
                FROM customrecord_hris_overtime_type 
                WHERE custrecord_hris_overtime_sequence_no = 3 
                  AND custrecord_hris_overtime_paycomponent = ${paycomponent} 
                  AND isinactive = 'F'
            `;
            const records = getResult(overtimesql);
            if (records && records.length > 0) {
                const otrate = records[0].custrecord_hris_overtime_value_cal || 1;
                const overtimeid = records[0].id;
                return `${otrate}#${overtimeid}`;
            }
            return 1;
        } catch (e) {
            log.error({
                title: 'Error in getrotrate',
                details: e.message || e
            });
            return 1;
        }
    };

    /**
     * Retrieves payroll component ID for overtime.
     * @param {string|number} paygroup
     * @returns {string|number|null}
     */
    const getpayrollcompidforovertime = (paygroup) => {
        try {
            const querypaycomname = `
                SELECT id 
                FROM customrecord_hris_payroll_component 
                WHERE custrecord_hris_component_short_name = 'Overtime' 
                  AND custrecord_hris_pay_process_group = ${paygroup}
            `;
            const records = getResult(querypaycomname);
            if (records && records.length > 0) {
                const id = records[0].id;
                log.debug('Component ID', id);
                return id;
            }
            log.debug('No results found for overtime payroll component');
            return null;
        } catch (e) {
            log.error({
                title: 'Error in getpayrollcompidforovertime',
                details: e.message || e
            });
            return null;
        }
    };

    /**
     * Creates and saves a custom unpaid leave entry and marks monthly attendance as completed.
     * @param {Object} data Data for creating the record.
     * @returns {void}
     */
    const createMonthlyAttendanceRecord = (data) => {
        try {
            log.audit('Processing parId', data.parId);
            const monthlyattensql = `SELECT * FROM customrecord_hrms_monthlyattendance WHERE id = ${data.parId}`;
            const queryResult = query.runSuiteQL({ query: monthlyattensql });
            const tsResult = queryResult.asMappedResults();

            log.debug('Monthly Attendance tsResult length', tsResult.length);

            for (const rec of tsResult) {
                const empid = rec.custrecord_hrms_month_empid || '';
                const monthid = rec.custrecord_hrms_month_monthid;
                const yearid = rec.custrecord_hrms_month_yearid;
                const paygroup = rec.custrecord_hrms_month_paygroup;
                let payDate = rec.custrecord_hrms_month_paydate || '';

                log.debug('paygroup', paygroup);

                let wageDetails = null;
                if (payDate) {
                    wageDetails = searchWagePeriod(paygroup);
                }

                if (wageDetails) {
                    const wageDetailsArray = wageDetails.split('#');
                    const startDate = wageDetailsArray[1];
                    const wageMonth = wageDetailsArray[2];
                    const wageYear = wageDetailsArray[3];

                    log.debug('Wage Period Details', {
                        wageDetailsArray,
                        startDate,
                        wageMonth,
                        wageYear,
                        payDate
                    });
                } else {
                    log.error('Wage Period Not Found', `No wage period found for pay group: ${paygroup}`);
                }

                const absentdays = rec.custrecord_hrms_month_absentdays || 0;
                log.debug('Absent Days', absentdays);

                if (absentdays != 0) {
                    const unpaidleaverecord = record.create({
                        type: 'customrecord_hris_unpaid_leave_entry',
                        isDynamic: true
                    });

                    const reasons = 'This Entry is created from monthly attendance';
                    unpaidleaverecord.setValue({ fieldId: 'custrecord_hris_ule_employee_name', value: empid, ignoreFieldChange: false });
                    unpaidleaverecord.setValue({ fieldId: 'custrecord_hris_ule_pay_group', value: paygroup, ignoreFieldChange: true });

                    if (payDate) {
                        const parsedPayDate = format.parse({
                            value: payDate,
                            type: format.Type.DATE
                        });
                        unpaidleaverecord.setValue({ fieldId: 'custrecord_hris_ule_pay_date', value: parsedPayDate, ignoreFieldChange: true });
                    }

                    unpaidleaverecord.setValue({ fieldId: 'custrecord_hris_ule_month', value: monthid, ignoreFieldChange: true });
                    unpaidleaverecord.setValue({ fieldId: 'custrecord_hris_ule_year', value: yearid, ignoreFieldChange: true });
                    unpaidleaverecord.setValue({ fieldId: 'custrecord_hris_ule_noof_days', value: absentdays, ignoreFieldChange: true });
                    unpaidleaverecord.setValue({ fieldId: 'custrecord_hris_ule_final_days', value: absentdays, ignoreFieldChange: true });
                    unpaidleaverecord.setValue({ fieldId: 'custrecord_hris_ule_reason', value: reasons, ignoreFieldChange: true });

                    const unpaidLeaveId = unpaidleaverecord.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });

                    log.debug('Created unpaid leave Record', `Record ID: ${unpaidLeaveId}`);
                }

                // Update the related monthly attendance record
                if (data.parId) {
                    record.submitFields({
                        type: 'customrecord_hrms_monthlyattendance',
                        id: parseInt(data.parId, 10),
                        values: {
                            custrecord_hrms_month_processcompleted: true
                        }
                    });
                    log.debug('Updated Monthly Attendance Record', `Record ID: ${data.parId}`);
                }
            }
        } catch (e) {
            log.error({
                title: 'Error Creating Monthly Attendance Record',
                details: e.message || e
            });
        }
    };

    /**
     * Marks the MRS status bar record.
     * @param {number} statusVal 1 = Ready/Completed, 2 = In Progress
     */
    const updateStatusBar = (statusVal) => {
        try {
            record.submitFields({
                type: 'customrecord_hris_mr_status_bar_rec',
                id: 16,
                values: {
                    custrecord_hris_mr_sts: statusVal
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }
            });
        } catch (e) {
            log.error({
                title: 'Error updating status bar',
                details: e.message || e
            });
        }
    };

    /**
     * Retrieves input data for the Map/Reduce script.
     * @returns {Array<Object>} Parsed data from the script parameter.
     */
    const getInputData = () => {
        try {
            const currentScript = runtime.getCurrentScript();
            const emplist = currentScript.getParameter({ name: 'custscript_hris_monthlyattenlist' });

            log.debug('Regular Pay Monthly attendance Input', emplist);

            // Set status to In Progress (2)
            updateStatusBar(2);

            return JSON.parse(emplist || '[]');
        } catch (e) {
            log.error({
                title: 'Error in getInputData',
                details: e.message || e
            });
            // Reset status to Completed/Ready (1) on error
            updateStatusBar(1);
            return [];
        }
    };

    /**
     * Processes each input record in the Map stage.
     * @param {Object} context The Map/Reduce context object.
     */
    const map = (context) => {
        try {
            const data = JSON.parse(context.value);
            log.debug('Map Data', data);

            context.write({
                key: String(data.empid),
                value: JSON.stringify(data)
            });
        } catch (e) {
            log.error({
                title: 'Error in map stage',
                details: e.message || e
            });
        }
    };

    /**
     * Processes data in the Reduce stage.
     * @param {Object} context The Reduce context object.
     */
    const reduce = (context) => {
        try {
            for (const value of context.values) {
                const data = JSON.parse(value);
                log.debug('Reduce Data', data);
                createMonthlyAttendanceRecord(data);
            }
            // Mark status complete
            updateStatusBar(1);
        } catch (e) {
            log.error({
                title: 'Error in reduce stage',
                details: e.message || e
            });
            updateStatusBar(1);
        }
    };

    /**
     * Handles errors and summarizes the script execution.
     * @param {Object} summary The summary of the Map/Reduce execution.
     */
    const summarize = (summary) => {
        try {
            summary.mapSummary.errors.iterator().each((key, error) => {
                log.error({
                    title: `Map Error for Key: ${key}`,
                    details: error
                });
                return true;
            });

            summary.reduceSummary.errors.iterator().each((key, error) => {
                log.error({
                    title: `Reduce Error for Key: ${key}`,
                    details: error
                });
                return true;
            });
        } catch (e) {
            log.error({
                title: 'Error in summarize',
                details: e.message || e
            });
        }
    };

    return {
        getInputData,
        map,
        reduce,
        summarize
    };
});
