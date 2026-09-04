function REST_PostPayProcessFunction(datain) {
	var i_emp_company='';
	var i_pay_group='';
	var i_emp_id='';
	var i_wage_month='';
	var year='';
	var pre_pay_processId='';
	try {
		var contextObj = nlapiGetContext();
		var i_subcontext = contextObj.getFeature('SUBSIDIARIES');
		nlapiLogExecution('DEBUG','Test ', 'i_subcontext --> '+ i_subcontext)
		
		var Flag =0;
		if(i_subcontext == false)
		{
			Flag = 1;
		}
		pre_pay_processId = datain.Record_id;
		nlapiLogExecution('DEBUG', 'pre_pay_processId', pre_pay_processId);
		var process_type = '1';
		var MontlySSGross=0.00;
		var MonthlyITGross= 0.00;
		var ITTotalGross= 0.00;
		var globalParamITVal;
		var ITGrossForYr=0.00;
		var ITYearlyCalc =0.00;
		var ITMonthlyCalc=0.00;
		var count=0.00;
		var totalCount =0.00;
		var globalparam_SSEMPval;
		var OTHoursfinal =0;

		var o_payprocess = nlapiLoadRecord('customrecord_hris_pre_pay_process_record', pre_pay_processId);
		var checked_pay_process = o_payprocess.getFieldValue('custrecord_hris_pre_pay_pr_checked');
		var status = o_payprocess.getFieldValue('custrecord_hris_pre_pay_pr_status');
		var employeeremarks=o_payprocess.getFieldValue('custrecord_hris_pre_pay_pr_remarks')
		if(checked_pay_process=='F')
		{
			totalCount = totalCount +1;
			i_emp_id = o_payprocess.getFieldValue('custrecord_hris_pre_pay_pr_employee_name');
			var Empfields = new Array();
			Empfields.push('custentity_hris_empcode');					
			Empfields.push('entityid');
			Empfields.push('custentity_hris_empptlocation');
			Empfields.push('custentity_hris_emp_isptapplicable');
			Empfields.push('custentity_hris_empdepartment_new');
			Empfields.push('hiredate');
			Empfields.push('custentity_hris_empsocialinsurapplicable');
			Empfields.push('custentity_hris_empsubdepartment');
			Empfields.push('custentity_hris_empdlocation_new');
			if (Flag == 0) 
			{
				Empfields.push('subsidiary');
			}

			var EmplookupValues = nlapiLookupField('employee', i_emp_id, Empfields);
			var i_EmpCode = EmplookupValues['custentity_hris_empcode'];
			var i_entityId = o_payprocess.getFieldValue('custrecord_hris_pre_pay_pr_employee_name');
			var PTLoc = EmplookupValues['custentity_hris_empptlocation'];
			var PTApplicable = EmplookupValues['custentity_hris_emp_isptapplicable'];
			var ESICApplicable = CheckPFApplicable(i_entityId);
			var empsubdepartment = EmplookupValues['custentity_hris_empsubdepartment'];
			var emplocation = EmplookupValues['custentity_hris_empdlocation_new'];
			var i_emp_dept = EmplookupValues['custentity_hris_empdepartment_new'];	
			var DOJ = EmplookupValues['hiredate']; 
			var PFApplicable = CheckPFApplicable(i_entityId);
			var empSSCheck = EmplookupValues['custentity_hris_empsocialinsurapplicable']; 
			if (Flag == 0) 
			{
				i_emp_company = EmplookupValues['subsidiary'];
			}	

			var i_emp_name_tx = o_payprocess.getFieldText('custrecord_hris_pre_pay_pr_employee_name');
			i_pay_group = o_payprocess.getFieldValue('custrecord_hris_pre_pay_pr_pay_group');
			i_wage_month = o_payprocess.getFieldValue('custrecord_hris_pre_pay_pr_wage_month');

			var wage_periodId = getWageperiodNo(i_wage_month);
			var getYearWP = getWagePeriodYear(i_pay_group,wage_periodId);
			var YEAR = getYearWP.toString().split('#')
			var GetYear= YEAR[0];
			year= YEAR[1];					
			var wEndDate= YEAR[2];	
			var GetMonthDays = getmonth_days(i_wage_month);

			var getSSandITYr = SearchSSandITYr(GetYear);
			var SSITYEAR = getSSandITYr.split('#');
			var SSstartMonth = SSITYEAR[0];
			var SSEndMonth = SSITYEAR[1];

			var initialrec = deleterecInitial(i_emp_id,i_pay_group,wage_periodId,process_type,GetYear);
			var getArryMonthDay = getArryMonthDays(i_emp_id,wage_periodId,GetYear);
			var paid_days = getPaidDays(i_emp_id,wage_periodId,GetMonthDays,GetYear);
			LOPDaysFinal = getLOPDaysFinal(i_emp_id,wage_periodId,GetYear);		

			OTHoursfinal = getOThours(i_emp_id,i_pay_group,wage_periodId,GetYear);
			var emp_Earn_Comp = getEmployee_EarnComp(i_emp_id,i_emp_name_tx,i_EmpCode,i_pay_group,wage_periodId,GetMonthDays,getArryMonthDay,DOJ,wEndDate,SSstartMonth,SSEndMonth,GetYear,i_emp_dept,i_emp_company,process_type,i_entityId,paid_days,LOPDaysFinal,year,ESICApplicable,PTApplicable,PFApplicable,PTLoc,empsubdepartment,emplocation,OTHoursfinal,employeeremarks)					
			var act_earning_gross = emp_Earn_Comp.split('#');					
			var actual_earning = act_earning_gross[0];					
			var gross_earn = act_earning_gross[1];				
			var Component_Type = act_earning_gross[2];
			var PAID_DAY = act_earning_gross[3];
			var EarnSSGross = act_earning_gross[4];
			var EarnITGross = act_earning_gross[5];

			var emp_dedc_Comp = getEmployee_DedcComp(i_emp_id,i_emp_name_tx,i_EmpCode,i_pay_group,wage_periodId,GetMonthDays,getArryMonthDay,GetYear,i_emp_dept,i_emp_company,process_type,i_entityId,paid_days,LOPDaysFinal,year,ESICApplicable,PTLoc,wEndDate,empsubdepartment,emplocation,OTHoursfinal,employeeremarks)					
			var act_dedu_gross = emp_dedc_Comp.split('#');					
			var actual_deduc = act_dedu_gross[0];					
			var gross_dedc = act_dedu_gross[1];					
			gross_dedc = Math.abs(gross_dedc);
			var Component_Type_dedc = act_dedu_gross[2];					
			var PAID_DAY = act_earning_gross[3];

			var emp_other_Comp = getEmployee_OtherComp(wEndDate, i_emp_id,i_emp_name_tx,i_EmpCode,i_pay_group,wage_periodId,GetMonthDays,getArryMonthDay,GetYear,i_emp_dept,i_emp_company,process_type,i_entityId,PAID_DAY,LOPDaysFinal,year,ESICApplicable,PTLoc,empsubdepartment,emplocation,OTHoursfinal,employeeremarks)
				
			var GetMonthVariableDays = MonthVarDay(i_emp_id, GetYear, wage_periodId);
			if (GetMonthVariableDays != 'undefined' && GetMonthVariableDays != '' && GetMonthVariableDays != null) 
			{
				var MonthlyVar = nlapiStringToDate(GetMonthVariableDays)
				var Varimonth = MonthlyVar.getMonth()+1;
				var MYear = MonthlyVar.getFullYear()
				Varimonth = valueCheck(Varimonth);
				Varimonth = gethrisMonth(Varimonth);
				if(wage_periodId== Varimonth && MYear == year)
				{
					var emp_monthly_Variable = getMonthlyVariable_Comp(i_emp_id, i_entity, i_EmpCode,DOJ, i_pay_group, wage_periodId,wEndDate, emp_Earn_Comp, emp_dedc_Comp, GetYear, i_emp_dept, i_emp_company, process_type, i_entityId, PAID_DAY, LOPDaysFinal, year, ESICApplicable, PTLoc,empsubdepartment,emplocation,OTHoursfinal,employeeremarks);
					if(emp_monthly_Variable!=null && emp_monthly_Variable!='' && emp_monthly_Variable!='undefined')
					{
						var splitGrossAndType = emp_monthly_Variable.split('#');
						var Montly_Amt = splitGrossAndType[0];
						Montly_Amt = valueCheck(Montly_Amt)
						Montly_Amt = Math.abs(Montly_Amt)
						var gross_type = splitGrossAndType[1];
						MontlySSGross = splitGrossAndType[2];						
						MonthlyITGross = splitGrossAndType[3];					
					}
				}
			}	
			
			if(PTApplicable=='T')
			{
				var PTEntry = createPTComp(i_entityId,i_EmpCode,process_type,i_pay_group,i_emp_id,i_emp_dept,wage_periodId,i_emp_company,LOPDaysFinal,PAID_DAY,GetYear,PTApplicable,PTLoc,empsubdepartment,emplocation,OTHoursfinal,employeeremarks);
			}
			
			var SSID = searchSSId(i_pay_group);
			if(MontlySSGross!=null && MontlySSGross!='' && MontlySSGross!='undefined' && MontlySSGross!=0)
			{
				SSTotalGross = parseFloat(MontlySSGross) + parseFloat(EarnSSGross);
			}
			else
			{
				SSTotalGross = parseFloat(EarnSSGross)
			}
			if(SSTotalGross!=0 && SSTotalGross!= null && SSTotalGross!='' && SSTotalGross!='undefined')
			{
				globalparam_SSEMPval = searchSSEMP(i_pay_group);
				var globalparam_SSEmloyerval = searchSSEmployer(i_pay_group);
				SSEmployeeConti = SSTotalGross * parseFloat(globalparam_SSEMPval) / 100;
				SSEmployerContri = SSTotalGross * parseFloat(globalparam_SSEmloyerval) / 100;		
				
				if(SSEmployeeConti!=null && SSEmployeeConti!='' && SSEmployeeConti!='undefined')
				{
					if(empSSCheck == 'T')
					{
						var CheckSSCompCreated = searchSSCompCreated(wEndDate, i_entityId,i_emp_name_tx,i_EmpCode,process_type,i_pay_group,i_emp_id,i_emp_dept,wage_periodId,i_emp_company,Component_Type,SSID,SSEmployeeConti,SSEmployerContri,SSTotalGross,LOPDaysFinal,PAID_DAY,GetYear,ESICApplicable,PTLoc,empsubdepartment,emplocation,OTHoursfinal,employeeremarks)
					}
				}
			}
			
			var ITID = searchITId()
			if(MonthlyITGross!=null && MonthlyITGross!='' && MonthlyITGross!='undefined' && MonthlyITGross!=0)
			{
				ITTotalGross = parseFloat(MonthlyITGross) + parseFloat(EarnITGross);
			}
			else
			{
				ITTotalGross = parseFloat(EarnITGross)
			}
			
			if (ITTotalGross != 0 && ITTotalGross != null && ITTotalGross != '' && ITTotalGross != 'undefined') 
			{
				globalParamITVal = searchITForCalc()
				ITGrossForYr = ITTotalGross * globalParamITVal;
				ITYearlyCalc = calulateITMonthlyValue(ITGrossForYr)
				ITMonthlyCalc = parseFloat(ITYearlyCalc) / 12;
				if(ITMonthlyCalc!=null && ITMonthlyCalc!='' && ITMonthlyCalc!='undefined')
				{
					var CheckITCompCreated = searchITCompCreated(wEndDate, i_entityId,i_emp_name_tx,i_EmpCode,process_type,i_pay_group,i_emp_id,i_emp_dept,wage_periodId,i_emp_company,Component_Type,ITID,ITMonthlyCalc,ITTotalGross,LOPDaysFinal,paid_days,GetYear,ESICApplicable,PTLoc,empsubdepartment,emplocation,OTHoursfinal,employeeremarks)
				}
			}
			
			var earning_Total = getEarningGross(wEndDate, i_emp_name_tx,i_EmpCode,i_pay_group,wage_periodId,i_emp_id,Component_Type,GetYear,i_emp_dept,i_emp_company,process_type,i_entityId,PAID_DAY,LOPDaysFinal,ESICApplicable,PTLoc,empsubdepartment,emplocation,OTHoursfinal,employeeremarks);
			var deduction_total = getDedcGross(wEndDate, i_emp_name_tx,i_EmpCode,i_pay_group,wage_periodId,i_emp_id,Component_Type_dedc,GetYear,i_emp_dept,i_emp_company,process_type,i_entityId,PAID_DAY,LOPDaysFinal,ESICApplicable,PTLoc,empsubdepartment,emplocation,OTHoursfinal,employeeremarks);
			var Net_Pay = GetNetPay(wEndDate, i_emp_name_tx, i_emp_id,i_EmpCode,i_pay_group,wage_periodId,earning_Total,deduction_total,GetYear,i_emp_dept,i_emp_company,process_type,i_entityId,PAID_DAY,LOPDaysFinal,ESICApplicable,PTLoc,empsubdepartment,emplocation,OTHoursfinal,employeeremarks)
		}
		count = count + 1;
		o_payprocess.setFieldValue('custrecord_hris_pre_pay_pr_status','Completed');
		o_payprocess.setFieldValue('custrecord_hris_pre_pay_pr_checked','T');
		nlapiSubmitRecord(o_payprocess,true,true);
		return totalCount;
	} catch (e) {
		var respRec = pre_pay_processId ? ('customrecord_hris_pre_pay_process_record (ID: ' + pre_pay_processId + ')') : '';
		logErrorToCustomRecord('REST_PostPayProcessFunction', e, i_pay_group, i_emp_company, i_emp_id, i_wage_month, year, respRec);
		throw e;
	}
}

function logErrorToCustomRecord(functionName, errorObj, payGroup, subsidiary, employee, month, year, respRecord) {
    try {
        var errorDetails = '';
        if (typeof errorObj === 'object' && errorObj !== null) {
            if (typeof errorObj.getDetails === 'function') {
                errorDetails = errorObj.getDetails();
            } else if (errorObj.message) {
                errorDetails = errorObj.message;
            } else if (errorObj.details) {
                errorDetails = errorObj.details;
            } else {
                errorDetails = JSON.stringify(errorObj);
            }
            if (errorObj.stack) {
                errorDetails += '\nStack: ' + errorObj.stack;
            }
        } else {
            errorDetails = String(errorObj);
        }

        nlapiLogExecution('ERROR', 'Error in ' + functionName, errorDetails);

        var logRec = nlapiCreateRecord('customrecord_pay_process_log');
        logRec.setFieldValue('custrecord_function', functionName);
        logRec.setFieldValue('custrecord_log', errorDetails);
        if (payGroup) {
            logRec.setFieldValue('custrecord_pay_group', payGroup);
        }
        if (subsidiary) {
            logRec.setFieldValue('custrecord_subsidiary', subsidiary);
        }
        if (employee) {
            logRec.setFieldValue('custrecord_employee', employee);
        }
        if (month) {
            logRec.setFieldValue('custrecord_month', month);
        }
        if (year) {
            logRec.setFieldValue('custrecord_year_payprolog', year);
        }
        if (respRecord) {
            logRec.setFieldValue('custrecord_responsible_record', respRecord);
        }
        nlapiSubmitRecord(logRec, true, true);
    } catch (logErr) {
        nlapiLogExecution('ERROR', 'Failed to save error log record in ' + functionName, logErr.getDetails ? logErr.getDetails() : (logErr.message || logErr.toString()));
    }
}

function getEmployee_EarnComp(i_emp_name,i_emp_name_tx,i_EmpCode,i_pay_group,wage_periodId,GetMonthDays,getArryMonthDay,DOJ,wEndDate,SSstartMonth,SSEndMonth,GetYear,i_emp_dept,i_emp_company,process_type,i_entityId,paid_days,LOPDaysFinal,year,ESICApplicable,PTApplicable,PFApplicable,PTLoc,empsubdepartment,emplocation,OTHoursfinal,employeeremarks) {
	var Emp_Datachange_Id = '';
	try {
		//nlapiLogExecution('DEBUG','Suitlet POST','paid_days ==============================^^^^^^^^^^^^^^^^^^^^^^^^^^ =='+paid_days)
	var Actual_gross_pay = 0.00;
	var Gross_earning=0.00;
	var Act_Gross_pay =0.00;
	var gross_dedc = 0.00;
	var proRatacaL = 0.00;
	var diffrence_in_pre_sal =0.00;
	var wage_Period = wage_periodId;
	var Increment_Month;
	var LOPAmt =0.00;
	var PresentDays=0.00;
	var IncrementLOPAmt=0.00;
	var Sal_adj_amt =0.00;	
	var ArrearAmt=0.00;
	var PFGross=0.00;
	var ESICTotal =0.00;
	var PFGrossTotal=0.00;
	var PFCheck ;
	var PFCal=0.00;
	var ESICEmpContri=0.00;
	var ESICEmplyerContri=0.00;
	var ESICGross=0.00; 
	var ESICGrossTotal=0.00;
	var globalParam_ESICEMPval;
	var globalparam_SSEMPval;
	var PTGrossTotal = 0.00;
	var PTCalc = 0.00;
	var SSGrossTotal= 0.00;
	var SSEmployeeConti=0.00;
	var SSEmployerContri = 0.00;
	var SSCheck;
	var globalParamITVal;
	var ITGrossForYr=0.00;
	var ITYearlyCalc=0.00;
	var ITMonthlyCalc=0.00;
	var ITGrossTotal=0.00;
	wage_Period = parseInt(wage_Period);
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_empchange_emp_pay_pro_gp', null, 'is', i_pay_group));
	Filters.push(new nlobjSearchFilter('custrecord_hris_empchange_employee_nam', null, 'is', i_emp_name)); 	
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
	var Column = new Array();
	Column.push(new nlobjSearchColumn('custrecord_hris_employee_data_change','custrecord_hris_employee_data_change'))
	Column.push(new nlobjSearchColumn('custrecord_hris_cde_payroll_component','custrecord_hris_employee_data_change'))//CompName
	Column.push(new nlobjSearchColumn('custrecord_hris_cde_monthly','custrecord_hris_employee_data_change'))//Monthly
	Column.push(new nlobjSearchColumn('custrecord_hris_cde_annually','custrecord_hris_employee_data_change'))//Annualy
	
	var searchEmpEarn = nlapiSearchRecord('customrecord_hris_employee_compen_change',null, Filters, Column);
	if (searchEmpEarn != null) 
	{
		for (var empE = 0; empE < searchEmpEarn.length; empE++) 
		{
			var ArrearAmt=0.00;
			Emp_Datachange_Id = searchEmpEarn[empE].getValue('custrecord_hris_employee_data_change','custrecord_hris_employee_data_change')//Emp data change id
			var i_current_monthly = searchEmpEarn[empE].getValue('custrecord_hris_cde_monthly','custrecord_hris_employee_data_change');//Monthly
			var i_current_annually = searchEmpEarn[empE].getValue('custrecord_hris_cde_annually','custrecord_hris_employee_data_change')//Annualy
			var i_Earn_Compnent = searchEmpEarn[empE].getValue('custrecord_hris_cde_payroll_component','custrecord_hris_employee_data_change')//Pay comp
			var i_Earn_Compnent_Txt = searchEmpEarn[empE].getText('custrecord_hris_cde_payroll_component','custrecord_hris_employee_data_change')//paycomp txt				
			var i_paygroup_earn = nlapiLookupField('customrecord_hris_employee_compen_change',Emp_Datachange_Id,'custrecord_hris_empchange_emp_pay_pro_gp');
			var i_emp_Id = nlapiLookupField('customrecord_hris_employee_compen_change',Emp_Datachange_Id,'custrecord_hris_empchange_employee_nam')			
			var Increment_eff_date = nlapiLookupField('customrecord_hris_employee_compen_change',Emp_Datachange_Id,'custrecord_hris_empchange_increment_eff')
			var Increament_applied_date = nlapiLookupField('customrecord_hris_employee_compen_change',Emp_Datachange_Id,'custrecord_hris_empchange_increment_app')
			if (Increment_eff_date != null && Increment_eff_date != '' && Increment_eff_date != 'undefined') 
			{

				var EFFECTIVE_DATE = Increment_eff_date.toString().split('/');				
				Increment_Month = EFFECTIVE_DATE[0];				
				Increment_Month = parseInt(Increment_Month);
				// Valid for month by florence
				Increment_Month = gethrisMonth(Increment_Month);
				var Increment_Day = EFFECTIVE_DATE[1];				
				var Increment_Year = EFFECTIVE_DATE[2];			
			}
					var EarnCompField = new Array();
					EarnCompField.push('custrecord_hris_payroll_component_type')
					EarnCompField.push('custrecord_hris_pt_ind')
					EarnCompField.push('custrecord_hris_account_name')
					var EarnComplookupValues =  nlapiLookupField('customrecord_hris_payroll_component',i_Earn_Compnent,EarnCompField);	
					var Component_type = EarnComplookupValues['custrecord_hris_payroll_component_type'];	
					var PTCheckComp = EarnComplookupValues['custrecord_hris_pt_ind'];						
					var account_code = EarnComplookupValues['custrecord_hris_account_name'];				
					if (i_current_monthly != '' && i_current_monthly != null && i_current_monthly != 'undefined' && i_current_monthly != 0) 
					{
						Gross_earning = parseFloat(Gross_earning) + parseFloat(i_current_monthly);
						//Array on Increment Effective Date	
						if(Increament_applied_date!='' && Increament_applied_date!=null && Increament_applied_date!='undefined')
						{
							nlapiLogExecution('DEBUG','Suitlet POST','Increament_applied_date======^^^^^^^^^^^^^^^^^^^^^^^^^^ =='+Increament_applied_date)
							//nlapiLogExecution('DEBUG','Suitlet POST','wEndDate================^^^^^^^^^^^^^^^^^^^^^^^^^^ =='+wEndDate)
							if (Increament_applied_date == wEndDate)
							{ 
							if (Increment_Month != null && Increment_Month != '' && Increment_Month != 'undefined') {
								if (Increment_Month < wage_Period) 
								{
									nlapiLogExecution('DEBUG', 'IMonth if loop Inside')
									var IMonth = parseInt(Increment_Month)
									var final_Diffrence = 0.00
									nlapiLogExecution('DEBUG', 'IMonth before For loop Inside',IMonth)
									for (var i = IMonth; i < wage_Period; i++) 
									{
										
										nlapiLogExecution('DEBUG', 'IMonth For loop Inside')
										//Increment_Month= parseInt(Increment_Month)+ parseInt(1);								
										var getDaysOfIncrementMonth = getmonth_days(IMonth);
										//LOp amount added in Existing Basic
										var IncrementLopAmt = getLOPDaysIncrement(i_emp_Id, IMonth, i_current_monthly, getDaysOfIncrementMonth, GetYear);
										var INCREMENTLOP = IncrementLopAmt.split('#')
										IncrementLOPAmt = INCREMENTLOP[0];
										//Increment Sal adjustment
										var IncreSalAdj = GetSalaryAdjustAmt(i_emp_Id, i_pay_group, i_Earn_Compnent, IMonth, GetYear);
										if (IncreSalAdj != null && IncreSalAdj != '' && IncreSalAdj != 'undefined') {
											var SALADJREC = IncreSalAdj.toString().split('#');
											Sal_adj_amt = SALADJREC[0];
										}
										//Increment Arrear
										var ArrDays = IncrementarrarDays(i_emp_Id, i_current_monthly, getArryMonthDay, IMonth, GetYear);
										var ArrearsAmtAndDays = ArrDays.toString().split('#');
										ArrearAmt = parseFloat(ArrearsAmtAndDays[0]);
										ArrearAmt = valueCheck(ArrearAmt);
										var Prev_Month = get_Prev_month_component_Value(i_emp_Id, i_paygroup_earn, i_Earn_Compnent, i_current_monthly, IMonth);
										var PREVI = Prev_Month.toString().split('#');
										var Prev_Actual_Amt = PREVI[0];
										var Prev_gross_eran = PREVI[1];
										var Prev_Comp = PREVI[2];
										
										if (i_current_monthly != Prev_gross_eran && i_Earn_Compnent == Prev_Comp) {
											if (Sal_adj_amt != 'undefined' && Sal_adj_amt != '' && Sal_adj_amt != null) {
												diffrence_in_pre_sal = (parseFloat(i_current_monthly) - parseFloat(Prev_Actual_Amt)) - parseFloat(IncrementLOPAmt) + parseFloat(Sal_adj_amt)//+ parseFloat(ArrearAmt);																			
											}
											else {
												diffrence_in_pre_sal = (parseFloat(i_current_monthly) - parseFloat(Prev_Actual_Amt)) - parseFloat(IncrementLOPAmt) + parseFloat(ArrearAmt);
											}
											final_Diffrence = parseFloat(final_Diffrence) + parseFloat(diffrence_in_pre_sal);
										}//End if (i_current_monthly != Prev_gross_eran && i_Earn_Compnent == Prev_Comp) 
										else {
											diffrence_in_pre_sal = 0.00;
											final_Diffrence = 0.00;
										}
										IMonth = parseInt(IMonth) + parseInt(1);
									}//End for (var i = IMonth; i < wage_Period; i++) 							
								}//End if (Increment_Month < wage_Period) 
							}//End if (Increment_Month != null && Increment_Month != '' && Increment_Month != 'undefined') 					
					}
						}
					
				//ArryDays
					var ArryCheck = compArrCheck(i_Earn_Compnent);					
					if(ArryCheck =='T')
					{
						nlapiLogExecution('DEBUG', 'Arrear Check is true')
						var ArrDays = arrarDays(i_emp_Id,i_current_monthly,getArryMonthDay,wage_Period,GetYear);					
						var ArrearsAmtAndDays = ArrDays.toString().split('#');
						var ArrearAmt =parseFloat(ArrearsAmtAndDays[0]);					
						ArrearAmt = valueCheck(ArrearAmt)					
						var ARDays = ArrearsAmtAndDays[1];					
						ARDays = valueCheck(ARDays)	
					}
					else
					{
						ArrearAmt =0.00;
						ARDays = 0.00;
						
					}					
				//LOP					
					var Comp_LOP_Check = compLoPCheck(i_Earn_Compnent);					
					var LOPDay = 0.00
					if(Comp_LOP_Check=='T')
					{
						var LOPDays = getLOPDays(i_emp_Id,wage_Period,i_current_monthly,GetMonthDays,GetYear);					
						var LOP =LOPDays.toString().split('#');
                      nlapiLogExecution('DEBUG', 'LOP Calculation', 'LOP array after split: ' + JSON.stringify(LOP));
						LOPAmt =LOP[0];					
						LOPAmt= parseFloat(LOPAmt)	
                      nlapiLogExecution('DEBUG', 'LOP Calculation', 'LOPAmt after parsing: ' + LOPAmt);
						LOPDay = LOP[1];					
						LOPDay=valueCheck(LOPDay)	
                      nlapiLogExecution('DEBUG', 'LOP Calculation', 'LOPDay after valueCheck: ' + LOPDay);
					}
					else
					{
						LOPAmt = 0.00;
						LOPDay = 0.00;						
					}					
				//ProRata
					var Pro_rata_Check = compProRataCheck(i_Earn_Compnent);
					if(Pro_rata_Check=='T')
					{
						var Preasent_Days = employeeDateofJoining(i_emp_Id,wage_Period,LOPDay,year);
						var PRORATA = Preasent_Days.toString().split('#')
						PresentDays = PRORATA[0];
									nlapiLogExecution('DEBUG', 'processId Fields', 'PresentDays*******^^' + PresentDays);			
						var wage_month_days = PRORATA[1];						
						var DOJ_Month =PRORATA[2];						
						var GetYrID = PRORATA[3];
						var DOJ_Yr = searchYrId(GetYrID)
												
						proRatacaL = (parseFloat(i_current_monthly)/wage_month_days)* PresentDays;	
						nlapiLogExecution('DEBUG', 'processId Fields', 'proRatacaL*******^^' + proRatacaL);
						proRatacaL = valueCheck(proRatacaL);
					}
					else
					{
						proRatacaL = 0.00;
						Pro_rata_Check=='F'
					}
					
				  //Salary adjustment		
						var salary_adjustment = GetSalaryAdjustAmt(i_emp_Id,i_pay_group,i_Earn_Compnent,wage_Period,GetYear);
						var SALADJREC= salary_adjustment.toString().split('#');
						var SalAdjustDate = SALADJREC[2]
						var Sal_adj_amt =0
						var Sal_adj_comp_type;
						if (SalAdjustDate != null && SalAdjustDate != 'undefined' && SalAdjustDate != '') 
						{
							var SALARYADJDATE = nlapiStringToDate(SalAdjustDate)//SalAdjustDate.toString().split('/');
							
							var SAMonth = SALARYADJDATE.getMonth()+1 ;//SALARYADJDATE[0];					
							nlapiLogExecution('DEBUG', 'processId Fields', 'SAMonth*******' + SAMonth);		
							var SAYear = SALARYADJDATE.getFullYear();//SALARYADJDATE[2];
							nlapiLogExecution('DEBUG', 'processId Fields', 'SAYear*******' + SAYear);	
							if (SAMonth == wage_Period) //&& SAYear == GetYear) 
							{
								Sal_adj_amt =  SALADJREC[0];		
															
								Sal_adj_comp_type = SALADJREC[1];							
							}
							//Sal_adj_amt = parseFloat(Sal_adj_amt)
							i_current_monthly = parseFloat(i_current_monthly) + parseFloat(Sal_adj_amt)
							nlapiLogExecution('DEBUG', 'processId Fields', 'i_current_monthly*******^^' + i_current_monthly);
							
						}
					
				//Gross Pay					
					if(Pro_rata_Check=='T' && (DOJ_Month == wage_Period)&&(DOJ_Yr == GetYear))
					{
						Actual_gross_payArrPro = Math.abs(parseFloat(ArrearAmt)-parseFloat(proRatacaL));
						Actual_gross_payArrPro = Math.abs(Actual_gross_payArrPro)
						Actual_gross_pay = parseFloat(Actual_gross_payArrPro)// - parseFloat(LOPAmt);
						paid_days =	PresentDays;
						nlapiLogExecution('debug','paid_days testing log in side the check box',paid_days);						
					}
					else
					{
						LOPAmt = valueCheck(LOPAmt);
						ArrearAmt= Math.abs(ArrearAmt);
						final_Diffrence=valueCheck(final_Diffrence);												
						Actual_gross_pay = parseFloat(i_current_monthly)+ parseFloat(ArrearAmt)- Math.abs(parseFloat(LOPAmt)) + parseFloat(final_Diffrence);						
						paid_days =paid_days ; 
						nlapiLogExecution('debug','paid_days testing log else part',paid_days);
					}					
					//PF
					nlapiLogExecution('debug','paid_days testing log out if inf else',paid_days);
					nlapiLogExecution('DEBUG', 'In LOP', 'PFApplicable===========' + PFApplicable);	
					PFCheck = compPFCheck(i_Earn_Compnent);
					nlapiLogExecution('DEBUG', 'In LOP', 'PFCheck===========' + PFCheck);	
					if (PFCheck == 'T') 
					{
						PFGross = CalcuPFgross(i_paygroup_earn,Actual_gross_pay)
						PFGrossTotal = parseFloat(PFGross)+ parseFloat(PFGrossTotal);  //PFcalcula(i_emp_Id,i_current_monthly,wage_Period,GetYear)
						nlapiLogExecution('DEBUG', 'In LOP', 'PFGrossTotal===========' + PFGrossTotal);												
					}	
					var globalParameterPFvalue = searchPFValue()
					if(globalParameterPFvalue == 15000 )//6500 && globalParameterPFvalue!='undefined' && globalParameterPFvalue!= null)
					{
						if(PFGrossTotal >= globalParameterPFvalue)//Restrict to 780
						{
							 PFCal = (15000 * 12)/100
							// /////////////nlapiLogExecution('DEBUG', 'PF', 'PFCal Restricted to 1800***************' + PFCal);
						}
						else if (PFGrossTotal < globalParameterPFvalue)
						{
							PFCal = (PFGrossTotal * 12)/100
							///////////////nlapiLogExecution('DEBUG', 'PF', 'PFCal less then 15000***************' + PFCal);
						}					
					}
					else
					{						
						PFCal = (PFGrossTotal * 12)/100
					}	
				
		
					//ESIC
					var ESICCal;
					var ESICCheck = compESICCheck(i_Earn_Compnent);
					
					if (ESICCheck == 'T') 
					{
						var ESICGross = CalcuESICgross(i_paygroup_earn,Actual_gross_pay);					
						ESICGrossTotal = parseFloat(ESICGrossTotal)+ parseFloat(ESICGross);					
					}
					if(ESICCheck == 'T')
					{
						globalParam_ESICEMPval =searchESICEMP();					
						var globalParam_ESICEmployerval = searchESICEmployer();
						ESICEmpContri =(parseFloat(ESICGrossTotal) * parseFloat(globalParam_ESICEMPval))/100
						ESICEmplyerContri = (parseFloat(ESICGrossTotal) * parseFloat(globalParam_ESICEmployerval))/100
					}

					//Loan Allocation
				
					var search_Loan_Ids = searchLoanEntry(i_emp_Id,wage_Period,GetYear);
					nlapiLogExecution('AUDIT', 'search_LoanEntry',  search_Loan_Ids);
					//		var split_LoanEntry =  search_LoanEntry.split('#');
	                //        var LoanEntry = split_LoanEntry[0];
					//		nlapiLogExecution('DEBUG', 'LoanEntry', LoanEntry);
	                //    	var loan_Type = split_LoanEntry[1];
					//		nlapiLogExecution('DEBUG', 'loan_Type', loan_Type);
							
					//if(LoanEntry!='' && LoanEntry!='undefined' && LoanEntry!=null)
					//{
					//	var LOAN = LoanEntry.split('#')
					//	var LoanType = LOAN[0];
					//	nlapiLogExecution('DEBUG', 'Loan Type', LoanType);
					//	var Loan_Amt = LOAN[1];
						//nlapiLogExecution('DEBUG', 'Loan_Amt', search_LoanEntry);
					//}
					
					//SS calculation
					//Check DOJ and current wage period 
					var SSEntryId;
				
					var DateofJoin = DOJ;
					DateofJoin = new Date(DateofJoin)
					////nlapiLogExecution('DEBUG', 'In LOP', 'DateofJoin===========' + DateofJoin);
					var Wage_EndDate = wEndDate;
					Wage_EndDate = new Date(Wage_EndDate)
					////nlapiLogExecution('DEBUG', 'In LOP', 'Wage_EndDate===========' + Wage_EndDate);
					
					var differenceInDays = (Wage_EndDate.getTime() - DateofJoin.getTime()) / (1000  *60*  60 * 24);
					////nlapiLogExecution('DEBUG', 'In LOP', 'differenceInDays===========' + differenceInDays);	
                    nlapiLogExecution('DEBUG', 'aa before SSCheck')					
					SSCheck = compSSCheck(i_paygroup_earn,i_Earn_Compnent);
					nlapiLogExecution('DEBUG', 'aa SSCheck', SSCheck)
					
					if(!SSCheck)
					{
						SSCheck = '';
					}
					
					var SSFlag =0;
					//if (differenceInDays >= 16) 
					//{
						if (SSCheck == 'T') 
						{
							//nlapiLogExecution('DEBUG', 'In LOP', 'Actual_gross_pay SS True===========' + Actual_gross_pay);		
							//var SSGross = CalcuSSGross(i_paygroup_earn, Actual_gross_pay);
							SSGrossTotal = parseFloat(SSGrossTotal) + parseFloat(i_current_monthly);
							nlapiLogExecution('DEBUG', 'In LOP', 'SSGrossTotal===========' + SSGrossTotal);
						} //End if (SSCheck == 'T') 

					//}	//End if (differenceInDays >= 16)			
					//Income tax
					var ITID = searchITId()					
					var IncomeTaxCheck = compIncomeCheck(i_paygroup_earn,i_Earn_Compnent);	
					//nlapiLogExecution('DEBUG', 'In LOP', 'IncomeTaxCheck===========' + IncomeTaxCheck);				
					if(IncomeTaxCheck == 'T')
					{
					//nlapiLogExecution('DEBUG', 'In LOP', 'i_Earn_Compnent===========' + i_Earn_Compnent_Txt);				
					//nlapiLogExecution('DEBUG', 'In LOP', 'Actual_gross_pay IT True===========' + Actual_gross_pay);		
						ITGrossTotal = parseFloat(ITGrossTotal) + parseFloat(Actual_gross_pay);
						//nlapiLogExecution('DEBUG', 'In LOP', 'ITGrossTotal===========' + ITGrossTotal);
					}	
							
					//Employee Contribution					
					//Actual_gross_pay = parseFloat(valueCheck(Actual_gross_pay));
					Act_Gross_pay = parseFloat(Act_Gross_pay)+ parseFloat(Actual_gross_pay);
					LOPDay = valueCheck(LOPDay)
					
					var payprocess = nlapiCreateRecord('customrecord_hris_pay_process');			
					payprocess.setFieldValue('custrecord_hris_pay_proc_employee',i_entityId);
					payprocess.setFieldValue('custrecord_hris_pay_proc_employee_code',i_EmpCode);
					payprocess.setFieldValue('custrecord_hris_pay_proc_process_type',process_type);
					payprocess.setFieldValue('custrecord_hris_pay_proc_pay_group', i_paygroup_earn);
					payprocess.setFieldValue('custrecord_hris_pay_proc_employee_name', i_emp_name_tx);
					payprocess.setFieldValue('custrecord_hris_pay_proc_department',i_emp_dept);
                    // By florence
					nlapiLogExecution('AUDIT', 'EarnrecSubdepartment',empsubdepartment);
                    payprocess.setFieldValue('custrecord_hris_pay_proc_subdept',empsubdepartment);
                  //  payprocess.setFieldValue('custrecord_hris_pay_proc_location',emplocation);

					if (i_emp_company != 'undefined' && i_emp_company!='' && i_emp_company!='')
					{
					payprocess.setFieldValue('custrecord_hris_pay_proc_company_name',i_emp_company);
					}
					payprocess.setFieldValue('custrecord_hris_pay_proc_pay_month', wage_Period);
					payprocess.setFieldValue('custrecord_hris_pay_proc_pay_date', wEndDate);
					payprocess.setFieldValue('custrecord_hris_pay_proc_year',GetYear);
					payprocess.setFieldValue('custrecord_hris_pay_proc_payroll_compone',i_Earn_Compnent);
					payprocess.setFieldValue('custrecord_hris_pay_proc_account_code',account_code);
					payprocess.setFieldValue('custrecord_hris_pay_proc_component_type',Component_type);
					payprocess.setFieldValue('custrecord_hris_pay_proc_lop_days',LOPDay);
					payprocess.setFieldValue('custrecord_hris_pay_proc_pt_check',PTCheckComp);
					payprocess.setFieldValue('custrecord_hris_pay_proc_ss_check',SSCheck);
					payprocess.setFieldValue('custrecord_hris_pay_proc_paid_days',paid_days);
					payprocess.setFieldValue('custrecord_hris_pay_proc_lop_days_final',LOPDaysFinal)
					payprocess.setFieldValue('custrecord_hris_pay_proc_lop_amount',LOPAmt.toFixed(2));//LOP amt
					if (Pro_rata_Check != null && Pro_rata_Check != '' && Pro_rata_Check != 'undefined') 
					{
						payprocess.setFieldValue('custrecord_hris_pay_proc_pro_rata', Pro_rata_Check);
					}
					else
					{
						payprocess.setFieldValue('custrecord_hris_pay_proc_pro_rata', 'F');
					}
					payprocess.setFieldValue('custrecord_hris_pay_proc_pro_rata_amount',proRatacaL.toFixed(2));
					payprocess.setFieldValue('custrecord_hris_pay_proc_arrear_days', ARDays);//AarryDays
					payprocess.setFieldValue('custrecord_hris_pay_proc_arrears', ArrearAmt.toFixed(2));//AarryAmt//
					payprocess.setFieldValue('custrecord_hris_pay_proc_pt_location',PTLoc);	
					payprocess.setFieldValue('custrecord_hris_pay_proc_actual_salary', i_current_monthly);
					payprocess.setFieldValue('custrecord_hris_pay_proc_gross_earning', i_current_monthly);					
					payprocess.setFieldValue('custrecord_hris_pay_proc_gross_deduction',gross_dedc);//custrecord_hris_pay_proc_value	
					//Actual_gross_pay = Math.abs(valueCheck(Actual_gross_pay)) ;
					
					nlapiLogExecution('DEBUG', 'aa actual pay value', Actual_gross_pay)
					
					payprocess.setFieldValue('custrecord_hris_pay_proc_actual_gross_ea', Actual_gross_pay.toFixed(2));
					payprocess.setFieldValue('custrecord_hris_pay_proc_value',parseFloat(Actual_gross_pay).toFixed(2));
					payprocess.setFieldValue('custrecord_hris_pay_proc_othours',OTHoursfinal);
					payprocess.setFieldValue('custrecord_hris_pay_proc_remark',employeeremarks);
					var payprocessId = nlapiSubmitRecord(payprocess, false, false);		
					nlapiLogExecution('DEBUG', 'Employee earn comp payprocessId', payprocessId)			
					}		
				
		}//End for (var empE = 0; empE < searchEmpEarn.length; empE++) 	
		if(PFApplicable=='T')
		{
			nlapiLogExecution('DEBUG', 'In LOP', 'PFGrossTotal===========********' + PFGrossTotal);	
			var PFCompEntry = createPFComp(i_entityId,i_emp_name_tx,i_EmpCode,process_type,i_paygroup_earn,i_emp_name,i_emp_dept,wage_Period,i_emp_company,account_code,Component_type,PFCal,PFGrossTotal,LOPDaysFinal,paid_days,GetYear,ESICApplicable,PTLoc,empsubdepartment,emplocation,OTHoursfinal,employeeremarks)
		}
		if(ESICApplicable=='T')
		{
			var ESICEntry = createESICComp(i_entityId,i_emp_name_tx,i_EmpCode,process_type,i_paygroup_earn,i_emp_name,i_emp_dept,wage_Period,i_emp_company,account_code,Component_type,ESICEmpContri,ESICEmplyerContri,ESICGrossTotal,LOPDaysFinal,paid_days,GetYear,ESICApplicable,PTLoc,empsubdepartment,emplocation,OTHoursfinal,employeeremarks)
		}
		
				var loanEntry = createLoanComp(wEndDate, i_entityId,i_emp_name_tx,i_EmpCode,process_type,i_paygroup_earn,i_emp_name,i_emp_dept,wage_Period,i_emp_company,account_code,Component_type,search_Loan_Ids,LOPDaysFinal,paid_days,GetYear,ESICApplicable,PTLoc, year,empsubdepartment,emplocation,OTHoursfinal,employeeremarks)


				// Leave Settlement
			var leaveSettlement = searchLeaveSettlementRecord(i_entityId, i_pay_group, wage_periodId, GetYear);
if (leaveSettlement) {
    // 1. Leave Salary (Sequence 48)
    if (leaveSettlement.lveSalary > 0) {
        var lveSalaryCompId = searchComponentBySeq(i_pay_group, 48);
        if (lveSalaryCompId) {
            createLeaveSettlementPayProcess(wEndDate,i_entityId, i_emp_name_tx, i_EmpCode, process_type, i_pay_group, i_emp_dept, wage_Period, GetYear, i_emp_company, leaveSettlement.lveSalary, lveSalaryCompId,paid_days,LOPDaysFinal,LOPDay,empsubdepartment, OTHoursfinal, employeeremarks);
            Act_Gross_pay = parseFloat(Act_Gross_pay) + parseFloat(leaveSettlement.lveSalary);
        }
    }
    // 2. Air Ticket (Sequence 37)
    if (leaveSettlement.airTicket > 0) {
        var airTicketCompId = searchComponentBySeq(i_pay_group, 37);
        if (airTicketCompId) {
        createairticketPayProcess(wEndDate, i_entityId, i_emp_name_tx, i_EmpCode, process_type, i_pay_group, i_emp_dept, wage_Period, GetYear, i_emp_company, leaveSettlement.airTicket, airTicketCompId, paid_days, LOPDaysFinal, LOPDay, empsubdepartment, OTHoursfinal, employeeremarks);
        Act_Gross_pay = parseFloat(Act_Gross_pay) + parseFloat(leaveSettlement.airTicket);
    }
    }
}
			
					
	}//End if (searchEmpEarn != null)  
	
	return Act_Gross_pay +"#"+Gross_earning+"#"+Component_type +"#"+paid_days +"#"+SSGrossTotal +"#"+ITGrossTotal;
	} catch (e) {
		var respRec = Emp_Datachange_Id ? ('customrecord_hris_employee_compen_change (ID: ' + Emp_Datachange_Id + ')') : 'customrecord_hris_employee_compen_change';
		logErrorToCustomRecord('getEmployee_EarnComp', e, i_pay_group, i_emp_company, i_entityId, wage_periodId, year, respRec);
		throw e;
	}
}

function getEmployee_OtherComp(wEndDate, i_emp_name,i_emp_name_tx,i_EmpCode,i_pay_group,wage_periodId,GetMonthDays,getArryMonthDay,GetYear,i_emp_dept,i_emp_company,process_type,i_entityId,paid_days,LOPDaysFinal,year,ESICApplicable,PTLoc,empsubdepartment,emplocation,OTHoursfinal,employeeremarks) {
	var Emp_Datachange_Id = '';
	try {
		var wage_Period = wage_periodId;
	var proRatacaL =0.00;
	var Actual_gross_payArrPro =0.00;
	var diffrence_in_pre_sal = 0.00;
	var Increment_Month;
	var LOPAmt =0.00;
	var Sal_adj_amt=0.00;
	var IncrementLOPAmt=0.00;
	var ArrearAmt = 0.00;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_empchange_emp_pay_pro_gp', null, 'is', i_pay_group));
	Filters.push(new nlobjSearchFilter('custrecord_hris_empchange_employee_nam', null, 'is', i_emp_name));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));	
	var Column = new Array();	
	Column.push(new nlobjSearchColumn('custrecord_hris_employee_data_change_int','custrecord_hris_employee_data_change_int'))//EDC id
	Column.push(new nlobjSearchColumn('custrecord_hris_payroll_component','custrecord_hris_employee_data_change_int'))//CompName
	Column.push(new nlobjSearchColumn('custrecord_hris_monthly','custrecord_hris_employee_data_change_int'))//Monthly
	Column.push(new nlobjSearchColumn('custrecord_hris_annually','custrecord_hris_employee_data_change_int'))//Annualy
	var searchEmpOth = nlapiSearchRecord('customrecord_hris_employee_compen_change',null, Filters, Column);
	nlapiLogExecution('DEBUG','other','searchEmpOth ************=='+searchEmpOth)
	if (searchEmpOth != null && !isNaN(searchEmpOth)) 
	{
		for (var empO = 0; empO < searchEmpOth.length; empO++) 
		{
			Emp_Datachange_Id = searchEmpOth[empO].getValue('custrecord_hris_employee_data_change_int','custrecord_hris_employee_data_change_int');
			var i_Earn_Compnent = searchEmpOth[empO].getValue('custrecord_hris_payroll_component','custrecord_hris_employee_data_change_int')
			var i_Earn_Compnent_Txt = searchEmpOth[empO].getText('custrecord_hris_payroll_component','custrecord_hris_employee_data_change_int')
			var i_current_monthly = searchEmpOth[empO].getValue('custrecord_hris_monthly','custrecord_hris_employee_data_change_int')
			nlapiLogExecution('DEBUG', 'i_current_monthly in searchEmpOth', i_current_monthly);
			var i_current_annually =searchEmpOth[empO].getValue('custrecord_hris_annually','custrecord_hris_employee_data_change_int')
			var empDataChangeFields = new Array();
			empDataChangeFields.push('custrecord_hris_empchange_emp_pay_pro_gp')
			empDataChangeFields.push('custrecord_hris_empchange_employee_nam')
			empDataChangeFields.push('custrecord_hris_empchange_increment_eff')
			
			var EDClookupValues = nlapiLookupField('customrecord_hris_employee_compen_change',Emp_Datachange_Id,empDataChangeFields);
			var i_paygroup_earn = EDClookupValues['custrecord_hris_empchange_emp_pay_pro_gp'];
			var i_emp_Id = EDClookupValues['custrecord_hris_empchange_employee_nam'];			
			var Increment_eff_date = EDClookupValues['custrecord_hris_empchange_increment_eff'];
				
			if(Increment_eff_date != null && Increment_eff_date != '' && Increment_eff_date != 'undefined') 
			{
				var EFFECTIVE_DATE = Increment_eff_date.toString().split('/');
				Increment_Month = EFFECTIVE_DATE[0];				
				Increment_Month = parseInt(Increment_Month);
				// month log
				Increment_Month = gethrisMonth(Increment_Month);
				var Increment_Day = EFFECTIVE_DATE[1];				
				var Increment_Year = EFFECTIVE_DATE[2];			
			}
			var EarnCompField = new Array();
			EarnCompField.push('custrecord_hris_payroll_component_type')			
			EarnCompField.push('custrecord_hris_account_name')
			var EarnComplookupValues =  nlapiLookupField('customrecord_hris_payroll_component',i_Earn_Compnent,EarnCompField);	
			var Component_type = EarnComplookupValues['custrecord_hris_payroll_component_type'];										
			var account_code = EarnComplookupValues['custrecord_hris_account_name'];		
			nlapiLogExecution('debug','Deduction Component inside test 1');
			if(i_current_monthly!='' && i_current_monthly!= null && i_current_monthly!='undefined' && i_current_monthly!=0)
			{
					//Array on Increment Effective Date	
					nlapiLogExecution('debug','Deduction Component inside test 2');				
					if (Increment_Month != null && Increment_Month != '' && Increment_Month != 'undefined') 
					{
						if (Increment_Month < wage_Period) 
						{
							var IMonth = parseInt(Increment_Month)
							var final_Diffrence = 0.00;
							for (var i = IMonth; i < wage_Period; i++) 
							{
								var getDaysOfIncrementMonth = getmonth_days(IMonth);								
								var Prev_Month = get_Prev_month_component_Value(i_emp_Id,i_paygroup_earn, i_Earn_Compnent, i_current_monthly, IMonth);								
								var PREVI = Prev_Month.toString().split('#');								
								var Prev_Actual_Amt = PREVI[0];								
								var Prev_gross_eran = PREVI[1];								
								var Prev_Comp = PREVI[2];
								var IncreSalAdj = GetSalaryAdjustAmt(i_emp_Id,i_pay_group,i_Earn_Compnent,IMonth,GetYear);
								if(IncreSalAdj!=null && IncreSalAdj!='' && IncreSalAdj!='undefined')
								{
									var SALADJREC= IncreSalAdj.toString().split('#');
									Sal_adj_amt = SALADJREC[0];
								}	
								//Increment Arrear
								var ArrDays = IncrementarrarDays(i_emp_Id,i_current_monthly,getArryMonthDay,IMonth,GetYear);					
								var ArrearsAmtAndDays = ArrDays.toString().split('#');
								ArrearAmt =parseFloat(ArrearsAmtAndDays[0]);								
								ArrearAmt = valueCheck(ArrearAmt);
								var IncrementLopAmt = getLOPDays(i_emp_Id,IMonth,i_current_monthly,getDaysOfIncrementMonth,GetYear);
								INCREMENTLOP = IncrementLopAmt.split('#')
								IncrementLOPAmt= INCREMENTLOP[0];								
								if (i_current_monthly != Prev_gross_eran && i_Earn_Compnent == Prev_Comp) 
								{
									if(Sal_adj_amt!='undefined' && Sal_adj_amt!=''&& Sal_adj_amt!=null)
									{
										diffrence_in_pre_sal = (parseFloat(i_current_monthly) - parseFloat(Prev_Actual_Amt))-parseFloat(IncrementLOPAmt)+ parseFloat(Sal_adj_amt)+parseFloat(ArrearAmt);
									}
									else
									{
										diffrence_in_pre_sal = (parseFloat(i_current_monthly) - parseFloat(Prev_Actual_Amt))-parseFloat(IncrementLOPAmt)+parseFloat(ArrearAmt);
									}								
									final_Diffrence = parseFloat(final_Diffrence) + parseFloat(diffrence_in_pre_sal);								
								}//End if (i_current_monthly != Prev_gross_eran && i_Earn_Compnent == Prev_Comp) 
								else 
								{
									diffrence_in_pre_sal = 0.00;
									final_Diffrence = 0.00;
								}//End else if (i_current_monthly != Prev_gross_eran && i_Earn_Compnent == Prev_Comp) 
								IMonth= parseInt(IMonth)+ parseInt(1);
							}//End for (var i = Increment_Month; i < wage_Period; i++) 
						}//End if (Increment_Month < wage_Period) 
					}//End if (Increment_Month != null && Increment_Month != '' && Increment_Month != 'undefined') 
					
				//ArryDays
					var ArryCheck = compArrCheck(i_Earn_Compnent);					
					if(ArryCheck =='T')
					{
						var ArrDays = arrarDays(i_emp_Id,i_current_monthly,getArryMonthDay,wage_Period,GetYear);					
						var ArrearsAmtAndDays = ArrDays.toString().split('#');
						var ArrearAmt = parseFloat(ArrearsAmtAndDays[0]);					
						ArrearAmt=valueCheck(ArrearAmt)
						var ARDays = ArrearsAmtAndDays[1];					
						ARDays=valueCheck(ARDays)	
					}//End if(ArryCheck =='T')
					else
					{
						ARDays = 0.00;
					}//End else if(ArryCheck =='T')
				//LOP
					var Comp_LOP_Check = compLoPCheck(i_Earn_Compnent);
					
					var LOPDay =0.00;
					if(Comp_LOP_Check=='T')
					{
						var LOPDays = getLOPDays(i_emp_Id,wage_Period,i_current_monthly,GetMonthDays,GetYear);					
						var LOP =LOPDays.toString().split('#');					
						LOPAmt =LOP[0];					
						LOPDay = LOP[1]; 					
						LOPDay=valueCheck(LOPDay)
					}//End if(Comp_LOP_Check=='T')
					else
					{
						LOPAmt = 0.00;
						LOPDay = 0.00;
					}//End else if(Comp_LOP_Check=='T')					
				//ProRata
					var Pro_rata_Check = compProRataCheck(i_Earn_Compnent);					
					if(Pro_rata_Check=='T')
					{
						var Preasent_Days = employeeDateofJoining(i_emp_Id,wage_Period,LOPDay,year);						
						var PRORATA = Preasent_Days.toString().split('#')
						var PresentDays = PRORATA[0];						
						var wage_month_days = PRORATA[1];						
						var DOJ_Month =PRORATA[2];						
						var GetYrID = PRORATA[3];
						var DOJ_Yr = searchYrId(GetYrID)					
						proRatacaL = (parseFloat(i_current_monthly)/wage_month_days)* PresentDays;						
					}//End if(Pro_rata_Check=='T')
					else
					{
						proRatacaL = 0.00;
						Pro_rata_Check=='F'
					}//End else if(Pro_rata_Check=='T')										
				//Gross Pay
					if(Pro_rata_Check=='T' && (DOJ_Month == wage_Period ))
					{
						
						Actual_gross_payArrPro = Math.abs(parseFloat(ArrearAmt)-parseFloat(proRatacaL));
						Actual_gross_payArrPro = Math.abs(Actual_gross_payArrPro);
						Actual_gross_pay = parseFloat(Actual_gross_payArrPro) - parseFloat(LOPAmt);	
						paid_days =	PresentDays;	
						nlapiLogExecution('debug','paid_days testing log getEmployee_OtherComp else ',paid_days);
					}//End if(Pro_rata_Check=='T' && (DOJ_Month == wage_Period ))
					else
					{
						ArrearAmt = valueCheck(ArrearAmt);
						LOPAmt = valueCheck(LOPAmt);
						final_Diffrence=valueCheck(final_Diffrence);	
						Actual_gross_pay = parseFloat(i_current_monthly)+parseFloat(ArrearAmt)- parseFloat(LOPAmt)+ parseFloat(final_Diffrence);
						paid_days =	paid_days;		
						nlapiLogExecution('debug','paid_days testing log getEmployee_OtherComp else ',paid_days);
					}//End else if(Pro_rata_Check=='T' && (DOJ_Month == wage_Period ))
					Actual_gross_pay = Math.abs(parseFloat(valueCheck(Actual_gross_pay)));
					nlapiLogExecution('debug','paid_days testing log getEmployee_OtherComp else ',paid_days);
					LOPDays = valueCheck(LOPDays);
					ARDays = valueCheck(ARDays)
					ArrearAmt = valueCheck(ArrearAmt)
					
					var payprocess = nlapiCreateRecord('customrecord_hris_pay_process');					
					payprocess.setFieldValue('custrecord_hris_pay_proc_employee',i_entityId);
					payprocess.setFieldValue('custrecord_hris_pay_proc_employee_code',i_EmpCode);
					payprocess.setFieldValue('custrecord_hris_pay_proc_process_type',process_type);
					payprocess.setFieldValue('custrecord_hris_pay_proc_pay_group', i_paygroup_earn);
					payprocess.setFieldValue('custrecord_hris_pay_proc_employee_name', i_emp_name_tx);
					payprocess.setFieldValue('custrecord_hris_pay_proc_department',i_emp_dept);
                    // By florence
                    payprocess.setFieldValue('custrecord_hris_pay_proc_subdept',empsubdepartment);
                   // payprocess.setFieldValue('custrecord_hris_pay_proc_location',emplocation); 
					if (i_emp_company != 'undefined' && i_emp_company!='' && i_emp_company!='')
					{
						payprocess.setFieldValue('custrecord_hris_pay_proc_company_name',i_emp_company);
					}
					payprocess.setFieldValue('custrecord_hris_pay_proc_pay_month', wage_Period);
					payprocess.setFieldValue('custrecord_hris_pay_proc_pay_date', wEndDate);
					payprocess.setFieldValue('custrecord_hris_pay_proc_year',GetYear);
					payprocess.setFieldValue('custrecord_hris_pay_proc_payroll_compone',i_Earn_Compnent);
					payprocess.setFieldValue('custrecord_hris_pay_proc_account_code',account_code);
					payprocess.setFieldValue('custrecord_hris_pay_proc_component_type',Component_type);
					payprocess.setFieldValue('custrecord_hris_pay_proc_lop_days',LOPDay);
					payprocess.setFieldValue('custrecord_hris_pay_proc_lop_amount', LOPAmt);					
					payprocess.setFieldValue('custrecord_hris_pay_proc_pro_rata',Pro_rata_Check);
					payprocess.setFieldValue('custrecord_hris_pay_proc_paid_days',paid_days);
					payprocess.setFieldValue('custrecord_hris_pay_proc_pt_location',PTLoc);
					payprocess.setFieldValue('custrecord_hris_pay_proc_lop_days_final',LOPDaysFinal)
					payprocess.setFieldValue('custrecord_hris_pay_proc_pro_rata_amount',proRatacaL.toFixed(2));
					payprocess.setFieldValue('custrecord_hris_pay_proc_arrear_days', ARDays);//AarryDays
					payprocess.setFieldValue('custrecord_hris_pay_proc_arrears', ArrearAmt);//AarryAmt
					//payprocess.setFieldValue('custrecord_hris_pay_proc_esic_check',ESICApplicable);
					payprocess.setFieldValue('custrecord_hris_pay_proc_actual_salary', i_current_monthly);
					if(Component_type=='1')

					{						
						payprocess.setFieldValue('custrecord_hris_pay_proc_gross_earning', i_current_monthly);	
						payprocess.setFieldValue('custrecord_hris_pay_proc_actual_gross_ea', Actual_gross_pay.toFixed(2));
					}//End if(Component_type=='1')
					else
					{
						payprocess.setFieldValue('custrecord_hris_pay_proc_gross_deduction', i_current_monthly);
						payprocess.setFieldValue('custrecord_hris_pay_proc_gross_deduction', Actual_gross_pay.toFixed(2));
					}//End else if(Component_type=='1')					
					payprocess.setFieldValue('custrecord_hris_pay_proc_value',Actual_gross_pay);
					payprocess.setFieldValue('custrecord_hris_pay_proc_othours',OTHoursfinal);
					payprocess.setFieldValue('custrecord_hris_pay_proc_remark',employeeremarks);
					var payprocessId = nlapiSubmitRecord(payprocess, false, false);	
					nlapiLogExecution('DEBUG', 'Employee Other Comp Payprocess', payprocessId);
				}
		}//End for (var empO = 0; empO < searchEmpOth.length; empO++) 		
	}//End if (searchEmpOth != null)
	} catch (e) {
		var respRec = Emp_Datachange_Id ? ('customrecord_hris_employee_compen_change (ID: ' + Emp_Datachange_Id + ')') : 'customrecord_hris_employee_compen_change';
		logErrorToCustomRecord('getEmployee_OtherComp', e, i_pay_group, i_emp_company, i_entityId, wage_periodId, year, respRec);
		throw e;
	}
}

function createPFComp(i_entityId,i_emp_name_tx,i_EmpCode,process_type,i_pay_group,i_emp_name,i_emp_dept,wage_Period,i_emp_company,account_code,Component_type,PFCal,PFGrossTotal,LOPDaysFinal,paid_days,GetYear,ESICApplicable,PTLoc,empsubdepartment,emplocation,OTHoursfinal,employeeremarks) {
	try {
		nlapiLogExecution('DEBUG', 'PF CAL in createPFComp', PFCal);
	var i_Earn_Compnent = searchPFID();		
	var account_code = nlapiLookupField('customrecord_hris_payroll_component',i_Earn_Compnent,'custrecord_hris_account_name');	
	//Salary adjustment		
		var salary_adjustment = GetSalaryAdjustAmt(i_entityId,i_pay_group,i_Earn_Compnent,wage_Period,GetYear);
		var SALADJREC= salary_adjustment.toString().split('#');
		var SalAdjustDate = SALADJREC[2]
		var Sal_adj_amt =0
		var Sal_adj_comp_type;
		if (SalAdjustDate != null && SalAdjustDate != 'undefined' && SalAdjustDate != '') 
		{
			var SALARYADJDATE = nlapiStringToDate(SalAdjustDate)//SalAdjustDate.toString().split('/');
			
			var SAMonth = SALARYADJDATE.getMonth()+1 ;//SALARYADJDATE[0];					
			nlapiLogExecution('DEBUG', 'processId Fields', 'SAMonth*******' + SAMonth);		
			var SAYear = SALARYADJDATE.getFullYear();//SALARYADJDATE[2];
			nlapiLogExecution('DEBUG', 'processId Fields', 'SAYear*******' + SAYear);	
			if (SAMonth == wage_Period) //&& SAYear == GetYear) 
			{
				Sal_adj_amt =  SALADJREC[0];		
											
				Sal_adj_comp_type = SALADJREC[1];							
			}
			//Sal_adj_amt = parseFloat(Sal_adj_amt)
			nlapiLogExecution('DEBUG','other','PFCalBefore************=='+PFCal)
			PFCal = parseFloat(PFCal) + parseFloat(Sal_adj_amt)
			nlapiLogExecution('DEBUG','other','Sal_adj_amt ************=='+Sal_adj_amt)
			nlapiLogExecution('DEBUG','other','PFCal After ************=='+PFCal)
		}
			
	var emp_name1 = nlapiLookupField('employee', i_entityId,'entityid');
	var payprocess = nlapiCreateRecord('customrecord_hris_pay_process');
	payprocess.setFieldValue('custrecord_hris_pay_proc_employee', i_entityId);
	payprocess.setFieldValue('custrecord_hris_pay_proc_employee_code',i_EmpCode);
	payprocess.setFieldValue('custrecord_hris_pay_proc_process_type', process_type);
	payprocess.setFieldValue('custrecord_hris_pay_proc_pay_group', i_pay_group);
	payprocess.setFieldValue('custrecord_hris_pay_proc_employee_name', i_emp_name_tx);
	payprocess.setFieldValue('custrecord_hris_pay_proc_department', i_emp_dept);
     // By florence
     payprocess.setFieldValue('custrecord_hris_pay_proc_subdept',empsubdepartment);
    // payprocess.setFieldValue('custrecord_hris_pay_proc_location',emplocation);
	if (i_emp_company != 'undefined' && i_emp_company!='' && i_emp_company!='')
	{
	payprocess.setFieldValue('custrecord_hris_pay_proc_company_name', i_emp_company);
	}
	payprocess.setFieldValue('custrecord_hris_pay_proc_pay_month', wage_Period);
	payprocess.setFieldValue('custrecord_hris_pay_proc_year', GetYear);
	payprocess.setFieldValue('custrecord_hris_pay_proc_payroll_compone', i_Earn_Compnent);
	payprocess.setFieldValue('custrecord_hris_pay_proc_account_code', account_code);
	// Florence Deduction value 1
	//payprocess.setFieldValue('custrecord_hris_pay_proc_component_type',2);//Component_type	
	payprocess.setFieldValue('custrecord_hris_pay_proc_component_type',2);
	payprocess.setFieldValue('custrecord_hris_pay_proc_pf_gross', PFGrossTotal);//AarryAmt
	payprocess.setFieldValue('custrecord_hris_pay_proc_actual_salary', PFCal);		
	payprocess.setFieldValue('custrecord_hris_pay_proc_gross_deduction', PFCal.toFixed(2));	
	payprocess.setFieldValue('custrecord_hris_pay_proc_lop_days_final',LOPDaysFinal)
	payprocess.setFieldValue('custrecord_hris_pay_proc_paid_days',paid_days);
	payprocess.setFieldValue('custrecord_hris_pay_proc_pt_location',PTLoc);
	payprocess.setFieldValue('custrecord_hris_pay_proc_actual_gross_de', PFCal.toFixed(2));			
	payprocess.setFieldValue('custrecord_hris_pay_proc_value', PFCal);
	payprocess.setFieldValue('custrecord_hris_pay_proc_othours',OTHoursfinal);
	payprocess.setFieldValue('custrecord_hris_pay_proc_remark',employeeremarks);
	var payprocessId = nlapiSubmitRecord(payprocess, false, false);	
	nlapiLogExecution('DEBUG', 'PF Component Payprocess', payprocessId);
	} catch (e) {
		logErrorToCustomRecord('createPFComp', e, i_pay_group, i_emp_company, i_entityId, wage_Period, GetYear, 'customrecord_hris_payroll_component (ID: ' + i_Earn_Compnent + ')');
		throw e;
	}
}

function createLoanComp(wEndDate, i_entityId,i_emp_name_tx,i_EmpCode,process_type,i_paygroup_earn,i_emp_name,i_emp_dept,wage_Period,i_emp_company,account_code,Component_type,search_Loan_Ids,LOPDaysFinal,paid_days,GetYear,ESICApplicable,PTLoc, year,empsubdepartment,emplocation,OTHoursfinal,employeeremarks) {
	try {
		if(search_Loan_Ids){
		   var Loan_Ids = searchLoanId(i_paygroup_earn);
		   nlapiLogExecution('DEBUG', 'Loan_Ids', Loan_Ids);
		   nlapiLogExecution('DEBUG', 'search_Loan_Ids', search_Loan_Ids);
		   var Loan_Rec =  search_Loan_Ids.split('#');
		   var Loan_Rec_Arr = Loan_Rec[0];
		  if(Loan_Rec_Arr){
		   Loan_Rec_Arr = Loan_Rec_Arr.split(',')
		   nlapiLogExecution('DEBUG', 'Loan_Rec_Arr length', Loan_Rec_Arr.length)
		   nlapiLogExecution('DEBUG', 'Loan_Rec_Arr length', Loan_Rec_Arr)
		   var Loan_Comp_Arr = Loan_Rec[1];
			   Loan_Comp_Arr = Loan_Comp_Arr.split(',')
		   nlapiLogExecution('DEBUG', 'Loan_Comp_Arr length', Loan_Comp_Arr.length)
		   nlapiLogExecution('DEBUG', 'Loan_Comp_Arr length', Loan_Comp_Arr)
		   var Loan_Child_Arr = Loan_Rec[2];
		   nlapiLogExecution('AUDIT','Loanchildarray',Loan_Child_Arr);
		   Loan_Child_Arr = Loan_Child_Arr.split(',')
		   nlapiLogExecution('AUDIT','Loanchildarraylength',Loan_Child_Arr.length);
		   nlapiLogExecution('AUDIT','Loanchildarrayvalue',Loan_Child_Arr);

			for(var count = 0; count < Loan_Rec_Arr.length; count++){
				nlapiLogExecution('AUDIT', 'Loan_Rec_Arr[count]', Loan_Rec_Arr[count])
				nlapiLogExecution('AUDIT', 'Loan_Comp_Arr[count]', Loan_Comp_Arr[count])
				var loan_record = nlapiLoadRecord('customrecord_hris_empchange_loan_applicn', Loan_Rec_Arr[count]);
				var loan_Type = loan_record.getFieldValue('custrecord_hris_loan_loan_type');
				nlapiLogExecution('DEBUG', 'loan_Type in createLoanComp')
				nlapiLogExecution('AUDIT','Loan_child_count',Loan_Child_Arr[count]);
				var loan_childrecord = nlapiLoadRecord('customrecord_hris_loan_applicat_child', Loan_Child_Arr[count]);
				var LoanEntry = loan_childrecord.getFieldValue('custrecord_hris_loan_alloc_paidamount');
				nlapiLogExecution('AUDIT', 'LoanEntry in createLoanComp', LoanEntry);
				var account_code = nlapiLookupField('customrecord_hris_payroll_component',Loan_Comp_Arr[count],'custrecord_hris_account_name');		
				var payprocess = nlapiCreateRecord('customrecord_hris_pay_process');
				payprocess.setFieldValue('custrecord_hris_pay_proc_employee', i_entityId);
				payprocess.setFieldValue('custrecord_hris_pay_proc_employee_code',i_EmpCode);
				payprocess.setFieldValue('custrecord_hris_pay_proc_process_type', process_type);
				payprocess.setFieldValue('custrecord_hris_pay_proc_pay_group', i_paygroup_earn);
				payprocess.setFieldValue('custrecord_hris_pay_proc_employee_name', i_emp_name_tx);
				payprocess.setFieldValue('custrecord_hris_pay_proc_department', i_emp_dept);
				payprocess.setFieldValue('custrecord_hris_pay_proc_subdept',empsubdepartment);
				if (i_emp_company != 'undefined' && i_emp_company!='' && i_emp_company!='')
				{
					payprocess.setFieldValue('custrecord_hris_pay_proc_company_name', i_emp_company);
				}
				payprocess.setFieldValue('custrecord_hris_pay_proc_pay_month', wage_Period);
				payprocess.setFieldValue('custrecord_hris_pay_proc_pay_date', wEndDate);
				payprocess.setFieldValue('custrecord_hris_pay_proc_year', GetYear);
				payprocess.setFieldValue('custrecord_hris_pay_proc_loan_year', year);
				payprocess.setFieldValue('custrecord_hris_pay_proc_payroll_compone', Loan_Comp_Arr[count]);
				payprocess.setFieldValue('custrecord_hris_pay_proc_account_code', account_code);
				payprocess.setFieldValue('custrecord_hris_pay_proc_component_type',2);
				payprocess.setFieldValue('custrecord_hris_pay_proc_actual_salary', LoanEntry);
				payprocess.setFieldValue('custrecord_hris_pay_proc_gross_deduction', LoanEntry);
				payprocess.setFieldValue('custrecord_hris_pay_proc_loan_reference', Loan_Rec_Arr[count]);		
				payprocess.setFieldValue('custrecord_hris_pay_proc_lop_days_final',LOPDaysFinal)
				payprocess.setFieldValue('custrecord_hris_pay_proc_paid_days',paid_days);
				payprocess.setFieldValue('custrecord_hris_pay_proc_pt_location',PTLoc);
				payprocess.setFieldValue('custrecord_hris_pay_proc_actual_gross_de', LoanEntry);			
				payprocess.setFieldValue('custrecord_hris_pay_proc_value', LoanEntry);
				payprocess.setFieldValue('custrecord_hris_pay_proc_othours',OTHoursfinal);
				payprocess.setFieldValue('custrecord_hris_pay_proc_remark',employeeremarks);
				var payprocessId = nlapiSubmitRecord(payprocess, false, false);
				nlapiLogExecution('DEBUG', 'Created loan Payprocess ID', payprocessId);
			}
		  }
		}
	} catch (e) {
		logErrorToCustomRecord('createLoanComp', e, i_paygroup_earn, i_emp_company, i_entityId, wage_Period, year, 'customrecord_hris_empchange_loan_applicn');
		throw e;
	}
}

function createESICComp(i_entityId,i_emp_name_tx,i_EmpCode,process_type,i_pay_group,i_emp_name,i_emp_dept,wage_Period,i_emp_company,account_code,Component_type,ESICEmpContri,ESICEmplyerContri,ESICGrossTotal,LOPDaysFinal,paid_days,GetYear,ESICApplicable,PTLoc,empsubdepartment,emplocation,OTHoursfinal,employeeremarks) {
	try {
		var i_Earn_Compnent = searchESICId(i_pay_group);
	var account_code = nlapiLookupField('customrecord_hris_payroll_component',i_Earn_Compnent,'custrecord_hris_account_name');			
	var emp_name1 = nlapiLookupField('employee', i_entityId,'entityid');
		//Salary adjustment		
		var salary_adjustment = GetSalaryAdjustAmt(i_entityId,i_pay_group,i_Earn_Compnent,wage_Period,GetYear);
		var SALADJREC= salary_adjustment.toString().split('#');
		var SalAdjustDate = SALADJREC[2]
		var Sal_adj_amt =0
		var Sal_adj_comp_type;
		if (SalAdjustDate != null && SalAdjustDate != 'undefined' && SalAdjustDate != '') 
		{
			var SALARYADJDATE = nlapiStringToDate(SalAdjustDate)//SalAdjustDate.toString().split('/');
			
			var SAMonth = SALARYADJDATE.getMonth()+1 ;//SALARYADJDATE[0];					
			nlapiLogExecution('DEBUG', 'processId Fields', 'SAMonth*******' + SAMonth);		
			var SAYear = SALARYADJDATE.getFullYear();//SALARYADJDATE[2];
			nlapiLogExecution('DEBUG', 'processId Fields', 'SAYear*******' + SAYear);	
			if (SAMonth == wage_Period) //&& SAYear == GetYear) 
			{
				Sal_adj_amt =  SALADJREC[0];		
											
				Sal_adj_comp_type = SALADJREC[1];							
			}
			//Sal_adj_amt = parseFloat(Sal_adj_amt)
			ESICEmpContri = parseFloat(ESICEmpContri) + parseFloat(Sal_adj_amt)
			nlapiLogExecution('DEBUG', 'processId Fields', 'ESICEmpContri*******^^' + ESICEmpContri);
			ESICEmplyerContri = parseFloat(ESICEmplyerContri) + parseFloat(Sal_adj_amt)
			nlapiLogExecution('DEBUG', 'processId Fields', 'ESICEmplyerContri*******^^' + ESICEmplyerContri);
		}
	var payprocess = nlapiCreateRecord('customrecord_hris_pay_process');
	payprocess.setFieldValue('custrecord_hris_pay_proc_employee', i_entityId);
	payprocess.setFieldValue('custrecord_hris_pay_proc_employee_code',i_EmpCode);
	payprocess.setFieldValue('custrecord_hris_pay_proc_process_type', process_type);
	payprocess.setFieldValue('custrecord_hris_pay_proc_pay_group', i_pay_group);
	payprocess.setFieldValue('custrecord_hris_pay_proc_employee_name', i_emp_name_tx);
	payprocess.setFieldValue('custrecord_hris_pay_proc_department', i_emp_dept);
     // By florence
     payprocess.setFieldValue('custrecord_hris_pay_proc_subdept',empsubdepartment);
    // payprocess.setFieldValue('custrecord_hris_pay_proc_location',emplocation);
	if (i_emp_company != 'undefined' && i_emp_company!='' && i_emp_company!='')
	{
	payprocess.setFieldValue('custrecord_hris_pay_proc_company_name', i_emp_company);
	}
	payprocess.setFieldValue('custrecord_hris_pay_proc_pay_month', wage_Period);
	payprocess.setFieldValue('custrecord_hris_pay_proc_year', GetYear);
	payprocess.setFieldValue('custrecord_hris_pay_proc_payroll_compone', i_Earn_Compnent);
	payprocess.setFieldValue('custrecord_hris_pay_proc_account_code', account_code);
// Florence Change For Component Type bcoz internal id is different
//payprocess.setFieldValue('custrecord_hris_pay_proc_component_type',2);
	payprocess.setFieldValue('custrecord_hris_pay_proc_component_type',2);//Component_type	
	payprocess.setFieldValue('custrecord_hris_pay_proc_esic_gross', ESICGrossTotal);//ESIC Gross Total
	payprocess.setFieldValue('custrecord_hris_pay_proc_paid_days',paid_days);
	payprocess.setFieldValue('custrecord_hris_pay_proc_esic_check',ESICApplicable);
	payprocess.setFieldValue('custrecord_hris_pay_proc_lop_days_final',LOPDaysFinal);
	payprocess.setFieldValue('custrecord_hris_pay_proc_pt_location',PTLoc);
	payprocess.setFieldValue('custrecord_hris_pay_proc_esic_emp_contri', ESICEmpContri);// ESIC emp contri
	payprocess.setFieldValue('custrecord_hris_pay_proc_esic_company_co', ESICEmplyerContri);//ESIC employer contri
	payprocess.setFieldValue('custrecord_hris_pay_proc_actual_salary', ESICEmpContri);	
	payprocess.setFieldValue('custrecord_hris_pay_proc_gross_deduction', ESICEmpContri.toFixed(2));	//	
	payprocess.setFieldValue('custrecord_hris_pay_proc_actual_gross_de', ESICEmpContri.toFixed(2));			
	payprocess.setFieldValue('custrecord_hris_pay_proc_value', ESICEmpContri);
	payprocess.setFieldValue('custrecord_hris_pay_proc_othours',OTHoursfinal);
	payprocess.setFieldValue('custrecord_hris_pay_proc_remark',employeeremarks);
	var payprocessId = nlapiSubmitRecord(payprocess, false, false);
	nlapiLogExecution('DEBUG', 'ESI Payprocess', payprocessId);

	} catch (e) {
		logErrorToCustomRecord('createESICComp', e, i_pay_group, i_emp_company, i_entityId, wage_Period, GetYear, 'customrecord_hris_payroll_component (ID: ' + i_Earn_Compnent + ')');
		throw e;
	}
}

function GetNetPay(wEndDate, i_emp_name_tx, i_emp_name,i_EmpCode,i_pay_group,wage_periodId,earning_Total,deduction_total,GetYear,i_emp_dept,i_emp_company,process_type,i_entityId,paid_days,LOPDaysFinal,ESICApplicable,PTLoc,empsubdepartment,emplocation,OTHoursfinal,employeeremarks) {
	try {
		var i_Earn_Compnent = searchNetId(i_pay_group);		
	var account_code = nlapiLookupField('customrecord_hris_payroll_component',i_Earn_Compnent,'custrecord_hris_account_name');		
	var wage_Period = wage_periodId;
	var Final_net_pay = 0.00;
	nlapiLogExecution('DEBUG', 'acc i_emp_name', i_emp_name)
	//var emp_name1 = nlapiLookupField('employee', i_emp_name,'entityid');
	nlapiLogExecution('DEBUG','Earning_Total',earning_Total);
	Final_net_pay = parseFloat(earning_Total)- parseFloat(deduction_total);

    //var Final_net_pay2 = Final_net_pay;
	//var newNetpay = Final_net_pay | 0;
	//Final_net_pay = Final_net_pay | 0;
	//Final_net_pay = parseFloat(Final_net_pay) + 1
    //var diff = parseFloat(Final_net_pay) - parseFloat(Final_net_pay2);
	//if(diff > '.48')
	//{
	//	Final_net_pay = parseFloat(Final_net_pay);
	//}
	
	Final_net_pay = Math.abs(parseFloat(Final_net_pay)); // Change to positive
    var decimal = Final_net_pay - Math.floor(Final_net_pay);
	decimal = parseFloat(decimal).toFixed(2)

	nlapiLogExecution('EMERGENCY','Final_net_pay',Final_net_pay);
	nlapiLogExecution('EMERGENCY',' Math.floor(Final_net_pay)', Math.floor(Final_net_pay));
	nlapiLogExecution('EMERGENCY','decimal',decimal);

	// Comment By Florence For Net Pay 1 Variation
	/* if(decimal >= .49)
	{
		Final_net_pay = Final_net_pay || 0;
	    Final_net_pay = parseFloat(Final_net_pay) + 1
	}
	else
	{
		Final_net_pay = Final_net_pay || 0;
	}
	 */
	

	// as per client ask this validation is included in this 13/05/2026

	 if(decimal >= .49)
	{
		Final_net_pay = Final_net_pay || 0;
		Final_net_pay = Math.floor(Final_net_pay);
	    Final_net_pay = parseFloat(Final_net_pay) + 1
	}
	else
	{
		Final_net_pay = Final_net_pay || 0;
		Final_net_pay=Math.floor(Final_net_pay);
	}
	


	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_empchange_employee_nam', null, 'is', i_emp_name)); 	
	var Column = new Array();
	Column.push(new nlobjSearchColumn('custrecord_hris_employee_data_change','custrecord_hris_employee_data_change'))
	var searchEmpEarn = nlapiSearchRecord('customrecord_hris_employee_compen_change',null, Filters, Column);
	if (searchEmpEarn != null) 
	{
		var Emp_Datachange_Id = searchEmpEarn[0].getValue('custrecord_hris_employee_data_change','custrecord_hris_employee_data_change')
		var empDataChangeFields = new Array();
		empDataChangeFields.push('custrecord_hris_empchange_bank_name')
		empDataChangeFields.push('custrecord_hris_empchange_bank_acc_no')
		var EDClookupValues = nlapiLookupField('customrecord_hris_employee_compen_change',Emp_Datachange_Id,empDataChangeFields);
		var Bank_name = EDClookupValues['custrecord_hris_empchange_bank_name'];
		var Bank_acc = EDClookupValues['custrecord_hris_empchange_bank_acc_no'];
	}
			
	var payprocess = nlapiCreateRecord('customrecord_hris_pay_process');
	payprocess.setFieldValue('custrecord_hris_pay_proc_employee',i_entityId);
	payprocess.setFieldValue('custrecord_hris_pay_proc_employee_code',i_EmpCode);
	payprocess.setFieldValue('custrecord_hris_pay_proc_process_type',process_type);
	payprocess.setFieldValue('custrecord_hris_pay_proc_pay_group', i_pay_group);
	payprocess.setFieldValue('custrecord_hris_pay_proc_employee_name', i_emp_name_tx);
	payprocess.setFieldValue('custrecord_hris_pay_proc_department',i_emp_dept);

     // By florence
     payprocess.setFieldValue('custrecord_hris_pay_proc_subdept',empsubdepartment);
   //  payprocess.setFieldValue('custrecord_hris_pay_proc_location',emplocation);
	payprocess.setFieldValue('custrecord_hris_pay_proc_bank_name', Bank_name);
	payprocess.setFieldValue('custrecord_hris_pay_proc_bank_account_no', Bank_acc);
	if (i_emp_company != 'undefined' && i_emp_company!='' && i_emp_company!='')
	{
	payprocess.setFieldValue('custrecord_hris_pay_proc_company_name',i_emp_company);
	}
	payprocess.setFieldValue('custrecord_hris_pay_proc_pay_month', wage_Period);	
	payprocess.setFieldValue('custrecord_hris_pay_proc_pay_date', wEndDate);
	payprocess.setFieldValue('custrecord_hris_pay_proc_year',GetYear);
	payprocess.setFieldValue('custrecord_hris_pay_proc_paid_days',paid_days);
	payprocess.setFieldValue('custrecord_hris_pay_proc_lop_days_final',LOPDaysFinal);
    payprocess.setFieldValue('custrecord_hris_pay_proc_pt_location',PTLoc);
	payprocess.setFieldValue('custrecord_hris_pay_proc_payroll_compone',i_Earn_Compnent);
	payprocess.setFieldValue('custrecord_hris_pay_proc_account_code',account_code);
	payprocess.setFieldValue('custrecord_hris_pay_proc_net_pay',Final_net_pay.toFixed(2));
	payprocess.setFieldValue('custrecord_hris_pay_proc_actual_salary',Final_net_pay.toFixed(2));
	payprocess.setFieldValue('custrecord_hris_pay_proc_value',Final_net_pay.toFixed(2));
	payprocess.setFieldValue('custrecord_hris_pay_proc_othours',OTHoursfinal);
	payprocess.setFieldValue('custrecord_hris_pay_proc_remark',employeeremarks);
	var payprocessId = nlapiSubmitRecord(payprocess, false, false);
	nlapiLogExecution('DEBUG', 'netpay process', payprocessId);
	} catch (e) {
		logErrorToCustomRecord('GetNetPay', e, i_pay_group, i_emp_company, i_entityId, wage_periodId, GetYear, 'employee (ID: ' + i_entityId + ')');
		throw e;
	}
}

function getMonthlyVariable_Comp(i_emp_name,i_entity,i_EmpCode,DOJ,i_pay_group,wage_periodId,wEndDate,emp_Earn_Comp,emp_dedc_Comp,GetYear,i_emp_dept,i_emp_company,process_type,i_entityId,paid_days,LOPDaysFinal,year,ESICApplicable,PTLoc,empsubdepartment,emplocation,OTHoursfinal,employeeremarks) {
	try {
		var gross_earning = emp_Earn_Comp;
	var gross_deduction = emp_dedc_Comp;
	var gross_ded = 0.00;
	var gross_earn = 0.00;
	var proRatacaL=0.00;
	var mth_var_sal_amt = 0.00;
	var PTMonthlyGross=0.00;
	var monthly_total=0.00;
	var SSGrossTotal =0.00;
	var wage_Period = wage_periodId;
	var i_comp_type;
	var ITGrossTotal=0.00
	var Filters = new Array();
	
	nlapiLogExecution('DEBUG', 'i_emp_name::::::::', i_emp_name)
	Filters.push(new nlobjSearchFilter('custrecord_hris_mthsal_paygroup', null, 'is', i_pay_group));
	Filters.push(new nlobjSearchFilter('custrecord_hris_mthsal_empname', null, 'is', i_emp_name));
	nlapiLogExecution('DEBUG', 'wage_Period::::::::', wage_Period)
	Filters.push(new nlobjSearchFilter('custrecord_hris_mthsal_month', null, 'is', wage_Period));
	Filters.push(new nlobjSearchFilter('custrecord_hris_mthsal_year', null, 'is', GetYear));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var Colm = new Array();
	Colm.push(new nlobjSearchColumn('internalid'));
	Colm.push(new nlobjSearchColumn('custrecord_hris_mthsal_salaryamount'));
	Colm.push(new nlobjSearchColumn('custrecord_hris_mthsal_paygroup'));
	Colm.push(new nlobjSearchColumn('custrecord_hris_mthsal_empname'));
	Colm.push(new nlobjSearchColumn('custrecord_hris_mthsal_paycomponent'));
	
	var searchMonthVarRec = nlapiSearchRecord('customrecord_hris_monthlysalinput',null, Filters, Colm);	
	if(searchMonthVarRec !=null &&searchMonthVarRec!='undefined' && searchMonthVarRec!='' )
	{
		for(var mvc=0;mvc< searchMonthVarRec.length;mvc++)
		{
			var i_paygroup_earn = searchMonthVarRec[mvc].getValue('custrecord_hris_mthsal_paygroup');			
			var i_emp_name = searchMonthVarRec[mvc].getValue('custrecord_hris_mthsal_empname');
			
			var PTLoc = nlapiLookupField('employee',i_emp_name,'custentity_hris_empptlocation');			
			var i_emp_name_txt = searchMonthVarRec[mvc].getText('custrecord_hris_mthsal_empname');			
			var i_current_monthly = searchMonthVarRec[mvc].getValue('custrecord_hris_mthsal_salaryamount');
			var i_Earn_Compnent = searchMonthVarRec[mvc].getValue('custrecord_hris_mthsal_paycomponent');
			
			var total_mv = searchMonthlyVariableEntry(i_paygroup_earn,i_emp_name,i_current_monthly,i_Earn_Compnent,wage_Period,GetYear,empsubdepartment,emplocation)	
			
			var EarnCompField = new Array();
			EarnCompField.push('custrecord_hris_pt_ind')			
			EarnCompField.push('custrecord_hris_pro_rate')
			EarnCompField.push('custrecord_hris_account_name')
			EarnCompField.push('custrecord_hris_component_short_name')
			var EarnComplookupValues =  nlapiLookupField('customrecord_hris_payroll_component',i_Earn_Compnent,EarnCompField);	
			var PTCheckComp = EarnComplookupValues['custrecord_hris_pt_ind'];	
			var Grosscheck = EarnComplookupValues['custrecord_hris_pro_rate'];	
			var account_code = EarnComplookupValues['custrecord_hris_account_name'];
			var i_Earn_Compnent_Txt = EarnComplookupValues['custrecord_hris_component_short_name'];			 								
			i_comp_type = getComponentType(i_Earn_Compnent);			
		//ProRata
				var Pro_rata_Check = compProRataCheck(i_Earn_Compnent);
				if(Pro_rata_Check=='T')
				{
					var Preasent_Days = employeeDateofJoining(i_emp_name,wage_Period,LOPDaysFinal,year);					
					var PRORATA = Preasent_Days.toString().split('#')
					var PresentDays = PRORATA[0];						
					var wage_month_days = PRORATA[1];						
					var DOJ_Month =PRORATA[2];											
					var DOJ_Yr = PRORATA[3];						
					proRatacaL = (parseFloat(total_mv)/wage_month_days)* PresentDays;										
					proRatacaL = valueCheck(proRatacaL);
				}
				else
				{
					proRatacaL = 0.00;
					Pro_rata_Check=='F'
				}
				
				var SSEntryId;
					var SSID = searchSSId(i_paygroup_earn)
					var DateofJoin = DOJ;
					DateofJoin = new Date(DateofJoin)
					nlapiLogExecution('DEBUG', 'In LOP', 'DateofJoin===========' + DateofJoin);
					var Wage_EndDate = wEndDate;
					Wage_EndDate = new Date(Wage_EndDate)
					nlapiLogExecution('DEBUG', 'In LOP', 'Wage_EndDate===========' + Wage_EndDate);
					
					var differenceInDays = (Wage_EndDate.getTime() - DateofJoin.getTime()) / (1000  *60*  60 * 24);
					nlapiLogExecution('DEBUG', 'In LOP', 'differenceInDays===========' + differenceInDays);	

					var SSCheck = compSSCheck(i_paygroup_earn,i_Earn_Compnent);
					nlapiLogExecution('DEBUG', 'In LOP', 'SSCheck===========***>' + SSCheck);
					
					//if (differenceInDays >= 16) 
					{
						if (SSCheck == 'T') 
						{
							SSGrossTotal = parseFloat(SSGrossTotal) + parseFloat(total_mv);
							nlapiLogExecution('DEBUG', 'In LOP', 'SSGrossTotal===========***>' + SSGrossTotal);
						}
					}
					
					//IT calc
					var ITID = searchITId()
					var ITGrossTotal=0.00;
					var IncomeTaxCheck = compIncomeCheck(i_paygroup_earn,i_Earn_Compnent);	
					//nlapiLogExecution('DEBUG', 'In LOP', 'IncomeTaxCheck===========' + IncomeTaxCheck);				
					if(IncomeTaxCheck == 'T')
					{						
						ITGrossTotal = parseFloat(ITGrossTotal) + parseFloat(total_mv);
						//nlapiLogExecution('DEBUG', 'In LOP', 'ITGrossTotal===========' + ITGrossTotal);
					}	
					
									
				
			//Gross Pay
				if(Pro_rata_Check=='T' && (DOJ_Month == wage_Period)) //&& DOJ_Yr == GetYear))
				{
					mth_var_sal_amt = parseFloat(proRatacaL)	
// changed for loan negative value display for bulk upload csv on 13/05/2026
					//mth_var_sal_amt = Math.abs(mth_var_sal_amt)	
					mth_var_sal_amt = mth_var_sal_amt;									 
				}
				else
				{
				// changed for loan negative value display for bulk upload csv on 13/05/2026

					//mth_var_sal_amt = Math.abs(total_mv)		
					mth_var_sal_amt = total_mv;		
				}
				
							
			//Salary adjustment	

			//var salary_adjustment = GetSalaryAdjustAmt(i_entity,i_pay_group,i_Earn_Compnent,wage_Period,GetYear);
			var salary_adjustment = GetSalaryAdjustAmt(i_entityId,i_pay_group,i_Earn_Compnent,wage_Period,GetYear)	
			var SALADJREC= salary_adjustment.toString().split('#');
			var SalAdjustDate = SALADJREC[2]
			var Sal_adj_amt =0
			var Sal_adj_comp_type;
			if (SalAdjustDate != null && SalAdjustDate != 'undefined' && SalAdjustDate != '') 
			{
				var SALARYADJDATE = nlapiStringToDate(SalAdjustDate)//SalAdjustDate.toString().split('/');
				
				var SAMonth = SALARYADJDATE.getMonth()+1 ;//SALARYADJDATE[0];					
				nlapiLogExecution('DEBUG', 'processId Fields', 'SAMonth*******' + SAMonth);		
				var SAYear = SALARYADJDATE.getFullYear();//SALARYADJDATE[2];
				nlapiLogExecution('DEBUG', 'processId Fields', 'SAYear*******' + SAYear);	
				if (SAMonth == wage_Period) //&& SAYear == GetYear) 
				{
					Sal_adj_amt =  SALADJREC[0];		
												
					Sal_adj_comp_type = SALADJREC[1];							
				}
				//Sal_adj_amt = parseFloat(Sal_adj_amt)
				mth_var_sal_amt = parseFloat(mth_var_sal_amt) + parseFloat(Sal_adj_amt)
				nlapiLogExecution('DEBUG', 'processId Fields', 'mth_var_sal_amt*******^^' + mth_var_sal_amt);
				
			}
			i_comp_type = valueCheck(i_comp_type)
			var payprocess = nlapiCreateRecord('customrecord_hris_pay_process');	
			payprocess.setFieldValue('custrecord_hris_pay_proc_employee',i_entityId);
			payprocess.setFieldValue('custrecord_hris_pay_proc_employee_code',i_EmpCode);
			payprocess.setFieldValue('custrecord_hris_pay_proc_process_type',process_type);	
			payprocess.setFieldValue('custrecord_hris_pay_proc_pay_group', i_paygroup_earn);
			payprocess.setFieldValue('custrecord_hris_pay_proc_employee_name', i_emp_name_txt);
			payprocess.setFieldValue('custrecord_hris_pay_proc_department',i_emp_dept);

             // By florence
			 nlapiLogExecution('AUDIT','Monthsubdepa',empsubdepartment); 
             payprocess.setFieldValue('custrecord_hris_pay_proc_subdept',empsubdepartment);
           //  payprocess.setFieldValue('custrecord_hris_pay_proc_location',emplocation);
			if (i_emp_company != 'undefined' && i_emp_company!='' && i_emp_company!='')
			{
			payprocess.setFieldValue('custrecord_hris_pay_proc_company_name',i_emp_company);
			}
			payprocess.setFieldValue('custrecord_hris_pay_proc_component_type',i_comp_type);
			payprocess.setFieldValue('custrecord_hris_pay_proc_pay_date', wEndDate);
			payprocess.setFieldValue('custrecord_hris_pay_proc_pay_month', wage_Period);
			payprocess.setFieldValue('custrecord_hris_pay_proc_pt_location',PTLoc);
			payprocess.setFieldValue('custrecord_hris_pay_proc_pt_check',PTCheckComp);
			payprocess.setFieldValue('custrecord_hris_pay_proc_year',GetYear);
			payprocess.setFieldValue('custrecord_hris_pay_proc_paid_days',paid_days);
			payprocess.setFieldValue('custrecord_hris_pay_proc_lop_days_final',LOPDaysFinal)
			payprocess.setFieldValue('custrecord_hris_pay_proc_payroll_compone',i_Earn_Compnent);
			payprocess.setFieldValue('custrecord_hris_pay_proc_account_code',account_code);
			payprocess.setFieldValue('custrecord_hris_pay_proc_monthly_variabl',mth_var_sal_amt);
			payprocess.setFieldValue('custrecord_hris_pay_proc_actual_salary', total_mv);
			
			if(i_comp_type=='1')
			{
				payprocess.setFieldValue('custrecord_hris_pay_proc_gross_earning',mth_var_sal_amt);				
				payprocess.setFieldValue('custrecord_hris_pay_proc_actual_gross_ea', mth_var_sal_amt);				
			}//End if(i_comp_type=='1')
			else
			{
				payprocess.setFieldValue('custrecord_hris_pay_proc_gross_deduction', mth_var_sal_amt);
				payprocess.setFieldValue('custrecord_hris_pay_proc_actual_gross_de', mth_var_sal_amt);
			}//End else if(i_comp_type=='1')
			
			payprocess.setFieldValue('custrecord_hris_pay_proc_value',mth_var_sal_amt);
			payprocess.setFieldValue('custrecord_hris_pay_proc_othours',OTHoursfinal);
			payprocess.setFieldValue('custrecord_hris_pay_proc_remark',employeeremarks);
			var monthvar = nlapiSubmitRecord(payprocess, false, false);	
			nlapiLogExecution('DEBUG', 'monthly var payprocess', monthvar);		
		}//End for(var mvc=0;mvc< searchMonthVarRec.length;mvc++)	
		return mth_var_sal_amt +"#"+i_comp_type  +"#"+SSGrossTotal +"#"+ITGrossTotal;		
	}//End if(searchMonthVarRec !=null &&searchMonthVarRec!='undefined' && searchMonthVarRec!='' )
	} catch (e) {
		logErrorToCustomRecord('getMonthlyVariable_Comp', e, i_pay_group, i_emp_company, i_entityId, wage_periodId, year, 'employee (ID: ' + i_entityId + ')');
		throw e;
	}
}

function searchLeaveSettlementRecord(empId, payGroup, month, year) {
	try {
		var filters = [
        ['custrecord_hrms_lveset_paidthropayroll', 'is', 'T'], 'AND',
        ['custrecord_hrms_lveset_empname', 'is', empId], 'AND', 
        ['custrecord_hrms_lveset_paygroup', 'is', payGroup], 'AND',
        ['custrecord_hris_leave_settle_month', 'is', month], 'AND',
        ['custrecord_hris_leave_settlement_year', 'is', year], 'AND',
        ['isinactive', 'is', 'F']
    ];
    var columns = [
        new nlobjSearchColumn('custrecord_hrms_lveset_lvesalaryamount'),
        new nlobjSearchColumn('custrecord_hrms_lveset_airticketamount')
    ];
    var results = nlapiSearchRecord('customrecord_hrms_leavesettlement', null, filters, columns);
    if (results) {
        return {
            lveSalary: results[0].getValue('custrecord_hrms_lveset_lvesalaryamount') || 0,
            airTicket: results[0].getValue('custrecord_hrms_lveset_airticketamount') || 0
        };
    }
    return null;
	} catch (e) {
		logErrorToCustomRecord('searchLeaveSettlementRecord', e, payGroup, null, empId, month, year, 'customrecord_hrms_leavesettlement');
		throw e;
	}
}

function searchComponentBySeq(payGroup, seqNo) {
	try {
		var filters = [
        ['custrecord_hris_pay_process_group', 'is', payGroup], 'AND',
        ['custrecord_hris__sequence_no_', 'equalto', seqNo], 'AND',
        ['isinactive', 'is', 'F']
    ];
    var res = nlapiSearchRecord('customrecord_hris_payroll_component', null, filters, [new nlobjSearchColumn('internalid')]);
    return res ? res[0].getValue('internalid') : null;
	} catch (e) {
		logErrorToCustomRecord('searchComponentBySeq', e, payGroup);
		throw e;
	}
}

function createLeaveSettlementPayProcess(waentityId, nameTxt, empCode, procType, payGrp, dept, month, year, company, amt, compId, subDept, otHrs, remarks) {
	try {
		var accCode = nlapiLookupField('customrecord_hris_payroll_component', compId, 'custrecord_hris_account_name');
    var rec = nlapiCreateRecord('customrecord_hris_pay_process');
    rec.setFieldValue('custrecord_hris_pay_proc_employee', entityId);
    rec.setFieldValue('custrecord_hris_pay_proc_employee_code', empCode);
    rec.setFieldValue('custrecord_hris_pay_proc_process_type', procType);
    rec.setFieldValue('custrecord_hris_pay_proc_pay_group', payGrp);
    rec.setFieldValue('custrecord_hris_pay_proc_employee_name', nameTxt);
    rec.setFieldValue('custrecord_hris_pay_proc_department', dept);
    rec.setFieldValue('custrecord_hris_pay_proc_subdept', subDept);
    if (company) rec.setFieldValue('custrecord_hris_pay_proc_company_name', company);
    rec.setFieldValue('custrecord_hris_pay_proc_pay_month', month);
    rec.setFieldValue('custrecord_hris_pay_proc_year', year);
    rec.setFieldValue('custrecord_hris_pay_proc_payroll_compone', compId);
    rec.setFieldValue('custrecord_hris_pay_proc_account_code', accCode);
    rec.setFieldValue('custrecord_hris_pay_proc_component_type', 1); // 1 = Earning
    rec.setFieldValue('custrecord_hris_pay_proc_actual_salary', amt);
    rec.setFieldValue('custrecord_hris_pay_proc_gross_earning', amt);
    rec.setFieldValue('custrecord_hris_pay_proc_actual_gross_ea', amt);
    rec.setFieldValue('custrecord_hris_pay_proc_value', amt);
    rec.setFieldValue('custrecord_hris_pay_proc_othours', otHrs);
    rec.setFieldValue('custrecord_hris_pay_proc_remark', remarks);
    nlapiSubmitRecord(rec, false, false);
	} catch (e) {
		logErrorToCustomRecord('createLeaveSettlementPayProcess', e, payGrp, company, waentityId, month, year, 'customrecord_hrms_leavesettlement (ID: ' + compId + ')');
		throw e;
	}
}

function createairticketPayProcess(wEndDate, waentityId, nameTxt, empCode, procType, payGrp, dept, month, year, company, amt, compId, paid_days, lopdaysFinal, lopDay, subDept, otHrs, remarks) {
	try {
		var accCode = nlapiLookupField('customrecord_hris_payroll_component', compId, 'custrecord_hris_account_name');
    var rec = nlapiCreateRecord('customrecord_hris_pay_process');
    rec.setFieldValue('custrecord_hris_pay_proc_employee', waentityId);
    rec.setFieldValue('custrecord_hris_pay_proc_employee_code', empCode);
    rec.setFieldValue('custrecord_hris_pay_proc_process_type', procType);
    rec.setFieldValue('custrecord_hris_pay_proc_pay_group', payGrp);
    rec.setFieldValue('custrecord_hris_pay_proc_employee_name', nameTxt);
    rec.setFieldValue('custrecord_hris_pay_proc_department', dept);
    rec.setFieldValue('custrecord_hris_pay_proc_subdept', subDept);
    if (company) rec.setFieldValue('custrecord_hris_pay_proc_company_name', company);
    rec.setFieldValue('custrecord_hris_pay_proc_pay_month', month);
    rec.setFieldValue('custrecord_hris_pay_proc_year', year);
    rec.setFieldValue('custrecord_hris_pay_proc_pay_date', wEndDate);
    rec.setFieldValue('custrecord_hris_pay_proc_paid_days', paid_days);
    rec.setFieldValue('custrecord_hris_pay_proc_lop_days', lopDay);
    rec.setFieldValue('custrecord_hris_pay_proc_lop_days_final', lopdaysFinal);
    rec.setFieldValue('custrecord_hris_pay_proc_payroll_compone', compId);
    rec.setFieldValue('custrecord_hris_pay_proc_account_code', accCode);
    rec.setFieldValue('custrecord_hris_pay_proc_component_type', 1);
    rec.setFieldValue('custrecord_hris_pay_proc_actual_salary', amt);
    rec.setFieldValue('custrecord_hris_pay_proc_gross_earning', amt);
    rec.setFieldValue('custrecord_hris_pay_proc_actual_gross_ea', amt);
    rec.setFieldValue('custrecord_hris_pay_proc_value', amt);
    rec.setFieldValue('custrecord_hris_pay_proc_othours', otHrs);
    rec.setFieldValue('custrecord_hris_pay_proc_remark', remarks);
    nlapiSubmitRecord(rec, false, false);
	} catch (e) {
		logErrorToCustomRecord('createairticketPayProcess', e, payGrp, company, waentityId, month, year, 'customrecord_hrms_leavesettlement (ID: ' + compId + ')');
		throw e;
	}
}

function getOThours(i_emp_name,i_pay_group,wage_periodId,GetYear) {
	try {
		var wage_Period = wage_periodId;
	
	var Filters = new Array();
	var Othours =0;
	nlapiLogExecution('DEBUG', 'OT Hours_emp_name::::::::', i_emp_name)
	Filters.push(new nlobjSearchFilter('custrecord_hris_mthsal_paygroup', null, 'is', i_pay_group));
	Filters.push(new nlobjSearchFilter('custrecord_hris_mthsal_empname', null, 'is', i_emp_name));
	nlapiLogExecution('DEBUG', 'OT Hourswage_Period::::::::', wage_Period)
	Filters.push(new nlobjSearchFilter('custrecord_hris_mthsal_month', null, 'is', wage_Period));
	Filters.push(new nlobjSearchFilter('custrecord_hris_mthsal_year', null, 'is', GetYear));
	Filters.push(new nlobjSearchFilter('custrecord_hris_mthsal_componenttype',null,'is','1'));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var Colm = new Array();
	/* Colm.push(new nlobjSearchColumn('internalid'));
	Colm.push(new nlobjSearchColumn('custrecord_hris_mthsal_salaryamount'));
	Colm.push(new nlobjSearchColumn('custrecord_hris_mthsal_paygroup'));
	Colm.push(new nlobjSearchColumn('custrecord_hris_mthsal_empname'));
	Colm.push(new nlobjSearchColumn('custrecord_hris_mthsal_paycomponent'));
 */
	Colm.push(new nlobjSearchColumn("custrecord_hris_mthsal_total_hours_days",null,"SUM"));
	
	var searchMonthVarRec = nlapiSearchRecord('customrecord_hris_monthlysalinput',null, Filters, Colm);	
	if(searchMonthVarRec !=null &&searchMonthVarRec!='undefined' && searchMonthVarRec!='' )
	{
		for(var mvc=0;mvc< searchMonthVarRec.length;mvc++)
		{
			Othours=searchMonthVarRec[mvc].getValue("custrecord_hris_mthsal_total_hours_days",null,"SUM");
			nlapiLogExecution('AUDIT', 'OT Hour::::::::', Othours)
			
			
							
			
		}//End for(var mvc=0;mvc< searchMonthVarRec.length;mvc++)	
			
	}//End if(searchMonthVarRec !=null &&searchMonthVarRec!='undefined' && searchMonthVarRec!='' )	
	return Othours;
	} catch (e) {
		logErrorToCustomRecord('getOThours', e, i_pay_group, null, i_emp_id, wage_periodId, GetYear);
		throw e;
	}
}

function searchMonthlyVariableEntry(i_paygroup_earn,i_emp_name,i_current_monthly,i_Earn_Compnent,wage_Period,GetYear) {
	try {
		var MV_Total = 0.00;
	nlapiLogExecution('DEBUG', 'aa i_paygroup_earn', i_paygroup_earn)
	nlapiLogExecution('DEBUG', 'aa i_emp_name', i_emp_name)
	nlapiLogExecution('DEBUG', 'aa i_Earn_Compnent', i_Earn_Compnent)
	nlapiLogExecution('DEBUG', 'aa wage_Period', wage_Period)
	nlapiLogExecution('DEBUG', 'aa GetYear', GetYear)
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_mthsal_paygroup', null, 'is', i_paygroup_earn));
	Filters.push(new nlobjSearchFilter('custrecord_hris_mthsal_empname', null, 'is', i_emp_name));
	Filters.push(new nlobjSearchFilter('custrecord_hris_mthsal_paycomponent', null, 'is', i_Earn_Compnent));//
	Filters.push(new nlobjSearchFilter('custrecord_hris_mthsal_month', null, 'is', wage_Period));
	Filters.push(new nlobjSearchFilter('custrecord_hris_mthsal_year', null, 'is', GetYear));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var Colm = new Array();
	Colm.push(new nlobjSearchColumn('internalid'));
	Colm.push(new nlobjSearchColumn('custrecord_hris_mthsal_salaryamount'));
	Colm.push(new nlobjSearchColumn('custrecord_hris_mthsal_paygroup'));
	Colm.push(new nlobjSearchColumn('custrecord_hris_mthsal_empname'));
	Colm.push(new nlobjSearchColumn('custrecord_hris_mthsal_paycomponent'));
	var searchMonthVarRec = nlapiSearchRecord('customrecord_hris_monthlysalinput',null, Filters, Colm);
	nlapiLogExecution('DEBUG', 'aa searchMonthVarRec length', searchMonthVarRec.length)
	if (searchMonthVarRec != null && searchMonthVarRec != 'undefined' && searchMonthVarRec != '') {
		for (var mvc = 0; mvc < searchMonthVarRec.length; mvc++) 
		{
			var i_current_monthly = searchMonthVarRec[mvc].getValue('custrecord_hris_mthsal_salaryamount');
			MV_Total = parseFloat(MV_Total)+ parseFloat(i_current_monthly);
		}
	}
	return MV_Total;
	} catch (e) {
		logErrorToCustomRecord('searchMonthlyVariableEntry', e);
		throw e;
	}
}

function createPTComp(i_entityId,i_EmpCode,process_type,i_paygroup_earn,i_emp_name,i_emp_dept,wage_Period,i_emp_company,LOPDaysFinal,paid_days,GetYear,PTApplicable,PTLoc,empsubdepartment,emplocation,OTHoursfinal,employeeremarks) {
	try {
		var i_Earn_Compnent = searchPTId(i_paygroup_earn);
	var account_code = nlapiLookupField('customrecord_hris_payroll_component',i_Earn_Compnent,'custrecord_hris_account_name');	
	nlapiLogExecution('DEBUG', 'PT Component Entityid', i_entityId);
	var emp_name1 = nlapiLookupField('employee', i_entityId,'entityid');	
	var PTGrossTotalFinal = searchPTGross(i_paygroup_earn,i_entityId,wage_Period,GetYear);	
	var PTCalc = searchSlabAmt(PTGrossTotalFinal,PTLoc);
			
	//Salary adjustment		
	var salary_adjustment = GetSalaryAdjustAmt(i_entityId,i_paygroup_earn,i_Earn_Compnent,wage_Period,GetYear);
	var SALADJREC= salary_adjustment.toString().split('#');
	var SalAdjustDate = SALADJREC[2]
	var Sal_adj_amt =0
	var Sal_adj_comp_type;
	if (SalAdjustDate != null && SalAdjustDate != 'undefined' && SalAdjustDate != '') 
	{
		var SALARYADJDATE = nlapiStringToDate(SalAdjustDate)//SalAdjustDate.toString().split('/');
		
		var SAMonth = SALARYADJDATE.getMonth()+1 ;//SALARYADJDATE[0];					
		nlapiLogExecution('DEBUG', 'processId Fields', 'SAMonth*******' + SAMonth);		
		var SAYear = SALARYADJDATE.getFullYear();//SALARYADJDATE[2];
		nlapiLogExecution('DEBUG', 'processId Fields', 'SAYear*******' + SAYear);	
		if (SAMonth == wage_Period) //&& SAYear == GetYear) 
		{
			Sal_adj_amt =  SALADJREC[0];		
										
			Sal_adj_comp_type = SALADJREC[1];							
		}
		//Sal_adj_amt = parseFloat(Sal_adj_amt)
		PTCalc = parseFloat(PTCalc) + parseFloat(Sal_adj_amt)
	}
	var payprocess = nlapiCreateRecord('customrecord_hris_pay_process');
	payprocess.setFieldValue('custrecord_hris_pay_proc_employee_name', emp_name1);
	payprocess.setFieldValue('custrecord_hris_pay_proc_employee', i_entityId);
	payprocess.setFieldValue('custrecord_hris_pay_proc_employee_code',i_EmpCode);
	payprocess.setFieldValue('custrecord_hris_pay_proc_process_type', process_type);
	payprocess.setFieldValue('custrecord_hris_pay_proc_pay_group', i_paygroup_earn);	
	payprocess.setFieldValue('custrecord_hris_pay_proc_department', i_emp_dept);
     // By florence
     payprocess.setFieldValue('custrecord_hris_pay_proc_subdept',empsubdepartment);
    // payprocess.setFieldValue('custrecord_hris_pay_proc_location',emplocation);
	if (i_emp_company != 'undefined' && i_emp_company!='' && i_emp_company!='')
	{
	payprocess.setFieldValue('custrecord_hris_pay_proc_company_name',i_emp_company);
	}
	payprocess.setFieldValue('custrecord_hris_pay_proc_pay_month', wage_Period);
	payprocess.setFieldValue('custrecord_hris_pay_proc_year', GetYear);
	payprocess.setFieldValue('custrecord_hris_pay_proc_payroll_compone', i_Earn_Compnent);
	payprocess.setFieldValue('custrecord_hris_pay_proc_account_code', account_code);
	// Florence Commented for comtype for deduction it is in 1
	//payprocess.setFieldValue('custrecord_hris_pay_proc_component_type',2);
	payprocess.setFieldValue('custrecord_hris_pay_proc_component_type',2);//Component_type	
	payprocess.setFieldValue('custrecord_hris_pay_proc_pt_gross', PTGrossTotalFinal);//PT Gross Total
	payprocess.setFieldValue('custrecord_hris_pay_proc_paid_days',paid_days);	
	payprocess.setFieldValue('custrecord_hris_pay_proc_lop_days_final',LOPDaysFinal);//
	if(PTApplicable!='T')	
	{
		payprocess.setFieldValue('custrecord_hris_pay_proc_pt_applicable',PTApplicable);
	}
	else
	{
		payprocess.setFieldValue('custrecord_hris_pay_proc_pt_applicable','F');
	}
	
	if(PTLoc!='' && PTLoc!='undefined' && PTLoc!=null)
	{
		payprocess.setFieldValue('custrecord_hris_pay_proc_pt_location',PTLoc);
	}		
	payprocess.setFieldValue('custrecord_hris_pay_proc_actual_salary', PTCalc);	
	payprocess.setFieldValue('custrecord_hris_pay_proc_gross_deduction', PTCalc);	//	
	payprocess.setFieldValue('custrecord_hris_pay_proc_actual_gross_de', PTCalc);	
	payprocess.setFieldValue('custrecord_hris_pay_proc_pt_amt', PTCalc);		
	payprocess.setFieldValue('custrecord_hris_pay_proc_value', PTCalc);
	payprocess.setFieldValue('custrecord_hris_pay_proc_othours',OTHoursfinal);
	payprocess.setFieldValue('custrecord_hris_pay_proc_remark',employeeremarks);
	var payprocessId = nlapiSubmitRecord(payprocess, false, false);
	nlapiLogExecution('DEBUG', 'PT Comp Payprocess', payprocessId);
	} catch (e) {
		logErrorToCustomRecord('createPTComp', e, i_pay_group, i_emp_company, i_entityId, wage_periodId, GetYear, 'customrecord_hris_payroll_component (ID: ' + i_Earn_Compnent + ')');
		throw e;
	}
}

function GetSalaryAdjustAmt(i_emp_Id,i_pay_group,i_Earn_Compnent,wage_Period,GetYear) {
	try {
		var SalAdjDate;
	var sal_Adj_Amt
	var i_comp_type ;
	var Component_id;
	var Filters = new Array();
	nlapiLogExecution('DEBUG', 'GetSalaryAdjustAmt Empid', i_emp_Id)
	Filters.push(new nlobjSearchFilter('custrecord_hris_sae_employee_name', null, 'is', i_emp_Id));
	Filters.push(new nlobjSearchFilter('custrecord_hris_sae_pay_group', null, 'is', i_pay_group));
	Filters.push(new nlobjSearchFilter('custrecord_hris_sae_component_name', null, 'is', i_Earn_Compnent));
	Filters.push(new nlobjSearchFilter('custrecord_hris_sae_month', null, 'is', wage_Period));
	Filters.push(new nlobjSearchFilter('custrecord_hris_sae_year', null, 'is', GetYear));	
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var Column = new Array();
	Column.push(new nlobjSearchColumn('internalid'));
	Column.push(new nlobjSearchColumn('custrecord_hris_sae_salary_amount'));//Amount
	Column.push(new nlobjSearchColumn('custrecord_hris_sae_component_name'));//Component name
	Column.push(new nlobjSearchColumn('custrecord_hris_sae_pay_date'));
	var searchSalAdjRec = nlapiSearchRecord('customrecord_hris_salary_adjustment_entr',null, Filters, Column);	
	if(searchSalAdjRec !=null)
	{		
		for(var salA = 0;salA< searchSalAdjRec.length;salA++)
		{
			 Component_id = searchSalAdjRec[salA].getValue('custrecord_hris_sae_component_name');			
			 i_comp_type = nlapiLookupField('customrecord_hris_payroll_component',Component_id,'custrecord_hris_payroll_component_type');			
			 sal_Adj_Amt =  searchSalAdjRec[salA].getValue('custrecord_hris_sae_salary_amount');		
			 SalAdjDate = searchSalAdjRec[salA].getValue('custrecord_hris_sae_pay_date');	
		}//End for(var salA = 0;salA< searchSalAdjRec.length;salA++)		
	}//End if(searchSalAdjRec !=null)
	return sal_Adj_Amt +"#"+i_comp_type+ "#"+SalAdjDate;
	} catch (e) {
		logErrorToCustomRecord('GetSalaryAdjustAmt', e);
		throw e;
	}
}

function deleterecToUpdate(i_emp_name,i_paygroup_earn,wage_Period,i_Earn_Compnent,process_type,GetYear) {
	try {
		var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_pay_group', null, 'is', i_paygroup_earn));
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_employee_name', null, 'is', i_emp_name));
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_pay_month', null, 'is', wage_Period));
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_payroll_compone', null, 'is', i_Earn_Compnent));
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_process_type', null, 'is', process_type));
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_year', null, 'is', GetYear));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var Column = new Array();
	Column.push(new nlobjSearchColumn('internalid'));	
	var searchSalRegRec = nlapiSearchRecord('customrecord_hris_pay_process',null, Filters, Column);	
	if(searchSalRegRec !=null)
	{
		for(var salR = 0;salR< searchSalRegRec.length;salR++)
		{
			var SalReg_Id = searchSalRegRec[salR].getValue('internalid');			
			nlapiDeleteRecord('customrecord_hris_pay_process',SalReg_Id);
		}//End 	for(var salR = 0;salR< searchSalRegRec.length;salR++)	
	}//End if(searchSalRegRec !=null)
	} catch (e) {
		logErrorToCustomRecord('deleterecToUpdate', e);
		throw e;
	}
}

function searchPTGross(i_paygroup_earn,i_entityId,wage_Period,GetYear) {
	try {
		var ActualGross=0.00
	var finalPTTotal=0.00;
	var Filters = new Array();
	nlapiLogExecution('DEBUG', 'searchPTGross', i_entityId)
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_pay_group', null, 'is', i_paygroup_earn));
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_employee', null, 'is', i_entityId));
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_pay_month', null, 'is', wage_Period));
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_year', null, 'is', GetYear));//
	// For Earning Id is 2
	//Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_component_type', null, 'is', 1));
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_component_type', null, 'is', 1));
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_pt_check', null, 'is', 'T'));	
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var Column = new Array();
	Column.push(new nlobjSearchColumn('internalid'));	
	Column.push(new nlobjSearchColumn('custrecord_hris_pay_proc_actual_gross_ea'));	
	var searchPTCheckRec = nlapiSearchRecord('customrecord_hris_pay_process',null, Filters, Column);	
	if(searchPTCheckRec !=null)
	{
		for(var PRG = 0;PRG< searchPTCheckRec.length;PRG++)
		{
			ActualGross = searchPTCheckRec[PRG].getValue('custrecord_hris_pay_proc_actual_gross_ea');	
			ActualGross = valueCheck(ActualGross)		
			finalPTTotal = parseFloat(finalPTTotal) + parseFloat(ActualGross);
			
		}//End 	for(var salR = 0;salR< searchSalRegRec.length;salR++)
	}//End if(searchSalRegRec !=null)
	return finalPTTotal;
	} catch (e) {
		logErrorToCustomRecord('searchPTGross', e);
		throw e;
	}
}

function deleterecInitial(i_emp_name,i_paygroup,wage_PeriodId,process_type,GetYear) {
	try {
		var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_pay_group', null, 'is', i_paygroup));
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_employee', null, 'is', i_emp_name));
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_pay_month', null, 'is', wage_PeriodId));
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_process_type', null, 'is', process_type));
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_year', null, 'is', GetYear));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var Column = new Array();
	Column.push(new nlobjSearchColumn('internalid'));	
	var searchSalRegRec = nlapiSearchRecord('customrecord_hris_pay_process',null, Filters, Column);	
	if(searchSalRegRec !=null)
	{
		for(var salR = 0;salR< searchSalRegRec.length;salR++)
		{
			var SalReg_Id = searchSalRegRec[salR].getValue('internalid');			
			nlapiDeleteRecord('customrecord_hris_pay_process',SalReg_Id);
		}//End for(var salR = 0;salR< searchSalRegRec.length;salR++)		
	}//End if(searchSalRegRec !=null)
	} catch (e) {
		logErrorToCustomRecord('deleterecInitial', e, i_paygroup, null, i_emp_id, wage_PeriodId, GetYear);
		throw e;
	}
}

function getArryMonthDays(i_emp_name,wage_periodId,GetYear) {
	try {
		var standard_month_days;
	var totalLOPDays = 0.00;
	var Filters = new Array();
	nlapiLogExecution('DEBUG', 'getArryMonthDays empid', i_emp_name)
	Filters.push(new nlobjSearchFilter('custrecord_hris_uae_employee_name', null, 'is', i_emp_name));	
	Filters.push(new nlobjSearchFilter('custrecord_hris_uae_month', null, 'is', wage_periodId));
	Filters.push(new nlobjSearchFilter('custrecord_hris_uae_year', null, 'is', GetYear));	
		
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var Column = new Array();
	Column.push(new nlobjSearchColumn('internalid'));
	Column.push(new nlobjSearchColumn('custrecord_hris_uae_arrear_month'));
	var searchLOPArrDays= nlapiSearchRecord('customrecord_hris_unpaid_arrear_entry',null, Filters, Column);	
	if(searchLOPArrDays!=null)
	{
		var ArrMonth = searchLOPArrDays[0].getValue('custrecord_hris_uae_arrear_month');
   		/* if (ArrMonth == '1' || ArrMonth == '3' || ArrMonth == '5' || ArrMonth == '7' || ArrMonth == '8' || ArrMonth == '10' || ArrMonth == '12') 
		{
        	standard_month_days = 31;
   		}//End if for odd month
	    if (ArrMonth == '4' || ArrMonth == '6' || ArrMonth == '9' || ArrMonth == '11') 
		{
	        standard_month_days = 30;
	    }//End if for even month
 */
		nlapiLogExecution('DEBUG', 'ArrMonth', ArrMonth)
		if (ArrMonth == '1' || ArrMonth == '3' || ArrMonth == '5' || ArrMonth == '9' || ArrMonth == '10' || ArrMonth == '12' || ArrMonth == '14') 
		{
        	standard_month_days = 31;
   		}//End if for odd month
	    if (ArrMonth == '4' || ArrMonth == '8' || ArrMonth == '11' || ArrMonth == '13') 
		{
	        standard_month_days = 30;
	    }//End if for even month

    	else if (ArrMonth == '2') 
		{
            var date = new Date()
            var year = date.getFullYear()           
            if (year % 4 == 0) 
			{
                standard_month_days = 29;
            }
            else 
			{
                standard_month_days = 28;
            }
        }//End else if (ArrMonth == '2') 
	}//End if(searchLOPArrDays!=null)
	nlapiLogExecution('DEBUG', 'standard_month_days', standard_month_days)
	return standard_month_days;
	} catch (e) {
		logErrorToCustomRecord('getArryMonthDays', e);
		throw e;
	}
}

function ArryWageMonth(i_emp_Id) {
	try {
		var totalLOPDays = 0.00;
	var Filters = new Array();
	nlapiLogExecution('DEBUG', 'ArryWageMonth empid', i_emp_Id)
	Filters.push(new nlobjSearchFilter('custrecord_hris_uae_employee_name', null, 'is', i_emp_Id));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var Column = new Array();
	Column.push(new nlobjSearchColumn('internalid'));
	Column.push(new nlobjSearchColumn('custrecord_hris_uae_pay_date'));
	var searchLOPDays= nlapiSearchRecord('customrecord_hris_unpaid_arrear_entry',null, Filters, Column);	
	if(searchLOPDays!=null)
	{
		for(var LOPArrD = 0 ;LOPArrD < searchLOPDays.length;LOPArrD++)
		{
			var ArryDate = searchLOPDays[LOPArrD].getValue('custrecord_hris_uae_pay_date');			
		}		
	}//End if(searchLOPDays!=null)
	else
	{
		return '';
	}//End else if(searchLOPDays!=null)
	return ArryDate;
	} catch (e) {
		logErrorToCustomRecord('ArryWageMonth', e);
		throw e;
	}
}

function MonthVarDay(i_emp_name, GetYear, wage_periodId) {
	try {
		GetYear = GetYear.toString();
	var Filters = new Array();
	nlapiLogExecution('DEBUG', 'aaa wage_periodId', wage_periodId)
	nlapiLogExecution('DEBUG', 'aaa GetYear', GetYear)
	nlapiLogExecution('DEBUG', 'MonthVarDay empid', i_emp_name)
	Filters.push(new nlobjSearchFilter('custrecord_hris_mthsal_empname', null, 'is', i_emp_name));
	Filters.push(new nlobjSearchFilter('custrecord_hris_mthsal_month', null, 'is', wage_periodId));
	Filters.push(new nlobjSearchFilter('custrecord_hris_mthsal_year', null, 'is', GetYear));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var Column = new Array();
	Column.push(new nlobjSearchColumn('internalid'));
	Column.push(new nlobjSearchColumn('custrecord_hris_mthsal_paydt'));
	var searchMVDays= nlapiSearchRecord('customrecord_hris_monthlysalinput',null, Filters, Column);
  	//nlapiLogExecution('DEBUG', 'aaa searchMVDays length', searchMVDays.length)
	if(searchMVDays!=null)
	{
		for(var MV= 0 ;MV < searchMVDays.length;MV++)
		{
			var MonthVarDate = searchMVDays[MV].getValue('custrecord_hris_mthsal_paydt');			
		}//End for(var MV= 0 ;MV < searchMVDays.length;MV++)		
	}//End if(searchMVDays!=null)	
	return MonthVarDate;
	} catch (e) {
		logErrorToCustomRecord('MonthVarDay', e);
		throw e;
	}
}

function SalAdjustDay(i_emp_Id,i_pay_group,i_Earn_Compnent,wage_Period,GetYear) {
	try {
		var SalAdjDate;
	var Filters = new Array();
	nlapiLogExecution('DEBUG', 'SalAdjustDay empid', i_emp_Id);
	Filters.push(new nlobjSearchFilter('custrecord_hris_sae_employee_name', null, 'is', i_emp_Id));
	Filters.push(new nlobjSearchFilter('custrecord_hris_sae_pay_group', null, 'is', i_pay_group));
	Filters.push(new nlobjSearchFilter('custrecord_hris_sae_component_name', null, 'is', i_Earn_Compnent));
	Filters.push(new nlobjSearchFilter('custrecord_hris_sae_month', null, 'is', wage_Period));
	Filters.push(new nlobjSearchFilter('custrecord_hris_sae_year', null, 'is', GetYear));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));	
	var Column = new Array();
	Column.push(new nlobjSearchColumn('internalid'));
	Column.push(new nlobjSearchColumn('custrecord_hris_sae_pay_date'));
	var searchSADays= nlapiSearchRecord('customrecord_hris_salary_adjustment_entr',null, Filters, Column);	
	if(searchSADays!=null)
	{
		for(var SA= 0 ;SA < searchSADays.length;SA++)
		{
			SalAdjDate = searchSADays[SA].getValue('custrecord_hris_sae_pay_date');			
		}//End for(var SA= 0 ;SA < searchSADays.length;SA++)		
	}//End if(searchSADays!=null)
	return SalAdjDate;
	} catch (e) {
		logErrorToCustomRecord('SalAdjustDay', e);
		throw e;
	}
}

function arrarDays(i_emp_Id,i_current_monthly,getArryMonthDay,wage_Period,GetYear) {
	try {
		var ArryLOPAmt = 0.00;
       var total_arryDays = 0;
       var Filters = new Array();
	   nlapiLogExecution('DEBUG', 'arrarDays empid', i_emp_Id);
	   Filters.push(new nlobjSearchFilter('custrecord_hris_uae_employee_name', null, 'is', i_emp_Id));
       Filters.push(new nlobjSearchFilter('custrecord_hris_uae_month', null, 'is', wage_Period));
       Filters.push(new nlobjSearchFilter('custrecord_hris_uae_year', null, 'is', GetYear));	
       Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
       
	   var Column = new Array();
       Column.push(new nlobjSearchColumn('internalid'));
       Column.push(new nlobjSearchColumn('custrecord_hris_uae_arrear_days'));
       Column.push(new nlobjSearchColumn('custrecord_hris_uae_pay_date'));
       Column.push(new nlobjSearchColumn('custrecord_hris_uae_arrear_month'));
       var searchLOPDays= nlapiSearchRecord('customrecord_hris_unpaid_arrear_entry',null, Filters, Column);	
       
	   if(searchLOPDays!=null)
       {
         nlapiLogExecution('DEBUG', 'searchLOPDays length', searchLOPDays.length)
       for(var LOPArr = 0 ;LOPArr < searchLOPDays.length;LOPArr++)
       {
           var ArryDays = searchLOPDays[LOPArr].getValue('custrecord_hris_uae_arrear_days');
		   var arrearMonth = searchLOPDays[LOPArr].getValue('custrecord_hris_uae_arrear_month')
		   var getArryMonthDay = getmonth_days(arrearMonth)
          // total_arryDays = parseInt(total_arryDays) + parseInt(ArryDays)//HERE WE ARE GETTING CONSOLIDATED ARREAR DAYS FOR THE EMPLOYEE
           var ArryLOPAmtVal =(parseFloat(i_current_monthly)/parseInt(getArryMonthDay))* parseFloat(ArryDays)//ARREAR AMOUNT CALCULATION	
		   ArryLOPAmt = parseFloat(ArryLOPAmt) + parseFloat(ArryLOPAmtVal)
		   total_arryDays = parseFloat(total_arryDays) + parseFloat(ArryDays)
           nlapiLogExecution('DEBUG', 'getArryMonthDay=== '+LOPArr, getArryMonthDay)
           nlapiLogExecution('DEBUG', 'total_arryDays=== '+LOPArr, total_arryDays)
           nlapiLogExecution('DEBUG', 'wage_Period=== '+LOPArr, wage_Period)
           nlapiLogExecution('DEBUG', 'GetYear=== '+LOPArr, GetYear)
           nlapiLogExecution('DEBUG', 'i_emp_Id=== '+LOPArr, i_emp_Id)
           //nlapiLogExecution('Debug','IncrementarrarDays ArryDays - ArryLOPAmt - i_current_monthly ', LOPArr +'-'+ ArryDays +'-'+ArryLOPAmt +'-'+ i_current_monthly );	
       }//End for(var LOPArr = 0 ;LOPArr < searchLOPDays.length;LOPArr++)	
      }//End if(searchLOPDays!=null) 
      else
      {
         return 0.00;
      }
          nlapiLogExecution('DEBUG', 'ArryLOPAmt +"#"+ ArryDays', ArryLOPAmt +"#"+ total_arryDays)
      return ArryLOPAmt +"#"+ total_arryDays ;
	} catch (e) {
		logErrorToCustomRecord('arrarDays', e);
		throw e;
	}
}

function IncrementarrarDays(i_emp_Id,i_current_monthly,getArryMonthDay,IMonth,GetYear) {
	try {
		var totalLOPDays = 0.00;
	var ArryLOPAmt = 0.00;
	var ArryDays=0.00;
	var Filters = new Array();
	nlapiLogExecution('DEBUG', 'IncrementarrarDays empid', i_emp_Id);
	Filters.push(new nlobjSearchFilter('custrecord_hris_uae_employee_name', null, 'is', i_emp_Id));
	Filters.push(new nlobjSearchFilter('custrecord_hris_uae_month', null, 'is', IMonth));
	Filters.push(new nlobjSearchFilter('custrecord_hris_uae_year', null, 'is', GetYear));	
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));	
	var Column = new Array();
	Column.push(new nlobjSearchColumn('internalid'));
	Column.push(new nlobjSearchColumn('custrecord_hris_uae_arrear_days'));
	Column.push(new nlobjSearchColumn('custrecord_hris_uae_pay_date'));
	Column.push(new nlobjSearchColumn('custrecord_hris_uae_arrear_month'));
	var searchLOPArrearDays= nlapiSearchRecord('customrecord_hris_unpaid_arrear_entry',null, Filters, Column);		
	if(searchLOPArrearDays!=null)
	{
		for(var LOPArr = 0 ;LOPArr < searchLOPArrearDays.length;LOPArr++)
		{
			ArryDays = searchLOPArrearDays[LOPArr].getValue('custrecord_hris_uae_arrear_days');
            		
			ArryLOPAmt =(parseFloat(i_current_monthly)/parseInt(getArryMonthDay))* parseFloat(ArryDays)			
		}//End for(var LOPArr = 0 ;LOPArr < searchLOPDays.length;LOPArr++)		
	}//End if(searchLOPDays!=null) 
	else
	{
		return 0.00;
	}
	return ArryLOPAmt +"#"+ ArryDays ;
	} catch (e) {
		logErrorToCustomRecord('IncrementarrarDays', e);
		throw e;
	}
}

function getLOPDays(i_emp_Id,wage_Period,i_current_monthly,GetMonthDays,GetYear) {
	try {
		var CaLLopDAys = 0.00;	
	var totalLOPDaysAmt = 0.00;
	var LOPDaysFinal = 0.00;
	var Filters = new Array();
	nlapiLogExecution('DEBUG', 'getLOPDays empid', i_emp_Id);
	Filters.push(new nlobjSearchFilter('custrecord_hris_ule_employee_name', null, 'is', i_emp_Id));
	Filters.push(new nlobjSearchFilter('custrecord_hris_ule_month', null, 'is', wage_Period));
	Filters.push(new nlobjSearchFilter('custrecord_hris_ule_year', null, 'is', GetYear));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var Column = new Array();
	Column.push(new nlobjSearchColumn('internalid'));
	Column.push(new nlobjSearchColumn('custrecord_hris_ule_noof_days'));
	var searchLOPDays= nlapiSearchRecord('customrecord_hris_unpaid_leave_entry',null, Filters, Column);
//nlapiLogExecution('DEBUG', 'searchLOPDays', searchLOPDays.length)	
	if (searchLOPDays != null) 
	{
		for (var LOP = 0; LOP < searchLOPDays.length; LOP++) 
		{
          nlapiLogExecution('DEBUG', 'i_current_monthly', i_current_monthly);
			var LOPDays = searchLOPDays[LOP].getValue('custrecord_hris_ule_noof_days') || 0;	
			LOPDaysFinal = parseFloat(LOPDays) + parseFloat(LOPDaysFinal)
          //below the comment line based on lop static getmonthdays 30 based on client requirement
			//CaLLopDAys = (parseFloat(i_current_monthly)/parseInt(GetMonthDays))* parseFloat(LOPDays);
          CaLLopDAys = (parseFloat(i_current_monthly)/30)* parseFloat(LOPDays);
			totalLOPDaysAmt = parseFloat(totalLOPDaysAmt)+ parseFloat(CaLLopDAys);
		}//End for (var LOP = 0; LOP < searchLOPDays.length; LOP++) 
	}//End if (searchLOPDays != null) 
	else
	{
		return 0.00 +"#"+ LOPDaysFinal;
	}//End else if (searchLOPDays != null) 
		nlapiLogExecution('DEBUG', 'totalLOPDaysAmt +"#"+ LOPDaysFinal', totalLOPDaysAmt +"#"+ LOPDaysFinal)
	return totalLOPDaysAmt +"#"+ LOPDaysFinal;
	} catch (e) {
		logErrorToCustomRecord('getLOPDays', e);
		throw e;
	}
}

function getLOPDaysIncrement(i_emp_Id,Increment_Month,i_current_monthly,getDaysOfIncrementMonth,GetYear) {
	try {
		var CaLLopDAys = 0.00;	
	var totalLOPDaysAmt = 0.00;
	var LOPDaysFinal = 0.00;
	var Filters = new Array();
	nlapiLogExecution('DEBUG', ' getLOPDaysIncrement empid', i_emp_Id);
	Filters.push(new nlobjSearchFilter('custrecord_hris_ule_employee_name', null, 'is', i_emp_Id));
	Filters.push(new nlobjSearchFilter('custrecord_hris_ule_month', null, 'is', Increment_Month));
	Filters.push(new nlobjSearchFilter('custrecord_hris_ule_year', null, 'is', GetYear));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var Column = new Array();
	Column.push(new nlobjSearchColumn('internalid'));
	Column.push(new nlobjSearchColumn('custrecord_hris_ule_noof_days'));
	var searchLOPDays= nlapiSearchRecord('customrecord_hris_unpaid_leave_entry',null, Filters, Column);						
	if (searchLOPDays != null) 
	{
		for (var LOP = 0; LOP < searchLOPDays.length; LOP++) 
		{
			var LOPDays = searchLOPDays[LOP].getValue('custrecord_hris_ule_noof_days');
			LOPDaysFinal = parseFloat(LOPDays) + parseFloat(LOPDaysFinal)							
			CaLLopDAys = (parseFloat(i_current_monthly)/parseInt(getDaysOfIncrementMonth))* parseFloat(LOPDays);
			totalLOPDaysAmt = parseFloat(totalLOPDaysAmt)+ parseFloat(CaLLopDAys);
		}//End for (var LOP = 0; LOP < searchLOPDays.length; LOP++) 
	}//End if (searchLOPDays != null) 
	else
	{
		return 0.00 +"#"+ LOPDaysFinal;
	}//End else if (searchLOPDays != null) 
	return totalLOPDaysAmt +"#"+ LOPDaysFinal;
	} catch (e) {
		logErrorToCustomRecord('getLOPDaysIncrement', e);
		throw e;
	}
}

function getmonth_days(wage_month) {
	try {
		var standard_month_days;
    if (wage_month == 'January' || wage_month == 'March' || wage_month == 'May' || wage_month == 'July' || wage_month == 'August' || wage_month == 'October' || wage_month == 'December'|| wage_month=='1'||wage_month=='3'||wage_month=='5'||wage_month=='7'||wage_month=='8'||wage_month=='10'||wage_month=='12') 
	{
        standard_month_days = 31
    }//End if for odd month
    if (wage_month == 'April' || wage_month == 'June' || wage_month == 'September' || wage_month == 'November'||wage_month=='4'||wage_month=='6'||wage_month=='9'||wage_month=='11') 
	{
        standard_month_days = 30
    }//End if for even month

	/* if (wage_month == 'January' || wage_month == 'March' || wage_month == 'May' || wage_month == 'July' || wage_month == 'August' || wage_month == 'October' || wage_month == 'December'|| wage_month=='1'||wage_month=='3'||wage_month=='5'||wage_month=='9'||wage_month=='10'||wage_month=='12'||wage_month=='14') 
	{
        standard_month_days = 31
    }//End if for odd month
    if (wage_month == 'April' || wage_month == 'June' || wage_month == 'September' || wage_month == 'November'||wage_month=='4'||wage_month=='6'||wage_month=='11'||wage_month=='13') 
	{
        standard_month_days = 30
    }//End if for even month */
    else 
        if (wage_month == 'February'|| wage_month=='2') 
		{
            var date = new Date()
            var year = date.getFullYear();            
            if (year % 4 == 0) 
			{
                standard_month_days = 29
            }
            else 
			{
                standard_month_days = 28
            }
        }//End else if for feb month
		nlapiLogExecution('debug','paid_days testing log standard_month_days else ',standard_month_days);
    return standard_month_days
	} catch (e) {
		logErrorToCustomRecord('getmonth_days', e);
		throw e;
	}
}

function compLoPCheck(i_Earn_Compnent) {
	try {
		var LOPCheck;
	if(i_Earn_Compnent !==null)
	{		
		var Filters = new Array();
		Filters.push(new nlobjSearchFilter('internalid', null, 'is',i_Earn_Compnent));
		Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
		var column = new Array();
		column.push(new nlobjSearchColumn('internalid'));
		column.push(new nlobjSearchColumn('custrecord_hris_loss_of_pay'));
		var searchLOPCheck= nlapiSearchRecord('customrecord_hris_payroll_component',null, Filters, column);		
		if(searchLOPCheck !=null)
		{
			var internalid = searchLOPCheck[0].getValue('internalid');			
			LOPCheck = searchLOPCheck[0].getValue('custrecord_hris_loss_of_pay');			
		}//End if(searchLOPCheck !=null)
		return LOPCheck;
	}//End if(i_Earn_Compnent_Txt !==null)
	} catch (e) {
		logErrorToCustomRecord('compLoPCheck', e);
		throw e;
	}
}

function compArrCheck(i_Earn_Compnent) {
	try {
		var ArrCheck;
	if(i_Earn_Compnent !==null)
	{		
		var Filters = new Array();
		Filters.push(new nlobjSearchFilter('internalid', null, 'is',i_Earn_Compnent));
		Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
		var column = new Array();
		column.push(new nlobjSearchColumn('internalid'));
		column.push(new nlobjSearchColumn('custrecord_hris_arrears'));
		var searchLOPCheck= nlapiSearchRecord('customrecord_hris_payroll_component',null, Filters, column);		
		if(searchLOPCheck !=null)
		{
			ArrCheck = searchLOPCheck[0].getValue('custrecord_hris_arrears');			
		}//End if(searchLOPCheck !=null)
		return ArrCheck;
	}//End if(i_Earn_Compnent_Txt !==null)
	} catch (e) {
		logErrorToCustomRecord('compArrCheck', e);
		throw e;
	}
}

function compPFCheck(i_Earn_Compnent) {
	try {
		var PFCheck;
	if(i_Earn_Compnent !==null)
	{
		var Filters = new Array();
		Filters.push(new nlobjSearchFilter('internalid', null, 'is',i_Earn_Compnent));
		Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
		var column = new Array();
		column.push(new nlobjSearchColumn('internalid'));
		column.push(new nlobjSearchColumn('custrecord_hris_pf_ind'));
		var searchPFCheck= nlapiSearchRecord('customrecord_hris_payroll_component',null, Filters, column);		
		if(searchPFCheck !=null)
		{
			PFCheck = searchPFCheck[0].getValue('custrecord_hris_pf_ind');			
		}//End if(searchPFCheck !=null)
		return PFCheck;
	}//End if(i_Earn_Compnent_Txt !==null)
	} catch (e) {
		logErrorToCustomRecord('compPFCheck', e);
		throw e;
	}
}

function searchPFValue() {
	try {
		var EmpPFValue;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_gp_sequence_no', null, 'equalto',4));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var column = new Array();
	column.push(new nlobjSearchColumn('internalid'));
	column.push(new nlobjSearchColumn('custrecord_hris_gp_value'));//ESIC internal id
	var searchPFCheck= nlapiSearchRecord('customrecord_hris_global_parameter',null, Filters, column);		
	if(searchPFCheck !=null)
	{
		EmpPFValue = searchPFCheck[0].getValue('custrecord_hris_gp_value');	
	}//End if(searchPFCheck !=null)
	return EmpPFValue;
	} catch (e) {
		logErrorToCustomRecord('searchPFValue', e);
		throw e;
	}
}

function searchESICEMP() {
	try {
		var EmpESICValue;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_gp_sequence_no', null, 'equalto',5));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var column = new Array();
	column.push(new nlobjSearchColumn('internalid'));
	column.push(new nlobjSearchColumn('custrecord_hris_gp_value'));//ESIC internal id
	var searchESICEMPCheck= nlapiSearchRecord('customrecord_hris_global_parameter',null, Filters, column);		
	if(searchESICEMPCheck !=null)
		{
			EmpESICValue = searchESICEMPCheck[0].getValue('custrecord_hris_gp_value');	
		}//End if(searchESICEMPCheck !=null)
		return EmpESICValue;
	} catch (e) {
		logErrorToCustomRecord('searchESICEMP', e);
		throw e;
	}
}

function searchSSEMP(i_pay_group) {
	try {
		var EmpSSValue;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_gp_pay_group', null, 'is', i_pay_group));
	Filters.push(new nlobjSearchFilter('custrecord_hris_gp_sequence_no', null, 'equalto',7));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var column = new Array();
	column.push(new nlobjSearchColumn('internalid'));
	column.push(new nlobjSearchColumn('custrecord_hris_gp_value'));//SS internal id
	var searchSSEMPCheck= nlapiSearchRecord('customrecord_hris_global_parameter',null, Filters, column);		
	if(searchSSEMPCheck !=null)
		{
			EmpSSValue = searchSSEMPCheck[0].getValue('custrecord_hris_gp_value');	
		}//End if(searchSSEMPCheck !=null)
		return EmpSSValue;
	} catch (e) {
		logErrorToCustomRecord('searchSSEMP', e);
		throw e;
	}
}

function searchITForCalc() {
	try {
		var EmpITValue;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_gp_sequence_no', null, 'equalto',9));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var column = new Array();
	column.push(new nlobjSearchColumn('internalid'));
	column.push(new nlobjSearchColumn('custrecord_hris_gp_value'));//SS internal id
	var searchITEMPCheck= nlapiSearchRecord('customrecord_hris_global_parameter',null, Filters, column);		
	if(searchITEMPCheck !=null)
		{
			EmpITValue = searchITEMPCheck[0].getValue('custrecord_hris_gp_value');	
		}//End if(searchSSEMPCheck !=null)
		return EmpITValue;
	} catch (e) {
		logErrorToCustomRecord('searchITForCalc', e);
		throw e;
	}
}

function searchESICCheckEmp(i_entityId) {
	try {
		var EmpESICCheck;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('internalid', null, 'is',i_entityId));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var column = new Array();
	column.push(new nlobjSearchColumn('internalid'));
	column.push(new nlobjSearchColumn('custentity_hris_isesiapplicable'));//ESIC internal id
	var searchESICEMPCheck= nlapiSearchRecord('employee',null, Filters, column);		
	if(searchESICEMPCheck !=null)
		{
			EmpESICCheck = searchESICEMPCheck[0].getValue('custentity_hris_isesiapplicable');	
		}//End if(searchESICEMPCheck !=null)
		return EmpESICCheck;
	} catch (e) {
		logErrorToCustomRecord('searchESICCheckEmp', e);
		throw e;
	}
}

function searchESICEmployer() {
	try {
		var EmpESICEmployerVal;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_gp_sequence_no', null, 'equalto',6));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var column = new Array();
	column.push(new nlobjSearchColumn('internalid'));
	column.push(new nlobjSearchColumn('custrecord_hris_gp_value'));//ESIC internal id
	var searchESICEmpoyerCheck= nlapiSearchRecord('customrecord_hris_global_parameter',null, Filters, column);		
	if(searchESICEmpoyerCheck !=null)
		{
			EmpESICEmployerVal = searchESICEmpoyerCheck[0].getValue('custrecord_hris_gp_value');	
		}//End if(searchESICEMPCheck !=null)
		return EmpESICEmployerVal;
	} catch (e) {
		logErrorToCustomRecord('searchESICEmployer', e);
		throw e;
	}
}

function searchSSEmployer(i_pay_group) {
	try {
		var SSEmployerVal;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_gp_pay_group', null, 'is',i_pay_group));
	Filters.push(new nlobjSearchFilter('custrecord_hris_gp_sequence_no', null, 'equalto',8));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var column = new Array();
	column.push(new nlobjSearchColumn('internalid'));
	column.push(new nlobjSearchColumn('custrecord_hris_gp_value'));//ss internal id
	var searchSSEmpoyerCheck= nlapiSearchRecord('customrecord_hris_global_parameter',null, Filters, column);		
	if(searchSSEmpoyerCheck !=null)
		{
			SSEmployerVal = searchSSEmpoyerCheck[0].getValue('custrecord_hris_gp_value');	
		}//End if(searchSSEmpoyerCheck !=null)
		return SSEmployerVal;
	} catch (e) {
		logErrorToCustomRecord('searchSSEmployer', e);
		throw e;
	}
}

function compESICCheck(i_Earn_Compnent) {
	try {
		var ESICCheck;
	if(i_Earn_Compnent !==null)
	{
		var Filters = new Array();
		Filters.push(new nlobjSearchFilter('internalid', null, 'is',i_Earn_Compnent));
		Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
		var column = new Array();
		column.push(new nlobjSearchColumn('internalid'));
		column.push(new nlobjSearchColumn('custrecord_hris_esic_ind'));//ESIC internal id
		var searchESICCheck= nlapiSearchRecord('customrecord_hris_payroll_component',null, Filters, column);		
		if(searchESICCheck !=null)
		{
			ESICCheck = searchESICCheck[0].getValue('custrecord_hris_esic_ind');			
		}//End if(searchESICCheck !=null)
		return ESICCheck;
	}//End if(i_Earn_Compnent_Txt !==null)
	} catch (e) {
		logErrorToCustomRecord('compESICCheck', e);
		throw e;
	}
}

function compSSCheck(i_paygroup_earn,i_Earn_Compnent) {
	try {
		var SSCheck;
	if(i_Earn_Compnent !==null)
	{
		nlapiLogExecution('DEBUG', 'compSSCheck paygroup')
		var Filters = new Array();
		Filters.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'is',i_paygroup_earn));
		Filters.push(new nlobjSearchFilter('internalid', null, 'is',i_Earn_Compnent));
		Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
		var column = new Array();
		column.push(new nlobjSearchColumn('internalid'));
		column.push(new nlobjSearchColumn('custrecord_hris_ss'));//SS internal id
		var searchSSCheck= nlapiSearchRecord('customrecord_hris_payroll_component',null, Filters, column);		
		if(searchSSCheck !=null)
		{
			SSCheck = searchSSCheck[0].getValue('custrecord_hris_ss');	
			nlapiLogExecution('DEBUG', 'compSSCheck SSCheck', SSCheck);		
		}//End if(searchSSCheck !=null)
		return SSCheck;
	}//End if(i_Earn_Compnent_Txt !==null)
	} catch (e) {
		logErrorToCustomRecord('compSSCheck', e);
		throw e;
	}
}

function compIncomeCheck(i_paygroup_earn,i_Earn_Compnent) {
	try {
		var ITCheck;
	if(i_Earn_Compnent !==null)
	{
		var Filters = new Array();
		Filters.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'is',i_paygroup_earn));
		Filters.push(new nlobjSearchFilter('internalid', null, 'is',i_Earn_Compnent));
		Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
		var column = new Array();
		column.push(new nlobjSearchColumn('internalid'));
		column.push(new nlobjSearchColumn('custrecord_hris_income_tax'));//IT internal id
		var searchITCheck= nlapiSearchRecord('customrecord_hris_payroll_component',null, Filters, column);		
		if(searchITCheck !=null)
		{
			ITCheck = searchITCheck[0].getValue('custrecord_hris_income_tax');			
		}//End if(searchSSCheck !=null)
		return ITCheck;
	}//End if(i_Earn_Compnent_Txt !==null)
	} catch (e) {
		logErrorToCustomRecord('compIncomeCheck', e);
		throw e;
	}
}

function compPTCheck(i_Earn_Compnent) {
	try {
		var PTCheck;
	if(i_Earn_Compnent !==null)
	{
		var Filters = new Array();
		Filters.push(new nlobjSearchFilter('internalid', null, 'is',i_Earn_Compnent));
		Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
		var column = new Array();
		column.push(new nlobjSearchColumn('internalid'));
		column.push(new nlobjSearchColumn('custrecord_hris_pt_ind'));//PT internal id
		var searchPTCheck= nlapiSearchRecord('customrecord_hris_payroll_component',null, Filters, column);		
		if(searchPTCheck !=null)
		{
			PTCheck = searchPTCheck[0].getValue('custrecord_hris_pt_ind');			
		}//End if(searchESICCheck !=null)
		return PTCheck;
	}//End if(i_Earn_Compnent_Txt !==null)
	} catch (e) {
		logErrorToCustomRecord('compPTCheck', e);
		throw e;
	}
}

function searchSlabAmt(PTGrossTotal,PTLoc) {
	try {
		/////////////nlapiLogExecution('DEBUG', 'PT In Search', 'PTGrossTotal***************' + PTGrossTotal);	
	var PT_lowVal;
	var PT_highVal;
	var PTAmt;
	var PTAmtFinal=0;
	if(PTLoc!=null && PTLoc!='' && PTLoc!='undefined')
	{
		var Filters = new Array();
		Filters.push(new nlobjSearchFilter('custrecord_hris_pt_state', null, 'is',PTLoc));
		Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
		var column = new Array();
		column.push(new nlobjSearchColumn('internalid'));
		column.push(new nlobjSearchColumn('custrecord_hris_pt_gross_sal_lowerval'));//Low value
		column.push(new nlobjSearchColumn('custrecord_hris_pt_gross_sal_high_val'));//Higher value	
		column.push(new nlobjSearchColumn('custrecord_hris_pt_amt'));// Pt amt
		var searchPTHightCheck= nlapiSearchRecord('customrecord_hris_pt_slap_master',null, Filters, column);		
		if(searchPTHightCheck !=null)
		{
			for(ptval=0;ptval<searchPTHightCheck.length;ptval++)
			{
				PT_lowVal =  searchPTHightCheck[ptval].getValue('custrecord_hris_pt_gross_sal_lowerval');
				PT_highVal = searchPTHightCheck[ptval].getValue('custrecord_hris_pt_gross_sal_high_val');
				PTAmt = searchPTHightCheck[ptval].getValue('custrecord_hris_pt_amt');
				if(PTGrossTotal >=PT_lowVal && PTGrossTotal <= PT_highVal)	
				{
					PTAmtFinal = PTAmt;
				}
			}
		}//End if(searchProRataCheck !=null)
		if(PTAmtFinal!=null && PTAmtFinal!='' && PTAmtFinal!='undefined')
		{
			return PTAmtFinal;
		}
		else
		{
			return 0;
		}
	}
	} catch (e) {
		logErrorToCustomRecord('searchSlabAmt', e);
		throw e;
	}
}

function compProRataCheck(i_Earn_Compnent) {
	try {
		var ProRataCheck;
	if(i_Earn_Compnent !==null)
	{
		var Filters = new Array();
		Filters.push(new nlobjSearchFilter('internalid', null, 'is',i_Earn_Compnent));
		Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
		var column = new Array();
		column.push(new nlobjSearchColumn('internalid'));
		column.push(new nlobjSearchColumn('custrecord_hris_pro_rate'));
		var searchProRataCheck= nlapiSearchRecord('customrecord_hris_payroll_component',null, Filters, column);		
		if(searchProRataCheck !=null)
		{
			ProRataCheck = searchProRataCheck[0].getValue('custrecord_hris_pro_rate');			
		}//End if(searchProRataCheck !=null)
		return ProRataCheck;
	}//End if(i_Earn_Compnent_Txt !==null)
	} catch (e) {
		logErrorToCustomRecord('compProRataCheck', e);
		throw e;
	}
}

function employeeDateofJoining(i_emp_name,wage_Period,LOPDay,year) {
	try {
		var presentDays =0;
	var wage_month_days = 0;	
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('internalid', null, 'is',i_emp_name));//entityid
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var column = new Array();
	column.push(new nlobjSearchColumn('internalid'));
	column.push(new nlobjSearchColumn('hiredate'));
	var searchDOJ= nlapiSearchRecord('employee',null, Filters, column);	
	if(searchDOJ !=null)
	{
		var EMP_DOJ =searchDOJ[0].getValue('hiredate');		
		var Finaldate = nlapiStringToDate(EMP_DOJ);
		var doj_date_day = Finaldate.getDate();	//Day of DOJ
		var	doj_month = Finaldate.getMonth() + 1;// Month of DOJ
		var doj_yr = Finaldate.getFullYear();	//Year of DOJ

		// For month change by florence
		doj_month= gethrisMonth(doj_month);
		nlapiLogExecution('DEBUG','Suitlet POST','year================^^^^^^^^^^^^^^^^^^^^^^^^^^ =='+year)
		nlapiLogExecution('DEBUG','Suitlet POST','doj_yr================^^^^^^^^^^^^^^^^^^^^^^^^^^ =='+doj_yr)
		if(doj_month == wage_Period && doj_yr == year)
		{
				
			wage_month_days = getmonth_days(wage_Period);		
            
             		
			presentDays = parseInt(wage_month_days)- parseInt(doj_date_day)- parseFloat(LOPDay)+ 1 ;						
		}//End if(doj_month == wage_Period)
	}//End if(searchDOJ !=null)
	return presentDays +"#"+wage_month_days +"#"+doj_month+"#"+doj_yr;
	} catch (e) {
		logErrorToCustomRecord('employeeDateofJoining', e);
		throw e;
	}
}

function searchYrId(GetYrID) {
	try {
		var YearTxt;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('name', null, 'is',GetYrID));//entityid
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var column = new Array();
	column.push(new nlobjSearchColumn('internalid'));
	var searchYr= nlapiSearchRecord('customlist_hris_year_master',null, Filters, column);	
	if(searchYr !=null)
	{
		YearTxt =searchYr[0].getValue('internalid');	//name						
	}//End if(searchDOJ !=null)
	return YearTxt //customlist_hris_year_master
	} catch (e) {
		logErrorToCustomRecord('searchYrId', e);
		throw e;
	}
}

function getComponentType(i_Earn_Compnent) {
	try {
		var CompType='';
	if(i_Earn_Compnent!=null && i_Earn_Compnent!='' && i_Earn_Compnent!='undefined')
	{
		var Filters = new Array();
		Filters.push(new nlobjSearchFilter('internalid', null, 'is',i_Earn_Compnent));
		Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
		var column = new Array();
		column.push(new nlobjSearchColumn('internalid'));
		column.push(new nlobjSearchColumn('custrecord_hris_payroll_component_type'));
		var searchCompType= nlapiSearchRecord('customrecord_hris_payroll_component',null, Filters, column);	
		if(searchCompType!=null)
		{
			CompType =searchCompType[0].getValue('custrecord_hris_payroll_component_type');			
		}//End if(searchCompType!=null)
		return CompType;
	}//End if(i_Earn_Compnent!=null && i_Earn_Compnent!='' && i_Earn_Compnent!='undefined')
	} catch (e) {
		logErrorToCustomRecord('getComponentType', e);
		throw e;
	}
}

function getWageperiodNo(i_wage_month) {
	try {
		var Wage_id;
	if(i_wage_month=='January')
	{
		Wage_id='1'
	}
	else if(i_wage_month=='February')
	{
		Wage_id='2'
	}
	else if(i_wage_month=='March')
	{
		Wage_id='3'
	}
	else if(i_wage_month=='April')
	{
		Wage_id='4'
	}
	else if(i_wage_month=='May')
	{
		Wage_id='5'
	}
	else if(i_wage_month=='June')
	{
		Wage_id='6'
	}
	else if(i_wage_month=='July')
	{
		Wage_id='7'
	}
	else if(i_wage_month=='August')
	{
		Wage_id='8'
	}
	else if(i_wage_month=='September')
	{
		Wage_id='9'
	}
	else if(i_wage_month=='October')
	{
		Wage_id='10'
	}
	else if(i_wage_month=='November')
	{
		Wage_id='11'
	}
	else if(i_wage_month=='December')
	{
		Wage_id='12'
	}
	return Wage_id;
	} catch (e) {
		logErrorToCustomRecord('getWageperiodNo', e);
		throw e;
	}
}

function gethrisMonth(monthParameter) {
	try {
		if (monthParameter == 1) {
        return '1';
    } else if (monthParameter == 2) {
        return '2';
    } else if (monthParameter == 3) {
        return '3';
    } else if (monthParameter == 4) {
        return '4';
    } else if (monthParameter == 5) {
        return '5';
    } else if (monthParameter == 6) {
        return '6';
    } else if (monthParameter == 7) {
        return '7';
    } else if (monthParameter == 8) {
        return '8';
    } else if (monthParameter == 9) {
        return '9';
    } else if (monthParameter == 10) {
        return '10';
    } else if (monthParameter == 11) {
        return '11';
    } else if (monthParameter == 12) {
        return '12';
    }
	} catch (e) {
		logErrorToCustomRecord('gethrisMonth', e);
		throw e;
	}
}

function getNormalMonth(monthParameter) {
	try {
		var monthInt = parseInt(monthParameter, 10);
		if (isNaN(monthInt) || monthInt < 1 || monthInt > 12) {
			throw new Error('Invalid monthParameter passed to getNormalMonth: ' + monthParameter);
		}
		return String(monthInt);
	} catch(e) {
		logErrorToCustomRecord('getNormalMonth', e);
		throw e;
	}
}

function getEarningGross(wEndDate, i_emp_name_tx,i_EmpCode,i_pay_group,wage_periodId,i_emp_name,Component_Type,GetYear,i_emp_dept,i_emp_company,process_type,i_entityId,paid_days,LOPDaysFinal,ESICApplicable,PTLoc,empsubdepartment,emplocation,OTHoursfinal,employeeremarks) {
	try {
		var wage_Period = wage_periodId;
	nlapiLogExecution('DEBUG', 'aa wage_Period', wage_Period)
	nlapiLogExecution('DEBUG', 'aa i_pay_group', i_pay_group)
	var i_Earn_Compnent = searchGrossEarnID(i_pay_group);
	nlapiLogExecution('DEBUG', 'aa i_Earn_Compnent', i_Earn_Compnent)
	var compEarntype = searchEarnCompType(i_pay_group)
	nlapiLogExecution('DEBUG', 'aa compEarntype test', compEarntype);
	nlapiLogExecution('AUDIT','Getyear',GetYear);
	var account_code = nlapiLookupField('customrecord_hris_payroll_component',i_Earn_Compnent,'custrecord_hris_account_name');			
	nlapiLogExecution('DEBUG', 'aa compEarntype test',account_code);
	var total_gross_Earn = 0.00;
	var total_Act_gross_Earn = 0.00;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_employee_name', null, 'is',i_emp_name_tx));
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_pay_group', null, 'is',i_pay_group));
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_pay_month', null, 'is',wage_Period));
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_component_type', null, 'is',compEarntype));
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_year', null, 'is', GetYear));
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_process_type', null, 'is', 1));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var column = new Array();
	column.push(new nlobjSearchColumn('internalid'));
	column.push(new nlobjSearchColumn('custrecord_hris_pay_proc_component_type'));
	column.push(new nlobjSearchColumn('custrecord_hris_pay_proc_gross_earning'));//Gross Earning
	column.push(new nlobjSearchColumn('custrecord_hris_pay_proc_actual_gross_ea'));//Actual Gross Earning
	var searchgetEarningGross= nlapiSearchRecord('customrecord_hris_pay_process',null, Filters, column);
	nlapiLogExecution('DEBUG', 'searchgetEarningGross',searchgetEarningGross)
	//nlapiLogExecution('DEBUG', 'searchgetEarningGross',searchgetEarningGross.length)
	
	if(searchgetEarningGross !=null)
	{	
		nlapiLogExecution('DEBUG', 'Inside searchgetEarningGross');	
		for(GE=0;GE<searchgetEarningGross.length;GE++)
		{
			var Gross_Earning = searchgetEarningGross[GE].getValue('custrecord_hris_pay_proc_gross_earning');
			Gross_Earning = valueCheck(Gross_Earning)
			total_gross_Earn = parseFloat(total_gross_Earn) + parseFloat(Gross_Earning);
			var Actual_Gross_Earning = searchgetEarningGross[GE].getValue('custrecord_hris_pay_proc_actual_gross_ea');	
			Actual_Gross_Earning = valueCheck(Actual_Gross_Earning);
			total_Act_gross_Earn = parseFloat(Actual_Gross_Earning)+ parseFloat(total_Act_gross_Earn);	
			nlapiLogExecution('DEBUG', 'aa Actual_Gross_Earning', Actual_Gross_Earning)
			nlapiLogExecution('DEBUG', 'aa total_Act_gross_Earn', total_Act_gross_Earn)
			
		}//End for(GE=0;GE<searchgetEarningGross.length;GE++)
		
		nlapiLogExecution('DEBUG', 'aaaa Actual_Gross_Earning', Actual_Gross_Earning)
			nlapiLogExecution('DEBUG', 'aaaa total_Act_gross_Earn', total_Act_gross_Earn)

		var payprocess = nlapiCreateRecord('customrecord_hris_pay_process');
		payprocess.setFieldValue('custrecord_hris_pay_proc_employee',i_entityId);
		payprocess.setFieldValue('custrecord_hris_pay_proc_employee_code',i_EmpCode);
		payprocess.setFieldValue('custrecord_hris_pay_proc_process_type',process_type);
		payprocess.setFieldValue('custrecord_hris_pay_proc_pay_group', i_pay_group);
		payprocess.setFieldValue('custrecord_hris_pay_proc_employee_name', i_emp_name_tx);
		payprocess.setFieldValue('custrecord_hris_pay_proc_department',i_emp_dept);
		payprocess.setFieldValue('custrecord_hris_pay_proc_subdept',empsubdepartment);
		if (i_emp_company != 'undefined' && i_emp_company!='' && i_emp_company!='')
		{
		payprocess.setFieldValue('custrecord_hris_pay_proc_company_name',i_emp_company);
		}
		payprocess.setFieldValue('custrecord_hris_pay_proc_pay_month', wage_Period);
		payprocess.setFieldValue('custrecord_hris_pay_proc_pay_date', wEndDate);
		payprocess.setFieldValue('custrecord_hris_pay_proc_year',GetYear);
		payprocess.setFieldValue('custrecord_hris_pay_proc_paid_days',paid_days);
		payprocess.setFieldValue('custrecord_hris_pay_proc_pt_location',PTLoc);
		payprocess.setFieldValue('custrecord_hris_pay_proc_lop_days_final',LOPDaysFinal)
		payprocess.setFieldValue('custrecord_hris_pay_proc_payroll_compone',i_Earn_Compnent);
		if (account_code != 'undefined' && account_code!='' && account_code!='')
		{
			payprocess.setFieldValue('custrecord_hris_pay_proc_account_code',account_code);
		}
		
		total_gross_Earn= valueCheck(total_gross_Earn);
		payprocess.setFieldValue('custrecord_hris_pay_proc_gross_earning',total_gross_Earn);
		total_Act_gross_Earn = valueCheck(total_Act_gross_Earn)
		payprocess.setFieldValue('custrecord_hris_pay_proc_actual_gross_ea', total_Act_gross_Earn);
		payprocess.setFieldValue('custrecord_hris_pay_proc_actual_salary', total_Act_gross_Earn);
		payprocess.setFieldValue('custrecord_hris_pay_proc_value',total_Act_gross_Earn);
		payprocess.setFieldValue('custrecord_hris_pay_proc_othours',OTHoursfinal);
		payprocess.setFieldValue('custrecord_hris_pay_proc_remark',employeeremarks);
		var payprocessId = nlapiSubmitRecord(payprocess, false, false);		
		nlapiLogExecution('DEBUG', 'Earning Payprocess id', payprocessId);
	}//End if(searchgetEarningGross !=null)
	return total_Act_gross_Earn;
	} catch (e) {
		logErrorToCustomRecord('getEarningGross', e);
		throw e;
	}
}

function getDedcGross(wEndDate, i_emp_name_tx,i_EmpCode,i_pay_group,wage_periodId,i_emp_name,Component_Type_dedc,GetYear,i_emp_dept,i_emp_company,process_type,i_entityId,paid_days,LOPDaysFinal,ESICApplicable,PTLoc,empsubdepartment,emplocation,OTHoursfinal,employeeremarks) {
	try {
		var wage_Period = wage_periodId
	var i_Earn_Compnent = searchDeductionEarnId(i_pay_group)
	var compdedctype = searchDedcCompType()
	var total_gross_dedc = 0.00;
	var total_Act_gross_dedc = 0.00;
	var Filters = new Array();
	nlapiLogExecution('AUDIT','Inside Deduction');
	nlapiLogExecution('AUDIT','Inside gross Component Type',+compdedctype);
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_employee_name', null, 'is',i_emp_name_tx));
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_pay_group', null, 'is',i_pay_group));
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_pay_month', null, 'is',wage_Period));
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_component_type', null, 'is',compdedctype));
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_year', null, 'is', GetYear));
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_process_type', null, 'is', 1));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var column = new Array();
	column.push(new nlobjSearchColumn('internalid'));
	column.push(new nlobjSearchColumn('custrecord_hris_pay_proc_component_type'));
	column.push(new nlobjSearchColumn('custrecord_hris_pay_proc_gross_deduction'));//Gross deduction
	column.push(new nlobjSearchColumn('custrecord_hris_pay_proc_actual_gross_de'));//Actual Gross deduction
	var searchgetDedcGross= nlapiSearchRecord('customrecord_hris_pay_process',null, Filters, column);	
	if(searchgetDedcGross !=null)
	{
		for(GD=0;GD<searchgetDedcGross.length;GD++)
		{
			var Gross_Dedc = searchgetDedcGross[GD].getValue('custrecord_hris_pay_proc_gross_deduction');			
			Gross_Dedc = valueCheck(Gross_Dedc)
			total_gross_dedc = parseFloat(total_gross_dedc) + parseFloat(Gross_Dedc);			
			var Actual_Gross_dedc = searchgetDedcGross[GD].getValue('custrecord_hris_pay_proc_actual_gross_de');			
			Actual_Gross_dedc = valueCheck(Actual_Gross_dedc);
			total_Act_gross_dedc = parseFloat(total_Act_gross_dedc)+ parseFloat(Actual_Gross_dedc);			
		}//End for(GD=0;GD<searchgetDedcGross.length;GD++)
		nlapiLogExecution('AUDIT','Actual Gross Ded',+total_Act_gross_dedc);

		var payprocess = nlapiCreateRecord('customrecord_hris_pay_process');
		payprocess.setFieldValue('custrecord_hris_pay_proc_employee',i_entityId);
		payprocess.setFieldValue('custrecord_hris_pay_proc_employee_code',i_EmpCode);
		payprocess.setFieldValue('custrecord_hris_pay_proc_process_type',process_type);
		payprocess.setFieldValue('custrecord_hris_pay_proc_pay_group', i_pay_group);
		payprocess.setFieldValue('custrecord_hris_pay_proc_employee_name', i_emp_name_tx);
		payprocess.setFieldValue('custrecord_hris_pay_proc_department',i_emp_dept);
		payprocess.setFieldValue('custrecord_hris_pay_proc_subdept',empsubdepartment);
		if (i_emp_company != 'undefined' && i_emp_company!='' && i_emp_company!='') 
		{
		payprocess.setFieldValue('custrecord_hris_pay_proc_company_name',i_emp_company);
		}
		payprocess.setFieldValue('custrecord_hris_pay_proc_pay_month', wage_Period);
		payprocess.setFieldValue('custrecord_hris_pay_proc_pay_date', wEndDate);
		payprocess.setFieldValue('custrecord_hris_pay_proc_year',GetYear);
		payprocess.setFieldValue('custrecord_hris_pay_proc_pt_location',PTLoc);
		payprocess.setFieldValue('custrecord_hris_pay_proc_paid_days',paid_days);
		payprocess.setFieldValue('custrecord_hris_pay_proc_lop_days_final',LOPDaysFinal)
		payprocess.setFieldValue('custrecord_hris_pay_proc_payroll_compone',i_Earn_Compnent);
		total_gross_dedc= valueCheck(total_gross_dedc);
		payprocess.setFieldValue('custrecord_hris_pay_proc_gross_deduction',total_gross_dedc);
		payprocess.setFieldValue('custrecord_hris_pay_proc_actual_salary',total_gross_dedc);
		Actual_Gross_dedc = valueCheck(Actual_Gross_dedc)
		payprocess.setFieldValue('custrecord_hris_pay_proc_actual_gross_de', total_Act_gross_dedc);
		payprocess.setFieldValue('custrecord_hris_pay_proc_value',total_Act_gross_dedc);
		payprocess.setFieldValue('custrecord_hris_pay_proc_othours',OTHoursfinal);
		payprocess.setFieldValue('custrecord_hris_pay_proc_remark',employeeremarks);
		var payprocessId = nlapiSubmitRecord(payprocess, false, false);		
		nlapiLogExecution('AUDIT','Inside Gross Deduction Payprocess Id',+payprocessId);
	}//End if(searchgetDedcGross !=null)
	return total_gross_dedc;
	} catch (e) {
		logErrorToCustomRecord('getDedcGross', e);
		throw e;
	}
}

function searchDeductionEarnId(i_pay_group) {
	try {
		var DedcID;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'is',i_pay_group));
	Filters.push(new nlobjSearchFilter('custrecord_hris__sequence_no_', null, 'equalto',99));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var column = new Array();
	column.push(new nlobjSearchColumn('internalid'));	
	var searchDedcGrossCheck= nlapiSearchRecord('customrecord_hris_payroll_component',null, Filters, column);		
	if(searchDedcGrossCheck !=null)
	{
		DedcID = searchDedcGrossCheck[0].getValue('internalid');	
	}//End if(searchEarnGrossCheck !=null)
	return DedcID;
	} catch (e) {
		logErrorToCustomRecord('searchDeductionEarnId', e);
		throw e;
	}
}

function searchNetId(i_pay_group) {
	try {
		var NetPayID;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'is',i_pay_group));
	Filters.push(new nlobjSearchFilter('custrecord_hris__sequence_no_', null, 'equalto',100));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var column = new Array();
	column.push(new nlobjSearchColumn('internalid'));	
	var searchNetCheck= nlapiSearchRecord('customrecord_hris_payroll_component',null, Filters, column);		
	if(searchNetCheck !=null)
	{
		NetPayID = searchNetCheck[0].getValue('internalid');	
	}//End if(searchNetCheck !=null)
	return NetPayID;
	} catch (e) {
		logErrorToCustomRecord('searchNetId', e);
		throw e;
	}
}

function searchPFID() {
	try {
		var NetPFID;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris__sequence_no_', null, 'equalto',53));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var column = new Array();
	column.push(new nlobjSearchColumn('internalid'));	
	var searchPFCheck= nlapiSearchRecord('customrecord_hris_payroll_component',null, Filters, column);		
	if(searchPFCheck !=null)
	{
		NetPFID = searchPFCheck[0].getValue('internalid');	
	}//End if(searchNetCheck !=null)
	return NetPFID;
	} catch (e) {
		logErrorToCustomRecord('searchPFID', e);
		throw e;
	}
}

function searchESICId(i_pay_group) {
	try {
		var ESICID;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'is',i_pay_group));
	Filters.push(new nlobjSearchFilter('custrecord_hris__sequence_no_', null, 'equalto',54));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var column = new Array();
	column.push(new nlobjSearchColumn('internalid'));	
	var searchPFCheck= nlapiSearchRecord('customrecord_hris_payroll_component',null, Filters, column);		
	if(searchPFCheck !=null)
	{
		ESICID = searchPFCheck[0].getValue('internalid');	
	}//End if(searchNetCheck !=null)
	return ESICID;
	} catch (e) {
		logErrorToCustomRecord('searchESICId', e);
		throw e;
	}
}

function searchSSId(i_pay_group) {
	try {
		var SSId;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'is',i_pay_group));
	Filters.push(new nlobjSearchFilter('custrecord_hris__sequence_no_', null, 'equalto',92));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var column = new Array();
	column.push(new nlobjSearchColumn('internalid'));	
	nlapiLogExecution('DEBUG', 'searchSSId paygroup', i_pay_group)
	var searchSSCheck= nlapiSearchRecord('customrecord_hris_payroll_component',null, Filters, column);		
	if(searchSSCheck !=null)
	{
		SSId = searchSSCheck[0].getValue('internalid');	
		nlapiLogExecution('DEBUG', 'searchSSId', SSId)
	}//End if(searchNetCheck !=null)
	return SSId;
	} catch (e) {
		logErrorToCustomRecord('searchSSId', e);
		throw e;
	}
}

function searchITId() {
	try {
		var ITId;
	var Filters = new Array();
	//Filters.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'is',i_pay_group));
	Filters.push(new nlobjSearchFilter('custrecord_hris__sequence_no_', null, 'equalto',95));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var column = new Array();
	column.push(new nlobjSearchColumn('internalid'));	
	var searchITCheck= nlapiSearchRecord('customrecord_hris_payroll_component',null, Filters, column);		
	if(searchITCheck !=null)
	{
		ITId = searchITCheck[0].getValue('internalid');	
	}//End if(searchNetCheck !=null)
	return ITId;
	} catch (e) {
		logErrorToCustomRecord('searchITId', e);
		throw e;
	}
}

function searchLoanId(i_paygroup_earn) {
	try {
		var LoanID = [];
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'is',i_paygroup_earn));
	Filters.push(new nlobjSearchFilter('custrecord_hris__sequence_no_', null, 'equalto',62));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var column = new Array();
	column.push(new nlobjSearchColumn('internalid'));	
	var searchLoanCheck= nlapiSearchRecord('customrecord_hris_payroll_component',null, Filters, column);		
	if(searchLoanCheck)
    

	{
		for(var index = 0; index < searchLoanCheck.length; index++){
			LoanID.push(searchLoanCheck[index].getValue('internalid'));
		}
			
	}//End if(searchNetCheck !=null)
		nlapiLogExecution('DEBUG', 'LoanID', LoanID);
	return LoanID;
	//===Ends Here
	} catch (e) {
		logErrorToCustomRecord('searchLoanId', e);
		throw e;
	}
}

function searchPTId(i_paygroup_earn) {
	try {
		var PTID;
	var Filters = new Array();
	//Filters.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'is',i_pay_group));
	Filters.push(new nlobjSearchFilter('custrecord_hris__sequence_no_', null, 'equalto',55));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var column = new Array();
	column.push(new nlobjSearchColumn('internalid'));	
	var searchPTCheck= nlapiSearchRecord('customrecord_hris_payroll_component',null, Filters, column);		
	if(searchPTCheck !=null)
	{
		PTID = searchPTCheck[0].getValue('internalid');	
	}//End if(searchNetCheck !=null)
	return PTID;
	} catch (e) {
		logErrorToCustomRecord('searchPTId', e);
		throw e;
	}
}

function searchDedcCompType() {
	try {
		var DeduType;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_com_sequence_no', null, 'equalto',2));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var column = new Array();
	column.push(new nlobjSearchColumn('internalid'));	
	var searchDEDCTypeCheck= nlapiSearchRecord('customrecord_hris_component_type',null, Filters, column);		
	if(searchDEDCTypeCheck !=null)
	{
		DeduType = searchDEDCTypeCheck[0].getValue('internalid');	
	}//End if(searchDEDCTypeCheck !=null)
	return DeduType;
	} catch (e) {
		logErrorToCustomRecord('searchDedcCompType', e);
		throw e;
	}
}

function searchEarnCompType() {
	try {
		var EarnType;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_com_sequence_no', null, 'equalto',1));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var column = new Array();
	column.push(new nlobjSearchColumn('internalid'));	
	var searchEarnTypeCheck= nlapiSearchRecord('customrecord_hris_component_type',null, Filters, column);		
	if(searchEarnTypeCheck !=null)
	{
		EarnType = searchEarnTypeCheck[0].getValue('internalid');	
		nlapiLogExecution('AUDIT','EarnType',EarnType);
	}//End if(searchDEDCTypeCheck !=null)
	return EarnType;
	} catch (e) {
		logErrorToCustomRecord('searchEarnCompType', e);
		throw e;
	}
}

function get_Prev_month_component_Value(i_emp_Id,i_paygroup_earn,i_Earn_Compnent_Value,i_current_monthly,Increment_Month) {
	try {
		var prev_gross_earn=0.00;
	var Prev_Gross_Amt=0.00;
	var prev_comp ;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_employee', null, 'is',i_emp_Id));
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_pay_group', null, 'is',i_paygroup_earn));
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_payroll_compone', null, 'is',i_Earn_Compnent_Value));
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_pay_month', null, 'is',Increment_Month));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var column = new Array();
	column.push(new nlobjSearchColumn('internalid'));
	column.push(new nlobjSearchColumn('custrecord_hris_pay_proc_actual_gross_ea'));
	column.push(new nlobjSearchColumn('custrecord_hris_pay_proc_gross_earning'));
	column.push(new nlobjSearchColumn('custrecord_hris_pay_proc_payroll_compone'));
	var searchPrevRec= nlapiSearchRecord('customrecord_hris_pay_process',null, Filters, column);	
	if (searchPrevRec != null) 
	{
		prev_gross_earn = searchPrevRec[0].getValue('custrecord_hris_pay_proc_gross_earning');
		Prev_Gross_Amt = searchPrevRec[0].getValue('custrecord_hris_pay_proc_actual_gross_ea');	
		prev_comp = searchPrevRec[0].getValue('custrecord_hris_pay_proc_payroll_compone');		
	}//End if (searchPrevRec != null) 
	nlapiLogExecution('DEBUG', 'Prev_month_component_Value', Prev_Gross_Amt +'#'+ prev_gross_earn +'#'+prev_comp);
	return Prev_Gross_Amt +'#'+ prev_gross_earn +'#'+prev_comp ;
	} catch (e) {
		logErrorToCustomRecord('get_Prev_month_component_Value', e);
		throw e;
	}
}//End function get_Prev_month_component_Value()

function CalcuPFgross(i_paygroup_earn,Actual_gross_pay)//,i_Earn_Compnent_Txt,Actual_gross_pay)
{
	try {
		var PFGrossTotal =0.00;
		var Filters = new Array();
		Filters.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'is',i_paygroup_earn));	
		Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
		var Column = new Array();
		Column.push(new nlobjSearchColumn('internalid'));
		Column.push(new nlobjSearchColumn('custrecord_hris_pf_ind'));	
		var searchPFGrossValue= nlapiSearchRecord('customrecord_hris_payroll_component',null, Filters, Column);	
		if(searchPFGrossValue!=null)
		{
			for(pcheck=0;pcheck<searchPFGrossValue.length;pcheck++)
			{
				var PFCheck = searchPFGrossValue[pcheck].getValue('custrecord_hris_pf_ind');
				if(PFCheck!='undefined' && PFCheck!='' && PFCheck!=null)
				{
				if(PFCheck=='T' )
					{
						PFGrossTotal = parseFloat(Actual_gross_pay)// + parseFloat(PFGrossTotal);
					}	
				}						
			}		
		}//End if(searchRoffValue!=null)
		return PFGrossTotal;
	} catch (e) {
		logErrorToCustomRecord('CalcuPFgross', e);
		throw e;
	}
}

function CalcuESICgross(i_paygroup_earn,Actual_gross_pay) {
	try {
		var ESICGrossTotal =0.00;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'is',i_paygroup_earn));	
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var Column = new Array();
	Column.push(new nlobjSearchColumn('internalid'));	
	Column.push(new nlobjSearchColumn('custrecord_hris_esic_ind'));
	var searchESICGrossValue= nlapiSearchRecord('customrecord_hris_payroll_component',null, Filters, Column);	
	if(searchESICGrossValue!=null)
	{
		for(pcheck=0;pcheck<searchESICGrossValue.length;pcheck++)
		{
			var ESICCheck = searchESICGrossValue[pcheck].getValue('custrecord_hris_esic_ind');
			if(ESICCheck!='undefined' && ESICCheck!='' && ESICCheck!=null)
			{
			if(ESICCheck=='T' )
				{
					ESICGrossTotal = parseFloat(Actual_gross_pay)// + parseFloat(PFGrossTotal);
				}	
			}						
		}		
	}//End if(searchRoffValue!=null)
	return ESICGrossTotal;
	} catch (e) {
		logErrorToCustomRecord('CalcuESICgross', e);
		throw e;
	}
}

function CalcuSSGross(i_paygroup_earn,Actual_gross_pay) {
	try {
		var SSGrossTotal =0.00;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'is',i_paygroup_earn));	
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var Column = new Array();
	Column.push(new nlobjSearchColumn('internalid'));	
	Column.push(new nlobjSearchColumn('custrecord_hris_ss'));
	var searchSSGrossValue= nlapiSearchRecord('customrecord_hris_payroll_component',null, Filters, Column);	
	if(searchSSGrossValue!=null)
	{
		for(sscheck=0;sscheck<searchSSGrossValue.length;sscheck++)
		{
			var SSCheck = searchSSGrossValue[sscheck].getValue('custrecord_hris_ss');
			if(SSCheck!='undefined' && SSCheck!='' && SSCheck!=null)
			{
				if(SSCheck=='T' )
				{
						SSGrossTotal = parseFloat(Actual_gross_pay)
				}	
			}						
		}		
	}//End if(searchRoffValue!=null)
	return SSGrossTotal;
	} catch (e) {
		logErrorToCustomRecord('CalcuSSGross', e);
		throw e;
	}
}

function CalcuITGross(i_paygroup_earn,Actual_gross_pay) {
	try {
		var SSGrossTotal =0.00;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'is',i_paygroup_earn));	
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var Column = new Array();
	Column.push(new nlobjSearchColumn('internalid'));	
	Column.push(new nlobjSearchColumn('custrecord_hris_ss'));
	var searchSSGrossValue= nlapiSearchRecord('customrecord_hris_payroll_component',null, Filters, Column);	
	if(searchSSGrossValue!=null)
	{
		for(sscheck=0;sscheck<searchSSGrossValue.length;sscheck++)
		{
			var SSCheck = searchSSGrossValue[0].getValue('custrecord_hris_ss');
			if(SSCheck!='undefined' && SSCheck!='' && SSCheck!=null)
			{
				if(SSCheck=='T' )
				{
						SSGrossTotal = parseFloat(Actual_gross_pay)
				}	
			}						
		}		
	}//End if(searchRoffValue!=null)
	return SSGrossTotal;
	} catch (e) {
		logErrorToCustomRecord('CalcuITGross', e);
		throw e;
	}
}

function CalcuPTgross(i_paygroup_earn,Actual_gross_pay) {
	try {
		var PTGrossTotal =0.00;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'is',i_paygroup_earn));
	Filters.push(new nlobjSearchFilter('custrecord_hris_pt_ind', null, 'is','T'));		
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var Column = new Array();
	Column.push(new nlobjSearchColumn('internalid'));	
	Column.push(new nlobjSearchColumn('custrecord_hris_pt_ind'));
	var searchPFGrossValue= nlapiSearchRecord('customrecord_hris_payroll_component',null, Filters, Column);	
	if(searchPFGrossValue!=null)
	{
		for(pcheck=0;pcheck<searchPFGrossValue.length;pcheck++)
		{
			var PTCheck = searchPFGrossValue[0].getValue('custrecord_hris_pt_ind');
				{
					PTGrossTotal = parseFloat(Actual_gross_pay)// + parseFloat(PFGrossTotal);
				}	
		}		
	}//End if(searchRoffValue!=null)
	return PTGrossTotal;
	} catch (e) {
		logErrorToCustomRecord('CalcuPTgross', e);
		throw e;
	}
}

function getEmployeeId(i_entity) {
	try {
		var Emp_internalId;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('entityid', null, 'is', i_entity.toString()));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var Column = new Array();
	Column.push(new nlobjSearchColumn('internalid'));
	var searchEmployee= nlapiSearchRecord('employee',null, Filters, Column);	
	if (searchEmployee != null) 
	{
		Emp_internalId = searchEmployee[0].getValue('internalid');		
	}//End if (searchEmployee != null) 
	return Emp_internalId;
	} catch (e) {
		logErrorToCustomRecord('getEmployeeId', e);
		throw e;
	}
}

function checkESICApplicable(i_entityId) {
	try {
		var ESICCheck;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('internalid', null, 'anyof', i_entityId));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var Column = new Array();
	Column.push(new nlobjSearchColumn('internalid'));
	Column.push(new nlobjSearchColumn('custentity_hris_isesiapplicable'));
	var searchESICCheckEmp= nlapiSearchRecord('employee',null, Filters, Column);	
	if (searchESICCheckEmp != null) 
	{
		ESICCheck = searchESICCheckEmp[0].getValue('custentity_hris_isesiapplicable');		
	}//End if (searchESICCheckEmp != null) 
	return ESICCheck;
	} catch (e) {
		logErrorToCustomRecord('checkESICApplicable', e);
		throw e;
	}
}

function CheckPFApplicable(i_entityId) {
	try {
		var PFCheck;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('internalid', null, 'anyof', i_entityId));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var Column = new Array();
	Column.push(new nlobjSearchColumn('internalid'));
	Column.push(new nlobjSearchColumn('custentity_hris_pfapplicable'));
	var searchPFCheckEmp= nlapiSearchRecord('employee',null, Filters, Column);	
	if (searchPFCheckEmp != null) 
	{
		PFCheck = searchPFCheckEmp[0].getValue('custentity_hris_pfapplicable');		
	}//End if (searchESICCheckEmp != null) 
	return PFCheck;
	} catch (e) {
		logErrorToCustomRecord('CheckPFApplicable', e);
		throw e;
	}
}

function getPaidDays(i_emp_name,wage_periodId,GetMonthDays,GetYear) {
	try {
		var Paid_Days=0.00;
	var totalLOP = 0.00;
	var Filters = new Array();
	nlapiLogExecution('debug','getPaidDays Employee name',i_emp_name);
	nlapiLogExecution('debug','getPaidDays wageperiod',wage_periodId);
	nlapiLogExecution('debug','getPaidDaysyear',GetYear);
	Filters.push(new nlobjSearchFilter('custrecord_hris_ule_employee_name', null, 'is',i_emp_name));
	Filters.push(new nlobjSearchFilter('custrecord_hris_ule_month', null, 'is', wage_periodId));
	Filters.push(new nlobjSearchFilter('custrecord_hris_ule_year', null, 'is', GetYear));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var Column = new Array();
	Column.push(new nlobjSearchColumn('internalid'));
	Column.push(new nlobjSearchColumn('custrecord_hris_ule_noof_days'));	
	var searchPaidDays= nlapiSearchRecord('customrecord_hris_unpaid_leave_entry',null, Filters, Column);	
	if (searchPaidDays != null) 
	{
		for(pd=0;pd<searchPaidDays.length;pd++)
		{
			var LOPDAys = searchPaidDays[pd].getValue('custrecord_hris_ule_noof_days') || 0;	
			totalLOP = parseFloat(totalLOP)+ parseFloat(LOPDAys);	
			
		}
		
		Paid_Days = parseFloat(GetMonthDays) - parseFloat(totalLOP);// Change GetMonthDays to 30
	}
	else
	{
		Paid_Days = parseFloat(GetMonthDays); 		
	}
	return Paid_Days
	} catch (e) {
		logErrorToCustomRecord('getPaidDays', e);
		throw e;
	}
}

function getLOPDaysFinal(i_emp_name,wage_periodId,GetYear) {
	try {
		var LOPFINALDAYS = 0.00;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_ule_employee_name', null, 'is',i_emp_name));
	Filters.push(new nlobjSearchFilter('custrecord_hris_ule_month', null, 'is', wage_periodId));
	Filters.push(new nlobjSearchFilter('custrecord_hris_ule_year', null, 'is', GetYear));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var Column = new Array();
	Column.push(new nlobjSearchColumn('internalid'));
	Column.push(new nlobjSearchColumn('custrecord_hris_ule_noof_days'));	
	var searchLOPDays= nlapiSearchRecord('customrecord_hris_unpaid_leave_entry',null, Filters, Column);	
	if (searchLOPDays != null) 
	{
		for(lopf=0;lopf<searchLOPDays.length;lopf++)
		{
			var LOPDaysFinal = searchLOPDays[lopf].getValue('custrecord_hris_ule_noof_days') || 0;
			LOPFINALDAYS = parseFloat(LOPDaysFinal)+ parseFloat(LOPFINALDAYS)
		}
	}//End if (searchLOPDays != null)
	else
	{
		LOPFINALDAYS=0.00;
	}
	return LOPFINALDAYS;
	} catch (e) {
		logErrorToCustomRecord('getLOPDaysFinal', e);
		throw e;
	}
}

function getWagePeriodYear(i_pay_group,i_wage_month) {
	try {
		var wpYear;
	var wpYearTxt;
	var WEndDate;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_group', null, 'is',i_pay_group));
	nlapiLogExecution('DEBUG', 'i_wage_month:::::::::::::::::', i_wage_month)
	Filters.push(new nlobjSearchFilter('custrecord_hris_month', null, 'is', i_wage_month));	
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var Column = new Array();
	Column.push(new nlobjSearchColumn('internalid'));
	Column.push(new nlobjSearchColumn('custrecord_hris_year'));	
	Column.push(new nlobjSearchColumn('custrecord_hris_end_date'));//End date
	var searchPaidDays= nlapiSearchRecord('customrecord_hris_wage_period_details',null, Filters, Column);	
	if (searchPaidDays != null) 
	{
		wpYear = searchPaidDays[0].getValue('custrecord_hris_year');	
		wpYearTxt = searchPaidDays[0].getText('custrecord_hris_year');
		WEndDate = 	searchPaidDays[0].getValue('custrecord_hris_end_date');
	}
	
	return wpYear +"#"+ wpYearTxt  +"#"+ WEndDate
	} catch (e) {
		logErrorToCustomRecord('getWagePeriodYear', e);
		throw e;
	}
}

function searchLoanEntry(i_emp_Id,wage_Period,GetYear) {
	try {
		var GetYear = GetYear;
	nlapiLogExecution('DEBUG', 'GET YEaR', GetYear)
	nlapiLogExecution('DEBUG', 'GET YEaR i_emp_Id', i_emp_Id)
	var Loan_Type = [];
	var Loan_Record_Arr = [];
    var Loan_Child_RecordArr =[];
	var Loan_Comp_Arr = [];
	var total_loanAmt=0.00;
	var Emi_Amount = [];
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_loan_emp_name', null, 'is',i_emp_Id));	
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var Column = new Array();
	Column.push(new nlobjSearchColumn('internalid'));
	Column.push(new nlobjSearchColumn('custrecord_hris_loan_emi_amount'));//Loan Amt
	Column.push(new nlobjSearchColumn('custrecord_hris_loan_loan_type'));//Loan Type
	Column.push(new nlobjSearchColumn('custrecord_hris_loan_emistartmonth'));//Start Month
	Column.push(new nlobjSearchColumn('custrecord_hris_loan_emi_end_date'));//End Month

   Column.push(new nlobjSearchColumn("custrecord_hris_loan_alloc_startdate","CUSTRECORD_HRIS_LOAN_ALLOC_LINK")); 
   Column.push(new nlobjSearchColumn("custrecord_hris_loan_alloc_installments","CUSTRECORD_HRIS_LOAN_ALLOC_LINK")); 
   Column.push(new nlobjSearchColumn("custrecord_hris_loan_alloc_enddate","CUSTRECORD_HRIS_LOAN_ALLOC_LINK")); 
   Column.push(new nlobjSearchColumn("custrecord_hris_loan_alloc_paidamount","CUSTRECORD_HRIS_LOAN_ALLOC_LINK"));
Column.push(new nlobjSearchColumn("internalid","CUSTRECORD_HRIS_LOAN_ALLOC_LINK"));	
   var searchLoanRec= nlapiSearchRecord('customrecord_hris_empchange_loan_applicn',null, Filters, Column);
	if (searchLoanRec != null) 
	{
		for(var LA=0; LA<searchLoanRec.length;LA++)
		{
			// Changed For loan child record
			//var S_date =searchLoanRec[LA].getValue('custrecord_hris_loan_emistartmonth');	
           nlapiLogExecution('AUDIT','Inside Loan')
            var S_date = searchLoanRec[LA].getValue('custrecord_hris_loan_alloc_startdate','CUSTRECORD_HRIS_LOAN_ALLOC_LINK')||'';
            nlapiLogExecution('DEBUG', 'S_date', S_date);
            
			
			
			var loanType = searchLoanRec[LA].getValue('custrecord_hris_loan_loan_type');
			var loan_comp = nlapiLookupField('customrecord_hris_loan_master', loanType, 'custrecord_hris_loan_component')
			nlapiLogExecution('DEBUG', 'loan_comp', loan_comp);
            var loanchildid =searchLoanRec[LA].getValue("internalid","CUSTRECORD_HRIS_LOAN_ALLOC_LINK");
			//var E_date =searchLoanRec[LA].getValue('custrecord_hris_loan_emi_end_date');
            var E_date =searchLoanRec[LA].getValue('custrecord_hris_loan_alloc_enddate','CUSTRECORD_HRIS_LOAN_ALLOC_LINK')||'';

            nlapiLogExecution('DEBUG', 'E_date', E_date);		
			if (S_date !== '' && E_date !== '') {
			var str_S_date = nlapiStringToDate(S_date);
			var SMonth = str_S_date.getMonth();
			var s_yr = str_S_date.getFullYear();
			var str_E_date = nlapiStringToDate(E_date);
			var EMonth = str_E_date.getMonth()+2;
			var e_yr = str_E_date.getFullYear();
            nlapiLogExecution('DEBUG', 's_yr----e_yr', s_yr+" - " +e_yr)
			var wagePeriodYear = nlapiLookupField('customlist_hris_year_master', GetYear, 'name');
			nlapiLogExecution('DEBUG', 'GET YEAR wagePeriodYear', wagePeriodYear)
			nlapiLogExecution('DEBUG', 'GET YEAR wage_Period', wage_Period)
			
			// for month it will change by florence
			var wage_Period1 = getNormalMonth(wage_Period);
			//var wageDate = new Date(wagePeriodYear, wage_Period);
			var wageDate = new Date(wagePeriodYear, wage_Period1);
			nlapiLogExecution('DEBUG', 'Loan wageDate', wageDate)
			var emiStartDate = new Date(s_yr, SMonth);
			nlapiLogExecution('DEBUG', 'emiStartDate',emiStartDate)
			var emiENDDate = new Date(e_yr, EMonth);
			nlapiLogExecution('DEBUG', 'emiENDDate',emiENDDate)
			var emiSAMEMonth = new Date(s_yr, SMonth +2);
			if ((wageDate > emiStartDate) && (wageDate < emiENDDate)){
					nlapiLogExecution('DEBUG', 'SMonth Loan', SMonth)
					nlapiLogExecution('DEBUG', 'EMonth Loan', EMonth)
					nlapiLogExecution('DEBUG', 'wage_Period Loan', wage_Period)
					nlapiLogExecution('DEBUG', 'Inside condition SMonth <= wage_Period && EMonth>= wage_Period')
				Loan_Record_Arr.push(searchLoanRec[LA].getValue('internalid'));
				Loan_Comp_Arr.push(loan_comp)
               // Loan_Child_RecordArr.push(searchLoanRec[LA].getValue("internalid","CUSTRECORD_HRIS_LOAN_ALLOC_LINK"));
				nlapiLogExecution('DEBUG', 'loan record ID in if condition', searchLoanRec[LA].getValue('internalid'))
				Loan_Child_RecordArr.push(loanchildid);
				}else if((wageDate > emiStartDate) && (wageDate < emiSAMEMonth)){
					Loan_Record_Arr.push(searchLoanRec[LA].getValue('internalid'));
				Loan_Comp_Arr.push(loan_comp)
                Loan_Child_RecordArr.push(loanchildid);
				nlapiLogExecution('DEBUG', 'loan record ID in else condition', searchLoanRec[LA].getValue('internalid'))
				}
              }
		}		
	         return Loan_Record_Arr +'#'+Loan_Comp_Arr +'#'+Loan_Child_RecordArr;
	}
	} catch (e) {
		logErrorToCustomRecord('searchLoanEntry', e);
		throw e;
	}
}

function valueCheck(value) {
	try {
		if(value==Infinity||value==-Infinity||isNaN(value) || value=='' || value==undefined || value==null || value.toString()=='NaN')	
    {        
		return 0.00;
    }
	else
	{
		return value
	}
	} catch (e) {
		logErrorToCustomRecord('valueCheck', e);
		throw e;
	}
}

function SearchSSandITYr(GetYear) {
	try {
		var ssAndITStartMonth;
	var ssAndITEndMonth;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_ssit_start_yr', null, 'is',GetYear));	
	var Column = new Array();
	Column.push(new nlobjSearchColumn('custrecord_hris_ssit_startmonth'));
	Column.push(new nlobjSearchColumn('custrecord_hris_ssit_end_month'));
	var searchSSandIT= nlapiSearchRecord('customrecord_hris_ss_financial_year',null, Filters, Column);
	if (searchSSandIT != null) 
	{
		ssAndITStartMonth = searchSSandIT[0].getValue('custrecord_hris_ssit_startmonth');
		
		ssAndITEndMonth = searchSSandIT[0].getValue('custrecord_hris_ssit_end_month');
	}
	return ssAndITStartMonth +"#"+ ssAndITEndMonth
	} catch (e) {
		logErrorToCustomRecord('SearchSSandITYr', e);
		throw e;
	}
}

function searchSSCompCreated(wEndDate, i_entityId,i_emp_name_tx,i_EmpCode,process_type,i_paygroup_earn,i_emp_name,i_emp_dept,wage_Period,i_emp_company,Component_type,SSID,SSEmployeeConti,SSEmployerContri,SSGrossTotal,LOPDaysFinal,paid_days,GetYear,ESICApplicable,PTLoc) {
	try {
		//var Filters = new Array();
	//Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_employee', null, 'is',i_entityId));
	//Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_payroll_compone', null, 'is',SSID));
	//Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_year', null, 'is',GetYear));	
	////Filters.push(new nlobjSearchFilter('custrecord_hris_pay_proc_pay_month', null, 'is',wage_Period));	
	//var Column = new Array();
	//Column.push(new nlobjSearchColumn('internalid'));	
	//var searchSSInPayprocess= nlapiSearchRecord('customrecord_hris_pay_process',null, Filters, Column);
	//if(searchSSInPayprocess!=null)
	//{
	//	var intRecid = searchSSInPayprocess[0].getValue('internalid')
	//	var copyId = nlapiCopyRecord('customrecord_hris_pay_process',intRecid);	
	//	copyId.setFieldValue('custrecord_hris_pay_proc_pay_month',wage_Period);
	//	copyId.setFieldValue('custrecord_hris_pay_proc_paid_days',paid_days);
	//	copyId.setFieldValue('custrecord_hris_pay_proc_lop_days',LOPDaysFinal);
	//	copyId.setFieldValue('custrecord_hris_pay_proc_esic_check',ESICApplicable);
	//	copyId.setFieldValue('custrecord_hris_pay_proc_pt_location',PTLoc);
	//	var submitRec = nlapiSubmitRecord(copyId,false,false)
	//}
	//else
	{
		createSSComp(wEndDate, i_entityId,i_emp_name_tx,i_EmpCode,process_type,i_paygroup_earn,i_emp_name,i_emp_dept,wage_Period,i_emp_company,Component_type,SSID,SSEmployeeConti,SSEmployerContri,SSGrossTotal,LOPDaysFinal,paid_days,GetYear,ESICApplicable,PTLoc,empsubdepartment,emplocation)
	}
	} catch (e) {
		logErrorToCustomRecord('searchSSCompCreated', e);
		throw e;
	}
}

function createSSComp(wEndDate, i_entityId,i_emp_name_tx,i_EmpCode,process_type,i_paygroup_earn,i_emp_name,i_emp_dept,wage_Period,i_emp_company,Component_type,SSID,SSEmployeeConti,SSEmployerContri,SSGrossTotal,LOPDaysFinal,paid_days,GetYear,ESICApplicable,PTLoc,empsubdepartment,emplocation,OTHoursfinal) {
	try {
		var i_Earn_Compnent = SSID;
	var account_code = nlapiLookupField('customrecord_hris_payroll_component',i_Earn_Compnent,'custrecord_hris_account_name');			
	var emp_name1 = nlapiLookupField('employee', i_entityId,'entityid');
	var payprocess = nlapiCreateRecord('customrecord_hris_pay_process');
	payprocess.setFieldValue('custrecord_hris_pay_proc_employee', i_entityId);
	payprocess.setFieldValue('custrecord_hris_pay_proc_employee_code',i_EmpCode);
	payprocess.setFieldValue('custrecord_hris_pay_proc_process_type', process_type);
	payprocess.setFieldValue('custrecord_hris_pay_proc_pay_group', i_paygroup_earn);
	payprocess.setFieldValue('custrecord_hris_pay_proc_employee_name', i_emp_name_tx);
	payprocess.setFieldValue('custrecord_hris_pay_proc_department', i_emp_dept);
	payprocess.setFieldValue('custrecord_hris_pay_proc_subdept',empsubdepartment);
    // payprocess.setFieldValue('custrecord_hris_pay_proc_location',emplocation);
	if (i_emp_company != 'undefined' && i_emp_company!='' && i_emp_company!='')
	{
	payprocess.setFieldValue('custrecord_hris_pay_proc_company_name', i_emp_company);
	}
	payprocess.setFieldValue('custrecord_hris_pay_proc_pay_month', wage_Period);
	payprocess.setFieldValue('custrecord_hris_pay_proc_pay_date', wEndDate);
	payprocess.setFieldValue('custrecord_hris_pay_proc_year', GetYear);
	payprocess.setFieldValue('custrecord_hris_pay_proc_payroll_compone', i_Earn_Compnent);
	//payprocess.setFieldValue('custrecord_hris_pay_proc_account_code', account_code);

	// Florence componet Deduction 1
	//payprocess.setFieldValue('custrecord_hris_pay_proc_component_type',2);//Component_type	
	payprocess.setFieldValue('custrecord_hris_pay_proc_component_type',2);
	payprocess.setFieldValue('custrecord_hris_pay_proc_ss_gross', SSGrossTotal);//ESIC Gross Total
	payprocess.setFieldValue('custrecord_hris_pay_proc_paid_days',paid_days);
	payprocess.setFieldValue('custrecord_hris_pay_proc_esic_check',ESICApplicable);
	payprocess.setFieldValue('custrecord_hris_pay_proc_lop_days_final',LOPDaysFinal);
	payprocess.setFieldValue('custrecord_hris_pay_proc_pt_location',PTLoc);
	payprocess.setFieldValue('custrecord_hris_pay_proc_social_security', SSEmployeeConti);// ESIC emp contri
	payprocess.setFieldValue('custrecord_hris_pay_proc_socialsecurity', SSEmployerContri);//ESIC employer contri
	payprocess.setFieldValue('custrecord_hris_pay_proc_actual_salary', SSEmployeeConti);	
	payprocess.setFieldValue('custrecord_hris_pay_proc_gross_deduction', SSEmployeeConti.toFixed(2));
	payprocess.setFieldValue('custrecord_hris_pay_proc_actual_gross_de', SSEmployeeConti.toFixed(2));			
	payprocess.setFieldValue('custrecord_hris_pay_proc_value', SSEmployeeConti);
	payprocess.setFieldValue('custrecord_hris_pay_proc_othours',OTHoursfinal);
	var payprocessId = nlapiSubmitRecord(payprocess, false, false);
	return payprocessId;
	} catch (e) {
		logErrorToCustomRecord('createSSComp', e);
		throw e;
	}
}

function searchITCompCreated(wEndDate, i_entityId,i_emp_name_tx,i_EmpCode,process_type,i_paygroup_earn,i_emp_name,i_emp_dept,wage_Period,i_emp_company,Component_type,ITID,ITMonthlyCalc,ITGrossTotal,LOPDaysFinal,paid_days,GetYear,ESICApplicable,PTLoc,empsubdepartment,emplocation,OTHoursfinal) {
	try {
		var i_Earn_Compnent = ITID;
	var account_code = nlapiLookupField('customrecord_hris_payroll_component',i_Earn_Compnent,'custrecord_hris_account_name');			
	var emp_name1 = nlapiLookupField('employee', i_entityId,'entityid');
	var payprocess = nlapiCreateRecord('customrecord_hris_pay_process');
	payprocess.setFieldValue('custrecord_hris_pay_proc_employee', i_entityId);
	payprocess.setFieldValue('custrecord_hris_pay_proc_employee_code',i_EmpCode);
	payprocess.setFieldValue('custrecord_hris_pay_proc_process_type', process_type);
	payprocess.setFieldValue('custrecord_hris_pay_proc_pay_group', i_paygroup_earn);
	payprocess.setFieldValue('custrecord_hris_pay_proc_employee_name', i_emp_name_tx);
	payprocess.setFieldValue('custrecord_hris_pay_proc_department', i_emp_dept);
	payprocess.setFieldValue('custrecord_hris_pay_proc_subdept',empsubdepartment);
    // payprocess.setFieldValue('custrecord_hris_pay_proc_location',emplocation);
	if (i_emp_company != 'undefined' && i_emp_company!='' && i_emp_company!='')
	{
	payprocess.setFieldValue('custrecord_hris_pay_proc_company_name', i_emp_company);
	}
	payprocess.setFieldValue('custrecord_hris_pay_proc_pay_month', wage_Period);
	payprocess.setFieldValue('custrecord_hris_pay_proc_pay_date', wEndDate);
	payprocess.setFieldValue('custrecord_hris_pay_proc_year', GetYear);
	payprocess.setFieldValue('custrecord_hris_pay_proc_payroll_compone', i_Earn_Compnent);
	//payprocess.setFieldValue('custrecord_hris_pay_proc_account_code', account_code);
	// Florence Deduction 1
	//payprocess.setFieldValue('custrecord_hris_pay_proc_component_type',2);
	payprocess.setFieldValue('custrecord_hris_pay_proc_component_type',2);//Component_type	
	payprocess.setFieldValue('custrecord_hris_pay_proc_it_gross', ITGrossTotal.toFixed(2));//ESIC Gross Total
	payprocess.setFieldValue('custrecord_hris_pay_proc_paid_days',paid_days);
	payprocess.setFieldValue('custrecord_hris_pay_proc_esic_check',ESICApplicable);
	payprocess.setFieldValue('custrecord_hris_pay_proc_lop_days_final',LOPDaysFinal);
	payprocess.setFieldValue('custrecord_hris_pay_proc_pt_location',PTLoc);
	payprocess.setFieldValue('custrecord_hris_pay_proc_it_monthly', ITMonthlyCalc.toFixed(2));// ESIC emp contri	
	payprocess.setFieldValue('custrecord_hris_pay_proc_actual_salary', ITMonthlyCalc.toFixed(2));	
	payprocess.setFieldValue('custrecord_hris_pay_proc_gross_deduction', ITMonthlyCalc.toFixed(2));	//	
	payprocess.setFieldValue('custrecord_hris_pay_proc_actual_gross_de', ITMonthlyCalc.toFixed(2));			
	payprocess.setFieldValue('custrecord_hris_pay_proc_value', ITMonthlyCalc.toFixed(2));
	payprocess.setFieldValue('custrecord_hris_pay_proc_othours',OTHoursfinal);
	var payprocessId = nlapiSubmitRecord(payprocess, false, false);
	return payprocessId
	} catch (e) {
		logErrorToCustomRecord('searchITCompCreated', e);
		throw e;
	}
}

function calulateITMonthlyValue(ITGrossForYr) {
	try {
		var remainITGross = 0.00;
		var calcITAmt = 0.00;
		var finalCal = 0.00;
		var Filters = new Array();		
		var Column = new Array();
		Column.push(new nlobjSearchColumn('internalid'));
		Column.push(new nlobjSearchColumn('custrecord_hris_income_tax_salary_slab'));
		Column.push(new nlobjSearchColumn('custrecord_hris_income_tax_deduc_perce'));	
		var searchITMonthlyValue = nlapiSearchRecord('customrecord_hris_income_tax_slab', null, Filters, Column);
		if (searchITMonthlyValue != null) {
			for (var IT = 0; IT < searchITMonthlyValue.length; IT++) {
				var ITSalSlab = searchITMonthlyValue[IT].getValue('custrecord_hris_income_tax_salary_slab');
				if (ITGrossForYr > ITSalSlab) {
					remainITGross = parseFloat(ITGrossForYr) - parseFloat(ITSalSlab);
					var ITSlabPerc = searchITMonthlyValue[IT].getValue('custrecord_hris_income_tax_deduc_perce');
					ITSlabPerc = parseFloat(ITSlabPerc);
					if (ITSlabPerc >= 20) {
						ITSalSlab = remainITGross;
					}
					calcITAmt = (parseFloat(ITSalSlab) * parseFloat(ITSlabPerc)) / 100;
					ITGrossForYr = remainITGross;
					finalCal = parseFloat(finalCal) + parseFloat(calcITAmt);
				} else {
					remainITGross = parseFloat(ITGrossForYr);
					var ITSlabPerc = searchITMonthlyValue[IT].getValue('custrecord_hris_income_tax_deduc_perce');
					ITSlabPerc = parseFloat(ITSlabPerc);
					if (ITSlabPerc >= 20) {
						ITGrossForYr = remainITGross;
					}
					calcITAmt = (parseFloat(ITGrossForYr) * parseFloat(ITSlabPerc)) / 100;
					ITGrossForYr = remainITGross;
					finalCal = parseFloat(finalCal) + parseFloat(calcITAmt);
					break;
				}
			}
		}
		return finalCal;
	} catch (e) {
		logErrorToCustomRecord('calulateITMonthlyValue', e);
		throw e;
	}
}