/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define([
    'N/record',
    'N/search',
    'N/log',
    'N/runtime',
    'N/format',
    'N/query'
], function (record, search, log, runtime, format, query) {

    function beforeSubmit(context) {
        if (context.type !== context.UserEventType.CREATE) return;


        var newRecord = context.newRecord;



        var s_auto_prfix = '';
        var recordType = newRecord.type;

        switch (recordType) {
            case 'customrecord_hris_lve_letter_req':
                s_auto_prfix = 'LTR';
                break;
            case 'customrecord_hris_empchange_loan_applicn':
                s_auto_prfix = 'LON';
                break;
            case 'customrecord_hris_lve_raise_comp_off':
                s_auto_prfix = 'RC';
                break;
            case 'customrecord_hris_empallocationtransfer':
                s_auto_prfix = 'EA';
                break;
            default:
                s_auto_prfix = 'LV';
        }

        var i_rec_type_id = newRecord.getValue({ fieldId: 'rectype' });
        log.debug('Record Type ID', i_rec_type_id);

        var uniqueRefSearch = search.create({
            type: 'customrecord_hris_unique_reference_numbe',
            filters: [
                ['custrecord_hris_record_type', 'anyof', i_rec_type_id],
                'AND',
                ['isinactive', 'is', 'F']
            ],
            columns: [
                'custrecord_hris_record_type',
                'custrecord_hris_unique_number'
            ]
        }).run().getRange({ start: 0, end: 1 });

        if (uniqueRefSearch && uniqueRefSearch.length > 0) {
            var result = uniqueRefSearch[0];
            var i_id_unique_ref = result.id;
            var i_unique_num = parseInt(result.getValue('custrecord_hris_unique_number')) + 1;

            var paddedNum = ('000000' + i_unique_num).slice(-6);
            var s_auto_number = s_auto_prfix + paddedNum;

            // Set name/auto number
            newRecord.setValue({
                fieldId: 'name',
                value: s_auto_number
            });

            // Get employee field ID based on record type
            var i_employee;
            switch (recordType) {
                case 'customrecord_hris_lve_letter_req':
                    i_employee = newRecord.getValue('custrecord_hris_letreq_employee_name');
                    break;
                case 'customrecord_hris_empchange_loan_applicn':
                    i_employee = newRecord.getValue('custrecord_hris_loan_emp_code');
                    break;
                case 'customrecord_hris_empallocationtransfer':
                    i_employee = newRecord.getValue('custrecord_hris_alloc_empid');
                    break;
                case 'customrecord_hris_lve_raise_comp_off':
                    i_employee = newRecord.getValue('custrecord_hris_rcomp_employee_name');
                    break;
                default:
                    i_employee = newRecord.getValue('custrecord_hris_lve_employeename');
            }

            var s_name = '';
            if (i_employee) {
                s_name = search.lookupFields({
                    type: 'employee',
                    id: i_employee,
                    columns: ['firstname']
                }).firstname || '';
            }

            // Clean up name prefix
            var s_emp_char = '';
            if (s_name) {
                var nameParts = s_name.split(' ');
                if (!isNaN(nameParts[0])) {
                    nameParts.shift();
                }
                s_name = nameParts.join(' ').toUpperCase();
                s_emp_char = s_name.substring(0, 2);
            }

            // Update the unique number record
            record.submitFields({
                type: 'customrecord_hris_unique_reference_numbe',
                id: i_id_unique_ref,
                values: {
                    custrecord_hris_unique_number: i_unique_num
                }
            });
        }


    }
    function afterSubmit(context) {
        if (context.type == context.UserEventType.DELETE) return;


        var newRecordObj = context.newRecord;
        var compoffid = context.newRecord.id;



        var empname = newRecordObj.getValue('custrecord_hris_rcomp_employee_name');
        log.debug("empname", empname);
        var leavetype = newRecordObj.getValue('custrecord_hris_rcomp_leave_type') || '';
        log.debug("leavetype", leavetype);
        var compoffdays = newRecordObj.getValue('custrecord_hris_rcomp_total_comp_offdays') || 1;
        log.debug('compoffdays', compoffdays);
        var approvalstatus = newRecordObj.getValue('custrecord_hris_rcomp_appstatus');
        log.debug('approvalstatus', approvalstatus);
        var leavebalcheck = newRecordObj.getValue('custrecord_hris_rcomp_leavebal_updated');
        log.debug('leavebalcheck', leavebalcheck);
        var compoffstartdate = newRecordObj.getValue('custrecord_hris_rcomp_comp_off_from_date');
        log.debug('compoffstartdate', compoffstartdate);

        if (approvalstatus == 2 && leavebalcheck == false) {

            var leavebalancesql = "Select * from customrecord_hris_leavebalance  where custrecord_hris_lvbal_employee_name= " + empname + " \
           and custrecord_hris_lvbal_leave_type = " + leavetype + "    and isinactive ='F'";
            log.debug(' leavebalancesql', leavebalancesql);
            // log.debug(empLeaveTakenSQL);
            var leavebalancesqlrecords = getResult(leavebalancesql);
            // log.debug('records in getEmpTotalLeaveTaken', JSON.stringify(records));
            if (leavebalancesqlrecords.length > 0) {

                var finalleave = 0;
                var totalleavecredited = 0;
                var leavebalid = leavebalancesqlrecords[0].id;
                var leavebalancecredited = leavebalancesqlrecords[0].custrecord_hris_lvbal_leave_balance_cred || 0;
                log.debug('leavebalancecredited', leavebalancecredited);
                var leavetaken = leavebalancesqlrecords[0].custrecord_hris_lvbal_leave_balance_take || 0;
                log.debug('leavetaken', leavetaken);
                var availableleavebal = leavebalancesqlrecords[0].custrecord_hris_lvbal_available_leave_ba || 0;
                finalleave = parseFloat(leavebalancecredited) + parseFloat(compoffdays) - parseFloat(leavetaken);
                totalleavecredited = parseFloat(compoffdays) + parseFloat(leavebalancecredited)
                log.debug(" totalleavecredited", totalleavecredited);
                log.debug('finalleave', finalleave)
                var updatedleavebalid = record.submitFields({
                    type: 'customrecord_hris_leavebalance',
                    id: leavebalid,
                    values: {
                        'custrecord_hris_lvbal_leave_balance_cred': totalleavecredited,
                        'custrecord_hris_lvbal_annual_leave_bal': totalleavecredited,
                        'custrecord_hris_lvbal_available_leave_ba': finalleave
                    }
                });
                log.debug('Updatedleavebalid', updatedleavebalid);
                var compoffRecord = record.load({
                    type: 'customrecord_hris_lve_raise_comp_off',
                    id: compoffid,
                    isDynamic: true,
                });
                compoffRecord.setValue({
                    fieldId: 'custrecord_hris_rcomp_leavebal_updated',
                    value: true,
                    ignoreFieldChange: true
                });
                var compoffRecordId = compoffRecord.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug('compoffRecordid', compoffRecordId);


            }


        }
// Develop and comment on same day 23/09/2025 as per mam told
      /*   if (approvalstatus == 2) {

            var formatcompoffstartdate = format.format({
                value: new Date(compoffstartdate),
                type: format.Type.DATE
            });
            log.audit('formatcompoffstartdate',formatcompoffstartdate)
            var dailychildsql = "select a.id as childid,b.custrecord_hris_working_shift_hours as shiftworkinghours, a.custrecord_njt_emp_daily_working_hours as dailyworkinghours \
                        from customrecord_njt_emp_daily_atten_ch  a join customrecord_hris_shift_master b on a.custrecord_hris_shiftmaser=b.id \
                       where a.custrecord_njt_emp_daily_date ='" + formatcompoffstartdate + "' and  a.custrecord_njt_daily_atten_emp="+ empname +"";
            log.debug(' dailychildsql', dailychildsql);
            // log.debug(empLeaveTakenSQL);
            var dailychildsqlrecords = getResult(dailychildsql);
            // log.debug('records in getEmpTotalLeaveTaken', JSON.stringify(records));
            if (dailychildsqlrecords.length > 0) {
                var shiftworkinghours = dailychildsqlrecords[0].shiftworkinghours;
                var dailyworkinghours = dailychildsqlrecords[0].dailyworkinghours || '';
                var childid = dailychildsqlrecords[0].childid;
                if (dailyworkinghours == ''||dailyworkinghours==0) {

                    var updatedChildid = record.submitFields({
                        type: 'customrecord_njt_emp_daily_atten_ch',
                        id: childid,
                        values: {
                            'custrecord_njt_emp_daily_working_hours': shiftworkinghours,

                        }
                    });
                    log.audit('updatedChildid',updatedChildid);
                }



            }

        } */


    }

    function getResult(pSQL) {
        // log.debug("QUERY", pSQL);
        var queryResults = query.runSuiteQL({
            query: pSQL
        });
        var records = queryResults.asMappedResults();
        return records;
    }
    function search_wageperiod(pay_group, month, year) {
        // debugger;

        var leavebalancesql = "Select * from customrecord_hris_leavebalance  where custrecord_hris_lvbal_employee_name= " + empname + " \
           and custrecord_hris_lvbal_leave_type = " + leavetype + "    and isinactive ='F'";
        log.debug(' leavebalancesql', leavebalancesql);
        // log.debug(empLeaveTakenSQL);
        var leavebalancesqlrecords = getResult(leavebalancesql);
        // log.debug('records in getEmpTotalLeaveTaken', JSON.stringify(records));
        if (leavebalancesqlrecords.length > 0) {


            var wage_cycledays = leavebalancesqlrecords[0].custrecord_hris_wage_cycle_day_s;

        }
        //  return WagePeriod_EndDate + "#" + start_date + "#" + wage_month + "#" + wage_year + "#" + wage_cycledays;
        return wage_cycledays;
    }
    return {
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };

});
