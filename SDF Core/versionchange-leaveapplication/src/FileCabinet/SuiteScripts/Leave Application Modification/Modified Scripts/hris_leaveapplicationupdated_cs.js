var frmhalfDay;
var toHalfDay;
var datediff = 0;

function pageInit_leaveApplication(type) {
    if (type == 'create') {
        debugger;
        nlapiDisableField('custrecord_hris_lve_noofencashmentdays', true);
        nlapiDisableField('customrecord_hris_leaveapplication', true);
        nlapiDisableField('custrecord_hris_lve_cancelreason', true);
        nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff);
    }

}
var TYPE;
function onSave_Leave_Application() {
    var encashmentCheck = nlapiGetFieldValue('custrecord_hris_lve_applylveencashment')
    var FromDate = nlapiGetFieldValue('custrecord_hris_lve_fromdate')
    var ToDate = nlapiGetFieldValue('custrecord_hris_lve_todate');
    var noOfEncashDays = nlapiGetFieldValue('custrecord_hris_lve_noofencashmentdays');

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
  var leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype');
  var seq_no_search = get_sequence_no(leave_type)
 /*   var E_leavetype = nlapiGetFieldValue("custrecord_hris_lve_leavetype");
    var leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid');  */
    var emp_name = nlapiGetFieldValue('custrecord_hris_lve_employeename')
    nlapiLogExecution('DEBUG','Seq No',seq_no_search);
    var seq_no_split = seq_no_search.split('#')
    var seq_no = seq_no_split[0];

    if(seq_no !=3){
    var leavebalanceRec = searchLeaveBalance(leave_type, emp_name)
    var LEAVEBAL = leavebalanceRec.split('#');
    var leavebalance = LEAVEBAL[0];
    nlapiLogExecution('DEBUG', 'leavebalance', leavebalance)
    nlapiSetFieldValue('custrecord_hris_lve_leavebalance', leavebalance, false)
    var roundoffleavebalance = GetRoundOffvalue(leavebalance);
    nlapiSetFieldValue('custrecord_hris_lve_leavebalance_wholeno', roundoffleavebalance, false)
    }


    var reason = nlapiGetFieldValue('custrecord_hris_lve_leavereason')
    var encashment = nlapiGetFieldValue('custrecord_hris_lve_applylveencashment')
    if (encashment == 'F') {
        if (reason == '' || reason == 'undefined' || reason == null) {

        }

    }

// Getting External Id

   var leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype')
    
/* var E_leavetype = nlapiGetFieldValue("custrecord_hris_lve_leavetype");
var leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid');   */


    var seq_no_search = get_sequence_no(leave_type)
    var seq_no_split = seq_no_search.split('#')
    var seq_no = seq_no_split[0];

    if (seq_no == 5) {

        var tot_days = nlapiGetFieldValue('custrecord_hris_lve_totalnodays')
        var validTillDate = nlapiGetFieldValue('custrecord_hris_lve_validtilldate')

        if (tot_days == 0.5) {

            var f_hday = nlapiGetFieldValue('custrecord_hris_lve_fromhalfday');
            var t_hday = nlapiGetFieldValue('custrecord_hris_lve_tohalfday');


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
    var leave_array = new Array();
    var filters = new Array();
    var column = new Array();
    var total_days = nlapiGetFieldValue('custrecord_hris_lve_totalnodays');
    //Get External id
    var leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype');
   /*  var E_leavetype = nlapiGetFieldValue("custrecord_hris_lve_leavetype");
    var leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid');   */

    filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
  // filters.push(new nlobjSearchFilter('externalid', null, 'is', leave_type))
    column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_suportdocallow'));
    column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_mindaysupport'));
    var leaveconf_results = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, column);
    if (leaveconf_results != null) {
        var support_doc_allowed = leaveconf_results[0].getValue('custrecord_hris_lveconfig_suportdocallow')
        if (support_doc_allowed == 'T') {
            var support_doc_days = leaveconf_results[0].getValue('custrecord_hris_lveconfig_mindaysupport')
            if (total_days > support_doc_days) {
                var support_doc = nlapiGetFieldValue('custrecord_hris_lve_supportdocument');
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
    var leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype');

    




    if (name == 'custrecord_hris_lve_todate') {

        var fromDate = nlapiGetFieldValue('custrecord_hris_lve_fromdate')
        var toDate = nlapiGetFieldValue('custrecord_hris_lve_todate');
        fromDate = nlapiStringToDate(fromDate);
        toDate = nlapiStringToDate(toDate);
        if (toDate < fromDate) {
            alert('To Date should be greater than From Date ')
            nlapiSetFieldValue('custrecord_hris_lve_todate', '', false);
            return false;
        }

        if (!fromDate) {
            alert("Please select From Date First and then you can select To Date ");
            nlapiSetFieldValue('custrecord_hris_lve_todate', '', false);
            return false;
        }

    }

    if (name == 'custrecord_hris_lve_fromdate') {

        var fromDate = nlapiGetFieldValue('custrecord_hris_lve_fromdate')
        var toDate = nlapiGetFieldValue('custrecord_hris_lve_todate');
        fromDate = nlapiStringToDate(fromDate);
        if(toDate){
        toDate = nlapiStringToDate(toDate);
        
        if (fromDate > toDate) {
            alert('From Date should be lesser than To Date ')
            nlapiSetFieldValue('custrecord_hris_lve_fromdate', '', false);
            return false;
        }
    }
      

    }

    




    var getUserId = nlapiGetFieldValue('custrecord_hris_lve_employeename');

    if (name == 'custrecord_hris_lve_leavetype') {
       var leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype');
      /*  var E_leavetype = nlapiGetFieldValue("custrecord_hris_lve_leavetype");
        var leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid');  */
        var employee_name = nlapiGetFieldValue('custrecord_hris_lve_employeename');



        if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
            var seq_no_search = get_sequence_no(leave_type)
            var seq_no_split = seq_no_search.split('#')
            var seq_no = seq_no_split[0];


            if (seq_no == 5) {
                nlapiDisableField('custrecord_hris_lve_todate', true)

            } else if(seq_no !=3)  {
                var leavebalanceRec = searchLeaveBalance(leave_type, employee_name);
                var LEAVEBAL = leavebalanceRec.split('#');
                var leavebalance = LEAVEBAL[0];
                var LeaveEncashbal = LEAVEBAL[1];
                nlapiSetFieldValue('custrecord_hris_lve_leavebalance', leavebalance, false)
                if (leavebalance > 1){
                    var roundoffleavebalance = GetRoundOffvalue(leavebalance);
                }
                else{
                    var roundoffleavebalance = leavebalance
                }
               
                nlapiSetFieldValue('custrecord_hris_lve_leavebalance_wholeno', roundoffleavebalance, false)
                nlapiSetFieldValue('custrecord_hris_lve_validtilldate', '', false)
                if (LeaveEncashbal != null && LeaveEncashbal != '') {
                    nlapiSetFieldValue('custrecord_hris_lve_encashmentlevbalance', LeaveEncashbal, false)

                }
            }
        }

        if (leave_type == '')
        {
            nlapiSetFieldValue('custrecord_hris_lve_leavebalance', '', false, false);
            nlapiSetFieldValue('custrecord_hris_lve_leavebalance_wholeno', '',false,false); 

            var url = nlapiResolveURL('RECORD', 'customrecord_hris_leaveapplication', null, null)
            window.onbeforeunload = null;
            window.open(url, '_self')

        }

    }
    if (name == 'custrecord_hris_lve_fromdate' || name == 'custrecord_hris_lve_todate') {

        var FrmDt;
        var ToDt;
       var leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype');
      /* var E_leavetype = nlapiGetFieldValue("custrecord_hris_lve_leavetype");
    var leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid');  */

        if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
            var fromDate = nlapiGetFieldValue('custrecord_hris_lve_fromdate')
            frmhalfDay = nlapiGetFieldValue('custrecord_hris_lve_fromhalfday');
            var toDate = nlapiGetFieldValue('custrecord_hris_lve_todate');
            toHalfDay = nlapiGetFieldValue('custrecord_hris_lve_tohalfday');

            var Leave_bal = nlapiGetFieldValue('custrecord_hris_lve_leavebalance');
            if (fromDate != '' && fromDate != 'undefined' && fromDate != null && toDate != '' && toDate != 'undefined' && toDate != null) {
                if (fromDate == toDate ) {

                  var leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype')
                /*   var E_leavetype = nlapiGetFieldValue("custrecord_hris_lve_leavetype");
                   var leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid'); */ 
                    var seq_no_search = get_sequence_no(leave_type)
                    var seq_no_split = seq_no_search.split('#')
                    var seq_no = seq_no_split[0];

                    if (seq_no == 2 || seq_no == 8 || seq_no ==13) {

                        if (Leave_bal == 0) {


                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', 1, false)
                        }


                    }

                    if (seq_no != 2 && seq_no != 8 && seq_no !=13) {
                        if (Leave_bal < 1) {
                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', Leave_bal, false)
                        }
                        if (Leave_bal >= 1) {
                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', 1, false)
                        }


                    }



                }

               
                if (fromDate != toDate) {

                    fromDate = nlapiStringToDate(fromDate);

                    var FrmMonth = fromDate.getMonth() + 1;

                    FrmDt = fromDate.getDate();



                    toDate = nlapiStringToDate(toDate);

                    var TOMonth = toDate.getMonth() + 1;

                    ToDt = toDate.getDate();



                    var weeklyoffIncCheck = weeklyOffInclude(leave_type);
                    var holiday_TF_check = holidayInclude(leave_type)
                    nlapiLogExecution("debug", "holiday_TF_check", holiday_TF_check);
                    nlapiLogExecution("debug", "weeklyoffIncCheck", weeklyoffIncCheck);
                    var empWeeklyoff = searchEmpsWeeklyOff(getUserId);
                    nlapiLogExecution("debug", "empWeeklyoff", empWeeklyoff);
                    var WEEKLYOFF = empWeeklyoff.split('#')
                    var WeeklyOfCount = WEEKLYOFF[0]

                    var WeeklyOffInW = WEEKLYOFF[1];

                    if (WeeklyOfCount == 2 || WeeklyOfCount == 1)
                    {

                        var finalWeeklyOff = WeeklyOffInW.split(',');
                        var firstWeeklyOffD = finalWeeklyOff[0];
                        // By Florence
                       /*  if (firstWeeklyOffD) {
                            firstWeeklyOffD = nlapiLookupField('customlist_hris_week_days', firstWeeklyOffD, 'custrecord_hris_lve_wkday_act_seq_no');
                        } */
                        var secWeeklyOffD = finalWeeklyOff[1];
                       /*  if (secWeeklyOffD) {
                            secWeeklyOffD = nlapiLookupField('customlist_hris_week_days', secWeeklyOffD, 'custrecord_hris_lve_wkday_act_seq_no');
                        } */

                        if (FrmMonth == TOMonth) 
						{
                            if (weeklyoffIncCheck == 'T') 
							{


                                var frm_halfday = nlapiGetFieldValue('custrecord_hris_lve_fromhalfday');
                                var to_halfday = nlapiGetFieldValue('custrecord_hris_lve_tohalfday');

                               
                               
                               // if (frm_halfday == 'F' && to_halfday == 'F') {


                                    if (holiday_TF_check == 'T') {
                                        var timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());

                                        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

                                        diffDays = diffDays + 1;

                                        nlapiSetFieldValue('custrecord_hris_lve_totalnodays', diffDays, false)



                                    }
                                    if (holiday_TF_check == 'F') {
                                        var holiday_count = searchEmpholidays(getUserId, fromDate, toDate, FrmDt, ToDt)
                                        if (holiday_count == 0) {
                                            datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                        } else {
                                            datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(holiday_count) + 1;
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                        }
                                    }
                             //  } 

                            } 
                            else
                            {
                                var frm_halfday = nlapiGetFieldValue('custrecord_hris_lve_fromhalfday');
                                nlapiLogExecution("debug", "frm_halfday", frm_halfday);
                                var to_halfday = nlapiGetFieldValue('custrecord_hris_lve_tohalfday');
                                nlapiLogExecution("debug", "frm_halfday", to_halfday);
                              
                             //   if (frm_halfday == 'F' && to_halfday == 'F') {
                                    nlapiLogExecution("debug", "holiday_TF_check", holiday_TF_check);
                                    if (holiday_TF_check == 'T') {

                                        var frm_date_val = nlapiGetFieldValue('custrecord_hris_lve_fromdate')
                                        var to_date_val = nlapiGetFieldValue('custrecord_hris_lve_todate')
                                        var frm_date_val_obj = nlapiStringToDate(frm_date_val)
                                        var date_split = frm_date_val_obj.toString().split(' ');
                                        var day = date_split[0];
                                        var frm_week_day = WeeklyOff(day)
                                        var to_date_val_obj = nlapiStringToDate(to_date_val)
                                        var date_split1 = to_date_val_obj.toString().split(' ');
                                        var day1 = date_split1[0];
                                        var to_week_day = WeeklyOff(day1)
                                        var get_all_dates = get_excluded_weeklyoff_days(fromDate, toDate, FrmDt, ToDt)
                                        var tot_days_count = get_all_dates.length;
                                        var day_split = get_all_dates.toString().split(',')
                                        var flag = 0;
                                        for (var j = 0; j < tot_days_count; j++) {

                                            var one_by_one_day = day_split[j]
                                            if (one_by_one_day == firstWeeklyOffD || one_by_one_day == secWeeklyOffD) {
                                                flag = flag + 1;
                                            }

                                        }
                                        if (flag == '0') {
                                            datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                        }
                                        if (flag == '1') {
                                            var final_flag = parseFloat(flag) * 1
                                            datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                        }
                                        if (flag == '2') {
                                            var final_flag = parseFloat(flag) * 1
                                            datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                        }
                                        if (flag > '2') {
                                            var final_flag = parseFloat(flag) * 1
                                            datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                        }
                                    }
                                    if (holiday_TF_check == 'F') {

                                        var holiday_count = searchEmpholidays(getUserId, fromDate, toDate, FrmDt, ToDt, FrmMonth, TOMonth)

                                        var context = nlapiGetContext();
                                        var user = context.getUser();
                                        // by florence
                                     /*    nlapiLogExecution('DEBUG', 'user', user);
                                        if (user == '329738') {
                                            alert('holiday_count' + holiday_count)
                                        } */

                                        var frm_date_val = nlapiGetFieldValue('custrecord_hris_lve_fromdate')
                                        var to_date_val = nlapiGetFieldValue('custrecord_hris_lve_todate')

                                        var frm_date_val_obj = nlapiStringToDate(frm_date_val)
                                        var date_split = frm_date_val_obj.toString().split(' ');
                                        var day = date_split[0];
                                        var frm_week_day = WeeklyOff(day)

                                        var to_date_val_obj = nlapiStringToDate(to_date_val)
                                        var date_split1 = to_date_val_obj.toString().split(' ');
                                        var day1 = date_split1[0];
                                        var to_week_day = WeeklyOff(day1)

                                        var get_all_dates = get_excluded_weeklyoff_days(fromDate, toDate, FrmDt, ToDt)

                                        var tot_days_count = get_all_dates.length;

                                        var day_split = get_all_dates.toString().split(',')
                                        var flag = 0;
                                        for (var j = 0; j < tot_days_count; j++) {


                                            var one_by_one_day = day_split[j]

                                            if (one_by_one_day == firstWeeklyOffD || one_by_one_day == secWeeklyOffD) {
                                                flag = flag + 1;
                                            }

                                        }


                                        if (flag == '0') {
                                            if (holiday_count == 0) {
                                                datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                            } else {
                                                var datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(holiday_count) + 1;
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                            }
                                        }
                                        if (flag == '1') {
                                            if (holiday_count == 0) {
                                                var final_flag = parseFloat(flag) * 1
                                                datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                            } else {
                                                var final_flag = parseFloat(flag) * 1
                                                datediff = (((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag)) - parseFloat(holiday_count);
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                            }
                                        }
                                        if (flag == '2') {
                                            if (holiday_count == 0) {
                                                var final_flag = parseFloat(flag) * 1
                                                datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                            } else {
                                                var final_flag = parseFloat(flag) * 1
                                                datediff = (((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag)) - parseFloat(holiday_count);
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                            }

                                        }
                                        if (flag > '2') {
                                            var final_flag = parseFloat(flag) * 1
                                            datediff = (((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag)) - parseFloat(holiday_count);
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                        }
                                    }
                                //}

                            }

                        }
                        else
                        {
                            if (weeklyoffIncCheck == 'T') 
							{
                                var frm_halfday = nlapiGetFieldValue('custrecord_hris_lve_fromhalfday');
                                var to_halfday = nlapiGetFieldValue('custrecord_hris_lve_tohalfday');
                               

                               // if (frm_halfday == 'F' && to_halfday == 'F') {
                                    if (holiday_TF_check == 'T') {

                                        var timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());

                                        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

                                        diffDays = diffDays + 1;

                                        nlapiSetFieldValue('custrecord_hris_lve_totalnodays', diffDays, false)

                                    }
                                    if (holiday_TF_check == 'F') {
                                        var holiday_count = searchEmpholidays(getUserId, fromDate, toDate, FrmDt, ToDt, FrmMonth, TOMonth)

                                        if (holiday_count == 0) {
                                            var monthdays = getArryMonthDays(FrmMonth);
                                            var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                                            var timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                            var finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                            finaldays = finaldays + 1;
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)

                                        } else {
                                            var monthdays = getArryMonthDays(FrmMonth);
                                            var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;

                                            var timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                            var finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                            finaldays = finaldays + 1;
                                            finaldays = finaldays - parseFloat(holiday_count);
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                        }
                                    }
                               // }

                            }
                            else
                            {
                                var frm_halfday = nlapiGetFieldValue('custrecord_hris_lve_fromhalfday');
                                var to_halfday = nlapiGetFieldValue('custrecord_hris_lve_tohalfday');

                                
                                //if (frm_halfday == 'F' && to_halfday == 'F') 
								//{
                                    if (holiday_TF_check == 'T') 
									{
                                        var frm_date_val = nlapiGetFieldValue('custrecord_hris_lve_fromdate')
                                        var to_date_val = nlapiGetFieldValue('custrecord_hris_lve_todate')
                                        var monthdays = getArryMonthDays(FrmMonth);
                                        var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                                        var frm_date_val_obj = nlapiStringToDate(frm_date_val)
                                        var date_split = frm_date_val_obj.toString().split(' ');
                                        var day = date_split[0];
                                        var frm_week_day = WeeklyOff(day)
                                        var to_date_val_obj = nlapiStringToDate(to_date_val)
                                        var date_split1 = to_date_val_obj.toString().split(' ');
                                        var day1 = date_split1[0];
                                        var to_week_day = WeeklyOff(day1)
                                        var get_all_dates = get_excluded_weeklyoff_days_for_different_months(firstMonthDays, fromDate, toDate, FrmDt, ToDt)
                                        var tot_days_count = get_all_dates.length;
                                        var day_split = get_all_dates.toString().split(',')

                                        var flag = 0;
                                        for (var j = 0; j < tot_days_count; j++) {

                                            var one_by_one_day = day_split[j]
                                            if (one_by_one_day == firstWeeklyOffD || one_by_one_day == secWeeklyOffD) {
                                                flag = flag + 1;

                                            }

                                        }
										nlapiLogExecution('DEBUG', 'holiday_TF_check T day_split', day_split)
                                        nlapiLogExecution('DEBUG', 'holiday_TF_check T firstWeeklyOffD', firstWeeklyOffD)
                                        nlapiLogExecution('DEBUG', 'holiday_TF_check T secWeeklyOffD', secWeeklyOffD)
										nlapiLogExecution('DEBUG', 'holiday_TF_check T flag', flag)
                                        if (flag == '0') {
                                            var monthdays = getArryMonthDays(FrmMonth);
                                            var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                            var timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                            var finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                            finaldays = finaldays + 1;
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                        }

                                        if (flag == '1') {
                                            var final_flag = parseFloat(flag) * 1
                                            var monthdays = getArryMonthDays(FrmMonth);
                                            var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);

                                            var timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                            var finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                            finaldays = finaldays + 1;
                                            finaldays = finaldays - parseFloat(final_flag);
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                        }
                                        if (flag == '2') {
                                            var final_flag = parseFloat(flag) * 1
                                            var monthdays = getArryMonthDays(FrmMonth);
                                            var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);

                                            var timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                            var finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                            finaldays = finaldays + 1;
                                            finaldays = finaldays - parseFloat(final_flag);
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                        }
                                        if (flag > '2') {
                                            var final_flag = parseFloat(flag) * 1


                                            var timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                            var finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                            finaldays = finaldays + 1 - parseFloat(final_flag);
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                        }
                                    }
                                    if (holiday_TF_check == 'F') 
									{
                                        var holiday_count = searchEmpholidays(getUserId, fromDate, toDate, FrmDt, ToDt, FrmMonth, TOMonth)
                                        var frm_date_val = nlapiGetFieldValue('custrecord_hris_lve_fromdate')
                                        var to_date_val = nlapiGetFieldValue('custrecord_hris_lve_todate')
                                        var monthdays = getArryMonthDays(FrmMonth);
                                        var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                                        var frm_date_val_obj = nlapiStringToDate(frm_date_val)
                                        var date_split = frm_date_val_obj.toString().split(' ');
                                        var day = date_split[0];
                                        var frm_week_day = WeeklyOff(day)
                                        var to_date_val_obj = nlapiStringToDate(to_date_val)
                                        var date_split1 = to_date_val_obj.toString().split(' ');
                                        var day1 = date_split1[0];
                                        var to_week_day = WeeklyOff(day1)
                                        var get_all_dates = get_excluded_weeklyoff_days_for_different_months(firstMonthDays, fromDate, toDate, FrmDt, ToDt)
                                        var tot_days_count = get_all_dates.length;
                                        var day_split = get_all_dates.toString().split(',')
                                        nlapiLogExecution('DEBUG', 'a1 day_split', day_split)
                                        nlapiLogExecution('DEBUG', 'a1 firstWeeklyOffD', firstWeeklyOffD)
                                        nlapiLogExecution('DEBUG', 'a1 secWeeklyOffD', secWeeklyOffD)

                                        var flag = 0;
                                        for (var j = 0; j < tot_days_count; j++) {
                                            var one_by_one_day = day_split[j]
                                            if (one_by_one_day == firstWeeklyOffD || one_by_one_day == secWeeklyOffD) {
                                                flag = flag + 1;

                                            }

                                        }
										nlapiLogExecution('DEBUG', 'a1 flag', flag)
										nlapiLogExecution('DEBUG', 'a1 holiday_count', holiday_count)
                                        if (flag == '0') {
                                            if (holiday_count == 0) {
                                                var monthdays = getArryMonthDays(FrmMonth);
                                                var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);

                                                var timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                var finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                finaldays = finaldays + 1;
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                            } else {
                                                var monthdays = getArryMonthDays(FrmMonth);
                                                var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);

                                                var timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                var finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                finaldays = finaldays + 1;
                                                finaldays = finaldays - parseFloat(holiday_count);
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                            }
                                        }
                                        if (flag == '1') {
                                            if (holiday_count == 0) {
                                                var final_flag = parseFloat(flag) * 1
                                                var monthdays = getArryMonthDays(FrmMonth);
                                                var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                var timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                var finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                finaldays = finaldays + 1;
                                                finaldays = finaldays - parseFloat(final_flag)
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                            } else {
                                                var final_flag = parseFloat(flag) * 1
                                                var monthdays = getArryMonthDays(FrmMonth);
                                                var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                var timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                var finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                finaldays = finaldays + 1;
                                                finaldays = finaldays - parseFloat(final_flag)
                                                finaldays = finaldays - parseFloat(holiday_count)
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                            }
                                        }
                                        if (flag == '2') {
                                            if (holiday_count == 0) {
                                                var final_flag = parseFloat(flag) * 1
                                                var monthdays = getArryMonthDays(FrmMonth);
                                                var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                var timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                var finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                finaldays = finaldays + 1;
                                                finaldays = finaldays - parseFloat(final_flag)
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                            } else {
                                                var final_flag = parseFloat(flag) * 1
                                                var monthdays = getArryMonthDays(FrmMonth);
                                                var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                var timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                var finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                finaldays = finaldays + 1;
                                                finaldays = finaldays - parseFloat(final_flag)
                                                finaldays = finaldays - parseFloat(holiday_count)

                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                            }
                                        }
                                        if (flag > '2') {
                                            if (holiday_count == 0) {

                                                var final_flag = parseFloat(flag) * 1
                                                var timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                var finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                finaldays = finaldays + 1;
                                                finaldays = finaldays - parseFloat(final_flag);
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                            } else {
                                                var final_flag = parseFloat(flag) * 1

                                                var timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                var finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                finaldays = finaldays + 1 - parseFloat(final_flag);
                                                finaldays = finaldays - parseFloat(holiday_count);
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
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
                                var frm_halfday = nlapiGetFieldValue('custrecord_hris_lve_fromhalfday');
                                var to_halfday = nlapiGetFieldValue('custrecord_hris_lve_tohalfday');

                                
                              //  if (frm_halfday == 'F' && to_halfday == 'F') {
                                    if (holiday_TF_check == 'T') {
                                        datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
                                        nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                    }
                                    if (holiday_TF_check == 'F') {

                                        var holiday_count = searchEmpholidays(getUserId, fromDate, toDate)

                                        if (holiday_count == 0) {
                                            datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                        } else {

                                            datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(holiday_count) + 1;
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                        }
                                    }
                               // }
                            } else
                            {
                                var frm_halfday = nlapiGetFieldValue('custrecord_hris_lve_fromhalfday');
                                var to_halfday = nlapiGetFieldValue('custrecord_hris_lve_tohalfday');
                               
                               // if (frm_halfday == 'F' && to_halfday == 'F') {

                                    if (holiday_TF_check == 'T') {

                                        var frm_date_val = nlapiGetFieldValue('custrecord_hris_lve_fromdate')
                                        var to_date_val = nlapiGetFieldValue('custrecord_hris_lve_todate')
                                        var frm_date_val_obj = nlapiStringToDate(frm_date_val)
                                        var date_split = frm_date_val_obj.toString().split(' ');
                                        var day = date_split[0];
                                        var frm_week_day = WeeklyOff(day)
                                        var to_date_val_obj = nlapiStringToDate(to_date_val)
                                        var date_split1 = to_date_val_obj.toString().split(' ');
                                        var day1 = date_split1[0];
                                        var to_week_day = WeeklyOff(day1)
                                        var get_all_dates = get_excluded_weeklyoff_days(fromDate, toDate, FrmDt, ToDt)
                                        var tot_days_count = get_all_dates.length;
                                        var day_split = get_all_dates.toString().split(',')
                                        var flag = 0;
                                        for (var j = 0; j < tot_days_count; j++) {
                                            var one_by_one_day = day_split[j]

                                            if (one_by_one_day == WeeklyOffInW) {
                                                flag = flag + 1;

                                            }

                                        }
                                        if (flag == '0') {
                                            datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                        }
                                        if (flag == '1') {
                                            var final_flag = parseFloat(flag) * 1
                                            datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1)
                                            datediff = parseFloat(datediff) - parseFloat(final_flag);
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                        }
                                        if (flag >= '2') {

                                            var final_flag = parseFloat(flag) * 1
                                            datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                        }
                                    }
                                    if (holiday_TF_check == 'F') {
                                        var holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
                                        var frm_date_val = nlapiGetFieldValue('custrecord_hris_lve_fromdate')
                                        var to_date_val = nlapiGetFieldValue('custrecord_hris_lve_todate')
                                        var frm_date_val_obj = nlapiStringToDate(frm_date_val)
                                        var date_split = frm_date_val_obj.toString().split(' ');
                                        var day = date_split[0];
                                        var frm_week_day = WeeklyOff(day)

                                        var to_date_val_obj = nlapiStringToDate(to_date_val)
                                        var date_split1 = to_date_val_obj.toString().split(' ');
                                        var day1 = date_split1[0];
                                        var to_week_day = WeeklyOff(day1)

                                        var get_all_dates = get_excluded_weeklyoff_days(fromDate, toDate, FrmDt, ToDt)
                                        var tot_days_count = get_all_dates.length;
                                        var day_split = get_all_dates.toString().split(',')
                                        var flag = 0;
                                        for (var j = 0; j < tot_days_count; j++) {
                                            var one_by_one_day = day_split[j]
                                            if (one_by_one_day == WeeklyOffInW) {
                                                flag = flag + 1;
                                            }

                                        }
                                        if (flag == '0') {
                                            if (holiday_count == 0) {
                                                datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                            } else {
                                                var datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(holiday_count) + 1;
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                            }
                                        }
                                        if (flag == '1') {
                                            if (holiday_count == 0) {
                                                var final_flag = parseFloat(flag) * 1
                                                datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                            } else {

                                                var final_flag = parseFloat(flag) * 1

                                                datediff = (parseFloat(ToDt) - parseFloat(FrmDt) + 1);
                                                datediff = parseFloat(datediff) - parseFloat(final_flag)
                                                datediff = parseFloat(datediff) - parseFloat(holiday_count);
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                            }
                                        }

                                        if (flag >= '2') {
                                            if (holiday_count == 0) {
                                                var final_flag = parseFloat(flag) * 1
                                                datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                            } else {

                                                var final_flag = parseFloat(flag) * 1

                                                datediff = (parseFloat(ToDt) - parseFloat(FrmDt) + 1);
                                                datediff = (parseFloat(datediff) - parseFloat(final_flag));
                                                datediff = (parseFloat(datediff) - parseFloat(holiday_count));
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                            }
                                        }

                                    }
                                //}
                            }
                        }
                        else
                        {
                            if (weeklyoffIncCheck == 'T') {
                                var frm_halfday = nlapiGetFieldValue('custrecord_hris_lve_fromhalfday');
                                var to_halfday = nlapiGetFieldValue('custrecord_hris_lve_tohalfday');
                                
                                //if (frm_halfday == 'F' && to_halfday == 'F') {
                                    if (holiday_TF_check == 'T') {
                                        var monthdays = getArryMonthDays(FrmMonth);
                                        var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                                        var finaldays = parseFloat(ToDt) + firstMonthDays;
                                        nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                    }
                                    if (holiday_TF_check == 'F') {
                                        var holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
                                        if (holiday_count == 0) {
                                            var monthdays = getArryMonthDays(FrmMonth);
                                            var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                                            var finaldays = parseFloat(ToDt) + firstMonthDays;
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                        } else {
                                            var monthdays = getArryMonthDays(FrmMonth);
                                            var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                                            var finaldays = (parseFloat(ToDt) + parseFloat(firstMonthDays)) - parseFloat(holiday_count);
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                        }
                                    }
                               // }
                            }
                            else
                            {
                                var frm_halfday = nlapiGetFieldValue('custrecord_hris_lve_fromhalfday');
                                var to_halfday = nlapiGetFieldValue('custrecord_hris_lve_tohalfday');
                                
                              //  if (frm_halfday == 'F' && to_halfday == 'F') {
                                    if (holiday_TF_check == 'T') {
                                        var frm_date_val = nlapiGetFieldValue('custrecord_hris_lve_fromdate')
                                        var to_date_val = nlapiGetFieldValue('custrecord_hris_lve_todate')
                                        var monthdays = getArryMonthDays(FrmMonth);
                                        var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                                        var frm_date_val_obj = nlapiStringToDate(frm_date_val)
                                        var date_split = frm_date_val_obj.toString().split(' ');
                                        var day = date_split[0];
                                        var frm_week_day = WeeklyOff(day)
                                        var to_date_val_obj = nlapiStringToDate(to_date_val)
                                        var date_split1 = to_date_val_obj.toString().split(' ');
                                        var day1 = date_split1[0];
                                        var to_week_day = WeeklyOff(day1)
                                        var get_all_dates = get_excluded_weeklyoff_days_for_different_months(firstMonthDays, fromDate, toDate, FrmDt, ToDt)
                                        var tot_days_count = get_all_dates.length;
                                        var day_split = get_all_dates.toString().split(',')
                                        var flag = 0;
                                        for (var j = 0; j < tot_days_count; j++) {
                                            var one_by_one_day = day_split[j]
                                            if (one_by_one_day == WeeklyOffInW) {
                                                flag = flag + 1;
                                            }

                                        }
                                        if (flag == '0') {
                                            var monthdays = getArryMonthDays(FrmMonth);
                                            var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                            var finaldays = parseFloat(ToDt) + firstMonthDays + 1;
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                        }
                                        if (flag == '1') {
                                            var final_flag = parseFloat(flag);
                                            var monthdays = getArryMonthDays(FrmMonth);
                                            var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                            var finaldays = parseFloat(ToDt) + firstMonthDays - parseFloat(final_flag) + 1;
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                        }
                                        if (flag == '2') {
                                            var final_flag = parseFloat(flag);
                                            var monthdays = getArryMonthDays(FrmMonth);
                                            var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                            var finaldays = parseFloat(ToDt) + firstMonthDays - parseFloat(final_flag) + 1;
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                        }
                                        if (flag > '2') {
                                            var final_flag = parseFloat(flag);
                                            var monthdays = getArryMonthDays(FrmMonth);
                                            var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                            var finaldays = parseFloat(ToDt) + firstMonthDays - parseFloat(final_flag) + 1;
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                        }

                                    }
                                    if (holiday_TF_check == 'F') {
                                        var holiday_count = searchEmpholidays(getUserId, fromDate, toDate)

                                        var frm_date_val = nlapiGetFieldValue('custrecord_hris_lve_fromdate')
                                        var to_date_val = nlapiGetFieldValue('custrecord_hris_lve_todate')
                                        var monthdays = getArryMonthDays(FrmMonth);
                                        var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                                        var frm_date_val_obj = nlapiStringToDate(frm_date_val)
                                        var date_split = frm_date_val_obj.toString().split(' ');
                                        var day = date_split[0];
                                        var frm_week_day = WeeklyOff(day)

                                        var to_date_val_obj = nlapiStringToDate(to_date_val)
                                        var date_split1 = to_date_val_obj.toString().split(' ');
                                        var day1 = date_split1[0];
                                        var to_week_day = WeeklyOff(day1)

                                        var get_all_dates = get_excluded_weeklyoff_days_for_different_months(firstMonthDays, fromDate, toDate, FrmDt, ToDt)

                                        var tot_days_count = get_all_dates.length;
                                        var day_split = get_all_dates.toString().split(',')
                                        var flag = 0;
                                        for (var j = 0; j < tot_days_count; j++) {
                                            var one_by_one_day = day_split[j]
                                            if (one_by_one_day == WeeklyOffInW) {
                                                flag = flag + 1;

                                            }

                                        }
                                        if (flag == '0') {
                                            if (holiday_count == 0) {
                                                var monthdays = getArryMonthDays(FrmMonth);
                                                var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                var finaldays = parseFloat(ToDt) + firstMonthDays + 1;
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                            } else {
                                                var monthdays = getArryMonthDays(FrmMonth);
                                                var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                var finaldays = (parseFloat(ToDt) + parseFloat(firstMonthDays)) - parseFloat(holiday_count) + 1;
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                            }
                                        }
                                        if (flag == '1') {
                                            if (holiday_count == 0) {
                                                var final_flag = parseFloat(flag);
                                                var monthdays = getArryMonthDays(FrmMonth);
                                                var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                var finaldays = parseFloat(ToDt) + firstMonthDays - parseFloat(final_flag) + 1;
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                            } else {
                                                var final_flag = parseFloat(flag);
                                                var monthdays = getArryMonthDays(FrmMonth);
                                                var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                var finaldays = ((parseFloat(ToDt) + parseFloat(firstMonthDays)) - parseFloat(final_flag)) - parseFloat(holiday_count) + 1;
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)

                                            }
                                        }
                                        if (flag == '2') {
                                            if (holiday_count == 0) {
                                                var final_flag = parseFloat(flag);
                                                var monthdays = getArryMonthDays(FrmMonth);
                                                var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                var finaldays = parseFloat(ToDt) + firstMonthDays - parseFloat(final_flag) + 1;
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                            } else {
                                                var final_flag = parseFloat(flag);
                                                var monthdays = getArryMonthDays(FrmMonth);
                                                var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                var finaldays = ((parseFloat(ToDt) + parseFloat(firstMonthDays)) - parseFloat(final_flag)) - parseFloat(holiday_count) + 1;
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                            }
                                        }
                                        if (flag > '2') {
                                            if (holiday_count == 0) {
                                                var final_flag = parseFloat(flag);
                                                var monthdays = getArryMonthDays(FrmMonth);
                                                var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                var finaldays = parseFloat(ToDt) + firstMonthDays - parseFloat(final_flag) + 1;
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                            } else {
                                                var final_flag = parseFloat(flag);
                                                var monthdays = getArryMonthDays(FrmMonth);
                                                var firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                var finaldays = ((parseFloat(ToDt) + parseFloat(firstMonthDays)) - parseFloat(final_flag)) - parseFloat(holiday_count) + 1;
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
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
                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', 1, false)

            }
            if (name == 'custrecord_hris_lve_fromdate') {
                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', 1, false)

            }
            if (name == 'custrecord_hris_lve_fromhalfday') {
                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', 0.5, false)

            }

            if (name == 'custrecord_hris_lve_tohalfday') {
                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', 0.5, false)

            }
        }





        if (name == 'custrecord_hris_lve_todate') {
            var Total_no_days = nlapiGetFieldValue('custrecord_hris_lve_totalnodays');
            Total_no_days = parseFloat(Total_no_days)
            var balance = nlapiGetFieldValue('custrecord_hris_lve_leavebalance');
            balance = parseFloat(balance)

            var leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype')

            var seq_no_search = get_sequence_no(leave_type)
            var seq_no_split = seq_no_search.split('#')
            var seq_no = seq_no_split[0];
            var negAllowChk = seq_no_split[1];
            var maxNegAllow = seq_no_split[2];

            if (seq_no != 2 && seq_no != 8 && seq_no !=13) {
                if (parseFloat(Total_no_days) > parseFloat(balance)) {
                    var bal_diff = parseFloat(Total_no_days) - parseFloat(balance);

                    if (negAllowChk == 'F') {
                        alert(' Leave Balance is low');
                        nlapiSetFieldValue('custrecord_hris_lve_todate', '', false);
                        nlapiSetFieldValue('custrecord_hris_lve_fromdate', '', false);
                        nlapiSetFieldValue('custrecord_hris_lve_totalnodays', '', false);
                        return false;
                    } else {
                        if (maxNegAllow < bal_diff) {
                            alert('You are allowed to take maximum 15 days of negative balance')
                            nlapiSetFieldValue('custrecord_hris_lve_todate', '', false);
                            nlapiSetFieldValue('custrecord_hris_lve_fromdate', '', false);
                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', '', false);
                            return false;
                        }
                    }

                }


            }



        }


        if (name == 'custrecord_hris_lve_fromdate') {

            var seq_no_search = get_sequence_no(leave_type)
            var seq_no_split = seq_no_search.split('#')
            var seq_no = seq_no_split[0];
            var getUserId = nlapiGetFieldValue('custrecord_hris_lve_employeename');
            var frm_date = nlapiGetFieldValue('custrecord_hris_lve_fromdate');






            if (frm_date != '' && frm_date != null && frm_date != 'undefined') {
           
            var check_holiday_frm_date = check_from_to_date_holiday(frm_date, getUserId)
         var leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype');
        /*   var E_leavetype = nlapiGetFieldValue("custrecord_hris_lve_leavetype");
           var leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid'); 
 */
            if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
                // Florence Changed here
             //   if (check_holiday_frm_date == false && seq_no != '2' && seq_no != '6' && leave_type != 11 && leave_type != 12 && leave_type != 16 && leave_type != 22 && leave_type != 23 && leave_type != 24 && leave_type != 25 && leave_type != 9 && leave_type != 18) {
                if (check_holiday_frm_date == false && seq_no != '2' && seq_no != '6' && seq_no !=13 && leave_type != 5 ) {

                    alert('Holiday present on this date');
                    nlapiSetFieldValue('custrecord_hris_lve_fromdate', '', false)
                    nlapiSetFieldValue('custrecord_hris_lve_totalnodays', '', false)
                    return false;
                }
                var check_weeklyoff_frm_date = check_weeklyoff_on_frm_to_date(frm_date, getUserId);

              //  if (check_weeklyoff_frm_date == true && seq_no != '2' && seq_no != '6' && leave_type != 11 && leave_type != 12 && leave_type != 16 && leave_type != 22 && leave_type != 23 && leave_type != 24 && leave_type != 25 && leave_type != 9 && leave_type != 18) {
                if (check_weeklyoff_frm_date == true && seq_no != '2' && seq_no != '6' && seq_no !=13 && leave_type != 5) {
                    alert('weeklyoff present on this date');
                    nlapiSetFieldValue('custrecord_hris_lve_fromdate', '', false)
                    nlapiSetFieldValue('custrecord_hris_lve_totalnodays', '', false)
                    return false;
                }
            } else {
                nlapiDisableField('custrecord_hris_lve_applylveencashment', false)
            }

                var Total_no_days = nlapiGetFieldValue('custrecord_hris_lve_totalnodays');

                var tdate = nlapiGetFieldValue('custrecord_hris_lve_todate');
                var min_no_days = min_days_apply(leave_type)
                var max_no_days = max_days_apply(leave_type)

                var leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype')
                 var seq_no_search = get_sequence_no(leave_type)
                var seq_no_split = seq_no_search.split('#')
                var seq_no = seq_no_split[0];

                {
                    if (tdate != '' && tdate != 'undefined' && tdate != null) {

                       var leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype');
     
                        if (seq_no == 4) {

                            if (parseFloat(Total_no_days) == parseFloat(min_no_days)) {

                                return true;

                            }
                            if (parseFloat(Total_no_days) != parseFloat(min_no_days)) {
                                if (parseFloat(Total_no_days) == parseFloat(max_no_days)) {

                                    return true;

                                }
                                nlapiSetFieldValue('custrecord_hris_lve_fromdate', '', false)
                                nlapiSetFieldValue('custrecord_hris_lve_todate', '', false)
                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', 0, false)
                                alert('Apply Vacation Leave 5 days or 10 days');
                                return false;

                            }

                            if (parseFloat(Total_no_days) == parseFloat(max_no_days)) {

                                return true;

                            }
                            if (parseFloat(Total_no_days) != parseFloat(max_no_days)) {
                                nlapiSetFieldValue('custrecord_hris_lve_fromdate', '', false)
                                nlapiSetFieldValue('custrecord_hris_lve_todate', '', false)
                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', 0, false)
                                alert('Apply Vacation Leave 5 days or 10 days');
                                return false;

                            }


                        }




                        if (seq_no != 4) {

                            if (min_no_days != 0 || max_no_days != 0) {
                                if (parseFloat(Total_no_days) < parseFloat(min_no_days)) {

                                    alert('Minimum no. of days for selected leave is ' + min_no_days)
                                    nlapiSetFieldValue('custrecord_hris_lve_fromdate', '', false)
                                    nlapiSetFieldValue('custrecord_hris_lve_todate', '', false)
                                    nlapiSetFieldValue('custrecord_hris_lve_totalnodays', '', false)
                                    return false;

                                }
                            }
                            if (max_no_days != 0) {

                                if (parseFloat(Total_no_days) > parseFloat(max_no_days)) {

                                    alert('total no of days should not more than ' + max_no_days)
                                    nlapiSetFieldValue('custrecord_hris_lve_fromdate', '', false)
                                    nlapiSetFieldValue('custrecord_hris_lve_todate', '', false)
                                    nlapiSetFieldValue('custrecord_hris_lve_totalnodays', '', false)
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
           var to_date = nlapiGetFieldValue('custrecord_hris_lve_todate');
            if (to_date != '' && to_date != null && to_date != 'undefined') {
           
                var E_leavetype = nlapiGetFieldValue("custrecord_hris_lve_leavetype");
                var leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid');
                var seq_no_search = get_sequence_no(E_leavetype)
                var seq_no_split = seq_no_search.split('#')
                var seq_no = seq_no_split[0];
                var getUserId = nlapiGetFieldValue('custrecord_hris_lve_employeename');
               

            var check_holiday_to_date = check_from_to_date_holiday(to_date, getUserId)

            if (check_holiday_to_date == false && seq_no != '2' && seq_no != '6' && leave_type != 11 && leave_type != 12 && leave_type != 16 && leave_type != 22 && leave_type != 23 && leave_type != 24 && leave_type != 25 && leave_type != 9 && leave_type != 18) {
                alert('Holiday present on this date');
                nlapiSetFieldValue('custrecord_hris_lve_todate', '', false)
                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', '', false)
                return false;
            }

            var check_weeklyoff_to_date = check_weeklyoff_on_frm_to_date(to_date, getUserId);

            if (check_weeklyoff_to_date == true && seq_no != '2' && seq_no != '6' && leave_type != 11 && leave_type != 12 && leave_type != 16 && leave_type != 22 && leave_type != 23 && leave_type != 24 && leave_type != 25 && leave_type != 9 && leave_type != 18) {
                alert('weeklyoff present on this date');
                nlapiSetFieldValue('custrecord_hris_lve_todate', '', false)
                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', '', false)
                return false;
            }
        } else {
            nlapiDisableField('custrecord_hris_lve_applylveencashment', false)
        }

            var Total_no_days = nlapiGetFieldValue('custrecord_hris_lve_totalnodays');
            var leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype');
            if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
                var fdate = nlapiGetFieldValue('custrecord_hris_lve_fromdate');
                var min_no_days = min_days_apply(leave_type)
                var max_no_days = max_days_apply(leave_type)

                var leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype')
          
                {


                    if (fdate != '' && fdate != 'undefined' && fdate != null) {


                       var leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype');

                         if (seq_no == 4) {


                            if (parseFloat(Total_no_days) != parseFloat(min_no_days)) {

                                if (parseFloat(Total_no_days) == parseFloat(max_no_days)) {

                                    return true;

                                }

                                nlapiSetFieldValue('custrecord_hris_lve_fromdate', '', false)
                                nlapiSetFieldValue('custrecord_hris_lve_todate', '', false)
                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', 0, false)
                                alert('Apply Vacation Leave 5 days or 10 days');
                                return false;

                            }
                            if (parseFloat(Total_no_days) == parseFloat(min_no_days)) {

                                return true;

                            }

                            if (parseFloat(Total_no_days) != parseFloat(max_no_days)) {
                                nlapiSetFieldValue('custrecord_hris_lve_fromdate', '', false)
                                nlapiSetFieldValue('custrecord_hris_lve_todate', '', false)
                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', 0, false)
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
                                    nlapiSetFieldValue('custrecord_hris_lve_fromdate', '', false)
                                    nlapiSetFieldValue('custrecord_hris_lve_todate', '', false)
                                    nlapiSetFieldValue('custrecord_hris_lve_totalnodays', '', false)
                                    return false;

                                }

                            }
                            if (max_no_days != 0) {

                                if (parseFloat(Total_no_days) > parseFloat(max_no_days)) {

                                    alert('total no of days should not more than ' + max_no_days)
                                    nlapiSetFieldValue('custrecord_hris_lve_fromdate', '', false)
                                    nlapiSetFieldValue('custrecord_hris_lve_todate', '', false)
                                    nlapiSetFieldValue('custrecord_hris_lve_totalnodays', '', false)
                                    return false;

                                }

                            }




                        }


                    }




                }




                return true;


            } else {
                alert('enter leave type');
                nlapiSetFieldValue('custrecord_hris_lve_todate', '', false)
                return false;
            }

        }





        




        if (name == 'custrecord_hris_lve_leavebalance') {

          var leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype');
         /*  var E_leavetype = nlapiGetFieldValue("custrecord_hris_lve_leavetype");
            var leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid');  */
            var seq_no_search = get_sequence_no(leave_type)
            var seq_no_split = seq_no_search.split('#')
            var seq_no = seq_no_split[0];
            if (seq_no == 5) {

                var leave_bal = nlapiGetFieldValue('custrecord_hris_lve_leavebalance')


                if (leave_bal != 0) {

                    if (leave_bal == 1) {
                        nlapiSetFieldValue('custrecord_hris_lve_totalnodays', leave_bal, false)
                        nlapiDisableField('custrecord_hris_lve_fromhalfday', true)
                        nlapiDisableField('custrecord_hris_lve_tohalfday', true)
                    }
                    if (leave_bal == 0.5) {
                        nlapiSetFieldValue('custrecord_hris_lve_totalnodays', leave_bal, false)

                        var f_hday = nlapiGetFieldValue('custrecord_hris_lve_fromhalfday');
                        var t_hday = nlapiGetFieldValue('custrecord_hris_lve_tohalfday');
                        if (f_hday == 'T') {
                            nlapiDisableField('custrecord_hris_lve_tohalfday', true)
                        }
                        if (f_hday == 'F') {
                            nlapiDisableField('custrecord_hris_lve_tohalfday', false)


                        }
                        if (t_hday == 'T') {
                            nlapiDisableField('custrecord_hris_lve_fromhalfday', true)
                        }
                        if (t_hday == 'F') {
                            nlapiDisableField('custrecord_hris_lve_fromhalfday', false)


                        }
                    }

                }
                if (leave_bal == 0) {
                    nlapiSetFieldValue('custrecord_hris_lve_leavebalance', leave_bal, false)
                    nlapiSetFieldValue('custrecord_hris_lve_leavebalance_wholeno', leave_bal, false)
                    nlapiSetFieldValue('custrecord_hris_lve_validtilldate', '', false)
                }


            }


        }

        if (name == 'custrecord_hris_lve_cancellation') {
            

            var leave_cancel_check = nlapiGetFieldValue('custrecord_hris_lve_cancellation');
            var application_status = nlapiGetFieldText('custrecord_hris_lve_hrmsapprovalstatus');
            var application_status_id = nlapiGetFieldValue('custrecord_hris_lve_hrmsapprovalstatus');
    
            if (leave_cancel_check == 'F') {
                nlapiDisableField('custrecord_hris_lve_cancelreason', true)
            }
            if (leave_cancel_check == 'T') {
                nlapiDisableField('custrecord_hris_lve_cancelreason', false)
            }
    
            if (application_status_id == '2') {
    
                var to_date_val = nlapiGetFieldValue('custrecord_hris_lve_todate');
    
             var leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype');
             /*  var E_leavetype = nlapiGetFieldValue("custrecord_hris_lve_leavetype");
               var leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid'); */ 
                var leave_type_conf = nlapiLoadRecord('customrecord_hris_leaveconfig', leave_type)
    
                var leave_cancel_period = leave_type_conf.getFieldValue('custrecord_hris_lveconfig_levcancelperod');
    
                if (leave_cancel_period != 0) {
    
                    var checkbox_value = nlapiGetFieldValue('custrecord_hris_lve_cancellation');
    
                    var to_date_val_obj = nlapiStringToDate(to_date_val)
    
    
                    var cancel_date = nlapiAddDays(to_date_val_obj, leave_cancel_period);
    
    
                    var current_date = new Date();
    
    
    
                    if (cancel_date < current_date) {
                        alert('You are not allowed to cancel this leave')
                        nlapiSetFieldValue('custrecord_hris_lve_cancellation', '', false)
                        nlapiDisableField('custrecord_hris_lve_cancelreason', true)
                    }
    
                }
    
            }
    
        }


    }
   



}




function postSourcing_validate_checkbox(type, name) {
    var leaveType = nlapiGetFieldValue('custrecord_hris_lve_leavetype');


}








function searchLeaveBalance(leave_type, getUserId) {

    var leave_balance = 0;
    var encash_balance = 0;
    var filters = new Array();
    var leave_balanceNme;
    if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
        nlapiLogExecution('DEBUG', 'leave_type', leave_type);
        nlapiLogExecution('DEBUG', 'getUserId', getUserId);

        filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_leave_type', null, 'is', leave_type))
        filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_employee_name', null, 'is', getUserId))
        filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'))
        var column = new Array();
        column.push(new nlobjSearchColumn('custrecord_hris_lvbal_available_leave_ba'));
        column.push(new nlobjSearchColumn('custrecord_hris_lvbal_encashable_days'));
        column.push(new nlobjSearchColumn('custrecord_hris_lvbal_leave_type'));

        var leaveBalanceresults = nlapiSearchRecord('customrecord_hris_leavebalance', null, filters, column);
        if (leaveBalanceresults != null) {
            leave_balance = leaveBalanceresults[0].getValue('custrecord_hris_lvbal_available_leave_ba')
            leave_balanceNme = leaveBalanceresults[0].getText('custrecord_hris_lvbal_leave_type')
            nlapiLogExecution('DEBUG', 'leave_balance name', leave_balanceNme);
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
    var supportDocCheck = false;
    var filters = new Array();
    var column = new Array();
    if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
        filters.push(new nlobjSearchFilter('name', null, 'is', leave_type))


        column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_suportdocallow'));
        var leaveTypeConfig = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, column);
        if (leaveTypeConfig != null) {
            supportDocCheck = leaveTypeConfig[0].getValue('custrecord_hris_lveconfig_suportdocallow')
        }
        return supportDocCheck;


    }

}



function weeklyOffInclude(leave_type) {

    var weeklyoffCheck = false;
    var filters = new Array();
    var column = new Array();
    if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
       filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
       //filters.push(new nlobjSearchFilter('externalid', null, 'is', leave_type))
        column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_includeweekoff'));
        var leaveTypeConfigWO = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, column);
        if (leaveTypeConfigWO != null) {
            weeklyoffCheck = leaveTypeConfigWO[0].getValue('custrecord_hris_lveconfig_includeweekoff')
        }
        return weeklyoffCheck;

    }


}




function WeeklyOff(DaysW) {

    var whole_day;
    var filters = new Array();
    filters.push(new nlobjSearchFilter('name', null, 'startswith', DaysW))

    var column = new Array();

    column.push(new nlobjSearchColumn('internalid'));

    var whole_day_search = nlapiSearchRecord('customlist_hris_week_days', null, filters, column);

    if (whole_day_search != null) {
        whole_day = whole_day_search[0].getValue('internalid')

    }
    return whole_day;
}





function Get_sequence_no_of_week_days(getUserId) {
    var filters = new Array();
    var columns = new Array();

    filters.push(new nlobjSearchFilter('internalid', null, 'is', getUserId));

    columns.push(new nlobjSearchColumn('custentity_hris_empweeklyoffs'));

    var EmployeeWeeklyOff = nlapiSearchRecord('employee', null, filters, columns);

    if (EmployeeWeeklyOff != null) {
        var s_weeklyoff = new Array();
        var s_weeklyoff = EmployeeWeeklyOff[0].getValue('custentity_hris_empweeklyoffs')

        nlapiLogExecution('DEBUG', 'before s_weeklyoff.length')
        var s_weeklyoff_length = s_weeklyoff.length;
        nlapiLogExecution('DEBUG', 'after s_weeklyoff.length')

        var s_weeklyoff_split = s_weeklyoff.split(',');

        var firstWeeklyOff = s_weeklyoff_split[0];

        var secWeeklyOff = s_weeklyoff_split[1];

        if (firstWeeklyOff != '' && firstWeeklyOff != 'undefined' && firstWeeklyOff != null) {
            var Filters1_week_day = new Array();
            var Columns1_week_days = new Array();


            Filters1_week_day.push(new nlobjSearchFilter('internalid', null, 'is', firstWeeklyOff));

            Columns1_week_days.push(new nlobjSearchColumn('custrecord_hris_lve_wkday_seq_no'));

            var WeeklyOff_search1 = nlapiSearchRecord('customlist_hris_week_days', null, Filters1_week_day, Columns1_week_days);

            if (WeeklyOff_search1 != null) {
                var seq_one = WeeklyOff_search1[0].getValue('custrecord_hris_lve_wkday_seq_no')
            }

            if (secWeeklyOff != '' && secWeeklyOff != 'undefined' && secWeeklyOff != null) {
                var Filters2_week_day = new Array();
                var Columns2_week_days = new Array();


                Filters2_week_day.push(new nlobjSearchFilter('internalid', null, 'is', secWeeklyOff));

                Columns2_week_days.push(new nlobjSearchColumn('custrecord_hris_lve_wkday_seq_no'));

                var WeeklyOff_search2 = nlapiSearchRecord('customlist_hris_week_days', null, Filters2_week_day, Columns2_week_days);

                if (WeeklyOff_search2 != null) {
                    var seq_two = WeeklyOff_search2[0].getValue('custrecord_hris_lve_wkday_seq_no')
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
    var Count = 0;
    var weekly_Count = new Array();
    var EmployeeWeeklyOff = nlapiSearchRecord("customrecord_hris_employeedatasourcing", null,
        [
            ["custrecord_hris_eds_employee", "anyof", getUserId]
        ],
        [
            new nlobjSearchColumn("custrecord_hris_eds_employee"),
            new nlobjSearchColumn("custrecord_hris_eds_employeeweeklyoff"),
            new nlobjSearchColumn("custrecord_hris_eds_employeeholidays")
        ]
    );

    if (EmployeeWeeklyOff != null) {
        var s_weeklyoff = EmployeeWeeklyOff[0].getValue('custrecord_hris_eds_employeeweeklyoff');
        if (s_weeklyoff.length == 3) {
            var split_s_weeklyoff = s_weeklyoff.toString().split(',')

            var split_s_weeklyoff_1 = split_s_weeklyoff[0]

            Count++;
            var split_s_weeklyoff_2 = split_s_weeklyoff[1]

            Count++;
            weekly_Count.push(split_s_weeklyoff_1 + "##" + split_s_weeklyoff_2)
        } else
        if (s_weeklyoff.length == 1) {
            var split_s_weeklyoff_1 = s_weeklyoff[0]
            Count++;
        }
    }
    return Count + "#" + s_weeklyoff;

}



function getArryMonthDays(FrmMonth) {

    var standard_month_days; {
        if (FrmMonth == '1' || FrmMonth == '3' || FrmMonth == '5' || FrmMonth == '7' || FrmMonth == '8' || FrmMonth == '10' || FrmMonth == '12') {
            standard_month_days = 31;
        }
        if (FrmMonth == '4' || FrmMonth == '6' || FrmMonth == '9' || FrmMonth == '11') {
            standard_month_days = 30;
        }
        else
        if (FrmMonth == '2') {
            var date = new Date()
            var year = date.getFullYear()
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
    var date_day = 0

    var date_push = new Array();

    var frm_dt = new Date(fromDate);

    var to_dt = new Date(toDate)

    var count_date = parseFloat(ToDt) - parseFloat(FrmDt) + 1;

    var date_day = frm_dt.getDay();

    date_day = parseFloat(date_day);

    for (var i = 1; i <= count_date; i++) {
        if (date_day >= '8') {

            date_day = 1


        }
        date_push.push(date_day);
        date_day = parseInt(date_day) + 1;
    }
    return date_push;
}



function searchEmpholidays(getUserId, fromDate, toDate) {
    var fromdate = fromDate;
    var todate = toDate;
    var holiday_date;
    var count = 0;
    var all_holiday_dates = new Array();
    var filters = new Array();
    var column = new Array();
    var s_holiday = new Array();
    var get_holiday_filters = new Array();
    var get_holiday_column = new Array();
    var emp_holidays = [];

    var Employee_holiday_searchResult = nlapiSearchRecord("customrecord_hris_employeedatasourcing", null,
        [
            ["custrecord_hris_eds_employee", "anyof", getUserId]
        ],
        [
            new nlobjSearchColumn("custrecord_hris_eds_employee"),
            new nlobjSearchColumn("custrecord_hris_eds_employeeweeklyoff"),
            new nlobjSearchColumn("custrecord_hris_eds_employeeholidays")
        ]
    );
    if (Employee_holiday_searchResult) {
    for (var i = 0; i < Employee_holiday_searchResult.length; i++) {
        var holidayList = Employee_holiday_searchResult[0].getValue('custrecord_hris_eds_employeeholidays');
        holidayList = holidayList.split(',')
    };


   
        for (var holidayCount = 0; holidayCount < holidayList.length; holidayCount++) {
            var holidayId = holidayList[holidayCount];
            if (holidayId) {
                var a_holidayData = nlapiLookupField('customrecord_hris_holiday_master', holidayId, ['custrecord_hris_holiday_date', 'isinactive', 'custrecord_hris_holidayconsiderforleave']);
                if (a_holidayData) {
                    var holidayDate = a_holidayData.custrecord_hris_holiday_date
                    var isInactive = a_holidayData.isinactive;
                    var ISHOLIDAYCONSIDERFORLEAVE = a_holidayData.custrecord_hris_holidayconsiderforleave;
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

    var one_day = 1000 * 60 * 60 * 24;
    var fromDate = startDate;
    var toDate = endDate
    nlapiLogExecution('DEBUG', 'getDatediffIndays', 'From Date = ' + fromDate + 'To Date = ' + toDate);
    var x = fromDate.split("/");
    var y = toDate.split("/");
    var date1 = new Date((x[2]), (x[1]), x[0]);
    var date2 = new Date((y[1] - 1), y[2], y[0]);
    var month1 = x[2] - 1;
    var month2 = y[2] - 1;
    var Diff = Math.ceil((date2.getTime() - date1.getTime()) / (one_day));
    nlapiLogExecution('DEBUG', 'getDatediffIndays', 'Date difference Return Value = ' + Diff);
    return Diff;

}


function SearchHolidayDate(s_holiday) {
    var holiday_master_filter = new Array();
    var holiday_master_column = new Array();
    s_holiday = parseFloat(s_holiday);

    holiday_master_filter.push(new nlobjSearchFilter('internalid', null, 'anyof', s_holiday))
    holiday_master_filter.push(new nlobjSearchFilter('custrecord_hris_holidayconsiderforleave', null, 'is', "T"))
    holiday_master_column.push(new nlobjSearchColumn('custrecord_hris_holiday_date'));
    holiday_master_column.push(new nlobjSearchColumn('name'));

    var holiday_date_result = nlapiSearchRecord('customrecord_hris_holiday_master', null, holiday_master_filter, holiday_master_column);
    if (holiday_date_result != null) {
        for (var HoL = 0; HoL < holiday_date_result.length; HoL++) {
            var s_holiday_name = holiday_date_result[HoL].getValue('name')
            var s_holiday_date = holiday_date_result[HoL].getValue('custrecord_hris_holiday_date')

            s_holiday_date = nlapiStringToDate(s_holiday_date);

            var month = s_holiday_date.getMonth() + 1;

            var actual_date = s_holiday_date.getDate();

        }
    }
}





function get_excluded_weeklyoff_days_for_different_months(firstMonthDays, fromDate, toDate, FrmDt, ToDt) {



    var date_push = new Array();
    var frm_dt = new Date(fromDate);
    var timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
    var finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    finaldays = parseFloat(finaldays) + 1;
    var count_date = finaldays;
    var date_day = frm_dt.getDay();
    for (var i = 1; i <= count_date; i++) {

        if (date_day > '7') {

            var date_day = 1;
        }


        date_push.push(date_day);



        date_day = parseFloat(date_day) + 1
    }


    return date_push;
}

function get_dates_between_dates(fromDate, toDate, FrmDt, ToDt) {
    var date_push_date = new Array();
    var frm_dt = new Date(fromDate);

    var count_date = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
    for (var i = 0; i < count_date; i++) {
        var date_date = frm_dt.getDate() + i;
        date_day = parseFloat(date_date);
        date_push_date.push(date_day);
    }

    return date_push_date;

}




function holidayInclude(leave_type) {

    var holidayCheck = false;
    var filters = new Array();
    var column = new Array();
    if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
        filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))

        column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_includeholiday'));
        var leaveTypeConfigWO = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, column);
        if (leaveTypeConfigWO != null) {
            holidayCheck = leaveTypeConfigWO[0].getValue('custrecord_hris_lveconfig_includeholiday')
            
        }

    }

    return holidayCheck;
}





function get_between_dates_in_different_months(FrmMonth, FrmDt, TOMonth, ToDt, fromDate) {
    var date_push_date = new Array();
    var frm_month_total_days = getArryMonthDays(FrmMonth);
    var frm_month_days = parseFloat(frm_month_total_days) - parseFloat(FrmDt) + 1;
    var frm_dt = new Date(fromDate);
    var to_month_days = ToDt;
    var total_days = parseFloat(frm_month_days) + parseFloat(to_month_days);
    for (var i = 0; i < total_days; i++) {
        var date_date = frm_dt.getDate() + i;
        date_date = parseFloat(date_date);
        if (date_date > frm_month_total_days) {
            date_date = (parseFloat(date_date) - parseFloat(date_date) + i) - 2;
        }
        date_push_date.push(date_date);
    }
    return date_push_date;

}




function halfday_Include(leave_type) {
    var halfdayCheck = false;
    var filters = new Array();


    if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
        filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
        var column = new Array();
        column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_allowhalfday'));
        var leaveTypeConfigWO = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, column);
        if (leaveTypeConfigWO != null) {
            halfdayCheck = leaveTypeConfigWO[0].getValue('custrecord_hris_lveconfig_allowhalfday')
        }

    }

    return halfdayCheck;
}


function encashment_min_days(leave_type) {
    if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
        var filters = new Array();
        filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
        var column = new Array();
        column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_minencashallow '));//leave type config id 
        var leaveTypeConfigWO = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, column);
        if (leaveTypeConfigWO != null) {
            var min_encashment_days = leaveTypeConfigWO[0].getValue('custrecord_hris_lveconfig_minencashallow ')
        }


    }

    return min_encashment_days;
}




function encashment_max_days(leave_type) {
    if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
        var filters = new Array();
        filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
        var column = new Array();
        column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_maxencashallow'));
        var leaveTypeConfigWO = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, column);
        if (leaveTypeConfigWO != null) {
            var max_encashment_days = leaveTypeConfigWO[0].getValue('custrecord_hris_lveconfig_maxencashallow')
        }

    }

    return max_encashment_days;
}



function min_days_apply(leave_type) {
    var filters = new Array();
    var column = new Array();

    if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
        filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
        column.push(new nlobjSearchColumn('custrecord_hris_lvecnfg_mindaystoapply'));
        var leaveTypeConfigWO = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, column);
        if (leaveTypeConfigWO != null) {
            var min_days = leaveTypeConfigWO[0].getValue('custrecord_hris_lvecnfg_mindaystoapply')
            nlapiLogExecution('DEBUG', 'min_days', min_days);
        }

    }

    return min_days;
}


function max_days_apply(leave_type) {
    var filters = new Array();
    var column = new Array();
    filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
    column.push(new nlobjSearchColumn('custrecord_hris_lvecfg_maxdaystoapply'));
    var leaveTypeConfigWO = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, column);
    if (leaveTypeConfigWO != null) {
        var max_days = leaveTypeConfigWO[0].getValue('custrecord_hris_lvecfg_maxdaystoapply')
    }
    return max_days;
}



function encashment_days_apply_check(leave_type) {
    var encashment_days_check = false;
    var falsevalue = false;
    var filters = new Array();
    var column = new Array();

    if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {

        filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
       // filters.push(new nlobjSearchFilter('externalid', null, 'is', leave_type))
        column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_encashallowed'));
        column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_encashavailed'));
        var leaveTypeConfigWO = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, column);

        if (leaveTypeConfigWO != null) {
            encashment_days_check = leaveTypeConfigWO[0].getValue('custrecord_hris_lveconfig_encashallowed')

            if (encashment_days_check == 'T') {
                var encashment_days_avail = leaveTypeConfigWO[0].getText('custrecord_hris_lveconfig_encashavailed')

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
    var leaveTypeConfigWO = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, column);

    if (leaveTypeConfigWO != null) {
        encashment_days_check = leaveTypeConfigWO[0].getValue('custrecord_hris_lveconfig_encashallowed')

        if (encashment_days_check == 'T') {
            var encashment_days_avail = leaveTypeConfigWO[0].getText('custrecord_hris_lveconfig_encashavailed')

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

    var date = frm_date;
    var result = 'F';
    var Holiday_name = new Array();
    var filters = new Array();
    var column = new Array();
    filters.push(new nlobjSearchFilter('custrecord_hris_holidayconsiderforleave', null, 'is', "T"))
    filters.push(new nlobjSearchFilter('custrecord_hris_holiday_date', null, 'on', date))
    column.push(new nlobjSearchColumn('internalid'));

    var check_holiday_present_result = nlapiSearchRecord('customrecord_hris_holiday_master', null, filters, column);

    if (check_holiday_present_result != null) {
        for (var i = '0'; i < check_holiday_present_result.length; i++) {
            Holiday_name = check_holiday_present_result[i].getValue('internalid');

            var result = holiday_check_with_employee(getUserId, Holiday_name);
            if (result == false) {
                break;
            }
        }

    }
    return result;
}



function holiday_check_with_employee(getUserId, Holiday_name) {
    var Employee_holiday_result = nlapiSearchRecord("customrecord_hris_employeedatasourcing", null,
        [
            ["custrecord_hris_eds_employee", "anyof", getUserId],
            "AND",
            ["custrecord_hris_eds_employeeholidays", "anyof", Holiday_name]
        ],
        [
            new nlobjSearchColumn("custrecord_hris_eds_employeeholidays")
        ]
    );

    if (Employee_holiday_result) {
        return false;

    } else {
        return true;
    }


}


function check_weeklyoff_on_frm_to_date(frm_date, getUserId) {

    var weeklyoff = new Array();
    var date = frm_date;
    date = nlapiStringToDate(date);

    var date_split = date.toString().split(' ');
    var day = date_split[0];


    var filters = new Array();
    var columns = new Array();

    filters.push(new nlobjSearchFilter('name', null, 'startswith', day))
    columns.push(new nlobjSearchColumn('internalid'));
    var week_result = nlapiSearchRecord('customlist_hris_week_days', null, filters, columns);
    if (week_result != null) {
        internal_id = week_result[0].getValue('internalid');
        var weeklyoff_function = check_function(getUserId, internal_id)
        return weeklyoff_function;
    }

    function check_function(getUserId, internal_id) {
        var Employee_weeklyoff_result = nlapiSearchRecord("customrecord_hris_employeedatasourcing", null,
            [
                ["custrecord_hris_eds_employee", "anyof", getUserId],
                "AND",
                ["custrecord_hris_eds_employeeweeklyoff", "anyof", internal_id]
            ],
            [
                new nlobjSearchColumn("custrecord_hris_eds_employee"),
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
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1;
    var yy = today.getFullYear();
    return mm + "/" + dd + "/" + yy;

}














function GetRoundOffvalue(finalAnnual) {
    var final_days = finalAnnual;
    nlapiLogExecution(
      "DEBUG",
      "",
      "final_days************************************" + final_days
    );
    var rounded_final_value;
    var split_final_days = new Array();
  
    split_final_days = final_days.toString().split(".");
  
    var integer_no = split_final_days[0];
    nlapiLogExecution(
      "DEBUG",
      "",
      "integer_no************************************" + integer_no
    );
  
    var i_decimal_val = split_final_days[1];
    nlapiLogExecution(
      "DEBUG",
      "",
      "i_decimal_val************************************" + i_decimal_val
    );
  
    
  
    var compare_no = "0" + "." + i_decimal_val;
    nlapiLogExecution(
      "DEBUG",
      "typeof(compare_no)" + typeof compare_no,
      "compare_no************************************" + compare_no
    );     
     rounded_final_value = parseFloat(integer_no); 
  
 
  
    nlapiLogExecution(
      "DEBUG",
      "",
      "rounded_final_value************************************" +
        rounded_final_value
    );
    return rounded_final_value;
  }





function get_sequence_no(leave_type) {

    var filters = new Array();
    var columns = new Array();

    filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
    //filters.push(new nlobjSearchFilter('externalid', null, 'is', leave_type))

    columns.push(new nlobjSearchColumn('custrecord_hris_lvecnfg_seqno'));
    columns.push(new nlobjSearchColumn('custrecord_hris_lveconfig_allowneglevbal'));
    columns.push(new nlobjSearchColumn('custrecord_hris_lvecfg_maxnegativebal'));

    var compoff_record_result = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, columns);

    if (compoff_record_result != null) {

        var sequence_no = compoff_record_result[0].getValue('custrecord_hris_lvecnfg_seqno')
        var negAllowChk = compoff_record_result[0].getValue('custrecord_hris_lveconfig_allowneglevbal')
        var maxNegAllow = compoff_record_result[0].getValue('custrecord_hris_lvecfg_maxnegativebal')


    }
    return sequence_no + "#" + negAllowChk + "#" + maxNegAllow;
}











