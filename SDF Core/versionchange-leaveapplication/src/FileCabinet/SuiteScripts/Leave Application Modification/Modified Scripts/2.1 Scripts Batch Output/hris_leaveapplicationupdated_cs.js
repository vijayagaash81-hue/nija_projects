/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/record', 'N/search', 'N/runtime'], (record, search, runtime) => {

    const frmhalfDay;
    const toHalfDay;
    const datediff = 0;
    
    function pageInit_leaveApplication(type) {
        if (type == 'create') {
            debugger;
            scriptContext.currentRecord.getField({ fieldId: 'custrecord_hris_lve_noofencashmentdays' }).isDisabled = true;
            scriptContext.currentRecord.getField({ fieldId: 'customrecord_hris_leaveapplication' }).isDisabled = true;
            scriptContext.currentRecord.getField({ fieldId: 'custrecord_hris_lve_cancelreason' }).isDisabled = true;
            scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: datediff, ignoreFieldChange: false });
        }
    
    }
    const TYPE;
    function onSave_Leave_Application() {
        const encashmentCheck = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_applylveencashment' })
        const FromDate = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_fromdate' })
        const ToDate = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_todate' });
        const noOfEncashDays = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_noofencashmentdays' });
    
        if (encashmentCheck == 'T' && (noOfEncashDays == '' || noOfEncashDays == 'undefined' || noOfEncashDays == null)) {
            alert('Please Enter No. of Encashment Days')
            return false;
        }
    
    
        if (encashmentCheck == 'F') {
            if (FromDate == '' || FromDate == 'undeefined' || FromDate == null) {
                alert('Please Enter From Date')
                return false;
            }
        }
        if (encashmentCheck == 'F') {
            if (ToDate == '' || ToDate == 'undeefined' || ToDate == null) {
                alert('Please Enter To Date');
                return false;
            }
        }
      const leave_type = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavetype' });
      const seq_no_search = get_sequence_no(leave_type)
     /*   const E_leavetype = scriptContext.currentRecord.getValue({ fieldId: "custrecord_hris_lve_leavetype" });
        const leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid');  */
        const emp_name = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_employeename' })
        log.debug({ title: 'Seq No', details: seq_no_search });
        const seq_no_split = seq_no_search.split('#')
        const seq_no = seq_no_split[0];
    
        if(seq_no !=3){
        const leavebalanceRec = searchLeaveBalance(leave_type, emp_name)
        const LEAVEBAL = leavebalanceRec.split('#');
        const leavebalance = LEAVEBAL[0];
        log.debug({ title: 'leavebalance', details: leavebalance })
        scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_leavebalance', value: leavebalance, ignoreFieldChange: false })
        const roundoffleavebalance = GetRoundOffvalue(leavebalance);
        scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_leavebalance_wholeno', value: roundoffleavebalance, ignoreFieldChange: false })
        }
    
    
        const reason = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavereason' })
        const encashment = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_applylveencashment' })
        if (encashment == 'F') {
            if (reason == '' || reason == 'undefined' || reason == null) {
    
            }
    
        }
    
    // Getting External Id
    
       const leave_type = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavetype' })
        
    /* const E_leavetype = scriptContext.currentRecord.getValue({ fieldId: "custrecord_hris_lve_leavetype" });
    const leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid');   */
    
    
        const seq_no_search = get_sequence_no(leave_type)
        const seq_no_split = seq_no_search.split('#')
        const seq_no = seq_no_split[0];
    
        if (seq_no == 5) {
    
            const tot_days = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_totalnodays' })
            const validTillDate = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_validtilldate' })
    
            if (tot_days == 0.5) {
    
                const f_hday = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_fromhalfday' });
                const t_hday = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_tohalfday' });
    
    
                if (f_hday == 'F' && t_hday == 'F') {
                    alert('check anyof halfday ')
                    return false;
                }
            }
            if (validTillDate == null || validTillDate == '' || validTillDate == 'undefined') {
    
                alert('Please select the compoff first.')
                return false;
            }
    
    
    
        }
        const leave_array = new Array();
        const filters = new Array();
        const column = new Array();
        const total_days = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_totalnodays' });
        //Get External id
        const leave_type = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavetype' });
       /*  const E_leavetype = scriptContext.currentRecord.getValue({ fieldId: "custrecord_hris_lve_leavetype" });
        const leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid');   */
    
        filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
      // filters.push(new nlobjSearchFilter('externalid', null, 'is', leave_type))
        column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_suportdocallow'));
        column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_mindaysupport'));
        const leaveconf_results = search.create({ type: 'customrecord_hris_leaveconfig', filters: filters, columns: column }).run();
        if (leaveconf_results != null) {
            const support_doc_allowed = leaveconf_results[0].getValue('custrecord_hris_lveconfig_suportdocallow')
            if (support_doc_allowed == 'T') {
                const support_doc_days = leaveconf_results[0].getValue('custrecord_hris_lveconfig_mindaysupport')
                if (total_days > support_doc_days) {
                    const support_doc = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_supportdocument' });
                    if (support_doc == '' || support_doc == 'undefined' || support_doc == null) {
                        alert('Please attach support document');
                        return false;
                    }
                }
            }
        }
    
    
    
        return true;
    
    }
    
    function fieldchange_Leave_apply(type, name, linenum) {
        debugger;
        const leave_type = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavetype' });
    
        
    
    
    
    
        if (name == 'custrecord_hris_lve_todate') {
    
            const fromDate = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_fromdate' })
            const toDate = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_todate' });
            fromDate = nlapiStringToDate(fromDate);
            toDate = nlapiStringToDate(toDate);
            if (toDate < fromDate) {
                alert('To Date should be greater than From Date ')
                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '', ignoreFieldChange: false });
                return false;
            }
    
            if (!fromDate) {
                alert("Please select From Date First and then you can select To Date ");
                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '', ignoreFieldChange: false });
                return false;
            }
    
        }
    
        if (name == 'custrecord_hris_lve_fromdate') {
    
            const fromDate = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_fromdate' })
            const toDate = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_todate' });
            fromDate = nlapiStringToDate(fromDate);
            if(toDate){
            toDate = nlapiStringToDate(toDate);
            
            if (fromDate > toDate) {
                alert('From Date should be lesser than To Date ')
                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_fromdate', value: '', ignoreFieldChange: false });
                return false;
            }
        }
          
    
        }
    
        
    
    
    
    
        const getUserId = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_employeename' });
    
        if (name == 'custrecord_hris_lve_leavetype') {
           const leave_type = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavetype' });
          /*  const E_leavetype = scriptContext.currentRecord.getValue({ fieldId: "custrecord_hris_lve_leavetype" });
            const leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid');  */
            const employee_name = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_employeename' });
    
    
    
            if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
                const seq_no_search = get_sequence_no(leave_type)
                const seq_no_split = seq_no_search.split('#')
                const seq_no = seq_no_split[0];
    
    
                if (seq_no == 5) {
                    scriptContext.currentRecord.getField({ fieldId: 'custrecord_hris_lve_todate' }).isDisabled = true
    
                } else if(seq_no !=3)  {
                    const leavebalanceRec = searchLeaveBalance(leave_type, employee_name);
                    const LEAVEBAL = leavebalanceRec.split('#');
                    const leavebalance = LEAVEBAL[0];
                    const LeaveEncashbal = LEAVEBAL[1];
                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_leavebalance', value: leavebalance, ignoreFieldChange: false })
                    if (leavebalance > 1){
                        const roundoffleavebalance = GetRoundOffvalue(leavebalance);
                    }
                    else{
                        const roundoffleavebalance = leavebalance
                    }
                   
                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_leavebalance_wholeno', value: roundoffleavebalance, ignoreFieldChange: false })
                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_validtilldate', value: '', ignoreFieldChange: false })
                    if (LeaveEncashbal != null && LeaveEncashbal != '') {
                        scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_encashmentlevbalance', value: LeaveEncashbal, ignoreFieldChange: false })
    
                    }
                }
            }
    
            if (leave_type == '')
            {
                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_leavebalance', value: '', ignoreFieldChange: false });
                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_leavebalance_wholeno', value: '', ignoreFieldChange: false }); 
    
                const url = nlapiResolveURL('RECORD', 'customrecord_hris_leaveapplication', null, null)
                window.onbeforeunload = null;
                window.open(url, '_self')
    
            }
    
        }
        if (name == 'custrecord_hris_lve_fromdate' || name == 'custrecord_hris_lve_todate') {
    
            const FrmDt;
            const ToDt;
           const leave_type = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavetype' });
          /* const E_leavetype = scriptContext.currentRecord.getValue({ fieldId: "custrecord_hris_lve_leavetype" });
        const leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid');  */
    
            if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
                const fromDate = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_fromdate' })
                frmhalfDay = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_fromhalfday' });
                const toDate = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_todate' });
                toHalfDay = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_tohalfday' });
    
                const Leave_bal = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavebalance' });
                if (fromDate != '' && fromDate != 'undefined' && fromDate != null && toDate != '' && toDate != 'undefined' && toDate != null) {
                    if (fromDate == toDate ) {
    
                      const leave_type = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavetype' })
                    /*   const E_leavetype = scriptContext.currentRecord.getValue({ fieldId: "custrecord_hris_lve_leavetype" });
                       const leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid'); */ 
                        const seq_no_search = get_sequence_no(leave_type)
                        const seq_no_split = seq_no_search.split('#')
                        const seq_no = seq_no_split[0];
    
                        if (seq_no == 2 || seq_no == 8 || seq_no ==13) {
    
                            if (Leave_bal == 0) {
    
    
                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: 1, ignoreFieldChange: false })
                            }
    
    
                        }
    
                        if (seq_no != 2 && seq_no != 8 && seq_no !=13) {
                            if (Leave_bal < 1) {
                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: Leave_bal, ignoreFieldChange: false })
                            }
                            if (Leave_bal >= 1) {
                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: 1, ignoreFieldChange: false })
                            }
    
    
                        }
    
    
    
                    }
    
                   
                    if (fromDate != toDate) {
    
                        fromDate = nlapiStringToDate(fromDate);
    
                        const FrmMonth = fromDate.getMonth() + 1;
    
                        FrmDt = fromDate.getDate();
    
    
    
                        toDate = nlapiStringToDate(toDate);
    
                        const TOMonth = toDate.getMonth() + 1;
    
                        ToDt = toDate.getDate();
    
    
    
                        const weeklyoffIncCheck = weeklyOffInclude(leave_type);
                        const holiday_TF_check = holidayInclude(leave_type)
                        log.debug({ title: "holiday_TF_check", details: holiday_TF_check });
                        log.debug({ title: "weeklyoffIncCheck", details: weeklyoffIncCheck });
                        const empWeeklyoff = searchEmpsWeeklyOff(getUserId);
                        log.debug({ title: "empWeeklyoff", details: empWeeklyoff });
                        const WEEKLYOFF = empWeeklyoff.split('#')
                        const WeeklyOfCount = WEEKLYOFF[0]
    
                        const WeeklyOffInW = WEEKLYOFF[1];
    
                        if (WeeklyOfCount == 2 || WeeklyOfCount == 1)
                        {
    
                            const finalWeeklyOff = WeeklyOffInW.split(',');
                            const firstWeeklyOffD = finalWeeklyOff[0];
                            // By Florence
                           /*  if (firstWeeklyOffD) {
                                firstWeeklyOffD = nlapiLookupField('customlist_hris_week_days', firstWeeklyOffD, 'custrecord_hris_lve_wkday_act_seq_no');
                            } */
                            const secWeeklyOffD = finalWeeklyOff[1];
                           /*  if (secWeeklyOffD) {
                                secWeeklyOffD = nlapiLookupField('customlist_hris_week_days', secWeeklyOffD, 'custrecord_hris_lve_wkday_act_seq_no');
                            } */
    
                            if (FrmMonth == TOMonth) 
    						{
                                if (weeklyoffIncCheck == 'T') 
    							{
    
    
                                    const frm_halfday = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_fromhalfday' });
                                    const to_halfday = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_tohalfday' });
    
                                   
                                   
                                   // if (frm_halfday == 'F' && to_halfday == 'F') {
    
    
                                        if (holiday_TF_check == 'T') {
                                            const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
    
                                            const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
                                            diffDays = diffDays + 1;
    
                                            scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: diffDays, ignoreFieldChange: false })
    
    
    
                                        }
                                        if (holiday_TF_check == 'F') {
                                            const holiday_count = searchEmpholidays(getUserId, fromDate, toDate, FrmDt, ToDt)
                                            if (holiday_count == 0) {
                                                datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
                                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: datediff, ignoreFieldChange: false })
                                            } else {
                                                datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(holiday_count) + 1;
                                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: datediff, ignoreFieldChange: false })
                                            }
                                        }
                                 //  } 
    
                                } 
                                else
                                {
                                    const frm_halfday = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_fromhalfday' });
                                    log.debug({ title: "frm_halfday", details: frm_halfday });
                                    const to_halfday = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_tohalfday' });
                                    log.debug({ title: "frm_halfday", details: to_halfday });
                                  
                                 //   if (frm_halfday == 'F' && to_halfday == 'F') {
                                        log.debug({ title: "holiday_TF_check", details: holiday_TF_check });
                                        if (holiday_TF_check == 'T') {
    
                                            const frm_date_val = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_fromdate' })
                                            const to_date_val = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_todate' })
                                            const frm_date_val_obj = nlapiStringToDate(frm_date_val)
                                            const date_split = frm_date_val_obj.toString().split(' ');
                                            const day = date_split[0];
                                            const frm_week_day = WeeklyOff(day)
                                            const to_date_val_obj = nlapiStringToDate(to_date_val)
                                            const date_split1 = to_date_val_obj.toString().split(' ');
                                            const day1 = date_split1[0];
                                            const to_week_day = WeeklyOff(day1)
                                            const get_all_dates = get_excluded_weeklyoff_days(fromDate, toDate, FrmDt, ToDt)
                                            const tot_days_count = get_all_dates.length;
                                            const day_split = get_all_dates.toString().split(',')
                                            const flag = 0;
                                            for (const j = 0; j < tot_days_count; j++) {
    
                                                const one_by_one_day = day_split[j]
                                                if (one_by_one_day == firstWeeklyOffD || one_by_one_day == secWeeklyOffD) {
                                                    flag = flag + 1;
                                                }
    
                                            }
                                            if (flag == '0') {
                                                datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
                                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: datediff, ignoreFieldChange: false })
                                            }
                                            if (flag == '1') {
                                                const final_flag = parseFloat(flag) * 1
                                                datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: datediff, ignoreFieldChange: false })
                                            }
                                            if (flag == '2') {
                                                const final_flag = parseFloat(flag) * 1
                                                datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: datediff, ignoreFieldChange: false })
                                            }
                                            if (flag > '2') {
                                                const final_flag = parseFloat(flag) * 1
                                                datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: datediff, ignoreFieldChange: false })
                                            }
                                        }
                                        if (holiday_TF_check == 'F') {
    
                                            const holiday_count = searchEmpholidays(getUserId, fromDate, toDate, FrmDt, ToDt, FrmMonth, TOMonth)
    
                                            const context = runtime;
                                            const user = context.getUser();
                                            // by florence
                                         /*    log.debug({ title: 'user', details: user });
                                            if (user == '329738') {
                                                alert('holiday_count' + holiday_count)
                                            } */
    
                                            const frm_date_val = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_fromdate' })
                                            const to_date_val = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_todate' })
    
                                            const frm_date_val_obj = nlapiStringToDate(frm_date_val)
                                            const date_split = frm_date_val_obj.toString().split(' ');
                                            const day = date_split[0];
                                            const frm_week_day = WeeklyOff(day)
    
                                            const to_date_val_obj = nlapiStringToDate(to_date_val)
                                            const date_split1 = to_date_val_obj.toString().split(' ');
                                            const day1 = date_split1[0];
                                            const to_week_day = WeeklyOff(day1)
    
                                            const get_all_dates = get_excluded_weeklyoff_days(fromDate, toDate, FrmDt, ToDt)
    
                                            const tot_days_count = get_all_dates.length;
    
                                            const day_split = get_all_dates.toString().split(',')
                                            const flag = 0;
                                            for (const j = 0; j < tot_days_count; j++) {
    
    
                                                const one_by_one_day = day_split[j]
    
                                                if (one_by_one_day == firstWeeklyOffD || one_by_one_day == secWeeklyOffD) {
                                                    flag = flag + 1;
                                                }
    
                                            }
    
    
                                            if (flag == '0') {
                                                if (holiday_count == 0) {
                                                    datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
                                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: datediff, ignoreFieldChange: false })
                                                } else {
                                                    const datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(holiday_count) + 1;
                                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: datediff, ignoreFieldChange: false })
                                                }
                                            }
                                            if (flag == '1') {
                                                if (holiday_count == 0) {
                                                    const final_flag = parseFloat(flag) * 1
                                                    datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: datediff, ignoreFieldChange: false })
                                                } else {
                                                    const final_flag = parseFloat(flag) * 1
                                                    datediff = (((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag)) - parseFloat(holiday_count);
                                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: datediff, ignoreFieldChange: false })
                                                }
                                            }
                                            if (flag == '2') {
                                                if (holiday_count == 0) {
                                                    const final_flag = parseFloat(flag) * 1
                                                    datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: datediff, ignoreFieldChange: false })
                                                } else {
                                                    const final_flag = parseFloat(flag) * 1
                                                    datediff = (((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag)) - parseFloat(holiday_count);
                                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: datediff, ignoreFieldChange: false })
                                                }
    
                                            }
                                            if (flag > '2') {
                                                const final_flag = parseFloat(flag) * 1
                                                datediff = (((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag)) - parseFloat(holiday_count);
                                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: datediff, ignoreFieldChange: false })
                                            }
                                        }
                                    //}
    
                                }
    
                            }
                            else
                            {
                                if (weeklyoffIncCheck == 'T') 
    							{
                                    const frm_halfday = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_fromhalfday' });
                                    const to_halfday = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_tohalfday' });
                                   
    
                                   // if (frm_halfday == 'F' && to_halfday == 'F') {
                                        if (holiday_TF_check == 'T') {
    
                                            const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
    
                                            const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
                                            diffDays = diffDays + 1;
    
                                            scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: diffDays, ignoreFieldChange: false })
    
                                        }
                                        if (holiday_TF_check == 'F') {
                                            const holiday_count = searchEmpholidays(getUserId, fromDate, toDate, FrmDt, ToDt, FrmMonth, TOMonth)
    
                                            if (holiday_count == 0) {
                                                const monthdays = getArryMonthDays(FrmMonth);
                                                const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                                                const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                finaldays = finaldays + 1;
                                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: finaldays, ignoreFieldChange: false })
    
                                            } else {
                                                const monthdays = getArryMonthDays(FrmMonth);
                                                const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
    
                                                const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                finaldays = finaldays + 1;
                                                finaldays = finaldays - parseFloat(holiday_count);
                                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: finaldays, ignoreFieldChange: false })
                                            }
                                        }
                                   // }
    
                                }
                                else
                                {
                                    const frm_halfday = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_fromhalfday' });
                                    const to_halfday = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_tohalfday' });
    
                                    
                                    //if (frm_halfday == 'F' && to_halfday == 'F') 
    								//{
                                        if (holiday_TF_check == 'T') 
    									{
                                            const frm_date_val = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_fromdate' })
                                            const to_date_val = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_todate' })
                                            const monthdays = getArryMonthDays(FrmMonth);
                                            const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                                            const frm_date_val_obj = nlapiStringToDate(frm_date_val)
                                            const date_split = frm_date_val_obj.toString().split(' ');
                                            const day = date_split[0];
                                            const frm_week_day = WeeklyOff(day)
                                            const to_date_val_obj = nlapiStringToDate(to_date_val)
                                            const date_split1 = to_date_val_obj.toString().split(' ');
                                            const day1 = date_split1[0];
                                            const to_week_day = WeeklyOff(day1)
                                            const get_all_dates = get_excluded_weeklyoff_days_for_different_months(firstMonthDays, fromDate, toDate, FrmDt, ToDt)
                                            const tot_days_count = get_all_dates.length;
                                            const day_split = get_all_dates.toString().split(',')
    
                                            const flag = 0;
                                            for (const j = 0; j < tot_days_count; j++) {
    
                                                const one_by_one_day = day_split[j]
                                                if (one_by_one_day == firstWeeklyOffD || one_by_one_day == secWeeklyOffD) {
                                                    flag = flag + 1;
    
                                                }
    
                                            }
    										log.debug({ title: 'holiday_TF_check T day_split', details: day_split })
                                            log.debug({ title: 'holiday_TF_check T firstWeeklyOffD', details: firstWeeklyOffD })
                                            log.debug({ title: 'holiday_TF_check T secWeeklyOffD', details: secWeeklyOffD })
    										log.debug({ title: 'holiday_TF_check T flag', details: flag })
                                            if (flag == '0') {
                                                const monthdays = getArryMonthDays(FrmMonth);
                                                const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                finaldays = finaldays + 1;
                                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: finaldays, ignoreFieldChange: false })
                                            }
    
                                            if (flag == '1') {
                                                const final_flag = parseFloat(flag) * 1
                                                const monthdays = getArryMonthDays(FrmMonth);
                                                const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
    
                                                const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                finaldays = finaldays + 1;
                                                finaldays = finaldays - parseFloat(final_flag);
                                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: finaldays, ignoreFieldChange: false })
                                            }
                                            if (flag == '2') {
                                                const final_flag = parseFloat(flag) * 1
                                                const monthdays = getArryMonthDays(FrmMonth);
                                                const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
    
                                                const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                finaldays = finaldays + 1;
                                                finaldays = finaldays - parseFloat(final_flag);
                                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: finaldays, ignoreFieldChange: false })
                                            }
                                            if (flag > '2') {
                                                const final_flag = parseFloat(flag) * 1
    
    
                                                const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                finaldays = finaldays + 1 - parseFloat(final_flag);
                                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: finaldays, ignoreFieldChange: false })
                                            }
                                        }
                                        if (holiday_TF_check == 'F') 
    									{
                                            const holiday_count = searchEmpholidays(getUserId, fromDate, toDate, FrmDt, ToDt, FrmMonth, TOMonth)
                                            const frm_date_val = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_fromdate' })
                                            const to_date_val = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_todate' })
                                            const monthdays = getArryMonthDays(FrmMonth);
                                            const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                                            const frm_date_val_obj = nlapiStringToDate(frm_date_val)
                                            const date_split = frm_date_val_obj.toString().split(' ');
                                            const day = date_split[0];
                                            const frm_week_day = WeeklyOff(day)
                                            const to_date_val_obj = nlapiStringToDate(to_date_val)
                                            const date_split1 = to_date_val_obj.toString().split(' ');
                                            const day1 = date_split1[0];
                                            const to_week_day = WeeklyOff(day1)
                                            const get_all_dates = get_excluded_weeklyoff_days_for_different_months(firstMonthDays, fromDate, toDate, FrmDt, ToDt)
                                            const tot_days_count = get_all_dates.length;
                                            const day_split = get_all_dates.toString().split(',')
                                            log.debug({ title: 'a1 day_split', details: day_split })
                                            log.debug({ title: 'a1 firstWeeklyOffD', details: firstWeeklyOffD })
                                            log.debug({ title: 'a1 secWeeklyOffD', details: secWeeklyOffD })
    
                                            const flag = 0;
                                            for (const j = 0; j < tot_days_count; j++) {
                                                const one_by_one_day = day_split[j]
                                                if (one_by_one_day == firstWeeklyOffD || one_by_one_day == secWeeklyOffD) {
                                                    flag = flag + 1;
    
                                                }
    
                                            }
    										log.debug({ title: 'a1 flag', details: flag })
    										log.debug({ title: 'a1 holiday_count', details: holiday_count })
                                            if (flag == '0') {
                                                if (holiday_count == 0) {
                                                    const monthdays = getArryMonthDays(FrmMonth);
                                                    const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
    
                                                    const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                    const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                    finaldays = finaldays + 1;
                                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: finaldays, ignoreFieldChange: false })
                                                } else {
                                                    const monthdays = getArryMonthDays(FrmMonth);
                                                    const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
    
                                                    const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                    const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                    finaldays = finaldays + 1;
                                                    finaldays = finaldays - parseFloat(holiday_count);
                                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: finaldays, ignoreFieldChange: false })
                                                }
                                            }
                                            if (flag == '1') {
                                                if (holiday_count == 0) {
                                                    const final_flag = parseFloat(flag) * 1
                                                    const monthdays = getArryMonthDays(FrmMonth);
                                                    const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                    const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                    const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                    finaldays = finaldays + 1;
                                                    finaldays = finaldays - parseFloat(final_flag)
                                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: finaldays, ignoreFieldChange: false })
                                                } else {
                                                    const final_flag = parseFloat(flag) * 1
                                                    const monthdays = getArryMonthDays(FrmMonth);
                                                    const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                    const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                    const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                    finaldays = finaldays + 1;
                                                    finaldays = finaldays - parseFloat(final_flag)
                                                    finaldays = finaldays - parseFloat(holiday_count)
                                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: finaldays, ignoreFieldChange: false })
                                                }
                                            }
                                            if (flag == '2') {
                                                if (holiday_count == 0) {
                                                    const final_flag = parseFloat(flag) * 1
                                                    const monthdays = getArryMonthDays(FrmMonth);
                                                    const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                    const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                    const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                    finaldays = finaldays + 1;
                                                    finaldays = finaldays - parseFloat(final_flag)
                                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: finaldays, ignoreFieldChange: false })
                                                } else {
                                                    const final_flag = parseFloat(flag) * 1
                                                    const monthdays = getArryMonthDays(FrmMonth);
                                                    const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                    const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                    const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                    finaldays = finaldays + 1;
                                                    finaldays = finaldays - parseFloat(final_flag)
                                                    finaldays = finaldays - parseFloat(holiday_count)
    
                                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: finaldays, ignoreFieldChange: false })
                                                }
                                            }
                                            if (flag > '2') {
                                                if (holiday_count == 0) {
    
                                                    const final_flag = parseFloat(flag) * 1
                                                    const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                    const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                    finaldays = finaldays + 1;
                                                    finaldays = finaldays - parseFloat(final_flag);
                                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: finaldays, ignoreFieldChange: false })
                                                } else {
                                                    const final_flag = parseFloat(flag) * 1
    
                                                    const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                    const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                    finaldays = finaldays + 1 - parseFloat(final_flag);
                                                    finaldays = finaldays - parseFloat(holiday_count);
                                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: finaldays, ignoreFieldChange: false })
                                                }
                                            }
                                        }
                                    //}
    
                                }
                            }
                        }
                        else
                        {
                            if (FrmMonth == TOMonth) {
                                if (weeklyoffIncCheck == 'T') {
                                    const frm_halfday = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_fromhalfday' });
                                    const to_halfday = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_tohalfday' });
    
                                    
                                  //  if (frm_halfday == 'F' && to_halfday == 'F') {
                                        if (holiday_TF_check == 'T') {
                                            datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
                                            scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: datediff, ignoreFieldChange: false })
                                        }
                                        if (holiday_TF_check == 'F') {
    
                                            const holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
    
                                            if (holiday_count == 0) {
                                                datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
                                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: datediff, ignoreFieldChange: false })
                                            } else {
    
                                                datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(holiday_count) + 1;
                                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: datediff, ignoreFieldChange: false })
                                            }
                                        }
                                   // }
                                } else
                                {
                                    const frm_halfday = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_fromhalfday' });
                                    const to_halfday = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_tohalfday' });
                                   
                                   // if (frm_halfday == 'F' && to_halfday == 'F') {
    
                                        if (holiday_TF_check == 'T') {
    
                                            const frm_date_val = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_fromdate' })
                                            const to_date_val = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_todate' })
                                            const frm_date_val_obj = nlapiStringToDate(frm_date_val)
                                            const date_split = frm_date_val_obj.toString().split(' ');
                                            const day = date_split[0];
                                            const frm_week_day = WeeklyOff(day)
                                            const to_date_val_obj = nlapiStringToDate(to_date_val)
                                            const date_split1 = to_date_val_obj.toString().split(' ');
                                            const day1 = date_split1[0];
                                            const to_week_day = WeeklyOff(day1)
                                            const get_all_dates = get_excluded_weeklyoff_days(fromDate, toDate, FrmDt, ToDt)
                                            const tot_days_count = get_all_dates.length;
                                            const day_split = get_all_dates.toString().split(',')
                                            const flag = 0;
                                            for (const j = 0; j < tot_days_count; j++) {
                                                const one_by_one_day = day_split[j]
    
                                                if (one_by_one_day == WeeklyOffInW) {
                                                    flag = flag + 1;
    
                                                }
    
                                            }
                                            if (flag == '0') {
                                                datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
                                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: datediff, ignoreFieldChange: false })
                                            }
                                            if (flag == '1') {
                                                const final_flag = parseFloat(flag) * 1
                                                datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1)
                                                datediff = parseFloat(datediff) - parseFloat(final_flag);
                                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: datediff, ignoreFieldChange: false })
                                            }
                                            if (flag >= '2') {
    
                                                const final_flag = parseFloat(flag) * 1
                                                datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: datediff, ignoreFieldChange: false })
                                            }
                                        }
                                        if (holiday_TF_check == 'F') {
                                            const holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
                                            const frm_date_val = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_fromdate' })
                                            const to_date_val = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_todate' })
                                            const frm_date_val_obj = nlapiStringToDate(frm_date_val)
                                            const date_split = frm_date_val_obj.toString().split(' ');
                                            const day = date_split[0];
                                            const frm_week_day = WeeklyOff(day)
    
                                            const to_date_val_obj = nlapiStringToDate(to_date_val)
                                            const date_split1 = to_date_val_obj.toString().split(' ');
                                            const day1 = date_split1[0];
                                            const to_week_day = WeeklyOff(day1)
    
                                            const get_all_dates = get_excluded_weeklyoff_days(fromDate, toDate, FrmDt, ToDt)
                                            const tot_days_count = get_all_dates.length;
                                            const day_split = get_all_dates.toString().split(',')
                                            const flag = 0;
                                            for (const j = 0; j < tot_days_count; j++) {
                                                const one_by_one_day = day_split[j]
                                                if (one_by_one_day == WeeklyOffInW) {
                                                    flag = flag + 1;
                                                }
    
                                            }
                                            if (flag == '0') {
                                                if (holiday_count == 0) {
                                                    datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
                                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: datediff, ignoreFieldChange: false })
                                                } else {
                                                    const datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(holiday_count) + 1;
                                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: datediff, ignoreFieldChange: false })
                                                }
                                            }
                                            if (flag == '1') {
                                                if (holiday_count == 0) {
                                                    const final_flag = parseFloat(flag) * 1
                                                    datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: datediff, ignoreFieldChange: false })
                                                } else {
    
                                                    const final_flag = parseFloat(flag) * 1
    
                                                    datediff = (parseFloat(ToDt) - parseFloat(FrmDt) + 1);
                                                    datediff = parseFloat(datediff) - parseFloat(final_flag)
                                                    datediff = parseFloat(datediff) - parseFloat(holiday_count);
                                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: datediff, ignoreFieldChange: false })
                                                }
                                            }
    
                                            if (flag >= '2') {
                                                if (holiday_count == 0) {
                                                    const final_flag = parseFloat(flag) * 1
                                                    datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: datediff, ignoreFieldChange: false })
                                                } else {
    
                                                    const final_flag = parseFloat(flag) * 1
    
                                                    datediff = (parseFloat(ToDt) - parseFloat(FrmDt) + 1);
                                                    datediff = (parseFloat(datediff) - parseFloat(final_flag));
                                                    datediff = (parseFloat(datediff) - parseFloat(holiday_count));
                                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: datediff, ignoreFieldChange: false })
                                                }
                                            }
    
                                        }
                                    //}
                                }
                            }
                            else
                            {
                                if (weeklyoffIncCheck == 'T') {
                                    const frm_halfday = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_fromhalfday' });
                                    const to_halfday = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_tohalfday' });
                                    
                                    //if (frm_halfday == 'F' && to_halfday == 'F') {
                                        if (holiday_TF_check == 'T') {
                                            const monthdays = getArryMonthDays(FrmMonth);
                                            const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                                            const finaldays = parseFloat(ToDt) + firstMonthDays;
                                            scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: finaldays, ignoreFieldChange: false })
                                        }
                                        if (holiday_TF_check == 'F') {
                                            const holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
                                            if (holiday_count == 0) {
                                                const monthdays = getArryMonthDays(FrmMonth);
                                                const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                                                const finaldays = parseFloat(ToDt) + firstMonthDays;
                                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: finaldays, ignoreFieldChange: false })
                                            } else {
                                                const monthdays = getArryMonthDays(FrmMonth);
                                                const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                                                const finaldays = (parseFloat(ToDt) + parseFloat(firstMonthDays)) - parseFloat(holiday_count);
                                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: finaldays, ignoreFieldChange: false })
                                            }
                                        }
                                   // }
                                }
                                else
                                {
                                    const frm_halfday = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_fromhalfday' });
                                    const to_halfday = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_tohalfday' });
                                    
                                  //  if (frm_halfday == 'F' && to_halfday == 'F') {
                                        if (holiday_TF_check == 'T') {
                                            const frm_date_val = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_fromdate' })
                                            const to_date_val = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_todate' })
                                            const monthdays = getArryMonthDays(FrmMonth);
                                            const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                                            const frm_date_val_obj = nlapiStringToDate(frm_date_val)
                                            const date_split = frm_date_val_obj.toString().split(' ');
                                            const day = date_split[0];
                                            const frm_week_day = WeeklyOff(day)
                                            const to_date_val_obj = nlapiStringToDate(to_date_val)
                                            const date_split1 = to_date_val_obj.toString().split(' ');
                                            const day1 = date_split1[0];
                                            const to_week_day = WeeklyOff(day1)
                                            const get_all_dates = get_excluded_weeklyoff_days_for_different_months(firstMonthDays, fromDate, toDate, FrmDt, ToDt)
                                            const tot_days_count = get_all_dates.length;
                                            const day_split = get_all_dates.toString().split(',')
                                            const flag = 0;
                                            for (const j = 0; j < tot_days_count; j++) {
                                                const one_by_one_day = day_split[j]
                                                if (one_by_one_day == WeeklyOffInW) {
                                                    flag = flag + 1;
                                                }
    
                                            }
                                            if (flag == '0') {
                                                const monthdays = getArryMonthDays(FrmMonth);
                                                const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                const finaldays = parseFloat(ToDt) + firstMonthDays + 1;
                                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: finaldays, ignoreFieldChange: false })
                                            }
                                            if (flag == '1') {
                                                const final_flag = parseFloat(flag);
                                                const monthdays = getArryMonthDays(FrmMonth);
                                                const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                const finaldays = parseFloat(ToDt) + firstMonthDays - parseFloat(final_flag) + 1;
                                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: finaldays, ignoreFieldChange: false })
                                            }
                                            if (flag == '2') {
                                                const final_flag = parseFloat(flag);
                                                const monthdays = getArryMonthDays(FrmMonth);
                                                const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                const finaldays = parseFloat(ToDt) + firstMonthDays - parseFloat(final_flag) + 1;
                                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: finaldays, ignoreFieldChange: false })
                                            }
                                            if (flag > '2') {
                                                const final_flag = parseFloat(flag);
                                                const monthdays = getArryMonthDays(FrmMonth);
                                                const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                const finaldays = parseFloat(ToDt) + firstMonthDays - parseFloat(final_flag) + 1;
                                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: finaldays, ignoreFieldChange: false })
                                            }
    
                                        }
                                        if (holiday_TF_check == 'F') {
                                            const holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
    
                                            const frm_date_val = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_fromdate' })
                                            const to_date_val = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_todate' })
                                            const monthdays = getArryMonthDays(FrmMonth);
                                            const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                                            const frm_date_val_obj = nlapiStringToDate(frm_date_val)
                                            const date_split = frm_date_val_obj.toString().split(' ');
                                            const day = date_split[0];
                                            const frm_week_day = WeeklyOff(day)
    
                                            const to_date_val_obj = nlapiStringToDate(to_date_val)
                                            const date_split1 = to_date_val_obj.toString().split(' ');
                                            const day1 = date_split1[0];
                                            const to_week_day = WeeklyOff(day1)
    
                                            const get_all_dates = get_excluded_weeklyoff_days_for_different_months(firstMonthDays, fromDate, toDate, FrmDt, ToDt)
    
                                            const tot_days_count = get_all_dates.length;
                                            const day_split = get_all_dates.toString().split(',')
                                            const flag = 0;
                                            for (const j = 0; j < tot_days_count; j++) {
                                                const one_by_one_day = day_split[j]
                                                if (one_by_one_day == WeeklyOffInW) {
                                                    flag = flag + 1;
    
                                                }
    
                                            }
                                            if (flag == '0') {
                                                if (holiday_count == 0) {
                                                    const monthdays = getArryMonthDays(FrmMonth);
                                                    const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                    const finaldays = parseFloat(ToDt) + firstMonthDays + 1;
                                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: finaldays, ignoreFieldChange: false })
                                                } else {
                                                    const monthdays = getArryMonthDays(FrmMonth);
                                                    const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                    const finaldays = (parseFloat(ToDt) + parseFloat(firstMonthDays)) - parseFloat(holiday_count) + 1;
                                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: finaldays, ignoreFieldChange: false })
                                                }
                                            }
                                            if (flag == '1') {
                                                if (holiday_count == 0) {
                                                    const final_flag = parseFloat(flag);
                                                    const monthdays = getArryMonthDays(FrmMonth);
                                                    const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                    const finaldays = parseFloat(ToDt) + firstMonthDays - parseFloat(final_flag) + 1;
                                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: finaldays, ignoreFieldChange: false })
                                                } else {
                                                    const final_flag = parseFloat(flag);
                                                    const monthdays = getArryMonthDays(FrmMonth);
                                                    const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                    const finaldays = ((parseFloat(ToDt) + parseFloat(firstMonthDays)) - parseFloat(final_flag)) - parseFloat(holiday_count) + 1;
                                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: finaldays, ignoreFieldChange: false })
    
                                                }
                                            }
                                            if (flag == '2') {
                                                if (holiday_count == 0) {
                                                    const final_flag = parseFloat(flag);
                                                    const monthdays = getArryMonthDays(FrmMonth);
                                                    const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                    const finaldays = parseFloat(ToDt) + firstMonthDays - parseFloat(final_flag) + 1;
                                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: finaldays, ignoreFieldChange: false })
                                                } else {
                                                    const final_flag = parseFloat(flag);
                                                    const monthdays = getArryMonthDays(FrmMonth);
                                                    const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                    const finaldays = ((parseFloat(ToDt) + parseFloat(firstMonthDays)) - parseFloat(final_flag)) - parseFloat(holiday_count) + 1;
                                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: finaldays, ignoreFieldChange: false })
                                                }
                                            }
                                            if (flag > '2') {
                                                if (holiday_count == 0) {
                                                    const final_flag = parseFloat(flag);
                                                    const monthdays = getArryMonthDays(FrmMonth);
                                                    const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                    const finaldays = parseFloat(ToDt) + firstMonthDays - parseFloat(final_flag) + 1;
                                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: finaldays, ignoreFieldChange: false })
                                                } else {
                                                    const final_flag = parseFloat(flag);
                                                    const monthdays = getArryMonthDays(FrmMonth);
                                                    const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                    const finaldays = ((parseFloat(ToDt) + parseFloat(firstMonthDays)) - parseFloat(final_flag)) - parseFloat(holiday_count) + 1;
                                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: finaldays, ignoreFieldChange: false })
                                                }
                                            }
                                        }
                                  //  }
                                }
                            }
                        }
                    }
                }
    
            } else {
    
                if (name == 'custrecord_hris_lve_todate') {
                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: 1, ignoreFieldChange: false })
    
                }
                if (name == 'custrecord_hris_lve_fromdate') {
                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: 1, ignoreFieldChange: false })
    
                }
                if (name == 'custrecord_hris_lve_fromhalfday') {
                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: 0.5, ignoreFieldChange: false })
    
                }
    
                if (name == 'custrecord_hris_lve_tohalfday') {
                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: 0.5, ignoreFieldChange: false })
    
                }
            }
    
    
    
    
    
            if (name == 'custrecord_hris_lve_todate') {
                const Total_no_days = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_totalnodays' });
                Total_no_days = parseFloat(Total_no_days)
                const balance = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavebalance' });
                balance = parseFloat(balance)
    
                const leave_type = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavetype' })
    
                const seq_no_search = get_sequence_no(leave_type)
                const seq_no_split = seq_no_search.split('#')
                const seq_no = seq_no_split[0];
                const negAllowChk = seq_no_split[1];
                const maxNegAllow = seq_no_split[2];
    
                if (seq_no != 2 && seq_no != 8 && seq_no !=13) {
                    if (parseFloat(Total_no_days) > parseFloat(balance)) {
                        const bal_diff = parseFloat(Total_no_days) - parseFloat(balance);
    
                        if (negAllowChk == 'F') {
                            alert(' Leave Balance is low');
                            scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '', ignoreFieldChange: false });
                            scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_fromdate', value: '', ignoreFieldChange: false });
                            scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: '', ignoreFieldChange: false });
                            return false;
                        } else {
                            if (maxNegAllow < bal_diff) {
                                alert('You are allowed to take maximum 15 days of negative balance')
                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '', ignoreFieldChange: false });
                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_fromdate', value: '', ignoreFieldChange: false });
                                scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: '', ignoreFieldChange: false });
                                return false;
                            }
                        }
    
                    }
    
    
                }
    
    
    
            }
    
    
            if (name == 'custrecord_hris_lve_fromdate') {
    
                const seq_no_search = get_sequence_no(leave_type)
                const seq_no_split = seq_no_search.split('#')
                const seq_no = seq_no_split[0];
                const getUserId = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_employeename' });
                const frm_date = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_fromdate' });
    
    
    
    
    
    
                if (frm_date != '' && frm_date != null && frm_date != 'undefined') {
               
                const check_holiday_frm_date = check_from_to_date_holiday(frm_date, getUserId)
             const leave_type = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavetype' });
            /*   const E_leavetype = scriptContext.currentRecord.getValue({ fieldId: "custrecord_hris_lve_leavetype" });
               const leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid'); 
     */
                if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
                    // Florence Changed here
                 //   if (check_holiday_frm_date == false && seq_no != '2' && seq_no != '6' && leave_type != 11 && leave_type != 12 && leave_type != 16 && leave_type != 22 && leave_type != 23 && leave_type != 24 && leave_type != 25 && leave_type != 9 && leave_type != 18) {
                    if (check_holiday_frm_date == false && seq_no != '2' && seq_no != '6' && seq_no !=13 && leave_type != 5 ) {
    
                        alert('Holiday present on this date');
                        scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_fromdate', value: '', ignoreFieldChange: false })
                        scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: '', ignoreFieldChange: false })
                        return false;
                    }
                    const check_weeklyoff_frm_date = check_weeklyoff_on_frm_to_date(frm_date, getUserId);
    
                  //  if (check_weeklyoff_frm_date == true && seq_no != '2' && seq_no != '6' && leave_type != 11 && leave_type != 12 && leave_type != 16 && leave_type != 22 && leave_type != 23 && leave_type != 24 && leave_type != 25 && leave_type != 9 && leave_type != 18) {
                    if (check_weeklyoff_frm_date == true && seq_no != '2' && seq_no != '6' && seq_no !=13 && leave_type != 5) {
                        alert('weeklyoff present on this date');
                        scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_fromdate', value: '', ignoreFieldChange: false })
                        scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: '', ignoreFieldChange: false })
                        return false;
                    }
                } else {
                    scriptContext.currentRecord.getField({ fieldId: 'custrecord_hris_lve_applylveencashment' }).isDisabled = false
                }
    
                    const Total_no_days = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_totalnodays' });
    
                    const tdate = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_todate' });
                    const min_no_days = min_days_apply(leave_type)
                    const max_no_days = max_days_apply(leave_type)
    
                    const leave_type = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavetype' })
                     const seq_no_search = get_sequence_no(leave_type)
                    const seq_no_split = seq_no_search.split('#')
                    const seq_no = seq_no_split[0];
    
                    {
                        if (tdate != '' && tdate != 'undefined' && tdate != null) {
    
                           const leave_type = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavetype' });
         
                            if (seq_no == 4) {
    
                                if (parseFloat(Total_no_days) == parseFloat(min_no_days)) {
    
                                    return true;
    
                                }
                                if (parseFloat(Total_no_days) != parseFloat(min_no_days)) {
                                    if (parseFloat(Total_no_days) == parseFloat(max_no_days)) {
    
                                        return true;
    
                                    }
                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_fromdate', value: '', ignoreFieldChange: false })
                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '', ignoreFieldChange: false })
                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: 0, ignoreFieldChange: false })
                                    alert('Apply Vacation Leave 5 days or 10 days');
                                    return false;
    
                                }
    
                                if (parseFloat(Total_no_days) == parseFloat(max_no_days)) {
    
                                    return true;
    
                                }
                                if (parseFloat(Total_no_days) != parseFloat(max_no_days)) {
                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_fromdate', value: '', ignoreFieldChange: false })
                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '', ignoreFieldChange: false })
                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: 0, ignoreFieldChange: false })
                                    alert('Apply Vacation Leave 5 days or 10 days');
                                    return false;
    
                                }
    
    
                            }
    
    
    
    
                            if (seq_no != 4) {
    
                                if (min_no_days != 0 || max_no_days != 0) {
                                    if (parseFloat(Total_no_days) < parseFloat(min_no_days)) {
    
                                        alert('Minimum no. of days for selected leave is ' + min_no_days)
                                        scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_fromdate', value: '', ignoreFieldChange: false })
                                        scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '', ignoreFieldChange: false })
                                        scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: '', ignoreFieldChange: false })
                                        return false;
    
                                    }
                                }
                                if (max_no_days != 0) {
    
                                    if (parseFloat(Total_no_days) > parseFloat(max_no_days)) {
    
                                        alert('total no of days should not more than ' + max_no_days)
                                        scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_fromdate', value: '', ignoreFieldChange: false })
                                        scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '', ignoreFieldChange: false })
                                        scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: '', ignoreFieldChange: false })
                                        return false;
    
                                    }
                                }
    
    
    
                            }
    
    
    
    
                        }
    
    
    
    
                    }
    
    
    
                    return true;
                } else {
    
                    alert('enter leave type')
                    return false;
                }
    
            }
    
    
    
    
            if (name == 'custrecord_hris_lve_todate') {
               const to_date = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_todate' });
                if (to_date != '' && to_date != null && to_date != 'undefined') {
               
                    const E_leavetype = scriptContext.currentRecord.getValue({ fieldId: "custrecord_hris_lve_leavetype" });
                    const leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid');
                    const seq_no_search = get_sequence_no(E_leavetype)
                    const seq_no_split = seq_no_search.split('#')
                    const seq_no = seq_no_split[0];
                    const getUserId = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_employeename' });
                   
    
                const check_holiday_to_date = check_from_to_date_holiday(to_date, getUserId)
    
                if (check_holiday_to_date == false && seq_no != '2' && seq_no != '6' && leave_type != 11 && leave_type != 12 && leave_type != 16 && leave_type != 22 && leave_type != 23 && leave_type != 24 && leave_type != 25 && leave_type != 9 && leave_type != 18) {
                    alert('Holiday present on this date');
                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '', ignoreFieldChange: false })
                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: '', ignoreFieldChange: false })
                    return false;
                }
    
                const check_weeklyoff_to_date = check_weeklyoff_on_frm_to_date(to_date, getUserId);
    
                if (check_weeklyoff_to_date == true && seq_no != '2' && seq_no != '6' && leave_type != 11 && leave_type != 12 && leave_type != 16 && leave_type != 22 && leave_type != 23 && leave_type != 24 && leave_type != 25 && leave_type != 9 && leave_type != 18) {
                    alert('weeklyoff present on this date');
                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '', ignoreFieldChange: false })
                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: '', ignoreFieldChange: false })
                    return false;
                }
            } else {
                scriptContext.currentRecord.getField({ fieldId: 'custrecord_hris_lve_applylveencashment' }).isDisabled = false
            }
    
                const Total_no_days = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_totalnodays' });
                const leave_type = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavetype' });
                if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
                    const fdate = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_fromdate' });
                    const min_no_days = min_days_apply(leave_type)
                    const max_no_days = max_days_apply(leave_type)
    
                    const leave_type = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavetype' })
              
                    {
    
    
                        if (fdate != '' && fdate != 'undefined' && fdate != null) {
    
    
                           const leave_type = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavetype' });
    
                             if (seq_no == 4) {
    
    
                                if (parseFloat(Total_no_days) != parseFloat(min_no_days)) {
    
                                    if (parseFloat(Total_no_days) == parseFloat(max_no_days)) {
    
                                        return true;
    
                                    }
    
                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_fromdate', value: '', ignoreFieldChange: false })
                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '', ignoreFieldChange: false })
                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: 0, ignoreFieldChange: false })
                                    alert('Apply Vacation Leave 5 days or 10 days');
                                    return false;
    
                                }
                                if (parseFloat(Total_no_days) == parseFloat(min_no_days)) {
    
                                    return true;
    
                                }
    
                                if (parseFloat(Total_no_days) != parseFloat(max_no_days)) {
                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_fromdate', value: '', ignoreFieldChange: false })
                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '', ignoreFieldChange: false })
                                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: 0, ignoreFieldChange: false })
                                    alert('Apply Vacation Leave 5 days or 10 days');
                                    return false;
    
                                }
    
                                if (parseFloat(Total_no_days) == parseFloat(max_no_days)) {
    
                                    return true;
    
                                }
    
    
    
                            }
    
                            if (seq_no != 4) {
    
    
                                if (min_no_days != 0) {
                                    if (parseFloat(Total_no_days) < parseFloat(min_no_days)) {
    
                                        alert('Minimum no. of days for selected leave is ' + min_no_days)
                                        scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_fromdate', value: '', ignoreFieldChange: false })
                                        scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '', ignoreFieldChange: false })
                                        scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: '', ignoreFieldChange: false })
                                        return false;
    
                                    }
    
                                }
                                if (max_no_days != 0) {
    
                                    if (parseFloat(Total_no_days) > parseFloat(max_no_days)) {
    
                                        alert('total no of days should not more than ' + max_no_days)
                                        scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_fromdate', value: '', ignoreFieldChange: false })
                                        scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '', ignoreFieldChange: false })
                                        scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: '', ignoreFieldChange: false })
                                        return false;
    
                                    }
    
                                }
    
    
    
    
                            }
    
    
                        }
    
    
    
    
                    }
    
    
    
    
                    return true;
    
    
                } else {
                    alert('enter leave type');
                    scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '', ignoreFieldChange: false })
                    return false;
                }
    
            }
    
    
    
    
    
            
    
    
    
    
            if (name == 'custrecord_hris_lve_leavebalance') {
    
              const leave_type = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavetype' });
             /*  const E_leavetype = scriptContext.currentRecord.getValue({ fieldId: "custrecord_hris_lve_leavetype" });
                const leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid');  */
                const seq_no_search = get_sequence_no(leave_type)
                const seq_no_split = seq_no_search.split('#')
                const seq_no = seq_no_split[0];
                if (seq_no == 5) {
    
                    const leave_bal = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavebalance' })
    
    
                    if (leave_bal != 0) {
    
                        if (leave_bal == 1) {
                            scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: leave_bal, ignoreFieldChange: false })
                            scriptContext.currentRecord.getField({ fieldId: 'custrecord_hris_lve_fromhalfday' }).isDisabled = true
                            scriptContext.currentRecord.getField({ fieldId: 'custrecord_hris_lve_tohalfday' }).isDisabled = true
                        }
                        if (leave_bal == 0.5) {
                            scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: leave_bal, ignoreFieldChange: false })
    
                            const f_hday = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_fromhalfday' });
                            const t_hday = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_tohalfday' });
                            if (f_hday == 'T') {
                                scriptContext.currentRecord.getField({ fieldId: 'custrecord_hris_lve_tohalfday' }).isDisabled = true
                            }
                            if (f_hday == 'F') {
                                scriptContext.currentRecord.getField({ fieldId: 'custrecord_hris_lve_tohalfday' }).isDisabled = false
    
    
                            }
                            if (t_hday == 'T') {
                                scriptContext.currentRecord.getField({ fieldId: 'custrecord_hris_lve_fromhalfday' }).isDisabled = true
                            }
                            if (t_hday == 'F') {
                                scriptContext.currentRecord.getField({ fieldId: 'custrecord_hris_lve_fromhalfday' }).isDisabled = false
    
    
                            }
                        }
    
                    }
                    if (leave_bal == 0) {
                        scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_leavebalance', value: leave_bal, ignoreFieldChange: false })
                        scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_leavebalance_wholeno', value: leave_bal, ignoreFieldChange: false })
                        scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_validtilldate', value: '', ignoreFieldChange: false })
                    }
    
    
                }
    
    
            }
    
            if (name == 'custrecord_hris_lve_cancellation') {
                
    
                const leave_cancel_check = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_cancellation' });
                const application_status = nlapiGetFieldText('custrecord_hris_lve_hrmsapprovalstatus');
                const application_status_id = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_hrmsapprovalstatus' });
        
                if (leave_cancel_check == 'F') {
                    scriptContext.currentRecord.getField({ fieldId: 'custrecord_hris_lve_cancelreason' }).isDisabled = true
                }
                if (leave_cancel_check == 'T') {
                    scriptContext.currentRecord.getField({ fieldId: 'custrecord_hris_lve_cancelreason' }).isDisabled = false
                }
        
                if (application_status_id == '2') {
        
                    const to_date_val = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_todate' });
        
                 const leave_type = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavetype' });
                 /*  const E_leavetype = scriptContext.currentRecord.getValue({ fieldId: "custrecord_hris_lve_leavetype" });
                   const leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid'); */ 
                    const leave_type_conf = record.load({ type: 'customrecord_hris_leaveconfig', id: leave_type })
        
                    const leave_cancel_period = leave_type_conf.getFieldValue('custrecord_hris_lveconfig_levcancelperod');
        
                    if (leave_cancel_period != 0) {
        
                        const checkbox_value = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_cancellation' });
        
                        const to_date_val_obj = nlapiStringToDate(to_date_val)
        
        
                        const cancel_date = nlapiAddDays(to_date_val_obj, leave_cancel_period);
        
        
                        const current_date = new Date();
        
        
        
                        if (cancel_date < current_date) {
                            alert('You are not allowed to cancel this leave')
                            scriptContext.currentRecord.setValue({ fieldId: 'custrecord_hris_lve_cancellation', value: '', ignoreFieldChange: false })
                            scriptContext.currentRecord.getField({ fieldId: 'custrecord_hris_lve_cancelreason' }).isDisabled = true
                        }
        
                    }
        
                }
        
            }
    
    
        }
       
    
    
    
    }
    
    
    
    
    function postSourcing_validate_checkbox(type, name) {
        const leaveType = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavetype' });
    
    
    }
    
    
    
    
    
    
    
    
    function searchLeaveBalance(leave_type, getUserId) {
    
        const leave_balance = 0;
        const encash_balance = 0;
        const filters = new Array();
        const leave_balanceNme;
        if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
            log.debug({ title: 'leave_type', details: leave_type });
            log.debug({ title: 'getUserId', details: getUserId });
    
            filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_leave_type', null, 'is', leave_type))
            filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_employee_name', null, 'is', getUserId))
            filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'))
            const column = new Array();
            column.push(new nlobjSearchColumn('custrecord_hris_lvbal_available_leave_ba'));
            column.push(new nlobjSearchColumn('custrecord_hris_lvbal_encashable_days'));
            column.push(new nlobjSearchColumn('custrecord_hris_lvbal_leave_type'));
    
            const leaveBalanceresults = search.create({ type: 'customrecord_hris_leavebalance', filters: filters, columns: column }).run();
            if (leaveBalanceresults != null) {
                leave_balance = leaveBalanceresults[0].getValue('custrecord_hris_lvbal_available_leave_ba')
                leave_balanceNme = leaveBalanceresults[0].getText('custrecord_hris_lvbal_leave_type')
                log.debug({ title: 'leave_balance name', details: leave_balanceNme });
                encash_balance = leaveBalanceresults[0].getValue('custrecord_hris_lvbal_encashable_days')
    
            } else {
                leave_balance = 0.00
                encash_balance = 0.00;
                alert('Leave balance is not available for selected leave type.');
            }
    
        }
    
    
        return leave_balance + "#" + encash_balance;
    }
    
    
    
    
    function searchSupportDocCheck(leave_type) {
        const supportDocCheck = false;
        const filters = new Array();
        const column = new Array();
        if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
            filters.push(new nlobjSearchFilter('name', null, 'is', leave_type))
    
    
            column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_suportdocallow'));
            const leaveTypeConfig = search.create({ type: 'customrecord_hris_leaveconfig', filters: filters, columns: column }).run();
            if (leaveTypeConfig != null) {
                supportDocCheck = leaveTypeConfig[0].getValue('custrecord_hris_lveconfig_suportdocallow')
            }
            return supportDocCheck;
    
    
        }
    
    }
    
    
    
    function weeklyOffInclude(leave_type) {
    
        const weeklyoffCheck = false;
        const filters = new Array();
        const column = new Array();
        if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
           filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
           //filters.push(new nlobjSearchFilter('externalid', null, 'is', leave_type))
            column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_includeweekoff'));
            const leaveTypeConfigWO = search.create({ type: 'customrecord_hris_leaveconfig', filters: filters, columns: column }).run();
            if (leaveTypeConfigWO != null) {
                weeklyoffCheck = leaveTypeConfigWO[0].getValue('custrecord_hris_lveconfig_includeweekoff')
            }
            return weeklyoffCheck;
    
        }
    
    
    }
    
    
    
    
    function WeeklyOff(DaysW) {
    
        const whole_day;
        const filters = new Array();
        filters.push(new nlobjSearchFilter('name', null, 'startswith', DaysW))
    
        const column = new Array();
    
        column.push(new nlobjSearchColumn('internalid'));
    
        const whole_day_search = search.create({ type: 'customlist_hris_week_days', filters: filters, columns: column }).run();
    
        if (whole_day_search != null) {
            whole_day = whole_day_search[0].getValue('internalid')
    
        }
        return whole_day;
    }
    
    
    
    
    
    function Get_sequence_no_of_week_days(getUserId) {
        const filters = new Array();
        const columns = new Array();
    
        filters.push(new nlobjSearchFilter('internalid', null, 'is', getUserId));
    
        columns.push(new nlobjSearchColumn('custentity_hris_empweeklyoffs'));
    
        const EmployeeWeeklyOff = search.create({ type: 'employee', filters: filters, columns: columns }).run();
    
        if (EmployeeWeeklyOff != null) {
            const s_weeklyoff = new Array();
            const s_weeklyoff = EmployeeWeeklyOff[0].getValue('custentity_hris_empweeklyoffs')
    
            log.debug({ title: 'before s_weeklyoff.length', details: '' })
            const s_weeklyoff_length = s_weeklyoff.length;
            log.debug({ title: 'after s_weeklyoff.length', details: '' })
    
            const s_weeklyoff_split = s_weeklyoff.split(',');
    
            const firstWeeklyOff = s_weeklyoff_split[0];
    
            const secWeeklyOff = s_weeklyoff_split[1];
    
            if (firstWeeklyOff != '' && firstWeeklyOff != 'undefined' && firstWeeklyOff != null) {
                const Filters1_week_day = new Array();
                const Columns1_week_days = new Array();
    
    
                Filters1_week_day.push(new nlobjSearchFilter('internalid', null, 'is', firstWeeklyOff));
    
                Columns1_week_days.push(new nlobjSearchColumn('custrecord_hris_lve_wkday_seq_no'));
    
                const WeeklyOff_search1 = search.create({ type: 'customlist_hris_week_days', filters: Filters1_week_day, columns: Columns1_week_days }).run();
    
                if (WeeklyOff_search1 != null) {
                    const seq_one = WeeklyOff_search1[0].getValue('custrecord_hris_lve_wkday_seq_no')
                }
    
                if (secWeeklyOff != '' && secWeeklyOff != 'undefined' && secWeeklyOff != null) {
                    const Filters2_week_day = new Array();
                    const Columns2_week_days = new Array();
    
    
                    Filters2_week_day.push(new nlobjSearchFilter('internalid', null, 'is', secWeeklyOff));
    
                    Columns2_week_days.push(new nlobjSearchColumn('custrecord_hris_lve_wkday_seq_no'));
    
                    const WeeklyOff_search2 = search.create({ type: 'customlist_hris_week_days', filters: Filters2_week_day, columns: Columns2_week_days }).run();
    
                    if (WeeklyOff_search2 != null) {
                        const seq_two = WeeklyOff_search2[0].getValue('custrecord_hris_lve_wkday_seq_no')
                    }
    
                    return seq_one + ',' + seq_two;
                } else {
                    return seq_one;
    
                }
    
            } else {
                return seq_one + ',' + seq_two;
            }
    
    
    
    
        }
    
    
    
    }
    
    
    
    
    
    
    function searchEmpsWeeklyOff(getUserId) {
        const Count = 0;
        const weekly_Count = new Array();
        const EmployeeWeeklyOff = search.create({ type: "customrecord_hris_employeedatasourcing", filters: [
                ["custrecord_hris_eds_employee", columns: "anyof", getUserId]
            ],
            [
                new nlobjSearchColumn("custrecord_hris_eds_employee" }).run(),
                new nlobjSearchColumn("custrecord_hris_eds_employeeweeklyoff"),
                new nlobjSearchColumn("custrecord_hris_eds_employeeholidays")
            ]
        );
    
        if (EmployeeWeeklyOff != null) {
            const s_weeklyoff = EmployeeWeeklyOff[0].getValue('custrecord_hris_eds_employeeweeklyoff');
            if (s_weeklyoff.length == 3) {
                const split_s_weeklyoff = s_weeklyoff.toString().split(',')
    
                const split_s_weeklyoff_1 = split_s_weeklyoff[0]
    
                Count++;
                const split_s_weeklyoff_2 = split_s_weeklyoff[1]
    
                Count++;
                weekly_Count.push(split_s_weeklyoff_1 + "##" + split_s_weeklyoff_2)
            } else
            if (s_weeklyoff.length == 1) {
                const split_s_weeklyoff_1 = s_weeklyoff[0]
                Count++;
            }
        }
        return Count + "#" + s_weeklyoff;
    
    }
    
    
    
    function getArryMonthDays(FrmMonth) {
    
        const standard_month_days; {
            if (FrmMonth == '1' || FrmMonth == '3' || FrmMonth == '5' || FrmMonth == '7' || FrmMonth == '8' || FrmMonth == '10' || FrmMonth == '12') {
                standard_month_days = 31;
            }
            if (FrmMonth == '4' || FrmMonth == '6' || FrmMonth == '9' || FrmMonth == '11') {
                standard_month_days = 30;
            }
            else
            if (FrmMonth == '2') {
                const date = new Date()
                const year = date.getFullYear()
                if (year % 4 == 0) {
                    standard_month_days = 29;
                } else {
                    standard_month_days = 28;
                }
            }
        }
        return standard_month_days;
    }
    
    
    
    
    function get_excluded_weeklyoff_days(fromDate, toDate, FrmDt, ToDt) {
    
    debugger;
        const date_day = 0
    
        const date_push = new Array();
    
        const frm_dt = new Date(fromDate);
    
        const to_dt = new Date(toDate)
    
        const count_date = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
    
        const date_day = frm_dt.getDay();
    
        date_day = parseFloat(date_day);
    
        for (const i = 1; i <= count_date; i++) {
            if (date_day >= '8') {
    
                date_day = 1
    
    
            }
            date_push.push(date_day);
            date_day = parseInt(date_day) + 1;
        }
        return date_push;
    }
    
    
    
    function searchEmpholidays(getUserId, fromDate, toDate) {
        const fromdate = fromDate;
        const todate = toDate;
        const holiday_date;
        const count = 0;
        const all_holiday_dates = new Array();
        const filters = new Array();
        const column = new Array();
        const s_holiday = new Array();
        const get_holiday_filters = new Array();
        const get_holiday_column = new Array();
        const emp_holidays = [];
    
        const Employee_holiday_searchResult = search.create({ type: "customrecord_hris_employeedatasourcing", filters: [
                ["custrecord_hris_eds_employee", columns: "anyof", getUserId]
            ],
            [
                new nlobjSearchColumn("custrecord_hris_eds_employee" }).run(),
                new nlobjSearchColumn("custrecord_hris_eds_employeeweeklyoff"),
                new nlobjSearchColumn("custrecord_hris_eds_employeeholidays")
            ]
        );
        if (Employee_holiday_searchResult) {
        for (const i = 0; i < Employee_holiday_searchResult.length; i++) {
            const holidayList = Employee_holiday_searchResult[0].getValue('custrecord_hris_eds_employeeholidays');
            holidayList = holidayList.split(',')
        };
    
    
       
            for (const holidayCount = 0; holidayCount < holidayList.length; holidayCount++) {
                const holidayId = holidayList[holidayCount];
                if (holidayId) {
                    const a_holidayData = nlapiLookupField('customrecord_hris_holiday_master', holidayId, ['custrecord_hris_holiday_date', 'isinactive', 'custrecord_hris_holidayconsiderforleave']);
                    if (a_holidayData) {
                        const holidayDate = a_holidayData.custrecord_hris_holiday_date
                        const isInactive = a_holidayData.isinactive;
                        const ISHOLIDAYCONSIDERFORLEAVE = a_holidayData.custrecord_hris_holidayconsiderforleave;
                        holidayDate = nlapiStringToDate(holidayDate);
                        if ((holidayDate > fromDate) && (holidayDate < toDate) && isInactive == 'F' && ISHOLIDAYCONSIDERFORLEAVE == "T") {
    
                            count = count + 1;
    
                        }
                    }
                }
    
    
            }
    
        }
    
        return count;
    }
    
    
    function getDatediffIndays(startDate, endDate) {
    
        const one_day = 1000 * 60 * 60 * 24;
        const fromDate = startDate;
        const toDate = endDate
        log.debug({ title: 'getDatediffIndays', details: 'From Date = ' + fromDate + 'To Date = ' + toDate });
        const x = fromDate.split("/");
        const y = toDate.split("/");
        const date1 = new Date((x[2]), (x[1]), x[0]);
        const date2 = new Date((y[1] - 1), y[2], y[0]);
        const month1 = x[2] - 1;
        const month2 = y[2] - 1;
        const Diff = Math.ceil((date2.getTime() - date1.getTime()) / (one_day));
        log.debug({ title: 'getDatediffIndays', details: 'Date difference Return Value = ' + Diff });
        return Diff;
    
    }
    
    
    function SearchHolidayDate(s_holiday) {
        const holiday_master_filter = new Array();
        const holiday_master_column = new Array();
        s_holiday = parseFloat(s_holiday);
    
        holiday_master_filter.push(new nlobjSearchFilter('internalid', null, 'anyof', s_holiday))
        holiday_master_filter.push(new nlobjSearchFilter('custrecord_hris_holidayconsiderforleave', null, 'is', "T"))
        holiday_master_column.push(new nlobjSearchColumn('custrecord_hris_holiday_date'));
        holiday_master_column.push(new nlobjSearchColumn('name'));
    
        const holiday_date_result = search.create({ type: 'customrecord_hris_holiday_master', filters: holiday_master_filter, columns: holiday_master_column }).run();
        if (holiday_date_result != null) {
            for (const HoL = 0; HoL < holiday_date_result.length; HoL++) {
                const s_holiday_name = holiday_date_result[HoL].getValue('name')
                const s_holiday_date = holiday_date_result[HoL].getValue('custrecord_hris_holiday_date')
    
                s_holiday_date = nlapiStringToDate(s_holiday_date);
    
                const month = s_holiday_date.getMonth() + 1;
    
                const actual_date = s_holiday_date.getDate();
    
            }
        }
    }
    
    
    
    
    
    function get_excluded_weeklyoff_days_for_different_months(firstMonthDays, fromDate, toDate, FrmDt, ToDt) {
    
    
    
        const date_push = new Array();
        const frm_dt = new Date(fromDate);
        const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
        const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
        finaldays = parseFloat(finaldays) + 1;
        const count_date = finaldays;
        const date_day = frm_dt.getDay();
        for (const i = 1; i <= count_date; i++) {
    
            if (date_day > '7') {
    
                const date_day = 1;
            }
    
    
            date_push.push(date_day);
    
    
    
            date_day = parseFloat(date_day) + 1
        }
    
    
        return date_push;
    }
    
    function get_dates_between_dates(fromDate, toDate, FrmDt, ToDt) {
        const date_push_date = new Array();
        const frm_dt = new Date(fromDate);
    
        const count_date = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
        for (const i = 0; i < count_date; i++) {
            const date_date = frm_dt.getDate() + i;
            date_day = parseFloat(date_date);
            date_push_date.push(date_day);
        }
    
        return date_push_date;
    
    }
    
    
    
    
    function holidayInclude(leave_type) {
    
        const holidayCheck = false;
        const filters = new Array();
        const column = new Array();
        if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
            filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
    
            column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_includeholiday'));
            const leaveTypeConfigWO = search.create({ type: 'customrecord_hris_leaveconfig', filters: filters, columns: column }).run();
            if (leaveTypeConfigWO != null) {
                holidayCheck = leaveTypeConfigWO[0].getValue('custrecord_hris_lveconfig_includeholiday')
                
            }
    
        }
    
        return holidayCheck;
    }
    
    
    
    
    
    function get_between_dates_in_different_months(FrmMonth, FrmDt, TOMonth, ToDt, fromDate) {
        const date_push_date = new Array();
        const frm_month_total_days = getArryMonthDays(FrmMonth);
        const frm_month_days = parseFloat(frm_month_total_days) - parseFloat(FrmDt) + 1;
        const frm_dt = new Date(fromDate);
        const to_month_days = ToDt;
        const total_days = parseFloat(frm_month_days) + parseFloat(to_month_days);
        for (const i = 0; i < total_days; i++) {
            const date_date = frm_dt.getDate() + i;
            date_date = parseFloat(date_date);
            if (date_date > frm_month_total_days) {
                date_date = (parseFloat(date_date) - parseFloat(date_date) + i) - 2;
            }
            date_push_date.push(date_date);
        }
        return date_push_date;
    
    }
    
    
    
    
    function halfday_Include(leave_type) {
        const halfdayCheck = false;
        const filters = new Array();
    
    
        if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
            filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
            const column = new Array();
            column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_allowhalfday'));
            const leaveTypeConfigWO = search.create({ type: 'customrecord_hris_leaveconfig', filters: filters, columns: column }).run();
            if (leaveTypeConfigWO != null) {
                halfdayCheck = leaveTypeConfigWO[0].getValue('custrecord_hris_lveconfig_allowhalfday')
            }
    
        }
    
        return halfdayCheck;
    }
    
    
    function encashment_min_days(leave_type) {
        if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
            const filters = new Array();
            filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
            const column = new Array();
            column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_minencashallow '));//leave type config id 
            const leaveTypeConfigWO = search.create({ type: 'customrecord_hris_leaveconfig', filters: filters, columns: column }).run();
            if (leaveTypeConfigWO != null) {
                const min_encashment_days = leaveTypeConfigWO[0].getValue('custrecord_hris_lveconfig_minencashallow ')
            }
    
    
        }
    
        return min_encashment_days;
    }
    
    
    
    
    function encashment_max_days(leave_type) {
        if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
            const filters = new Array();
            filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
            const column = new Array();
            column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_maxencashallow'));
            const leaveTypeConfigWO = search.create({ type: 'customrecord_hris_leaveconfig', filters: filters, columns: column }).run();
            if (leaveTypeConfigWO != null) {
                const max_encashment_days = leaveTypeConfigWO[0].getValue('custrecord_hris_lveconfig_maxencashallow')
            }
    
        }
    
        return max_encashment_days;
    }
    
    
    
    function min_days_apply(leave_type) {
        const filters = new Array();
        const column = new Array();
    
        if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
            filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
            column.push(new nlobjSearchColumn('custrecord_hris_lvecnfg_mindaystoapply'));
            const leaveTypeConfigWO = search.create({ type: 'customrecord_hris_leaveconfig', filters: filters, columns: column }).run();
            if (leaveTypeConfigWO != null) {
                const min_days = leaveTypeConfigWO[0].getValue('custrecord_hris_lvecnfg_mindaystoapply')
                log.debug({ title: 'min_days', details: min_days });
            }
    
        }
    
        return min_days;
    }
    
    
    function max_days_apply(leave_type) {
        const filters = new Array();
        const column = new Array();
        filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
        column.push(new nlobjSearchColumn('custrecord_hris_lvecfg_maxdaystoapply'));
        const leaveTypeConfigWO = search.create({ type: 'customrecord_hris_leaveconfig', filters: filters, columns: column }).run();
        if (leaveTypeConfigWO != null) {
            const max_days = leaveTypeConfigWO[0].getValue('custrecord_hris_lvecfg_maxdaystoapply')
        }
        return max_days;
    }
    
    
    
    function encashment_days_apply_check(leave_type) {
        const encashment_days_check = false;
        const falsevalue = false;
        const filters = new Array();
        const column = new Array();
    
        if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
    
            filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
           // filters.push(new nlobjSearchFilter('externalid', null, 'is', leave_type))
            column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_encashallowed'));
            column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_encashavailed'));
            const leaveTypeConfigWO = search.create({ type: 'customrecord_hris_leaveconfig', filters: filters, columns: column }).run();
    
            if (leaveTypeConfigWO != null) {
                encashment_days_check = leaveTypeConfigWO[0].getValue('custrecord_hris_lveconfig_encashallowed')
    
                if (encashment_days_check == 'T') {
                    const encashment_days_avail = leaveTypeConfigWO[0].getText('custrecord_hris_lveconfig_encashavailed')
    
                    if (encashment_days_avail == 'Yearly') {
    
                        return encashment_days_check;
    
                    } else {
    
                        return falsevalue;
    
                    }
                } else {
                    return falsevalue;
    
                }
            }
    
    
        }
       filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type));
        //filters.push(new nlobjSearchFilter('externalid', null, 'is', leave_type));
        column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_encashallowed'));
        column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_encashavailed'));
        const leaveTypeConfigWO = search.create({ type: 'customrecord_hris_leaveconfig', filters: filters, columns: column }).run();
    
        if (leaveTypeConfigWO != null) {
            encashment_days_check = leaveTypeConfigWO[0].getValue('custrecord_hris_lveconfig_encashallowed')
    
            if (encashment_days_check == 'T') {
                const encashment_days_avail = leaveTypeConfigWO[0].getText('custrecord_hris_lveconfig_encashavailed')
    
                if (encashment_days_avail == 'Yearly') {
    
                    return encashment_days_check;
    
                } else {
    
                    return falsevalue;
    
                }
            } else {
                return falsevalue;
    
            }
        }
    
    }
    
    
    function check_from_to_date_holiday(frm_date, getUserId) {
    
        const date = frm_date;
        const result = 'F';
        const Holiday_name = new Array();
        const filters = new Array();
        const column = new Array();
        filters.push(new nlobjSearchFilter('custrecord_hris_holidayconsiderforleave', null, 'is', "T"))
        filters.push(new nlobjSearchFilter('custrecord_hris_holiday_date', null, 'on', date))
        column.push(new nlobjSearchColumn('internalid'));
    
        const check_holiday_present_result = search.create({ type: 'customrecord_hris_holiday_master', filters: filters, columns: column }).run();
    
        if (check_holiday_present_result != null) {
            for (const i = '0'; i < check_holiday_present_result.length; i++) {
                Holiday_name = check_holiday_present_result[i].getValue('internalid');
    
                const result = holiday_check_with_employee(getUserId, Holiday_name);
                if (result == false) {
                    break;
                }
            }
    
        }
        return result;
    }
    
    
    
    function holiday_check_with_employee(getUserId, Holiday_name) {
        const Employee_holiday_result = search.create({ type: "customrecord_hris_employeedatasourcing", filters: [
                ["custrecord_hris_eds_employee", columns: "anyof", getUserId],
                "AND",
                ["custrecord_hris_eds_employeeholidays", "anyof", Holiday_name]
            ],
            [
                new nlobjSearchColumn("custrecord_hris_eds_employeeholidays" }).run()
            ]
        );
    
        if (Employee_holiday_result) {
            return false;
    
        } else {
            return true;
        }
    
    
    }
    
    
    function check_weeklyoff_on_frm_to_date(frm_date, getUserId) {
    
        const weeklyoff = new Array();
        const date = frm_date;
        date = nlapiStringToDate(date);
    
        const date_split = date.toString().split(' ');
        const day = date_split[0];
    
    
        const filters = new Array();
        const columns = new Array();
    
        filters.push(new nlobjSearchFilter('name', null, 'startswith', day))
        columns.push(new nlobjSearchColumn('internalid'));
        const week_result = search.create({ type: 'customlist_hris_week_days', filters: filters, columns: columns }).run();
        if (week_result != null) {
            internal_id = week_result[0].getValue('internalid');
            const weeklyoff_function = check_function(getUserId, internal_id)
            return weeklyoff_function;
        }
    
        function check_function(getUserId, internal_id) {
            const Employee_weeklyoff_result = search.create({ type: "customrecord_hris_employeedatasourcing", filters: [
                    ["custrecord_hris_eds_employee", columns: "anyof", getUserId],
                    "AND",
                    ["custrecord_hris_eds_employeeweeklyoff", "anyof", internal_id]
                ],
                [
                    new nlobjSearchColumn("custrecord_hris_eds_employee" }).run(),
                    new nlobjSearchColumn("custrecord_hris_eds_hiredate")
                ]
            );
    
    
            if (Employee_weeklyoff_result != null) {
    
                return true;
    
            }
    
            return false;
    
    
    
        }
    
    
    
    
    }
    
    
    function GetCurrentDate() {
        const today = new Date();
        const dd = today.getDate();
        const mm = today.getMonth() + 1;
        const yy = today.getFullYear();
        return mm + "/" + dd + "/" + yy;
    
    }
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    function GetRoundOffvalue(finalAnnual) {
        const final_days = finalAnnual;
        log.debug({ title: "", details: "final_days************************************" + final_days });
        const rounded_final_value;
        const split_final_days = new Array();
      
        split_final_days = final_days.toString().split(".");
      
        const integer_no = split_final_days[0];
        log.debug({ title: "", details: "integer_no************************************" + integer_no });
      
        const i_decimal_val = split_final_days[1];
        log.debug({ title: "", details: "i_decimal_val************************************" + i_decimal_val });
      
        
      
        const compare_no = "0" + "." + i_decimal_val;
        log.debug({ title: "typeof(compare_no, details: '' })" + typeof compare_no,
          "compare_no************************************" + compare_no
        );     
         rounded_final_value = parseFloat(integer_no); 
      
     
      
        log.debug({ title: "", details: "rounded_final_value************************************" +
            rounded_final_value });
        return rounded_final_value;
      }
    
    
    
    
    
    function get_sequence_no(leave_type) {
    
        const filters = new Array();
        const columns = new Array();
    
        filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
        //filters.push(new nlobjSearchFilter('externalid', null, 'is', leave_type))
    
        columns.push(new nlobjSearchColumn('custrecord_hris_lvecnfg_seqno'));
        columns.push(new nlobjSearchColumn('custrecord_hris_lveconfig_allowneglevbal'));
        columns.push(new nlobjSearchColumn('custrecord_hris_lvecfg_maxnegativebal'));
    
        const compoff_record_result = search.create({ type: 'customrecord_hris_leaveconfig', filters: filters, columns: columns }).run();
    
        if (compoff_record_result != null) {
    
            const sequence_no = compoff_record_result[0].getValue('custrecord_hris_lvecnfg_seqno')
            const negAllowChk = compoff_record_result[0].getValue('custrecord_hris_lveconfig_allowneglevbal')
            const maxNegAllow = compoff_record_result[0].getValue('custrecord_hris_lvecfg_maxnegativebal')
    
    
        }
        return sequence_no + "#" + negAllowChk + "#" + maxNegAllow;
    }

    return {
        pageInit_leaveApplication: pageInit_leaveApplication,
        postSourcing_validate_checkbox: postSourcing_validate_checkbox
    };
});
