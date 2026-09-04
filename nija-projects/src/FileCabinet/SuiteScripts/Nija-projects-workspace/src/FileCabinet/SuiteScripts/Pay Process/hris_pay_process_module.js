/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 * @Description Core Pay Process Module – contains all business logic
 */
define(['N/record', 'N/search', 'N/log', 'N/format'],
    (record, search, log, format) => {

        const CUSTOM_RECORDS = {
            PRE_PAY_PROCESS: 'customrecord_hris_pre_pay_process_record',
            PAY_PROCESS: 'customrecord_hris_pay_process',
            EMP_COMP_CHANGE: 'customrecord_hris_employee_compen_change',
            PAYROLL_COMPONENT: 'customrecord_hris_payroll_component',
            UNPAID_LEAVE: 'customrecord_hris_unpaid_leave_entry',
            UNPAID_ARREAR: 'customrecord_hris_unpaid_arrear_entry',
            MONTHLY_SAL: 'customrecord_hris_monthlysalinput',
            SALARY_ADJ: 'customrecord_hris_salary_adjustment_entr',
            WAGE_PERIOD: 'customrecord_hris_wage_period_details',
            LOAN_APP: 'customrecord_hris_empchange_loan_applicn',
            LOAN_CHILD: 'customrecord_hris_loan_applicat_child',
            LOAN_MASTER: 'customrecord_hris_loan_master',
            GLOBAL_PARAM: 'customrecord_hris_global_parameter',
            COMPONENT_TYPE: 'customrecord_hris_component_type',
            PT_SLAB: 'customrecord_hris_pt_slap_master',
            INCOME_TAX_SLAB: 'customrecord_hris_income_tax_slab',
            SS_FIN_YEAR: 'customrecord_hris_ss_financial_year',
            MONTHLY_ATTENDANCE: 'customrecord_hrms_monthlyattendance',
            LEAVE_SETTLEMENT: 'customrecord_hrms_leavesettlement',
            YEAR_MASTER: 'customlist_hris_year_master'
        };

        // ==================== PUBLIC API ====================

        /**
         * Main entry point – processes pay for a given Pre-Pay Process record
         * @param {number|string} prePayProcessId
         * @returns {Object}
         */
        const processEmployeePay = (prePayProcessId) => {
            if (!prePayProcessId) {
                throw new Error('Record_id is required');
            }

            const prePayRec = record.load({
                type: CUSTOM_RECORDS.PRE_PAY_PROCESS,
                id: prePayProcessId
            });

            const checked = prePayRec.getValue('custrecord_hris_pre_pay_pr_checked');
            log.debug( 'Checked Value',checked);
            if (checked !== 'F' && checked !== false) {
                return {
                    success: false,
                    message: 'Record already processed'
                };
            }

            const empId = prePayRec.getValue('custrecord_hris_pre_pay_pr_employee_name');
            const payGroup = prePayRec.getValue('custrecord_hris_pre_pay_pr_pay_group');
            const wageMonth = prePayRec.getValue('custrecord_hris_pre_pay_pr_wage_month');
            const remarks = prePayRec.getValue('custrecord_hris_pre_pay_pr_remarks');

            // Wage Period
            const wagePeriodId = getWagePeriodNo(wageMonth);
            const wagePeriodData = getWagePeriodYear(payGroup, wagePeriodId);
            const getYear = wagePeriodData.yearId;
            const year = wagePeriodData.yearText;
            const wEndDate = wagePeriodData.endDate;

            const monthDays = getMonthDays(wagePeriodId);

            // SS / IT Year
            const ssItYear = searchSSandITYr(getYear);

            // Employee master
            const empRec = record.load({ type: 'employee', id: empId });
            const empCode = empRec.getValue('employeeid');
            const dept = empRec.getValue('department');
            const company = empRec.getValue('subsidiary');
            const hireDateStr = empRec.getValue('hiredate');
            const esicApplicable = empRec.getValue('custentity_hris_isesiapplicable');
            const pfApplicable = empRec.getValue('custentity_hris_pfapplicable');
            const ptLoc = empRec.getValue('custentity_hris_empptlocation');
            const subDept = empRec.getValue('custentity_hris_empsubdepartment');
            const location = empRec.getValue('custentity_hris_empdlocation_new');

            // Cleanup previous run
            deleteRecInitial(empId, payGroup, wagePeriodId, 1, getYear);

            // Attendance / LOP / OT
            const arrearMonthDays = getArrearMonthDays(empId, wagePeriodId, getYear);
            const paidDays = getPaidDays(empId, wagePeriodId, monthDays, getYear);
            const lopDaysFinal = getLOPDaysFinal(empId, wagePeriodId, getYear);
            const otHours = getOTHours(empId, payGroup, wagePeriodId, getYear);

            // Process Earnings
            const earnings = getEmployeeEarningComp({
                empId, empNameTx: empRec.getText('internalid'), empCode, payGroup,
                wagePeriodId, monthDays, arrearMonthDays, hireDateStr, wEndDate,
                ssStartMonth: ssItYear.startMonth, ssEndMonth: ssItYear.endMonth,
                getYear, dept, company, processType: 1, entityId: empId,
                paidDays, lopDaysFinal, year, esicApplicable, pfApplicable,
                ptLoc, subDept, location, otHours, remarks
            });

            // Process Deductions
            const deductions = getEmployeeDeductionComp({
                empId, empNameTx: empRec.getText('internalid'), empCode, payGroup,
                wagePeriodId, monthDays, arrearMonthDays, getYear, dept, company,
                processType: 1, entityId: empId, paidDays, lopDaysFinal, year,
                esicApplicable, ptLoc, wEndDate, subDept, location, otHours, remarks
            });

            // Other components
            getEmployeeOtherComp({
                wEndDate, empId, empNameTx: empRec.getText('internalid'), empCode,
                payGroup, wagePeriodId, monthDays, arrearMonthDays, getYear,
                dept, company, processType: 1, entityId: empId,
                paidDays: earnings.paidDays, lopDaysFinal, year,
                esicApplicable, ptLoc, subDept, location, otHours, remarks
            });

            // Monthly Variable Pay
            getMonthlyVariableComp({
                empId, empEntity: empId, empCode, hireDateStr, payGroup,
                wagePeriodId, wEndDate, getYear, dept, company,
                processType: 1, entityId: empId, paidDays, lopDaysFinal,
                year, esicApplicable, ptLoc, subDept, location, otHours, remarks
            });

            // Loans
            const loanData = searchLoanEntry(empId, wagePeriodId, getYear);
            createLoanComp({
                wEndDate, entityId: empId, empNameTx: empRec.getText('internalid'),
                empCode, processType: 1, payGroup, empName: empId, dept,
                wagePeriod: wagePeriodId, company, componentType: earnings.componentType,
                searchLoanIds: loanData, lopDaysFinal, paidDays, getYear,
                esicApplicable, ptLoc, year, subDept, location, otHours, remarks
            });

            // PF
            if (pfApplicable === 'T') {
                createPFComp({
                    entityId: empId, empNameTx: empRec.getText('internalid'),
                    empCode, processType: 1, payGroup, empName: empId, dept,
                    wagePeriod: wagePeriodId, company, componentType: earnings.componentType,
                    pfCal: 0, pfGrossTotal: 0, lopDaysFinal, paidDays, getYear,
                    esicApplicable, ptLoc, subDept, location, otHours, remarks
                });
            }

            // ESIC
            if (esicApplicable === 'T') {
                createESICComp({
                    entityId: empId, empNameTx: empRec.getText('internalid'),
                    empCode, processType: 1, payGroup, empName: empId, dept,
                    wagePeriod: wagePeriodId, company, componentType: earnings.componentType,
                    esicEmpContri: 0, esicEmployerContri: 0, esicGrossTotal: 0,
                    lopDaysFinal, paidDays, getYear, esicApplicable, ptLoc,
                    subDept, location, otHours, remarks
                });
            }

            // Gross totals
            const earningTotal = getEarningGross({
                wEndDate, empNameTx: empRec.getText('internalid'), empCode,
                payGroup, wagePeriodId, empId, componentType: earnings.componentType,
                getYear, dept, company, processType: 1, entityId: empId,
                paidDays, lopDaysFinal, esicApplicable, ptLoc, subDept,
                location, otHours, remarks
            });

            const deductionTotal = getDeductionGross({
                wEndDate, empNameTx: empRec.getText('internalid'), empCode,
                payGroup, wagePeriodId, empId, componentType: deductions.componentType,
                getYear, dept, company, processType: 1, entityId: empId,
                paidDays, lopDaysFinal, esicApplicable, ptLoc, subDept,
                location, otHours, remarks
            });
            

            // Net Pay
            getNetPay({
                wEndDate, empNameTx: empRec.getText('internalid'), empId, empCode,
                payGroup, wagePeriodId, earningTotal, deductionTotal, getYear,
                dept, company, processType: 1, entityId: empId, paidDays,
                lopDaysFinal, esicApplicable, ptLoc, subDept, location, otHours, remarks
            });

            // Mark as completed
            prePayRec.setValue('custrecord_hris_pre_pay_pr_status', 'Completed');
            prePayRec.setValue('custrecord_hris_pre_pay_pr_checked', true);
            prePayRec.save();

            return {
                success: true,
                message: 'Pay process completed successfully',
                prePayProcessId: prePayProcessId,
                actualEarning: earnings.actualGross,
                grossEarning: earnings.grossEarning,
                actualDeduction: deductions.actualGross,
                grossDeduction: deductions.grossDeduction,
                netPay: parseFloat(earningTotal) - parseFloat(deductionTotal)
            };
        };

        // ==================== HELPER FUNCTIONS ====================

        const createPayProcessRecord = (params) => {
            try {
                const payRec = record.create({ type: CUSTOM_RECORDS.PAY_PROCESS });

                payRec.setValue('custrecord_hris_pay_proc_employee', params.entityId);
                payRec.setValue('custrecord_hris_pay_proc_employee_code', params.empCode);
                payRec.setValue('custrecord_hris_pay_proc_process_type', params.processType);
                payRec.setValue('custrecord_hris_pay_proc_pay_group', params.payGroup);
                payRec.setValue('custrecord_hris_pay_proc_employee_name', params.empNameTx);
                payRec.setValue('custrecord_hris_pay_proc_department', params.dept);
                payRec.setValue('custrecord_hris_pay_proc_subdept', params.subDept);

                if (params.company) {
                    payRec.setValue('custrecord_hris_pay_proc_company_name', params.company);
                }

                payRec.setValue('custrecord_hris_pay_proc_pay_month', params.wagePeriod);
                payRec.setValue('custrecord_hris_pay_proc_pay_date', params.wEndDate);
                payRec.setValue('custrecord_hris_pay_proc_year', params.getYear);
                payRec.setValue('custrecord_hris_pay_proc_payroll_compone', params.component);
                if (params.accountCode) {
                    payRec.setValue('custrecord_hris_pay_proc_account_code', params.accountCode);
                }
                payRec.setValue('custrecord_hris_pay_proc_component_type', params.componentType);
                payRec.setValue('custrecord_hris_pay_proc_lop_days', params.lopAmt || 0);
                payRec.setValue('custrecord_hris_pay_proc_pro_rata_amount', params.proRataAmt || 0);
                payRec.setValue('custrecord_hris_pay_proc_arrears', params.arrearAmt || 0);
                payRec.setValue('custrecord_hris_pay_proc_arrear_days', params.arrearDays || 0);
                payRec.setValue('custrecord_hris_pay_proc_actual_gross_ea', params.actualGross || 0);
                payRec.setValue('custrecord_hris_pay_proc_value', params.actualGross || 0);
                payRec.setValue('custrecord_hris_pay_proc_paid_days', params.paidDays || 0);
                payRec.setValue('custrecord_hris_pay_proc_lop_days_final', params.lopDaysFinal || 0);
                payRec.setValue('custrecord_hris_pay_proc_pt_location', params.ptLoc);
                payRec.setValue('custrecord_hris_pay_proc_othours', params.otHours || 0);
                payRec.setValue('custrecord_hris_pay_proc_remark', params.remarks || '');

                return payRec.save();
            } catch (e) {
                log.error('createPayProcessRecord Error', e.message);
                return null;
            }
        };

        const getEmployeeEarningComp = (p) => {
            let actualGross = 0;
            let grossEarning = 0;
            let componentType = '';
            let ssGrossTotal = 0;
            let itGrossTotal = 0;

            try {
                const compensationSearch = search.create({
                    type: CUSTOM_RECORDS.EMP_COMP_CHANGE,
                    filters: [
                        ['custrecord_hris_empchange_emp_pay_pro_gp', 'is', p.payGroup],
                        'AND',
                        ['custrecord_hris_empchange_employee_nam', 'is', p.empId],
                        'AND',
                        ['isinactive', 'is', 'F']
                    ],
                    columns: [
                        'custrecord_hris_employee_data_change',
                        search.createColumn({
                            name: 'custrecord_hris_cde_payroll_component',
                            join: 'custrecord_hris_employee_data_change'
                        }),
                        search.createColumn({
                            name: 'custrecord_hris_cde_monthly',
                            join: 'custrecord_hris_employee_data_change'
                        })
                    ]
                });

                const results = compensationSearch.run().getRange({ start: 0, end: 1000 });

                results.forEach(result => {
                    try {
                        const currentMonthly = parseFloat(result.getValue({
                            name: 'custrecord_hris_cde_monthly',
                            join: 'custrecord_hris_employee_data_change'
                        }) || 0);

                        const earnComponent = result.getValue({
                            name: 'custrecord_hris_cde_payroll_component',
                            join: 'custrecord_hris_employee_data_change'
                        });

                        if (currentMonthly > 0 && earnComponent) {
                            const compRec = record.load({
                                type: CUSTOM_RECORDS.PAYROLL_COMPONENT,
                                id: earnComponent
                            });

                            componentType = compRec.getValue('custrecord_hris_payroll_component_type');
                            const accountCode = compRec.getValue('custrecord_hris_account_name');

                            let lopAmt = 0;
                            let arrearAmt = 0;
                            let proRataAmt = 0;

                            if (compRec.getValue('custrecord_hris_loss_of_pay') === 'T') {
                                const lop = getLOPDays(p.empId, p.wagePeriodId, currentMonthly, p.monthDays, p.getYear);
                                lopAmt = lop.amount;
                            }

                            if (compRec.getValue('custrecord_hris_arrears') === 'T') {
                                const arr = getArrearDays(p.empId, currentMonthly, p.arrearMonthDays, p.wagePeriodId, p.getYear);
                                arrearAmt = Math.abs(arr.amount);
                            }

                            if (compRec.getValue('custrecord_hris_pro_rate') === 'T') {
                                const present = getEmployeeDateOfJoining(p.empId, p.wagePeriodId, 0, p.getYear, p.payGroup);
                                proRataAmt = (currentMonthly / present.monthDays) * present.presentDays;
                            }

                            if (compRec.getValue('custrecord_hris_ss') === 'T') {
                                ssGrossTotal += currentMonthly;
                            }
                            if (compRec.getValue('custrecord_hris_income_tax') === 'T') {
                                itGrossTotal += currentMonthly;
                            }

                            const finalAmt = currentMonthly - Math.abs(lopAmt) + arrearAmt;
                            actualGross += finalAmt;

                            createPayProcessRecord({
                                entityId: p.entityId,
                                empCode: p.empCode,
                                processType: p.processType,
                                payGroup: p.payGroup,
                                empNameTx: p.empNameTx,
                                dept: p.dept,
                                subDept: p.subDept,
                                company: p.company,
                                wagePeriod: p.wagePeriodId,
                                wEndDate: p.wEndDate,
                                getYear: p.getYear,
                                component: earnComponent,
                                accountCode,
                                componentType,
                                lopAmt,
                                proRataAmt,
                                arrearAmt,
                                actualGross: finalAmt,
                                paidDays: p.paidDays,
                                lopDaysFinal: p.lopDaysFinal,
                                ptLoc: p.ptLoc,
                                otHours: p.otHours,
                                remarks: p.remarks
                            });
                        }
                    } catch (itemError) {
                        log.error('Error Processing Earning Component', itemError.message);
                    }
                });

                return {
                    actualGross,
                    grossEarning,
                    componentType,
                    paidDays: p.paidDays,
                    ssGrossTotal,
                    itGrossTotal
                };
            } catch (e) {
                log.error('getEmployeeEarningComp Error', e.message);
                return { actualGross: 0, grossEarning: 0, componentType: '', paidDays: 0, ssGrossTotal: 0, itGrossTotal: 0 };
            }
        };

        const getEmployeeDeductionComp = (p) => {
            let actualGross = 0;
            let grossDeduction = 0;
            let componentType = '';

            try {
                const dedSearch = search.create({
                    type: CUSTOM_RECORDS.EMP_COMP_CHANGE,
                    filters: [
                        ['custrecord_hris_empchange_emp_pay_pro_gp', 'is', p.payGroup],
                        'AND',
                        ['custrecord_hris_empchange_employee_nam', 'is', p.empId],
                        'AND',
                        ['isinactive', 'is', 'F']
                    ],
                    columns: [
                        'custrecord_hris_employee_datachangeint',
                        search.createColumn({
                            name: 'custrecord_hris_cdb_payroll_component',
                            join: 'custrecord_hris_employee_datachangeint'
                        }),
                        search.createColumn({
                            name: 'custrecord_hris_cdb_monthly',
                            join: 'custrecord_hris_employee_datachangeint'
                        })
                    ]
                });

                const results = dedSearch.run().getRange({ start: 0, end: 1000 });

                results.forEach(result => {
                    try {
                        const currentMonthly = parseFloat(result.getValue({
                            name: 'custrecord_hris_cdb_monthly',
                            join: 'custrecord_hris_employee_datachangeint'
                        }) || 0);

                        const dedComponent = result.getValue({
                            name: 'custrecord_hris_cdb_payroll_component',
                            join: 'custrecord_hris_employee_datachangeint'
                        });

                        if (currentMonthly > 0 && dedComponent) {
                            const compRec = record.load({
                                type: CUSTOM_RECORDS.PAYROLL_COMPONENT,
                                id: dedComponent
                            });

                            componentType = compRec.getValue('custrecord_hris_payroll_component_type');
                            const accountCode = compRec.getValue('custrecord_hris_account_name');

                            actualGross += currentMonthly;
                            grossDeduction += currentMonthly;

                            createPayProcessRecord({
                                entityId: p.entityId,
                                empCode: p.empCode,
                                processType: p.processType,
                                payGroup: p.payGroup,
                                empNameTx: p.empNameTx,
                                dept: p.dept,
                                subDept: p.subDept,
                                company: p.company,
                                wagePeriod: p.wagePeriodId,
                                wEndDate: p.wEndDate,
                                getYear: p.getYear,
                                component: dedComponent,
                                accountCode,
                                componentType,
                                actualGross: currentMonthly,
                                paidDays: p.paidDays,
                                lopDaysFinal: p.lopDaysFinal,
                                ptLoc: p.ptLoc,
                                otHours: p.otHours,
                                remarks: p.remarks
                            });
                        }
                    } catch (itemError) {
                        log.error('Error Processing Deduction Component', itemError.message);
                    }
                });

                return { actualGross, grossDeduction, componentType, paidDays: p.paidDays };
            } catch (e) {
                log.error('getEmployeeDeductionComp Error', e.message);
                return { actualGross: 0, grossDeduction: 0, componentType: '', paidDays: 0 };
            }
        };

        const getEmployeeOtherComp = (p) => {
            try {
                const otherSearch = search.create({
                    type: CUSTOM_RECORDS.EMP_COMP_CHANGE,
                    filters: [
                        ['custrecord_hris_empchange_emp_pay_pro_gp', 'is', p.payGroup],
                        'AND',
                        ['custrecord_hris_empchange_employee_nam', 'is', p.empId],
                        'AND',
                        ['isinactive', 'is', 'F']
                    ],
                    columns: [
                        'custrecord_hris_employee_data_change_int',
                        search.createColumn({
                            name: 'custrecord_hris_payroll_component',
                            join: 'custrecord_hris_employee_data_change_int'
                        }),
                        search.createColumn({
                            name: 'custrecord_hris_monthly',
                            join: 'custrecord_hris_employee_data_change_int'
                        })
                    ]
                });

                const results = otherSearch.run().getRange({ start: 0, end: 1000 });

                results.forEach(result => {
                    try {
                        const currentMonthly = parseFloat(result.getValue({
                            name: 'custrecord_hris_monthly',
                            join: 'custrecord_hris_employee_data_change_int'
                        }) || 0);

                        const otherComponent = result.getValue({
                            name: 'custrecord_hris_payroll_component',
                            join: 'custrecord_hris_employee_data_change_int'
                        });

                        if (currentMonthly > 0 && otherComponent) {
                            const compRec = record.load({
                                type: CUSTOM_RECORDS.PAYROLL_COMPONENT,
                                id: otherComponent
                            });

                            const componentType = compRec.getValue('custrecord_hris_payroll_component_type');
                            const accountCode = compRec.getValue('custrecord_hris_account_name');

                            createPayProcessRecord({
                                entityId: p.entityId,
                                empCode: p.empCode,
                                processType: p.processType,
                                payGroup: p.payGroup,
                                empNameTx: p.empNameTx,
                                dept: p.dept,
                                subDept: p.subDept,
                                company: p.company,
                                wagePeriod: p.wagePeriodId,
                                wEndDate: p.wEndDate,
                                getYear: p.getYear,
                                component: otherComponent,
                                accountCode,
                                componentType,
                                actualGross: currentMonthly,
                                paidDays: p.paidDays,
                                lopDaysFinal: p.lopDaysFinal,
                                ptLoc: p.ptLoc,
                                otHours: p.otHours,
                                remarks: p.remarks
                            });
                        }
                    } catch (itemError) {
                        log.error('Error Processing Other Component', itemError.message);
                    }
                });
            } catch (e) {
                log.error('getEmployeeOtherComp Error', e.message);
            }
        };

        const getMonthlyVariableComp = (p) => {
            try {
                const mvSearch = search.create({
                    type: CUSTOM_RECORDS.MONTHLY_SAL,
                    filters: [
                        ['custrecord_hris_mthsal_paygroup', 'is', p.payGroup],
                        'AND',
                        ['custrecord_hris_mthsal_empname', 'is', p.empId],
                        'AND',
                        ['custrecord_hris_mthsal_month', 'is', p.wagePeriodId],
                        'AND',
                        ['custrecord_hris_mthsal_year', 'is', p.getYear],
                        'AND',
                        ['isinactive', 'is', 'F']
                    ],
                    columns: [
                        'custrecord_hris_mthsal_salaryamount',
                        'custrecord_hris_mthsal_paycomponent'
                    ]
                });

                const results = mvSearch.run().getRange({ start: 0, end: 1000 });

                results.forEach(result => {
                    try {
                        const monthlyAmt = parseFloat(result.getValue('custrecord_hris_mthsal_salaryamount') || 0);
                        const payComponent = result.getValue('custrecord_hris_mthsal_paycomponent');

                        if (monthlyAmt > 0 && payComponent) {
                            const compRec = record.load({
                                type: CUSTOM_RECORDS.PAYROLL_COMPONENT,
                                id: payComponent
                            });

                            const componentType = compRec.getValue('custrecord_hris_payroll_component_type');
                            const accountCode = compRec.getValue('custrecord_hris_account_name');

                            createPayProcessRecord({
                                entityId: p.entityId,
                                empCode: p.empCode,
                                processType: p.processType,
                                payGroup: p.payGroup,
                                empNameTx: p.empEntity,
                                dept: p.dept,
                                subDept: p.subDept,
                                company: p.company,
                                wagePeriod: p.wagePeriodId,
                                wEndDate: p.wEndDate,
                                getYear: p.getYear,
                                component: payComponent,
                                accountCode,
                                componentType,
                                actualGross: monthlyAmt,
                                paidDays: p.paidDays,
                                lopDaysFinal: p.lopDaysFinal,
                                ptLoc: p.ptLoc,
                                otHours: p.otHours,
                                remarks: p.remarks
                            });
                        }
                    } catch (itemError) {
                        log.error('Error Processing Monthly Variable Component', itemError.message);
                    }
                });
            } catch (e) {
                log.error('getMonthlyVariableComp Error', e.message);
            }
        };

        const createLoanComp = (p) => {
            try {
                if (!p.searchLoanIds || p.searchLoanIds.loanRecordIds.length === 0) {
                    log.debug('No Loans Found', 'Skipping loan component creation');
                    return;
                }

                const { loanRecordIds, loanCompIds, loanChildIds } = p.searchLoanIds;

                for (let i = 0; i < loanRecordIds.length; i++) {
                    try {
                        const childRec = record.load({
                            type: CUSTOM_RECORDS.LOAN_CHILD,
                            id: loanChildIds[i]
                        });
                        const loanEntry = childRec.getValue('custrecord_hris_loan_alloc_paidamount');

                        const compRec = record.load({
                            type: CUSTOM_RECORDS.PAYROLL_COMPONENT,
                            id: loanCompIds[i]
                        });
                        const accountCode = compRec.getValue('custrecord_hris_account_name');

                        const payRec = record.create({ type: CUSTOM_RECORDS.PAY_PROCESS });

                        payRec.setValue('custrecord_hris_pay_proc_employee', p.entityId);
                        payRec.setValue('custrecord_hris_pay_proc_employee_code', p.empCode);
                        payRec.setValue('custrecord_hris_pay_proc_process_type', p.processType);
                        payRec.setValue('custrecord_hris_pay_proc_pay_group', p.payGroup);
                        payRec.setValue('custrecord_hris_pay_proc_employee_name', p.empNameTx);
                        payRec.setValue('custrecord_hris_pay_proc_department', p.dept);
                        payRec.setValue('custrecord_hris_pay_proc_subdept', p.subDept);
                        if (p.company) payRec.setValue('custrecord_hris_pay_proc_company_name', p.company);
                        payRec.setValue('custrecord_hris_pay_proc_pay_month', p.wagePeriod);
                        payRec.setValue('custrecord_hris_pay_proc_pay_date', p.wEndDate);
                        payRec.setValue('custrecord_hris_pay_proc_year', p.getYear);
                        payRec.setValue('custrecord_hris_pay_proc_loan_year', p.year);
                        payRec.setValue('custrecord_hris_pay_proc_payroll_compone', loanCompIds[i]);
                        payRec.setValue('custrecord_hris_pay_proc_account_code', accountCode);
                        payRec.setValue('custrecord_hris_pay_proc_component_type', 2);
                        payRec.setValue('custrecord_hris_pay_proc_actual_salary', loanEntry);
                        payRec.setValue('custrecord_hris_pay_proc_gross_deduction', loanEntry);
                        payRec.setValue('custrecord_hris_pay_proc_loan_reference', loanRecordIds[i]);
                        payRec.setValue('custrecord_hris_pay_proc_lop_days_final', p.lopDaysFinal);
                        payRec.setValue('custrecord_hris_pay_proc_paid_days', p.paidDays);
                        payRec.setValue('custrecord_hris_pay_proc_pt_location', p.ptLoc);
                        payRec.setValue('custrecord_hris_pay_proc_actual_gross_de', loanEntry);
                        payRec.setValue('custrecord_hris_pay_proc_value', loanEntry);
                        payRec.setValue('custrecord_hris_pay_proc_othours', p.otHours);
                        payRec.setValue('custrecord_hris_pay_proc_remark', p.remarks);

                        payRec.save();
                    } catch (loanError) {
                        log.error('Error Creating Loan Component ' + i, loanError.message);
                    }
                }
            } catch (e) {
                log.error('createLoanComp Error', e.message);
            }
        };

        const createPFComp = (p) => {
            try {
                const pfCompId = searchPFID();
                if (!pfCompId) {
                    log.error('createPFComp', 'PF Component ID not found');
                    return;
                }

                const compRec = record.load({ type: CUSTOM_RECORDS.PAYROLL_COMPONENT, id: pfCompId });
                const accountCode = compRec.getValue('custrecord_hris_account_name');

                const payRec = record.create({ type: CUSTOM_RECORDS.PAY_PROCESS });

                payRec.setValue('custrecord_hris_pay_proc_employee', p.entityId);
                payRec.setValue('custrecord_hris_pay_proc_employee_code', p.empCode);
                payRec.setValue('custrecord_hris_pay_proc_process_type', p.processType);
                payRec.setValue('custrecord_hris_pay_proc_pay_group', p.payGroup);
                payRec.setValue('custrecord_hris_pay_proc_employee_name', p.empNameTx);
                payRec.setValue('custrecord_hris_pay_proc_department', p.dept);
                payRec.setValue('custrecord_hris_pay_proc_subdept', p.subDept);
                if (p.company) payRec.setValue('custrecord_hris_pay_proc_company_name', p.company);
                payRec.setValue('custrecord_hris_pay_proc_pay_month', p.wagePeriod);
                payRec.setValue('custrecord_hris_pay_proc_year', p.getYear);
                payRec.setValue('custrecord_hris_pay_proc_payroll_compone', pfCompId);
                payRec.setValue('custrecord_hris_pay_proc_account_code', accountCode);
                payRec.setValue('custrecord_hris_pay_proc_component_type', 2);
                payRec.setValue('custrecord_hris_pay_proc_pf_gross', p.pfGrossTotal);
                payRec.setValue('custrecord_hris_pay_proc_actual_salary', p.pfCal);
                payRec.setValue('custrecord_hris_pay_proc_gross_deduction', parseFloat(p.pfCal).toFixed(2));
                payRec.setValue('custrecord_hris_pay_proc_lop_days_final', p.lopDaysFinal);
                payRec.setValue('custrecord_hris_pay_proc_paid_days', p.paidDays);
                payRec.setValue('custrecord_hris_pay_proc_pt_location', p.ptLoc);
                payRec.setValue('custrecord_hris_pay_proc_actual_gross_de', parseFloat(p.pfCal).toFixed(2));
                payRec.setValue('custrecord_hris_pay_proc_value', p.pfCal);
                payRec.setValue('custrecord_hris_pay_proc_othours', p.otHours);
                payRec.setValue('custrecord_hris_pay_proc_remark', p.remarks);

                payRec.save();
            } catch (e) {
                log.error('createPFComp Error', e.message);
            }
        };

        const createESICComp = (p) => {
            try {
                const esicCompId = searchESICId(p.payGroup);
                if (!esicCompId) {
                    log.error('createESICComp', 'ESIC Component ID not found');
                    return;
                }

                const compRec = record.load({ type: CUSTOM_RECORDS.PAYROLL_COMPONENT, id: esicCompId });
                const accountCode = compRec.getValue('custrecord_hris_account_name');

                const payRec = record.create({ type: CUSTOM_RECORDS.PAY_PROCESS });

                payRec.setValue('custrecord_hris_pay_proc_employee', p.entityId);
                payRec.setValue('custrecord_hris_pay_proc_employee_code', p.empCode);
                payRec.setValue('custrecord_hris_pay_proc_process_type', p.processType);
                payRec.setValue('custrecord_hris_pay_proc_pay_group', p.payGroup);
                payRec.setValue('custrecord_hris_pay_proc_employee_name', p.empNameTx);
                payRec.setValue('custrecord_hris_pay_proc_department', p.dept);
                payRec.setValue('custrecord_hris_pay_proc_subdept', p.subDept);
                if (p.company) payRec.setValue('custrecord_hris_pay_proc_company_name', p.company);
                payRec.setValue('custrecord_hris_pay_proc_pay_month', p.wagePeriod);
                payRec.setValue('custrecord_hris_pay_proc_year', p.getYear);
                payRec.setValue('custrecord_hris_pay_proc_payroll_compone', esicCompId);
                payRec.setValue('custrecord_hris_pay_proc_account_code', accountCode);
                payRec.setValue('custrecord_hris_pay_proc_component_type', 2);
                payRec.setValue('custrecord_hris_pay_proc_esic_gross', p.esicGrossTotal);
                payRec.setValue('custrecord_hris_pay_proc_paid_days', p.paidDays);
                payRec.setValue('custrecord_hris_pay_proc_esic_check', p.esicApplicable);
                payRec.setValue('custrecord_hris_pay_proc_lop_days_final', p.lopDaysFinal);
                payRec.setValue('custrecord_hris_pay_proc_pt_location', p.ptLoc);
                payRec.setValue('custrecord_hris_pay_proc_esic_emp_contri', p.esicEmpContri);
                payRec.setValue('custrecord_hris_pay_proc_esic_company_co', p.esicEmployerContri);
                payRec.setValue('custrecord_hris_pay_proc_actual_salary', p.esicEmpContri);
                payRec.setValue('custrecord_hris_pay_proc_gross_deduction', parseFloat(p.esicEmpContri).toFixed(2));
                payRec.setValue('custrecord_hris_pay_proc_actual_gross_de', parseFloat(p.esicEmpContri).toFixed(2));
                payRec.setValue('custrecord_hris_pay_proc_value', p.esicEmpContri);
                payRec.setValue('custrecord_hris_pay_proc_othours', p.otHours);
                payRec.setValue('custrecord_hris_pay_proc_remark', p.remarks);

                payRec.save();
            } catch (e) {
                log.error('createESICComp Error', e.message);
            }
        };

        const getEarningGross = (p) => {
            let totalActGrossEarn = 0;

            try {
                const earnSearch = search.create({
                    type: CUSTOM_RECORDS.PAY_PROCESS,
                    filters: [
                        ['custrecord_hris_pay_proc_employee_name', 'is', p.empNameTx],
                        'AND',
                        ['custrecord_hris_pay_proc_pay_group', 'is', p.payGroup],
                        'AND',
                        ['custrecord_hris_pay_proc_pay_month', 'is', p.wagePeriodId],
                        'AND',
                        ['custrecord_hris_pay_proc_component_type', 'is', searchEarnCompType()],
                        'AND',
                        ['custrecord_hris_pay_proc_year', 'is', p.getYear],
                        'AND',
                        ['custrecord_hris_pay_proc_process_type', 'is', p.processType],
                        'AND',
                        ['isinactive', 'is', 'F']
                    ],
                    columns: ['custrecord_hris_pay_proc_actual_gross_ea']
                });

                const results = earnSearch.run().getRange({ start: 0, end: 1000 });

                results.forEach(result => {
                    totalActGrossEarn += parseFloat(result.getValue('custrecord_hris_pay_proc_actual_gross_ea') || 0);
                });

                // Create summary record
                createPayProcessRecord({
                    entityId: p.entityId,
                    empCode: p.empCode,
                    processType: p.processType,
                    payGroup: p.payGroup,
                    empNameTx: p.empNameTx,
                    dept: p.dept,
                    subDept: p.subDept,
                    company: p.company,
                    wagePeriod: p.wagePeriodId,
                    wEndDate: p.wEndDate,
                    getYear: p.getYear,
                    component: null,
                    accountCode: null,
                    componentType: null,
                    actualGross: totalActGrossEarn,
                    paidDays: p.paidDays,
                    lopDaysFinal: p.lopDaysFinal,
                    ptLoc: p.ptLoc,
                    otHours: p.otHours,
                    remarks: p.remarks
                });

                return totalActGrossEarn;
            } catch (e) {
                log.error('getEarningGross Error', e.message);
                return 0;
            }
        };

        const getDeductionGross = (p) => {
            let totalGrossDedc = 0;

            try {
                const dedSearch = search.create({
                    type: CUSTOM_RECORDS.PAY_PROCESS,
                    filters: [
                        ['custrecord_hris_pay_proc_employee_name', 'is', p.empNameTx],
                        'AND',
                        ['custrecord_hris_pay_proc_pay_group', 'is', p.payGroup],
                        'AND',
                        ['custrecord_hris_pay_proc_pay_month', 'is', p.wagePeriodId],
                        'AND',
                        ['custrecord_hris_pay_proc_component_type', 'is', searchDedcCompType()],
                        'AND',
                        ['custrecord_hris_pay_proc_year', 'is', p.getYear],
                        'AND',
                        ['custrecord_hris_pay_proc_process_type', 'is', p.processType],
                        'AND',
                        ['isinactive', 'is', 'F']
                    ],
                    columns: ['custrecord_hris_pay_proc_gross_deduction']
                });

                const results = dedSearch.run().getRange({ start: 0, end: 1000 });

                results.forEach(result => {
                    totalGrossDedc += parseFloat(result.getValue('custrecord_hris_pay_proc_gross_deduction') || 0);
                });

                createPayProcessRecord({
                    entityId: p.entityId,
                    empCode: p.empCode,
                    processType: p.processType,
                    payGroup: p.payGroup,
                    empNameTx: p.empNameTx,
                    dept: p.dept,
                    subDept: p.subDept,
                    company: p.company,
                    wagePeriod: p.wagePeriodId,
                    wEndDate: p.wEndDate,
                    getYear: p.getYear,
                    component: null,
                    accountCode: null,
                    componentType: null,
                    actualGross: totalGrossDedc,
                    paidDays: p.paidDays,
                    lopDaysFinal: p.lopDaysFinal,
                    ptLoc: p.ptLoc,
                    otHours: p.otHours,
                    remarks: p.remarks
                });

                return totalGrossDedc;
            } catch (e) {
                log.error('getDeductionGross Error', e.message);
                return 0;
            }
        };

        const getNetPay = (p) => {
            let finalNetPay = parseFloat(p.earningTotal) - parseFloat(p.deductionTotal);

            // Rounding
            const decimal = finalNetPay - Math.floor(finalNetPay);
            finalNetPay = decimal >= 0.49 ? Math.ceil(finalNetPay) : Math.floor(finalNetPay);

            try {
                const netPayCompId = searchNetId(p.payGroup);
                if (!netPayCompId) {
                    log.error('getNetPay', 'Net Pay Component ID not found');
                    return;
                }

                const compRec = record.load({ type: CUSTOM_RECORDS.PAYROLL_COMPONENT, id: netPayCompId });
                const accountCode = compRec.getValue('custrecord_hris_account_name');

                const payRec = record.create({ type: CUSTOM_RECORDS.PAY_PROCESS });

                payRec.setValue('custrecord_hris_pay_proc_employee', p.entityId);
                payRec.setValue('custrecord_hris_pay_proc_employee_code', p.empCode);
                payRec.setValue('custrecord_hris_pay_proc_process_type', p.processType);
                payRec.setValue('custrecord_hris_pay_proc_pay_group', p.payGroup);
                payRec.setValue('custrecord_hris_pay_proc_employee_name', p.empNameTx);
                payRec.setValue('custrecord_hris_pay_proc_department', p.dept);
                payRec.setValue('custrecord_hris_pay_proc_subdept', p.subDept);
                if (p.company) payRec.setValue('custrecord_hris_pay_proc_company_name', p.company);
                payRec.setValue('custrecord_hris_pay_proc_pay_month', p.wagePeriodId);
                payRec.setValue('custrecord_hris_pay_proc_pay_date', p.wEndDate);
                payRec.setValue('custrecord_hris_pay_proc_year', p.getYear);
                payRec.setValue('custrecord_hris_pay_proc_payroll_compone', netPayCompId);
                payRec.setValue('custrecord_hris_pay_proc_account_code', accountCode);
                payRec.setValue('custrecord_hris_pay_proc_net_pay', parseFloat(finalNetPay).toFixed(2));
                payRec.setValue('custrecord_hris_pay_proc_actual_salary', parseFloat(finalNetPay).toFixed(2));
                payRec.setValue('custrecord_hris_pay_proc_value', parseFloat(finalNetPay).toFixed(2));
                payRec.setValue('custrecord_hris_pay_proc_paid_days', p.paidDays);
                payRec.setValue('custrecord_hris_pay_proc_lop_days_final', p.lopDaysFinal);
                payRec.setValue('custrecord_hris_pay_proc_pt_location', p.ptLoc);
                payRec.setValue('custrecord_hris_pay_proc_othours', p.otHours);

                payRec.save();
            } catch (e) {
                log.error('getNetPay Error', e.message);
            }
        };

        // ==================== UTILITY FUNCTIONS ====================

        const getWagePeriodNo = (wageName) => {
            const monthMap = {
                'January': '1', 'February': '2', 'March': '3', 'April': '4',
                'May': '5', 'June': '6', 'July': '7', 'August': '8',
                'September': '9', 'October': '10', 'November': '11', 'December': '12'
            };
            return monthMap[wageName] || wageName;
        };

        const getMonthDays = (monthNum) => {
            const m = monthNum.toString();
            if (['1', '3', '5', '7', '8', '10', '12'].includes(m)) return 31;
            if (['4', '6', '9', '11'].includes(m)) return 30;
            if (m === '2') {
                const year = new Date().getFullYear();
                return (year % 4 === 0) ? 29 : 28;
            }
            return 30;
        };

        const getWagePeriodYear = (payGroup, wagePeriodId) => {
            try {
                const wageSearch = search.create({
                    type: CUSTOM_RECORDS.WAGE_PERIOD,
                    filters: [
                        ['custrecord_hris_pay_group', 'is', payGroup],
                        'AND',
                        ['custrecord_hris_month', 'is', wagePeriodId],
                        'AND',
                        ['isinactive', 'is', 'F']
                    ],
                    columns: ['custrecord_hris_year', 'custrecord_hris_end_date']
                });

                const result = wageSearch.run().getRange({ start: 0, end: 1 });
                if (result.length > 0) {
                    return {
                        yearId: result[0].getValue('custrecord_hris_year'),
                        yearText: result[0].getText('custrecord_hris_year'),
                        endDate: result[0].getValue('custrecord_hris_end_date')
                    };
                }
                return { yearId: '', yearText: '', endDate: '' };
            } catch (e) {
                log.error('getWagePeriodYear Error', e.message);
                return { yearId: '', yearText: '', endDate: '' };
            }
        };

        const getPaidDays = (empId, wagePeriodId, monthDays, getYear) => {
            try {
                const attSearch = search.create({
                    type: CUSTOM_RECORDS.MONTHLY_ATTENDANCE,
                    filters: [
                        ['custrecord_hrms_month_empid', 'anyof', empId],
                        'AND',
                        ['custrecord_hrms_month_monthid', 'anyof', wagePeriodId],
                        'AND',
                        ['custrecord_hrms_month_yearid', 'anyof', getYear],
                        'AND',
                        ['isinactive', 'is', 'F']
                    ],
                    columns: ['custrecord_hrms_month_presentdays']
                });

                const result = attSearch.run().getRange({ start: 0, end: 1 });
                return result.length > 0 ? parseFloat(result[0].getValue('custrecord_hrms_month_presentdays') || 0) : 0;
            } catch (e) {
                log.error('getPaidDays Error', e.message);
                return 0;
            }
        };

        const getLOPDaysFinal = (empId, wagePeriodId, getYear) => {
            try {
                const lopSearch = search.create({
                    type: CUSTOM_RECORDS.UNPAID_LEAVE,
                    filters: [
                        ['custrecord_hris_ule_employee_name', 'is', empId],
                        'AND',
                        ['custrecord_hris_ule_month', 'is', wagePeriodId],
                        'AND',
                        ['custrecord_hris_ule_year', 'is', getYear],
                        'AND',
                        ['isinactive', 'is', 'F']
                    ],
                    columns: ['custrecord_hris_ule_noof_days']
                });

                let totalLop = 0;
                lopSearch.run().getRange({ start: 0, end: 1000 }).forEach(r => {
                    totalLop += parseFloat(r.getValue('custrecord_hris_ule_noof_days') || 0);
                });
                return totalLop;
            } catch (e) {
                log.error('getLOPDaysFinal Error', e.message);
                return 0;
            }
        };

        const getLOPDays = (empId, wagePeriod, currentMonthly, monthDays, getYear) => {
            try {
                const lopSearch = search.create({
                    type: CUSTOM_RECORDS.UNPAID_LEAVE,
                    filters: [
                        ['custrecord_hris_ule_employee_name', 'is', empId],
                        'AND',
                        ['custrecord_hris_ule_month', 'is', wagePeriod],
                        'AND',
                        ['custrecord_hris_ule_year', 'is', getYear],
                        'AND',
                        ['isinactive', 'is', 'F']
                    ],
                    columns: ['custrecord_hris_ule_noof_days']
                });

                let totalLopAmt = 0;
                let totalLopDays = 0;

                lopSearch.run().getRange({ start: 0, end: 1000 }).forEach(r => {
                    const days = parseFloat(r.getValue('custrecord_hris_ule_noof_days') || 0);
                    totalLopDays += days;
                    totalLopAmt += (currentMonthly / 30) * days;
                });

                return { amount: totalLopAmt, days: totalLopDays };
            } catch (e) {
                log.error('getLOPDays Error', e.message);
                return { amount: 0, days: 0 };
            }
        };

        const getArrearDays = (empId, currentMonthly, arrearMonthDays, wagePeriod, getYear) => {
            try {
                const arrSearch = search.create({
                    type: CUSTOM_RECORDS.UNPAID_ARREAR,
                    filters: [
                        ['custrecord_hris_uae_employee_name', 'is', empId],
                        'AND',
                        ['custrecord_hris_uae_month', 'is', wagePeriod],
                        'AND',
                        ['custrecord_hris_uae_year', 'is', getYear],
                        'AND',
                        ['isinactive', 'is', 'F']
                    ],
                    columns: ['custrecord_hris_uae_arrear_days']
                });

                let totalArrAmt = 0;
                let totalArrDays = 0;

                arrSearch.run().getRange({ start: 0, end: 1000 }).forEach(r => {
                    const days = parseFloat(r.getValue('custrecord_hris_uae_arrear_days') || 0);
                    totalArrDays += days;
                    totalArrAmt += (currentMonthly / parseInt(arrearMonthDays)) * days;
                });

                return { amount: totalArrAmt, days: totalArrDays };
            } catch (e) {
                log.error('getArrearDays Error', e.message);
                return { amount: 0, days: 0 };
            }
        };

        const getArrearMonthDays = (empId, wagePeriodId, getYear) => {
            try {
                const arrSearch = search.create({
                    type: CUSTOM_RECORDS.UNPAID_ARREAR,
                    filters: [
                        ['custrecord_hris_uae_employee_name', 'is', empId],
                        'AND',
                        ['custrecord_hris_uae_month', 'is', wagePeriodId],
                        'AND',
                        ['custrecord_hris_uae_year', 'is', getYear],
                        'AND',
                        ['isinactive', 'is', 'F']
                    ],
                    columns: ['custrecord_hris_uae_arrear_month']
                });

                const result = arrSearch.run().getRange({ start: 0, end: 1 });
                if (result.length > 0) {
                    return getMonthDays(result[0].getValue('custrecord_hris_uae_arrear_month'));
                }
                return 30;
            } catch (e) {
                log.error('getArrearMonthDays Error', e.message);
                return 30;
            }
        };

        const getOTHours = (empId, payGroup, wagePeriodId, getYear) => {
            try {
                const otSearch = search.create({
                    type: CUSTOM_RECORDS.MONTHLY_SAL,
                    filters: [
                        ['custrecord_hris_mthsal_paygroup', 'is', payGroup],
                        'AND',
                        ['custrecord_hris_mthsal_empname', 'is', empId],
                        'AND',
                        ['custrecord_hris_mthsal_month', 'is', wagePeriodId],
                        'AND',
                        ['custrecord_hris_mthsal_year', 'is', getYear],
                        'AND',
                        ['isinactive', 'is', 'F']
                    ],
                    columns: [
                        search.createColumn({ name: 'custrecord_hris_mthsal_total_hours_days', summary: 'SUM' })
                    ]
                });

                const result = otSearch.run().getRange({ start: 0, end: 1 });
                return result.length > 0 ? parseFloat(result[0].getValue({
                    name: 'custrecord_hris_mthsal_total_hours_days',
                    summary: 'SUM'
                }) || 0) : 0;
            } catch (e) {
                log.error('getOTHours Error', e.message);
                return 0;
            }
        };

        const getEmployeeDateOfJoining = (empId, wagePeriod, lopDay, getYear, payGroup) => {
            try {
                const empSearch = search.create({
                    type: 'employee',
                    filters: [['internalid', 'is', empId]],
                    columns: ['hiredate']
                });

                const empResult = empSearch.run().getRange({ start: 0, end: 1 });
                let presentDays = 0;
                const monthDays = getMonthDays(wagePeriod);

                if (empResult.length > 0) {
                    const hireDateStr = empResult[0].getValue('hiredate');
                    if (hireDateStr) {
                        const hireDate = format.parse({ value: hireDateStr, type: format.Type.DATE });
                        const dojDay = hireDate.getDate();

                        const attSearch = search.create({
                            type: CUSTOM_RECORDS.MONTHLY_ATTENDANCE,
                            filters: [
                                ['custrecord_hrms_month_empid', 'anyof', empId],
                                'AND',
                                ['custrecord_hrms_month_monthid', 'anyof', wagePeriod],
                                'AND',
                                ['custrecord_hrms_month_yearid', 'anyof', getYear]
                            ],
                            columns: ['custrecord_hrms_month_presentdays']
                        });

                        const attResult = attSearch.run().getRange({ start: 0, end: 1 });
                        if (attResult.length > 0) {
                            presentDays = parseFloat(attResult[0].getValue('custrecord_hrms_month_presentdays') || 0);
                        } else {
                            presentDays = parseInt(monthDays) - parseInt(dojDay) - parseFloat(lopDay) + 1;
                        }
                    }
                }

                return { presentDays, monthDays };
            } catch (e) {
                log.error('getEmployeeDateOfJoining Error', e.message);
                return { presentDays: 0, monthDays: 0 };
            }
        };

        const searchSSandITYr = (getYear) => {
            try {
                const ssSearch = search.create({
                    type: CUSTOM_RECORDS.SS_FIN_YEAR,
                    filters: [['custrecord_hris_ssit_start_yr', 'is', getYear]],
                    columns: ['custrecord_hris_ssit_startmonth', 'custrecord_hris_ssit_end_month']
                });

                const result = ssSearch.run().getRange({ start: 0, end: 1 });
                if (result.length > 0) {
                    return {
                        startMonth: result[0].getValue('custrecord_hris_ssit_startmonth'),
                        endMonth: result[0].getValue('custrecord_hris_ssit_end_month')
                    };
                }
                return { startMonth: '1', endMonth: '12' };
            } catch (e) {
                log.error('searchSSandITYr Error', e.message);
                return { startMonth: '1', endMonth: '12' };
            }
        };

        const deleteRecInitial = (empId, payGroup, wagePeriodId, processType, getYear) => {
            try {
                const delSearch = search.create({
                    type: CUSTOM_RECORDS.PAY_PROCESS,
                    filters: [
                        ['custrecord_hris_pay_proc_employee', 'is', empId],
                        'AND',
                        ['custrecord_hris_pay_proc_pay_group', 'is', payGroup],
                        'AND',
                        ['custrecord_hris_pay_proc_pay_month', 'is', wagePeriodId],
                        'AND',
                        ['custrecord_hris_pay_proc_process_type', 'is', processType],
                        'AND',
                        ['custrecord_hris_pay_proc_year', 'is', getYear],
                        'AND',
                        ['isinactive', 'is', 'F']
                    ],
                    columns: ['internalid']
                });

                delSearch.run().getRange({ start: 0, end: 1000 }).forEach(r => {
                    record.delete({ type: CUSTOM_RECORDS.PAY_PROCESS, id: r.id });
                });
            } catch (e) {
                log.error('deleteRecInitial Error', e.message);
            }
        };

        const searchLoanEntry = (empId, wagePeriod, getYear) => {
            const loanRecordIds = [];
            const loanCompIds = [];
            const loanChildIds = [];

            try {
                const loanSearch = search.create({
                    type: CUSTOM_RECORDS.LOAN_APP,
                    filters: [
                        ['custrecord_hris_loan_emp_name', 'is', empId],
                        'AND',
                        ['isinactive', 'is', 'F']
                    ],
                    columns: [
                        'internalid',
                        'custrecord_hris_loan_loan_type',
                        search.createColumn({
                            name: 'custrecord_hris_loan_alloc_startdate',
                            join: 'CUSTRECORD_HRIS_LOAN_ALLOC_LINK'
                        }),
                        search.createColumn({
                            name: 'custrecord_hris_loan_alloc_enddate',
                            join: 'CUSTRECORD_HRIS_LOAN_ALLOC_LINK'
                        }),
                        search.createColumn({
                            name: 'internalid',
                            join: 'CUSTRECORD_HRIS_LOAN_ALLOC_LINK'
                        })
                    ]
                });

                const results = loanSearch.run().getRange({ start: 0, end: 1000 });

                results.forEach(result => {
                    try {
                        const startDate = result.getValue({
                            name: 'custrecord_hris_loan_alloc_startdate',
                            join: 'CUSTRECORD_HRIS_LOAN_ALLOC_LINK'
                        });
                        const endDate = result.getValue({
                            name: 'custrecord_hris_loan_alloc_enddate',
                            join: 'CUSTRECORD_HRIS_LOAN_ALLOC_LINK'
                        });
                        const loanChildId = result.getValue({
                            name: 'internalid',
                            join: 'CUSTRECORD_HRIS_LOAN_ALLOC_LINK'
                        });

                        if (!startDate || !endDate || !loanChildId) return;

                        const startDateObj = format.parse({ value: startDate, type: format.Type.DATE });
                        const endDateObj = format.parse({ value: endDate, type: format.Type.DATE });

                        const sMonth = startDateObj.getMonth();
                        const sYear = startDateObj.getFullYear();
                        const eMonth = endDateObj.getMonth() + 2;
                        const eYear = endDateObj.getFullYear();

                        const loanType = result.getValue('custrecord_hris_loan_loan_type');
                        if (!loanType) return;

                        const loanMasterRec = record.load({
                            type: CUSTOM_RECORDS.LOAN_MASTER,
                            id: loanType
                        });
                        const loanComp = loanMasterRec.getValue('custrecord_hris_loan_component');

                        const yearSearch = search.create({
                            type: CUSTOM_RECORDS.YEAR_MASTER,
                            filters: [['internalid', 'is', getYear]],
                            columns: ['name']
                        });
                        const yearResult = yearSearch.run().getRange({ start: 0, end: 1 });
                        const wagePeriodYear = yearResult.length > 0 ?
                            parseInt(yearResult[0].getValue('name')) : new Date().getFullYear();

                        const wagePeriod1 = getNormalMonth(wagePeriod);
                        const wageDate = new Date(wagePeriodYear, wagePeriod1 - 1, 1);
                        const emiStartDate = new Date(sYear, sMonth, 1);
                        const emiEndDate = new Date(eYear, eMonth, 1);
                        const emiSameMonth = new Date(sYear, sMonth + 2, 1);

                        if ((wageDate > emiStartDate && wageDate < emiEndDate) ||
                            (wageDate > emiStartDate && wageDate < emiSameMonth)) {
                            loanRecordIds.push(result.id);
                            loanCompIds.push(loanComp);
                            loanChildIds.push(loanChildId);
                        }
                    } catch (itemError) {
                        log.error('Error Processing Individual Loan', itemError.message);
                    }
                });
            } catch (e) {
                log.error('searchLoanEntry Error', e.message);
            }

            return { loanRecordIds, loanCompIds, loanChildIds };
        };

        const searchPFID = () => {
            try {
                const pfSearch = search.create({
                    type: CUSTOM_RECORDS.PAYROLL_COMPONENT,
                    filters: [
                        ['custrecord_hris__sequence_no_', 'equalto', '53'],
                        'AND',
                        ['isinactive', 'is', 'F']
                    ],
                    columns: ['internalid']
                });
                const result = pfSearch.run().getRange({ start: 0, end: 1 });
                return result.length > 0 ? result[0].id : null;
            } catch (e) {
                log.error('searchPFID Error', e.message);
                return null;
            }
        };

        const searchESICId = (payGroup) => {
            try {
                const esicSearch = search.create({
                    type: CUSTOM_RECORDS.PAYROLL_COMPONENT,
                    filters: [
                        ['custrecord_hris_pay_process_group', 'is', payGroup],
                        'AND',
                        ['custrecord_hris__sequence_no_', 'equalto', '54'],
                        'AND',
                        ['isinactive', 'is', 'F']
                    ],
                    columns: ['internalid']
                });
                const result = esicSearch.run().getRange({ start: 0, end: 1 });
                return result.length > 0 ? result[0].id : null;
            } catch (e) {
                log.error('searchESICId Error', e.message);
                return null;
            }
        };

        const searchNetId = (payGroup) => {
            try {
                const netSearch = search.create({
                    type: CUSTOM_RECORDS.PAYROLL_COMPONENT,
                    filters: [
                        ['custrecord_hris_pay_process_group', 'is', payGroup],
                        'AND',
                        ['custrecord_hris__sequence_no_', 'equalto', '100'],
                        'AND',
                        ['isinactive', 'is', 'F']
                    ],
                    columns: ['internalid']
                });
                const result = netSearch.run().getRange({ start: 0, end: 1 });
                return result.length > 0 ? result[0].id : null;
            } catch (e) {
                log.error('searchNetId Error', e.message);
                return null;
            }
        };

        const searchEarnCompType = () => {
            try {
                const earnSearch = search.create({
                    type: CUSTOM_RECORDS.COMPONENT_TYPE,
                    filters: [
                        ['custrecord_hris_com_sequence_no', 'equalto', '1'],
                        'AND',
                        ['isinactive', 'is', 'F']
                    ],
                    columns: ['internalid']
                });
                const result = earnSearch.run().getRange({ start: 0, end: 1 });
                return result.length > 0 ? result[0].id : '1';
            } catch (e) {
                return '1';
            }
        };

        const searchDedcCompType = () => {
            try {
                const dedcSearch = search.create({
                    type: CUSTOM_RECORDS.COMPONENT_TYPE,
                    filters: [
                        ['custrecord_hris_com_sequence_no', 'equalto', '2'],
                        'AND',
                        ['isinactive', 'is', 'F']
                    ],
                    columns: ['internalid']
                });
                const result = dedcSearch.run().getRange({ start: 0, end: 1 });
                return result.length > 0 ? result[0].id : '2';
            } catch (e) {
                return '2';
            }
        };

        const getNormalMonth = (monthParameter) => {
            const monthMap = {
                '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
                '7': 7, '8': 8, '9': 9, '10': 10, '11': 11, '12': 12,
                'January': 1, 'February': 2, 'March': 3, 'April': 4,
                'May': 5, 'June': 6, 'July': 7, 'August': 8,
                'September': 9, 'October': 10, 'November': 11, 'December': 12
            };
            return monthMap[monthParameter.toString()] || parseInt(monthParameter) || 1;
        };

        // ==================== EXPORTS ====================
        return {
            processEmployeePay
        };
    });