/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/search', 'N/query', 'N/format', 'N/record', 'N/currentRecord', 'N/url', './moment.js', 'N/runtime'],
    (search, query, format, record, currentRecord, url, moment, runtime) => {

        const beforeSubmit = (context) => {
            if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.DELETE) {
                let flag = 0;

                log.debug('##################:', '******************');

                const rec_id = context.newRecord.id;
                log.debug('rec_id :', ` rec_id${rec_id}`);

                if (_logValidation(rec_id)) {

                    const leave_record = record.load({
                        type: 'customrecord_hris_leaveapplication',
                        id: rec_id
                    });
                    log.debug('leave_record :', `leave_record${leave_record}`);

                    const leave_type = leave_record.getValue('custrecord_hris_lve_leavetype');
                    log.debug('leave_type :', `leave_type${leave_type}`);
                    const seq_no = get_sequence_no(leave_type, query);

                    const hireDate = leave_record.getValue('custrecord_hris_lve_hiredate');
                    const employee = leave_record.getValue('custrecord_hris_lve_employeename');
                    log.debug('employee', `employee =${employee}`);

                    const leave_status = leave_record.getValue('custrecord_hris_lve_hrmsapprovalstatus');
                    log.debug('leave_status :', `leave_status${leave_status}`);

                    const leaveCANCEL_status = leave_record.getValue('custrecord_hris_lve_cancel_leavestatus');
                    log.debug('leaveCANCEL_status :', `leaveCANCEL_status${leaveCANCEL_status}`);

                    const cancelCHECk = leave_record.getValue('custrecord_hris_lve_cancellation');
                    log.debug('cancelCHECk :', `cancelCHECk${cancelCHECk}`);

                    const tot_no_days = leave_record.getValue('custrecord_hris_lve_totalnodays') || 0;
                    log.debug('tot_no_days', `tot_no_days =${tot_no_days}`);

                    const curDate = new Date();
                    let annualcheck = 0;
                    const annualleavetype = 1;
                    let empcatagory;

                    if (seq_no == 2 && employee && hireDate) {
                        log.debug("Inside");
                        const empQuery = `select b.id as empcatagoryid, b.custrecord_hris_empcat_seqno as seqno from employee a join customrecord_hris_employeecategory b on a.custentity_hris_empcategory = b.id where a.id = ${employee} and b.isinactive='F'`;

                        const queryResults = query.runSuiteQL({
                            query: empQuery
                        });
                        const empQueryrecords = queryResults.asMappedResults();

                        if (empQueryrecords.length > 0) {
                            const rec = empQueryrecords[0];
                            empcatagory = rec.seqno;
                        }
                        log.audit("empcatagory", empcatagory);

                        if (empcatagory == 1 || empcatagory == 3) {
                            let compareDate = moment(hireDate).add(670, 'days');
                            compareDate = format.parse({
                                value: compareDate,
                                type: format.Type.DATE
                            });

                            if (compareDate >= curDate) {
                                annualcheck = 1;
                            }

                            const leaveQuery = `select * from customrecord_hris_leaveapplication where custrecord_hris_lve_leavetype = ${annualleavetype} and custrecord_hris_lve_workresume ='T' and isinactive ='F' and custrecord_hris_lve_employeename = ${employee}`;

                            const leaveResults = query.runSuiteQL({
                                query: leaveQuery
                            });
                            log.debug("Labour Leavequery", leaveQuery);
                            const leaveQueryrecords = leaveResults.asMappedResults();

                            if (leaveQueryrecords.length > 0) {
                                const rec = leaveQueryrecords[0];
                                let rejoindate = rec.custrecord_hris_lve_actualresumedate;
                                rejoindate = format.parse({
                                    value: rejoindate,
                                    type: format.Type.DATE
                                });
                                let compareRejoinDate = moment(rejoindate).add(670, 'days');
                                compareRejoinDate = format.parse({
                                    value: compareRejoinDate,
                                    type: format.Type.DATE
                                });

                                if (compareRejoinDate >= curDate) {
                                    log.debug("Not completion of 22 months of rejoining date of the previous annual leave.");
                                    annualcheck = 1;
                                }
                            }
                        } else if (empcatagory == 2) {
                            log.debug('Inside Office staff');
                            let compareDate = moment(hireDate).add(365, 'days');
                            compareDate = format.parse({
                                value: compareDate,
                                type: format.Type.DATE
                            });

                            log.debug("Staff Comparedate 1", compareDate);
                            if (compareDate >= curDate) {
                                log.debug('Not completion of 12 months of service');
                                annualcheck = 1;
                            }

                            const leaveQuery = `select * from customrecord_hris_leaveapplication where custrecord_hris_lve_leavetype = ${annualleavetype} and custrecord_hris_lve_workresume ='T' and isinactive ='F' and custrecord_hris_lve_employeename = ${employee}`;
                            log.debug("Staff Leavequery", leaveQuery);
                            const leaveResults = query.runSuiteQL({
                                query: leaveQuery
                            });

                            const leaveQueryrecords = leaveResults.asMappedResults();

                            if (leaveQueryrecords.length > 0) {
                                const rec = leaveQueryrecords[0];
                                let rejoindate = rec.custrecord_hris_lve_actualresumedate;
                                rejoindate = format.parse({
                                    value: rejoindate,
                                    type: format.Type.DATE
                                });
                                let compareRejoinDate = moment(rejoindate).add(365, 'days');
                                compareRejoinDate = format.parse({
                                    value: compareRejoinDate,
                                    type: format.Type.DATE
                                });

                                if (compareRejoinDate >= curDate) {
                                    log.debug('Not completion of 22 months of service');
                                    annualcheck = 1;
                                }
                            }
                        }

                        let total_applied = 0;
                        let leavebalancetaken = 0;
                        log.audit('annualcheck', annualcheck);

                        if (leave_status == 2 && annualcheck == 1) {
                            const annualleavetypeVal = 2;
                            if (cancelCHECk == false) {
                                const leavebalQuery = `select * from customrecord_hris_leavebalance where custrecord_hris_lvbal_leave_type = ${annualleavetypeVal} and isinactive ='F' and custrecord_hris_lvbal_employee_name = ${employee}`;

                                const queryResults = query.runSuiteQL({
                                    query: leavebalQuery
                                });
                                const leavebalQueryrecords = queryResults.asMappedResults();

                                if (leavebalQueryrecords.length > 0) {
                                    const rec = leavebalQueryrecords[0];
                                    const leavebalid = rec.id;
                                    total_applied = rec.custrecord_hris_lvbal_total_applied_days || 0;
                                    leavebalancetaken = rec.custrecord_hris_lvbal_leave_balance_take || 0;

                                    log.debug('total_applied', `total_applied =${total_applied}`);

                                    const final_days = parseFloat(total_applied) + parseFloat(tot_no_days);
                                    const final_leavetaken = parseFloat(leavebalancetaken) + parseFloat(tot_no_days);
                                    log.debug('final_days', `final_days =${final_days}`);

                                    const updatedleavebalid = record.submitFields({
                                        type: 'customrecord_hris_leavebalance',
                                        id: leavebalid,
                                        values: {
                                            'custrecord_hris_lvbal_total_applied_days': final_days,
                                            'custrecord_hris_lvbal_leave_balance_take': final_leavetaken
                                        },
                                        options: {
                                            enableSourcing: false,
                                            ignoreMandatoryFields: true
                                        }
                                    });
                                    log.debug(" updatedleavebalid", updatedleavebalid);
                                }
                            } else if (cancelCHECk == true && leaveCANCEL_status == 2) {
                                const leavebalQuery = `select * from customrecord_hris_leavebalance where custrecord_hris_lvbal_leave_type = ${annualleavetypeVal} and isinactive ='F' and custrecord_hris_lvbal_employee_name = ${employee}`;

                                const queryResults = query.runSuiteQL({
                                    query: leavebalQuery
                                });
                                const leavebalQueryrecords = queryResults.asMappedResults();

                                if (leavebalQueryrecords.length > 0) {
                                    const rec = leavebalQueryrecords[0];
                                    total_applied = rec.custrecord_hris_lvbal_total_applied_days || 0;
                                    leavebalancetaken = rec.custrecord_hris_lvbal_leave_balance_take || 0;
                                    const leavebalid = rec.id;

                                    log.debug('total_applied', `total_applied =${total_applied}`);

                                    const final_days = parseFloat(total_applied) - parseFloat(tot_no_days);
                                    log.debug('final_days', `final_days =${final_days}`);
                                    const final_leavetaken = parseFloat(leavebalancetaken) - parseFloat(tot_no_days);

                                    const updatedleavebalid = record.submitFields({
                                        type: 'customrecord_hris_leavebalance',
                                        id: leavebalid,
                                        values: {
                                            'custrecord_hris_lvbal_total_applied_days': final_days,
                                            'custrecord_hris_lvbal_leave_balance_take': final_leavetaken
                                        },
                                        options: {
                                            enableSourcing: false,
                                            ignoreMandatoryFields: true
                                        }
                                    });
                                    log.debug(" updatedleavebalid", updatedleavebalid);
                                }
                            }
                        }

                        if (leave_status == 3 && annualcheck == 1) {
                            const annualleavetypeVal = 2;
                            const leavebalQuery = `select * from customrecord_hris_leavebalance where custrecord_hris_lvbal_leave_type = ${annualleavetypeVal} and isinactive ='F' and custrecord_hris_lvbal_employee_name = ${employee}`;

                            const queryResults = query.runSuiteQL({
                                query: leavebalQuery
                            });
                            const leavebalQueryrecords = queryResults.asMappedResults();

                            if (leavebalQueryrecords.length > 0) {
                                const rec = leavebalQueryrecords[0];
                                total_applied = rec.custrecord_hris_lvbal_total_applied_days || 0;
                                leavebalancetaken = rec.custrecord_hris_lvbal_leave_balance_take || 0;
                                const leavebalid = rec.id;

                                log.debug('total_applied', `total_applied =${total_applied}`);

                                const final_days = parseFloat(total_applied) - parseFloat(tot_no_days);
                                log.debug('final_days', `final_days =${final_days}`);
                                const final_leavetaken = parseFloat(leavebalancetaken) - parseFloat(tot_no_days);

                                const updatedleavebalid = record.submitFields({
                                    type: 'customrecord_hris_leavebalance',
                                    id: leavebalid,
                                    values: {
                                        'custrecord_hris_lvbal_total_applied_days': final_days,
                                        'custrecord_hris_lvbal_leave_balance_take': final_leavetaken
                                    },
                                    options: {
                                        enableSourcing: false,
                                        ignoreMandatoryFields: true
                                    }
                                });
                                log.debug(" updatedleavebalid", updatedleavebalid);
                            }
                        }
                    }
                }
            }
        };

        const _logValidation = (value) => (value !== null && value !== undefined && value !== '');

        const get_sequence_no = (leave_type, queryModule) => {
            const leavesequencesql = `select * from customrecord_hris_leaveconfig where id ='${leave_type}' and isinactive ='F'`;
            log.debug("leavesequencesql", leavesequencesql);
            const queryResult = queryModule.runSuiteQL({
                query: leavesequencesql
            });
            const leavesequencesqlrecords = queryResult.asMappedResults();
            log.debug(" leavesequencesqlrecords.length", leavesequencesqlrecords.length);
            let sequence_no;
            if (leavesequencesqlrecords.length > 0) {
                sequence_no = leavesequencesqlrecords[0].custrecord_hris_lvecnfg_seqno;
            }
            return sequence_no;
        };

        return {
            beforeSubmit
        };
    });
