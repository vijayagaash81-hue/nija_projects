/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */

define(['N/log', 'N/search', 'N/record', 'N/runtime', 'N/format', 'N/query', './moment.js'], function (log, search, record, runtime, format, query, moment) {

    function execute(context) {
        log.debug('Schedule script is working');
        var employeesql = "select * from employee where  id =6139 and isinactive = 'F' and custentity_hris_empemploymentstatus =1";
        log.debug("employeesql", employeesql);
        var queryResult = query.runSuiteQL({
            query: employeesql,
        });
        var employeesqlrecords = queryResult.asMappedResults();

        //    var employeesqlrecords = getResult(employeesql);

        log.debug(" employeesqlrecords.length", employeesqlrecords.length);
        if (employeesqlrecords.length > 0) {

            for (var r = 0; r < employeesqlrecords.length; r++) {
                var leavebalsearch = [];
                var obDetails = [];
                var empInternalId = employeesqlrecords[r].id;
                log.debug('empIntenalId', empInternalId);
                var dateConsidered;
                var currentdate = new Date();
                log.debug('CurrentDate initial', currentdate);
                var obLeaveBalance = 0;
                currentdate = format.parse({
                    value: currentdate,
                    type: format.Type.DATE
                });
                log.debug('Current Date', currentdate);
                //if (empInternalId) {
                var employeeRecord = record.load({
                    type: record.Type.EMPLOYEE,
                    id: empInternalId
                });

                var empHireDate = employeeRecord.getValue('hiredate');
              /*   var empGender = employeeRecord.getValue('custentity_hris_empgender');
                var empJobStatus = employeeRecord.getValue('custentity_emp_employee_job_status');
                var empReligion = employeeRecord.getValue('custentity_hris_empreligion');
                var empGrade = employeeRecord.getValue('custentity_emp_grade_');
                var subsidiary = employeeRecord.getValue('subsidiary');
                var locationID = employeeRecord.getValue('location');
                var maritalStatus = employeeRecord.getValue('custentity_hris_empmaritalstatus');
                var empWeeklyOffCriteria = employeeRecord.getValue('custentity_hris_empweeklyoffcriteria');
                var omaniNonOmani = employeeRecord.getValue('custentity_hris_empomani');

                log.debug('empHireDate', empHireDate);
                log.debug('empGender', empGender);
                log.debug('empJobStatus', empJobStatus);
                log.debug('empReligion', empReligion);
                log.debug('empGrade', empGrade);
                log.debug('subsidiary', subsidiary);
                log.debug('locationID', locationID);
                log.debug('maritalStatus', maritalStatus);
                log.debug('empWeeklyOffCriteria', empWeeklyOffCriteria);
                log.debug('omaniNonOmani', omaniNonOmani); */

                var empHireDateObj = format.parse({
                    value: empHireDate,
                    type: format.Type.DATE
                });

                obDetails = getEmployeeOBDetails(empInternalId);
                log.debug('obDetails', JSON.stringify(obDetails));
                if (obDetails && obDetails.length > 0) {
                    //  If OB Date is present. Consider it for Calculation
                    var obDetailsecord = obDetails[0];
                    obLeaveBalance = obDetailsecord.obleavebalance;
                    var obDate = obDetailsecord.obdate;
                    var parsedOBDate = format.parse({
                        value: obDate,
                        type: format.Type.DATE,
                       // timezone: format.Timezone.ASIA_MUSCAT
                    });
                    dateConsidered = parsedOBDate;
                } else {
                    // Step 3: If OB Date is not present. Consider Emp Join Date for Calculation
                    dateConsidered =empHireDateObj;
                }
                leavebalsearch = searchLeaveBalance(empInternalId, query, empHireDateObj, format, moment, dateConsidered,currentdate)
                log.debug('leavebalsearch', leavebalsearch);
                /*  } else {
                     log.error('No Employee ID found');
                 } */
            }
        }

    }

    function getEmployeeOBDetails(empInternalId) {
        try {
            var result = [];
            var obdate = '';
            var obleavebalance = 0;
    /*         var leaveobbalancesql = "select * from customrecord_hris_leavebalance where custrecord_hris_lvbal_employee_name = '" + empInternalId + "' and  custrecord_hris_lvbal_leave_type = 1 and isinactive ='F'\
                               AND custrecord_hris_lvbal_obdate  IS NOT NULL"// custrecord_hris_lvbal_openingbalance 
     */      
                               var leaveobbalancesql = "select a.* from customrecord_hris_leavebalance a join customrecord_hris_leaveconfig b on a.custrecord_hris_lvbal_leave_type=b.id\
                               where a.custrecord_hris_lvbal_employee_name = '" + empInternalId + "'  and a.isinactive ='F'\
                               and b.custrecord_hris_lvecnfg_seqno = 3 AND a.custrecord_hris_lvbal_obdate  IS NOT NULL" 
                             
            log.debug("leaveobbalancesql", leaveobbalancesql);
            var queryResult = query.runSuiteQL({
                query: leaveobbalancesql,
            });
            var leaveobbalancesqlrecords = queryResult.asMappedResults();


            log.debug(" leaveobbalancesqlrecords.length", leaveobbalancesqlrecords.length);
            if (leaveobbalancesqlrecords.length > 0) {
                obdate = leaveobbalancesqlrecords[0].custrecord_hris_lvbal_obdate || '';
                obleavebalance = leaveobbalancesqlrecords[0].custrecord_hris_lvbal_openingbalance || 0;
                var leavebalcredited = leaveobbalancesqlrecords[0].custrecord_hris_lvbal_leave_balance_cred || 0;
                var leavebaltaken = leaveobbalancesqlrecords[0].custrecord_hris_lvbal_leave_balance_take || 0;
                var availableleavebal = leaveobbalancesqlrecords[0].custrecord_hris_lvbal_available_leave_ba || 0;

                var leavebalid = leaveobbalancesqlrecords[0].id;
                log.debug('Leavebalance Id', leavebalid);
                result.push({
                    "obdate": obdate,
                    "obleavebalance": obleavebalance
                });

            }
            return result;
        } catch (e) {
            log.error("Error in getEmployeeOBDetails", e);

        }
    }
    function searchLeaveBalance(empInternalId, query, empHireDateObj, format, moment, dateConsidered,currentdate) {

       // var leavebalancesql = "select * from customrecord_hris_leavebalance where custrecord_hris_lvbal_employee_name = '" + empInternalId + "' and  custrecord_hris_lvbal_leave_type = 1 and isinactive ='F'"
        var leavebalancesql = "select a.*,b.custrecord_hris_lvecfg_accuraldays as accuraldays from customrecord_hris_leavebalance a join customrecord_hris_leaveconfig b on a.custrecord_hris_lvbal_leave_type=b.id\
        where a.custrecord_hris_lvbal_employee_name = '" + empInternalId + "'  and a.isinactive ='F'\
        and b.custrecord_hris_lvecnfg_seqno = 3" 
        log.debug("leavebalancesql", leavebalancesql);
        var queryResult = query.runSuiteQL({
            query: leavebalancesql,
        });
        var leavebalancesqlrecords = queryResult.asMappedResults();


        log.debug(" leavebalancesqlrecords.length", leavebalancesqlrecords.length);
        if (leavebalancesqlrecords.length > 0) {
            var obdate = leavebalancesqlrecords[0].custrecord_hris_lvbal_obdate;
            var obleavebalance = leavebalancesqlrecords[0].custrecord_hris_lvbal_openingbalance || 0;
            var leavebalcredited = leavebalancesqlrecords[0].custrecord_hris_lvbal_leave_balance_cred || 0;
            var leavebaltaken = leavebalancesqlrecords[0].custrecord_hris_lvbal_leave_balance_take || 0;
            var availableleavebal = leavebalancesqlrecords[0].custrecord_hris_lvbal_available_leave_ba || 0;
            var accuraldays =leavebalancesqlrecords[0].accuraldays||1;

            var leavebalid = leavebalancesqlrecords[0].id;
            log.debug('Leavebalance Id', leavebalid);
            //  var diffDays = currentdate.diff(empHireDateObj, 'days');          
            log.debug('Emphiredateobj', empHireDateObj);
            //  var diffDays = moment.duration(currentdate.diff(empHireDateObj));
            // Convert JavaScript Date objects to Moment.js objects
            var currentMoment = moment(currentdate);
            var dateConsideredMoment = moment(dateConsidered);

            // Calculate the difference in days between the two dates
            var diffDays = currentMoment.diff(dateConsideredMoment, 'days');
            log.debug("Diff Days", diffDays);
            //var leaveBalance = diffDays * 0.08219;
            var leaveBalance = diffDays *(accuraldays/30);
            log.debug('LeaveBalance', leaveBalance);
            var finalleavebal = parseFloat(obleavebalance) + parseFloat(leaveBalance) - parseFloat(leavebaltaken);
            log.debug('finalleavebal', finalleavebal);

            var leavebalupdatedid = record.submitFields({
                type: 'customrecord_hris_leavebalance',
                id: leavebalid,
                values: {
                    //'custrecord_hris_lvbal_annual_leave_bal': leaveBalance.toFixed(2),
                    'custrecord_hris_lvbal_leave_balance_cred': leaveBalance.toFixed(2),
                    'custrecord_hris_lvbal_available_leave_ba': finalleavebal.toFixed(2)
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }
            });
            log.debug('leavebalupdatedid', leavebalupdatedid);

        }
    }
    return {
        execute: execute
    };
});
