/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/record', 'N/search', 'N/task', 'N/log', 'N/format', 'N/runtime', 'N/url', 'N/query'],
    function (record, search, task, log, format, runtime, url, query) {

        /**
         * Retrieves input data for the Map/Reduce script.
         * @returns {Array} Parsed data from the script parameter.
         */
        function getInputData() {
            try {
               // Retrieve parameters
                     var scriptParams = runtime.getCurrentScript();
				var emplist = runtime.getCurrentScript().getParameter('custscript_hris_monthlyattenlist');
			
                log.debug({ title: 'Regular Pay Monthly attendance', details: scriptParams.getParameter({ name: 'custscript_hris_monthlyattenlist' }) });

                record.submitFields({
                    type: "customrecord_hris_mr_status_bar_rec",
                    id: 16,
                    values: {
                        custrecord_hris_mr_sts: 2
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });
                
                 return JSON.parse(emplist);
            }

            catch (e) {

                log.error({
                    title: 'Error in MRS',
                    details: e.message
                });
                record.submitFields({
                    type: "customrecord_hris_mr_status_bar_rec",
                    id: 16,
                    values: {
                        custrecord_hris_mr_sts: 1
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });
            }
        }

        /**
         * Processes each input record in the Map stage.
         * Adds Pay Group information and writes data to context.
         * @param {Object} context The Map/Reduce context object.
         */
        function map(context) {
            var data = JSON.parse(context.value);
            log.debug('Map Data', data);


            context.write({
                key: data.empid,
                value: JSON.stringify(data)
            });
        }

        /**
         * Creates and saves a custom monthly attendance record.
         * @param {Object} data Data for creating the record.
         * @returns {number|null} The ID of the created record, or null if an error occurs.
         */
        /**
 * Creates and saves a custom monthly attendance record.
 * @param {Object} data Data for creating the record.
 * @returns {number|null} The ID of the created record, or null if an error occurs.
 */
        function createMonthlyAttendanceRecord(data, query, format) {
            try {
                 log.audit("data.parId",data.parId);
                var monthlyattensql = "Select * from customrecord_hrms_monthlyattendance where id = " + data.parId;
                var queryResult = query.runSuiteQL({ query: monthlyattensql });
                var tsResult = queryResult.asMappedResults();
                log.debug("tsResult", tsResult);
                log.debug("tsResult length", tsResult.length);

                // Loop through the results and set sublist values
                for (var loop = 0; loop < tsResult.length; loop++) {
                    var rec = tsResult[loop];
                    var empid = rec.custrecord_hrms_month_empid || "";
                    var project = rec.custrecord_hrms_month_project;
                    var projectSeg = rec.custrecord_hrms_month_projectsite;
                    var presentdays = rec.custrecord_hrms_month_presentdays || 0; // Default to 0 if PresentCount is null
                    
                    var weeklyOTHours = rec.custrecord_hrms_month_weeklyothrs || 0;
                    log.debug("weeklyOTHours", weeklyOTHours);
                   
                   
                    var monthid = rec.custrecord_hrms_month_monthid;
                    var yearid = rec.custrecord_hrms_month_yearid;
                    var paygroup = rec.custrecord_hrms_month_paygroup;
                    log.debug("paygroup", paygroup)
                    var payDate = rec.custrecord_hrms_month_paydate||'';
                   if(payDate !=''){
                    var wageDetails = searchWagePeriod(paygroup);
                   }
                    if (wageDetails) {
                        var wageDetailsArray = wageDetails.split('#');
                      //  var payDate = wageDetailsArray[0]; // End date as Pay Date
                        var startDate = wageDetailsArray[1];
                        var wageMonth = wageDetailsArray[2];
                        var wageYear = wageDetailsArray[3];


                        log.debug('Pay Date',wageDetailsArray);
log.debug('Start Date', payDate);
log.debug('Wage Month', startDate);
log.debug('Wage Year', wageMonth);
log.debug('Wage Year', wageYear);



                    } else {
                        log.error('Wage Period Not Found', 'No wage period found for pay group: ' + paygroup);
                    }
                    var parId = rec.id

                    var remark = 'This Entry is created from monthly attendance'
                  
                     var absentdays = rec.custrecord_hrms_month_absentdays || 0;
                    log.debug("Absent Days", absentdays);
                    if (absentdays != 0) {

                        var unpaidleaverecord = record.create({
                            type: 'customrecord_hris_unpaid_leave_entry',
                            isDynamic: true
                        });
                        var reaons = 'This Entry is created from monthly attendance'
                        unpaidleaverecord.setValue({ fieldId: 'custrecord_hris_ule_employee_name', value: empid, ignoreFieldChange: false });
                        unpaidleaverecord.setValue({ fieldId: 'custrecord_hris_ule_pay_group', value: paygroup, ignoreFieldChange: true });
                        if (payDate) {

                            payDate = format.parse({
                                value: payDate,
                                type: format.Type.DATE
                            });
                            unpaidleaverecord.setValue({ fieldId: 'custrecord_hris_ule_pay_date', value: payDate, ignoreFieldChange: true });
                        }
                        unpaidleaverecord.setValue({ fieldId: 'custrecord_hris_ule_month', value: monthid, ignoreFieldChange: true });
                        unpaidleaverecord.setValue({ fieldId: 'custrecord_hris_ule_year', value: yearid, ignoreFieldChange: true });
                        unpaidleaverecord.setValue({ fieldId: 'custrecord_hris_ule_noof_days', value: absentdays, ignoreFieldChange: true });
                        unpaidleaverecord.setValue({ fieldId: 'custrecord_hris_ule_final_days', value: absentdays, ignoreFieldChange: true });
                        unpaidleaverecord.setValue({ fieldId: 'custrecord_hris_ule_reason', value: reaons, ignoreFieldChange: true });
                        var unpaidleaverecordrecordId = unpaidleaverecord.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });;

                        log.debug('Created unpaid leave Record', 'Record ID: ' + unpaidleaverecordrecordId);


                    } 
                     // Update the related daily attendance record
                     if (data.parId) {
                        record.submitFields({
                            type: 'customrecord_hrms_monthlyattendance',
                            id: parseInt(data.parId, 10),
                            values: {
                               
                                custrecord_hrms_month_processcompleted :true
                            }
                        });
                        log.debug('Updated Monthly  Attendance Record', 'Record ID: ' + data.parId);
                    }
             

                }
            } catch (e) {
                log.error('Error Creating Monthly Attendance Record', e.toString());
                return null;
            }
        }


        /**
         * Processes data in the Reduce stage.
         * Creates custom records for each employee's data.
         * @param {Object} context The Reduce context object.
         */
        function reduce(context) {
            try {
                context.values.forEach(function (value) {
                    var data = JSON.parse(value);
                    log.debug('Reduce Data', data);
                    var recordId = createMonthlyAttendanceRecord(data, query, format);

                });
                record.submitFields({
                    type: "customrecord_hris_mr_status_bar_rec",
                    id: 16,
                    values: {
                        custrecord_hris_mr_sts: 1
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });
            } catch (e) {
                log.error({
                    title: 'Error in MRS',
                    details: e.message
                });
                record.submitFields({
                    type: "customrecord_hris_mr_status_bar_rec",
                    id: 16,
                    values: {
                        custrecord_hris_mr_sts: 1
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });
            }
        }

        /**
         * Retrieves the Pay Group for an employee.
         * @param {number} empId Employee ID.
         * @returns {string|null} Pay Group or null if not found.
         */
        function getPayGroup(empId) {
            try {
                var empCompSql = "SELECT * FROM customrecord_hris_employee_compen_change WHERE custrecord_hris_empchange_employee_nam = " + empId + " AND isinactive = 'F'";
                var records = getResult(empCompSql);
                return records.length > 0 ? records[0].custrecord_hris_empchange_emp_pay_pro_gp : null;
            } catch (e) {
                log.error('Error in getPayGroup', e);
                return null;
            }
        }
        function searchWagePeriod(payGroup) {
            try {
                var wagePeriodSql = "SELECT * FROM customrecord_hris_lvewage_period_details WHERE custrecord_hris_lvepay_group = " + payGroup + " AND isinactive = 'F'";
                var records = getResult(wagePeriodSql);
                log.debug("records",records);
                if (records.length > 0) {
                    var endDate = records[0].custrecord_hris_lveend_date;
                    var startDate = records[0].custrecord_hris_lvestart_date;
                    var month = records[0].custrecord_hris_lvemonth;
                    var year = records[0].custrecord_hris_lveyear;
                    return endDate + "#" + startDate + "#" + month + "#" + year;
                }
                return null;
            } catch (e) {
                log.error('Error in searchWagePeriod', e);
                return null;
            }
        }
        function getPayrollcomponent(paygroup,otsequence) {
            try {


                var paycompsql = "select * from customrecord_hris_payroll_component where custrecord_hris__sequence_no_ = 38 and isinactive='F' \
                and custrecord_hris_overtime_type_seq_no =" + otsequence+" and custrecord_hris_pay_process_group= " + paygroup
                var records = getResult(paycompsql);
                return records.length > 0 ? records[0].id : null;
            } catch (e) {
                log.error('Error in getPayrollcomponent', e);
                return null;
            }
        }

        function getbasicpay(empid){
            try{
         /*    var empcompensql="select b.custrecord_hris_cde_monthly as monthlyamt from customrecord_hris_employee_compen_change a join customrecord_hris_compensation_details_e b on\
             a.id=b.custrecord_hris_employee_data_change  join customrecord_hris_payroll_component c  on b.custrecord_hris_cde_payroll_component = c.id \
              where a.custrecord_hris_empchange_employee_nam ="+empid+"and c.isinactive='F' and c.custrecord_hris__sequence_no_ =1"
 */
// Changed according to mam told 15/07/2025 overtime is checked is consider
   var empcompensql="select sum(b.custrecord_hris_cde_monthly) as monthlyamt from customrecord_hris_employee_compen_change a join customrecord_hris_compensation_details_e b on\
             a.id=b.custrecord_hris_employee_data_change  join customrecord_hris_payroll_component c  on b.custrecord_hris_cde_payroll_component = c.id \
              where a.custrecord_hris_empchange_employee_nam ="+empid+"and c.isinactive='F' and c.custrecord_hris_overtime_calculation ='T'"

  log.debug('empcompensql',empcompensql)
              var records = getResult(empcompensql);
              if (records.length > 0) {  
                var basicpay = records[0].monthlyamt;

              }  
              return basicpay;
            } catch (e) {
                log.error('Error in getbasicpay', e);
                return 1;
            }  
        }

        function getweeklyotrate(paycomponent) {
            try {
                var overtimesql = "select *  from customrecord_hris_overtime_type where custrecord_hris_overtime_sequence_no =1 and custrecord_hris_overtime_paycomponent="+paycomponent+" and isinactive='F'";
                var records = getResult(overtimesql);
                log.debug("recordsgetweklyotrate",records);
                if (records.length > 0) {
                    var otrate = records[0].custrecord_hris_overtime_value_cal || 1;
                    var overtimeid = records[0].id;

                }

                return otrate + "#" + overtimeid;
            } catch (e) {
                log.error('Error in getweeklyotrate', e);
                return 1;
            }
        }
        function getholidayottate(paycomponent) {
            try {
                var overtimesql = "select *  from customrecord_hris_overtime_type where custrecord_hris_overtime_sequence_no =2 and custrecord_hris_overtime_paycomponent="+paycomponent+" and isinactive='F'";
                var records = getResult(overtimesql);
                var records = getResult(overtimesql);
                if (records.length > 0) {
                    var otrate = records[0].custrecord_hris_overtime_value_cal || 1;
                    var overtimeid = records[0].id;

                }

                return otrate + "#" + overtimeid;
            } catch (e) {
                log.error('Error in getweeklyotrate', e);
                return 1;
            }
        }
        function getrotrate(paycomponent) {
            try {
                var overtimesql = "select *  from customrecord_hris_overtime_type where custrecord_hris_overtime_sequence_no =3  and custrecord_hris_overtime_paycomponent="+paycomponent+" and isinactive='F'";
                var records = getResult(overtimesql);
                var records = getResult(overtimesql);
                if (records.length > 0) {
                    var otrate = records[0].custrecord_hris_overtime_value_cal || 1;
                    var overtimeid = records[0].id;

                }

                return otrate + "#" + overtimeid;
            } catch (e) {
                log.error('Error in getweeklyotrate', e);
                return 1;
            }
        }

        function getpayrollcompidforovertime(paygroup){
            var querypaycomname = "SELECT id FROM customrecord_hris_payroll_component " +
            "WHERE custrecord_hris_component_short_name = 'Overtime' " +
            "AND custrecord_hris_pay_process_group = "+paygroup+"";
            var records = getResult(querypaycomname);
            var records = getResult(querypaycomname);
// var queryResult = getResult(querypaycomname);

if (records.length > 0) {
    // var result = queryResult.results[0];
    var id = records[0].id;

    log.debug("Component ID", id);

 
} else {
    log.debug("No results found");
}
return id;
        }
        /**
         * Retrieves Wage Period details for a Pay Group.
         * @param {string} payGroup Pay Group.
         * @returns {string|null} Wage details as "EndDate#StartDate#Month#Year" or null if not found.
         */
        function otsearchWagePeriod(payGroup) {
            try {
                var wagePeriodSql = "SELECT * FROM customrecord_hris_lvewage_period_details WHERE custrecord_hris_lvepay_group = " + payGroup + " AND isinactive = 'F'";
                var records = getResult(wagePeriodSql);
                if (records.length > 0) {
                    var endDate = records[0].custrecord_hris_lveend_date;
                    var startDate = records[0].custrecord_hris_lvestart_date;
                    var month = records[0].custrecord_hris_lvemonth;
                    var year = records[0].custrecord_hris_lveyear;
                    return endDate + "#" + startDate + "#" + month + "#" + year;
                }
                return null;
            } catch (e) {
                log.error('Error in searchWagePeriod', e);
                return null;
            }
        }
         function searchWagePeriod(payGroup) {
            try {
                var wagePeriodSql = "SELECT * FROM customrecord_hris_wage_period_details WHERE custrecord_hris_pay_group = " + payGroup + " AND isinactive = 'F'";
                var records = getResult(wagePeriodSql);
                if (records.length > 0) {
                    var endDate = records[0].custrecord_hris_end_date;
                    var startDate = records[0].custrecord_hris_start_date;
                    var month = records[0].custrecord_hris_month;
                    var year = records[0].custrecord_hris_year;
                    return endDate + "#" + startDate + "#" + month + "#" + year;
                }
                return null;
            } catch (e) {
                log.error('Error in searchWagePeriod', e);
                return null;
            }
        }

        /**
         * Executes a SuiteQL query and returns results as a mapped array.
         * @param {string} pSQL The SQL query string.
         * @returns {Array} Query results as mapped objects.
         */
        function getResult(pSQL) {
            var queryResults = query.runSuiteQL({ query: pSQL });
            return queryResults.asMappedResults();
        }

        /**
         * Handles errors and summarizes the script execution.
         * @param {Object} summary The summary of the Map/Reduce execution.
         */
        function summarize(summary) {
            summary.mapSummary.errors.iterator().each(function (key, error) {
                log.error('Map Error for Key: ' + key, error);
                return true;
            });
            summary.reduceSummary.errors.iterator().each(function (key, error) {
                log.error('Reduce Error for Key: ' + key, error);
                return true;
            });
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };
    });
