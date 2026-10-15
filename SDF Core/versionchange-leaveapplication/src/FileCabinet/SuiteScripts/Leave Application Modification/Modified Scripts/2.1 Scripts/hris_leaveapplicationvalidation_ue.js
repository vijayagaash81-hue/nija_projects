/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
let QUERY;
define(['N/record', 'N/ui/serverWidget', 'N/search', 'N/query','./moment.js', 'N/runtime','N/format'], function (record, serverWidget, search, query,moment,runtime,format) {
    QUERY = query;
    function beforeLoad(scriptContext) {
        // Leave Cancel / Leave Settlement  Before Load
        let form = scriptContext.form;
        form.clientScriptModulePath = './hris_leave_cancel_cs.js';
        let currentrecord = scriptContext.newRecord;
        let Leaverecordid = currentrecord.id;
        log.debug(' Leaverecordid',  Leaverecordid);
        let currentUser = runtime.getCurrentUser();
        let userRole = currentUser.role;
        log.debug('Current User Role', userRole);
        let user = runtime.getCurrentUser().id;
        let approvalstatus = currentrecord.getValue({
            fieldId: 'custrecord_hris_lve_hrmsapprovalstatus'
        });
        log.debug('Approval Status',approvalstatus);
        let cancelstatus = currentrecord.getValue({
            fieldId: 'custrecord_hris_lve_cancel_leavestatus'
        })||1;
        log.debug('Cancel Status',cancelstatus);
        let cancelcheck = currentrecord.getValue({
            fieldId: 'custrecord_hris_lve_cancellation'
        });
        let EmpName = currentrecord.getValue('custrecord_hris_lve_employeename');
        let Requestor = currentrecord.getValue('custrecordhris_lve_requestor');
              log.debug('Cancel Check',cancelcheck);
              let settlecheck =currentrecord.getValue({
                fieldId:'custrecord_hris_lve_leavesettlement'
              });
              log.debug('Settle check',settlecheck);
              let settlementrefid=currentrecord.getValue({
                fieldId:'custrecord_hris_lve_settlerefno'
              })||'';
              let settlementid=currentrecord.getValue({
                fieldId:'custrecord_hris_lve_settlement_refno'
              })||'';
              
              let workresumecheck = currentrecord.getValue({
                fieldId: 'custrecord_hris_lve_workresume'
            });
                  log.debug('workresumecheck',workresumecheck);     
        if ( Leaverecordid) {
            let LeaveRecord = record.load({
                type: 'customrecord_hris_leaveapplication',
                id:Leaverecordid,
                isDynamic: true
            });

        //  if (scriptContext.type == 'view' && approvalstatus == 2 && cancelstatus == 1) {    
            if (scriptContext.type == 'view' && approvalstatus == 2 && cancelcheck == false && settlecheck==false && workresumecheck == false) {                 
                form.addButton({
                    id: 'custpage_cancel',
                    label: 'Leavecancel',
                    functionName: 'Cancelclick()' //upload CS Function name
                });
            }

           /*  if (scriptContext.type == 'view' && approvalstatus == 2 && cancelcheck == false && settlecheck==true && settlementrefid==''&& (userRole==1000 || userRole==3)) {                 
                form.addButton({
                    id: 'custpage_settle',
                    label: 'Leavesettlement',
                    functionName: 'HRSettlementclick()' //upload CS Function name
                });
            } */
            if (scriptContext.type == 'view' && approvalstatus == 2 && cancelcheck == false && settlecheck==true && settlementid==''&& (userRole==1008 || userRole==1012 || userRole==3)) {                 
                form.addButton({
                    id: 'custpage_settle',
                    label: 'Leave Settlement',
                    functionName: 'Settlementclick()' //upload CS Function name
                });
            }
            if(scriptContext.type =='view' && approvalstatus==1 && cancelcheck == false &&(user == EmpName || user == Requestor)){
              //  form.clientScriptFileId = 'customscript_hris_lve_pullbackcall_cs';
                form.clientScriptModulePath = './hris_pullbackcall_cs.js';
                form.addButton({
                    id: 'custpage_DeleteButton',
                    label: 'Pullback Leave',
                    functionName: 'PullbackLeave("' + Leaverecordid + '")'
                });
            }
           

      

        }

      // LMS Work Flow Before Load
        
        let status = currentrecord.getValue({ fieldId: 'custrecord_hris_lve_staus' });
        let statusInColor = '<BR><font size=2>STATUS</font><BR><font color="red" size=2>' + (status ? status : 'Draft') + '</font>';
        currentrecord.setValue({ fieldId: 'custrecord_hris_lve_status_incolor', value: statusInColor });
        
        let statusInColorfield = form.getField({ id: 'custrecord_hris_lve_status_incolor' });
        statusInColorfield.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
        
        let namefield = form.getField({ id: 'custrecord_hris_lve_staus' });
        namefield.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

// LA Delete Record


        let newType = runtime.executionContext;
        let LeaveApp_status = currentrecord.getValue('custrecord_hris_lve_hrmsapprovalstatus');
        let leaveEncash_Status = currentrecord.getValue('custrecord_hris_lve_encashstatus');
        let role = runtime.getCurrentUser().role;

        if (scriptContext.type == 'view' && newType === runtime.ContextType.USER_INTERFACE) {
            let editButton = form.getButton('edit');
            if ((LeaveApp_status === '3' || leaveEncash_Status === '3') && role !== '3') {
                editButton.isDisabled = true;
            }
        }

        if (scriptContext.type == 'edit' && newType === runtime.ContextType.USER_INTERFACE) {
            if ((LeaveApp_status === '3' || leaveEncash_Status === '3') && role !== '3') {
                throw new Error('You cannot edit this record');
            }
        }


    }
    function afterSubmit(scriptContext) {
        try {
            let newRecord = scriptContext.newRecord;
            let _record_id = newRecord.id;
            // Section Record Check This record is already present for the applied date

            if (scriptContext.type == scriptContext.UserEventType.CREATE) {
              
                let empName = scriptContext.newRecord.getValue({ fieldId: 'custrecord_hris_lve_employeename' });
                let errorMessage = 'This record is already present for the applied date';
                let fromDate = scriptContext.newRecord.getValue({ fieldId: 'custrecord_hris_lve_fromdate' });
                let toDate = scriptContext.newRecord.getValue({ fieldId: 'custrecord_hris_lve_todate' });

                let filters = [
                    ['custrecord_hris_lve_employeename', 'anyof', empName], 'AND', [
                        ['custrecord_hris_lve_fromdate', 'onorafter', fromDate], 'AND',
                        ['custrecord_hris_lve_todate', 'onorbefore', toDate]
                    ], 'OR', [
                        ['custrecord_hris_lve_fromdate', 'within', fromDate, toDate]
                    ], 'OR', [
                        ['custrecord_hris_lve_todate', 'within', fromDate, toDate]
                    ]
                ];

                let columns = [
                    search.createColumn({ name: 'internalid' }),
                    search.createColumn({ name: 'custrecord_hris_lve_cancellation' }),
                    search.createColumn({ name: 'custrecord_hris_lve_hrmsapprovalstatus' }),
                    search.createColumn({ name: 'custrecord_hris_lve_cancel_leavestatus' })
                ];

                let leaveSearch = search.create({
                    type: 'customrecord_hris_leaveapplication',
                    filters: filters,
                    columns: columns
                }).run().getRange({ start: 0, end: 1000 });

                if (leaveSearch.length > 0) {
                    leaveSearch.forEach(function (result) {
                        let cancelStatus = result.getValue({ name: 'custrecord_hris_lve_cancel_leavestatus' });
                        let approveStatus = result.getValue({ name: 'custrecord_hris_lve_hrmsapprovalstatus' });
                        let cancelChkBox = result.getValue({ name: 'custrecord_hris_lve_cancellation' });

                        log.debug('Leave Check', 'Leave Id: ' + result.getValue({ name: 'internalid' }));

                        if (cancelStatus === '3' || (approveStatus === '1' && cancelChkBox === 'F') || (cancelStatus === '3' && cancelChkBox === 'T')) {
                            throw new Error(errorMessage);
                        }

                        if (!((approveStatus === '2' && cancelChkBox === 'T' && cancelStatus === '2') || approveStatus === '3')) {
                            throw new Error(errorMessage);
                        }
                    });
                }
            }

            // Workresume Functionality
            if (scriptContext.type == scriptContext.UserEventType.EDIT) {
                let newRecord = record.load({ type: 'customrecord_hris_leaveapplication', id: _record_id, isDynamic: true, });
                let todayDate = new Date();
                let workResume = newRecord.getValue('custrecord_hris_lve_workresume');
                let leaveType = newRecord.getValue('custrecord_hris_lve_leavetype');
                let status = newRecord.getValue('custrecord_hris_lve_hrmsapprovalstatus');
                let workResumptionDone = newRecord.getValue('custrecord_hris_lve_workresumptiondone');
                let empployee_name = newRecord.getValue('custrecord_hris_lve_employeename');
                let sequenceNo = getLeaveConfigSequence(leaveType);
                log.debug(" workResumptionDone Sequence No", sequenceNo);
                if (status == 2 && workResumptionDone === false && sequenceNo !== '11' && sequenceNo !== '22') {
                    log.debug('Processing Work Resumption');

                    let workResume = newRecord.getValue('custrecord_hris_lve_workresume');
                    if (workResume) {


                        let expected_resume_back_date = newRecord.getValue('custrecord_hris_lve_expectedresumebackdt');
                        let actual_work_resume_date = newRecord.getValue('custrecord_hris_lve_actualresumedate');
                        let leave_total_number_of_days = newRecord.getValue('custrecord_hris_lve_totalnodays');
                        let total_delay_days = newRecord.getValue('custrecord_hris_lve_actualtotdelaydays');
                        let total_updated_delay_days = newRecord.getValue('custrecord_hris_lve_totalupdateddelayday') || 0;
                        let leave_from_date = newRecord.getValue('custrecord_hris_lve_fromdate');
        
                        actual_work_resume_date = format.parse({ value: actual_work_resume_date, type: format.Type.DATE });
                        expected_resume_back_date = format.parse({ value: expected_resume_back_date, type: format.Type.DATE });
        
                        if (!total_delay_days || total_delay_days === '' || total_delay_days === null || total_delay_days === 'null' || total_delay_days === NaN || total_delay_days === 'NaN') {
                            total_delay_days = 0;
                        }
        
                        total_delay_days = parseInt(total_delay_days, 10);
                        total_updated_delay_days = parseInt(total_updated_delay_days, 10);
        
                        let searchPayGrp = searchPaygroup(empployee_name);
                        log.debug('actual_work_resume_date', actual_work_resume_date);
                        log.debug('expected_resume_back_date', expected_resume_back_date);
                        log.debug('total_delay_days', total_delay_days);
                        log.debug('total_updated_delay_days', total_updated_delay_days);
                        log.debug('todayDate', todayDate);
        
                        let date_day = todayDate.getDate();
                        let wageDate = searchWagePeriod(searchPayGrp);
                        let wDate = wageDate.split('#');
                        log.debug('w_Date', wDate);
                        let end_date = wDate[0];
                       end_date= format.parse({value: end_date, type: format.Type.DATE})
                        log.debug('end_date', end_date);
                        let start_date = wDate[1];
                        start_date=format.parse({value: start_date, type: format.Type.DATE})
                        log.debug('start_date', start_date);
                        let leave_month = wDate[2];
                        log.debug('leave_month', leave_month);
                        let leave_year_id = wDate[3];
                        log.debug('leave_year_id', leave_year_id);
        
                        let mth = actual_work_resume_date.getMonth() + 1;
                        log.debug('mth', mth);
                        let arrear_month = mth;
        
                        if (workResume == true) {
                            if ((actual_work_resume_date < todayDate || total_delay_days < total_updated_delay_days) && sequenceNo !== '2') {
                                log.debug('Called Sequence not equal to 2 $$$$$$$$$$$$$$$$$$$$$$');
        
                                if (empployee_name && leaveType && total_delay_days < 0) {
                                    total_delay_days = Math.abs(total_delay_days);
                                    let leaveBalanceSearch = search.create({
                                        type: 'customrecord_hris_leavebalance',
                                        filters: [
                                            ['isinactive', 'is', 'F'],
                                            'AND',
                                            ['custrecord_hris_lvbal_employee_name', 'anyof', empployee_name],
                                            'AND',
                                            ['custrecord_hris_lvbal_leave_type', 'anyof', leaveType]
                                        ],
                                        columns: [
                                            'internalid',
                                            'custrecord_hris_lvbal_available_leave_ba',
                                            'custrecord_hris_lvbal_leave_balance_take'
                                        ]
                                    });
        
                                    let leaveBalanceResult = leaveBalanceSearch.run().getRange({ start: 0, end: 1 });
        
                                    if (leaveBalanceResult.length > 0) {
                                        let internal_id = leaveBalanceResult[0].getValue('internalid');
                                        let balanceRecord = record.load({ type: 'customrecord_hris_leavebalance', id: internal_id });
        
                                        let avl_leave_bal = balanceRecord.getValue('custrecord_hris_lvbal_available_leave_ba');
                                        let leave_bal_taken = balanceRecord.getValue('custrecord_hris_lvbal_leave_balance_take');
        
                                        avl_leave_bal = avl_leave_bal || 0;
                                        leave_bal_taken = leave_bal_taken || 0;
        
                                        avl_leave_bal = parseFloat(avl_leave_bal) + parseFloat(total_delay_days);
                                        leave_bal_taken = parseFloat(leave_bal_taken) - parseFloat(total_delay_days);
        
                                        if (sequenceNo !== '2') {
                                            balanceRecord.setValue('custrecord_hris_lvbal_available_leave_ba', avl_leave_bal);
                                        }
                                        balanceRecord.setValue('custrecord_hris_lvbal_leave_balance_take', leave_bal_taken);
        
                                        let leaveBalanceSubmit = record.submitFields({
                                            type: 'customrecord_hris_leavebalance',
                                            id: internal_id,
                                            values: {
                                                'custrecord_hris_lvbal_available_leave_ba': avl_leave_bal,
                                                'custrecord_hris_lvbal_leave_balance_take': leave_bal_taken
                                            }
                                        });
                                        log.debug('leave_balnce_submit', leaveBalanceSubmit);
                                    }
                                }
                               else if (total_delay_days > 0) {
                                    let leaveBalanceSearch = search.create({
                                        type: 'customrecord_hris_leavebalance',
                                        filters: [
                                            ['isinactive', 'is', 'F'],
                                            'AND',
                                            ['custrecord_hris_lvbal_employee_name', 'anyof', empployee_name],
                                            'AND',
                                            ['custrecord_hris_lvbal_leave_type.custrecord_hris_lvecnfg_seqno', 'equalto', '2']
                                        ],
                                        columns: [
                                            'internalid',
                                            'custrecord_hris_lvbal_available_leave_ba',
                                            'custrecord_hris_lvbal_leave_balance_take'
                                        ]
                                    });
                        
                                    let leaveBalanceResult = leaveBalanceSearch.run().getRange({ start: 0, end: 1 });
                        
                                    if (leaveBalanceResult.length > 0) {
                                        let balanceRecordId = leaveBalanceResult[0].getValue('internalid');
                                        let balanceRecord = record.load({
                                            type: 'customrecord_hris_leavebalance',
                                            id: balanceRecordId,
                                            isDynamic: true,
                                        });
                        
                                        let leave_bal_taken = parseFloat(balanceRecord.getValue('custrecord_hris_lvbal_leave_balance_take')) || 0;
                                        leave_bal_taken += total_delay_days;
                        
                                        balanceRecord.setValue({
                                            fieldId: 'custrecord_hris_lvbal_leave_balance_take',
                                            value: leave_bal_taken
                                        });
                        
                                        balanceRecord.save({
                                            enableSourcing: true,
                                            ignoreMandatoryFields: true
                                        });;
                                        log.debug('Leave Balance Updated', 'Leave Balance Take updated for employee ' + empployee_name);
                                    }
                                }
                                if (empployee_name && leaveType) {

                                    if (todayDate > expected_resume_back_date) { // create arrears only if today date is greater than expected resume date
                                        log.debug('create arrear entry');
                                        
                                        // calculating the arrears days based on the below condition
                                        let calculate_date;
                                        if (actual_work_resume_date < expected_resume_back_date) {
                                            calculate_date = expected_resume_back_date;
                                        } else {
                                            calculate_date = actual_work_resume_date;
                                        }
                    
                                        let daysDiff = Math.round((todayDate.getTime() - calculate_date.getTime()) / (24 * 60 * 60 * 1000));
                                        log.debug('create arrear entry daysDiff', daysDiff);
                    
                                        if (daysDiff > 0) { // arrears create only greater than 0 days
                                            let arrears_record = search.create({
                                                type: "customrecord_hris_unpaid_arrear_entry",
                                                filters: [
                                                    ["isinactive", "is", "F"],
                                                    "AND",
                                                    ["custrecord_hris_uae_employee_name", "anyof", empployee_name],
                                                    "AND",
                                                    ["custrecord_hris_uae_pay_group", "anyof", searchPayGrp],
                                                    "AND",
                                                    ["custrecord_hris_uae_month", "is", leave_month],
                                                    "AND",
                                                    ["custrecord_hris_uae_year", "is", leave_year_id],
                                                    "AND",
                                                    ["custrecord_hris_uae_leave_reference_no", "is", _record_id]
                                                ],
                                                columns: [
                                                    search.createColumn({ name: "internalid" })
                                                ]
                                            }).run().getRange({ start: 0, end: 1 });
                    
                                            if (!arrears_record || arrears_record.length === 0) {
                                                log.debug('Arrear creation below 25');
                    
                                                let create_arrears = record.create({
                                                    type: 'customrecord_hris_unpaid_arrear_entry',
                                                    isDynamic: true,
                                                });
                    
                                                create_arrears.setValue({
                                                    fieldId: 'custrecord_hris_uae_employee_name',
                                                    value: empployee_name
                                                });
                    
                                                create_arrears.setValue({
                                                    fieldId: 'custrecord_hris_uae_pay_group',
                                                    value: searchPayGrp
                                                });
                    
                                                create_arrears.setValue({
                                                    fieldId: 'custrecord_hris_uae_pay_date',
                                                    value: end_date
                                                });
                    
                                                create_arrears.setValue({
                                                    fieldId: 'custrecord_hris_uae_month',
                                                    value: leave_month
                                                });
                    
                                                create_arrears.setValue({
                                                    fieldId: 'custrecord_hris_uae_year',
                                                    value: leave_year_id
                                                });
                    
                                                create_arrears.setValue({
                                                    fieldId: 'custrecord_hris_uae_arrear_days',
                                                    value: daysDiff
                                                });
                    
                                                create_arrears.setValue({
                                                    fieldId: 'custrecord_hris_uae_arrear_month',
                                                    value: arrear_month
                                                });
                    
                                                create_arrears.setValue({
                                                    fieldId: 'custrecord_hris_uae_leave_reference_no',
                                                    value: _record_id
                                                });
                    
                                                create_arrears.setValue({
                                                    fieldId: 'custrecord_hris_uae_remark',
                                                    value: 'Unpaid Arrear entry against work resumption'
                                                });
                    
                                                let create_arrears_id = create_arrears.save({ enableSourcing: true, ignoreMandatoryFields: true });
                                                log.debug('create_arrears submit', create_arrears_id);
                                            } else {
                                                let internal_id = arrears_record[0].id;
                                                let load_record = record.load({
                                                    type: 'customrecord_hris_unpaid_arrear_entry',
                                                   
                                                    id: internal_id,
                                                    isDynamic: true,
                                                });
                    
                                                load_record.setValue({
                                                    fieldId: 'custrecord_hris_uae_arrear_days',
                                                    value: daysDiff
                                                });
                    
                                                let load_arrears_submit = load_record.save({ enableSourcing: true, ignoreMandatoryFields: true });
                                                log.debug('load_arrears_submit', load_arrears_submit);
                                            }
                                        }
                                    }
                                }
                            }
                            if (sequenceNo == '2') {
                                log.debug('Called Sequence equal to 2 ***********************');
                    
                                let employeeName = newRecord.getValue({ fieldId: 'employee_name' });
                                let leaveType = newRecord.getValue({ fieldId: 'leave_type' });
                                let totalDelayDays = newRecord.getValue({ fieldId: 'total_delay_days' });
                                let actualWorkResumeDate =newRecord.getValue({ fieldId: 'actual_work_resume_date' });
                                let todayDate = new Date();
                    
                                if (employeeName && leaveType) {
                                    let leaveBalanceSearch = search.create({
                                        type: 'customrecord_hris_leavebalance',
                                        filters: [
                                            ['isinactive', 'is', 'F'],
                                            'AND',
                                            ['custrecord_hris_lvbal_employee_name', 'anyof', employeeName],
                                            'AND',
                                            ['custrecord_hris_lvbal_leave_type', 'anyof', leaveType]
                                        ],
                                        columns: [
                                            'internalid',
                                            'custrecord_hris_lvbal_available_leave_ba',
                                            'custrecord_hris_lvbal_leave_balance_take'
                                        ]
                                    });
                    
                                    let searchResult = leaveBalanceSearch.run().getRange({ start: 0, end: 1 });
                    
                                    if (searchResult.length > 0) {
                                        let internalId = searchResult[0].getValue({ name: 'internalid' });
                                        let balanceRecord = record.load({
                                            type: 'customrecord_hris_leavebalance',
                                            id: internalId,
                                            isDynamic: true,
                                        });
                    
                                        let leaveBalTaken = balanceRecord.getValue({ fieldId: 'custrecord_hris_lvbal_leave_balance_take' });
                                        if (!leaveBalTaken) {
                                            leaveBalTaken = 0;
                                        }
                    
                                        leaveBalTaken = parseFloat(leaveBalTaken) + parseFloat(totalDelayDays);
                                        balanceRecord.setValue({
                                            fieldId: 'custrecord_hris_lvbal_leave_balance_take',
                                            value: leaveBalTaken
                                        });
                    
                                        let leaveBalanceSubmit = balanceRecord.save({ enableSourcing: true, ignoreMandatoryFields: true });
                                        log.debug('leave_balance_submit for sequence_no 2', leaveBalanceSubmit);
                    
                                        let oneDay = 24 * 60 * 60 * 1000;
                                        let daysDiff = Math.round((new Date(actualWorkResumeDate).getTime() - todayDate.getTime()) / oneDay);
                    
                                        if (daysDiff > 0) {
                                            let arrearsSearch = search.create({
                                                type: 'customrecord_hris_unpaid_arrear_entry',
                                                filters: [
                                                    ['isinactive', 'is', 'F'],
                                                    'AND',
                                                    ['custrecord_hris_uae_employee_name', 'anyof', employeeName],
                                                    'AND',
                                                    ['custrecord_hris_uae_pay_group', 'anyof', searchPayGrp],
                                                    'AND',
                                                    ['custrecord_hris_uae_month', 'is', leave_month],
                                                    'AND',
                                                    ['custrecord_hris_uae_year', 'is', leave_year_id],
                                                    'AND',
                                                    ['custrecord_hris_uae_leave_reference_no', 'is', _record_id]
                                                ],
                                                columns: ['internalid']
                                            });
                    
                                            let arrearsResult = arrearsSearch.run().getRange({ start: 0, end: 1 });
                    
                                            if (arrearsResult.length === 0) {
                                                log.debug('Arrear creation for sequence_no 2');
                                                let createArrears = record.create({
                                                    type: 'customrecord_hris_unpaid_arrear_entry',
                                                    isDynamic: true,
                                                });
                    
                                                createArrears.setValue({ fieldId: 'custrecord_hris_uae_employee_name', value: employeeName });
                                                createArrears.setValue({ fieldId: 'custrecord_hris_uae_pay_group', value:searchPayGrp });
                                                createArrears.setValue({ fieldId: 'custrecord_hris_uae_pay_date', value: end_date });
                                                createArrears.setValue({ fieldId: 'custrecord_hris_uae_month', value: leave_month });
                                                createArrears.setValue({ fieldId: 'custrecord_hris_uae_year', value: leave_year_id});
                                                createArrears.setValue({ fieldId: 'custrecord_hris_uae_arrear_days', value: daysDiff });
                                                createArrears.setValue({ fieldId: 'custrecord_hris_uae_arrear_month', value: arrear_month });
                                                createArrears.setValue({ fieldId: 'custrecord_hris_uae_leave_reference_no', value: _record_id});
                                                createArrears.setValue({ fieldId: 'custrecord_hris_uae_remark', value: 'Unpaid Arrear entry against work resumption' });
                    
                                                let createArrearsSubmit = createArrears.save({ enableSourcing: true, ignoreMandatoryFields: true });
                                                log.debug('create_arrears submit', createArrearsSubmit);
                                            } else {
                                                let internalIdArrears = arrearsResult[0].getValue({ name: 'internalid' });
                                                let loadRecord = record.load({
                                                    type: 'customrecord_hris_unpaid_arrear_entry',
                                                    id: internalIdArrears,
                                                    isDynamic: true,
                                                });
                    
                                                loadRecord.setValue({ fieldId: 'custrecord_hris_uae_arrear_days', value: daysDiff });
                    
                                                let loadArrearsSubmit = loadRecord.save({ enableSourcing: true, ignoreMandatoryFields: true });
                                                log.debug('load_arrears_submit for sequence_no 2', loadArrearsSubmit);
                                            }
                                        }
                                    }
                                }
                            }
                        
                            
                        }
              


                        newRecord.setValue('custrecord_hris_lve_workresumptiondone', true);
                        newRecord.save({ enableSourcing: true, ignoreMandatoryFields: true });
                        log.debug('Work Resumption Done Updated', 'Success');


                        //  }
                        // }

                        // Work resume date and Status Updation
                        // Get the value of 'custrecord_hris_lve_workresume'
                        // if (workResume) {
                        // Fetch 'custrecord_hris_lve_actualresumedate' and 'custrecord_hris_lve_employeename'
                        let actualResumeDate = newRecord.getValue('custrecord_hris_lve_actualresumedate');
                        let employeeId = newRecord.getValue('custrecord_hris_lve_employeename');

                        if (actualResumeDate && employeeId) {
                            let employeeRecord = record.load({
                                type: record.Type.EMPLOYEE,
                                id: employeeId,
                                isDynamic: true
                            });

                            // Set the rejoin date
                            employeeRecord.setValue({
                                fieldId: 'custentity_hris_rejoin_date',
                                value: actualResumeDate
                            });
                            employeeRecord.setValue({
                                fieldId: 'custentity_hris_empemploymentstatus',
                                value: 1,
                                ignoreFieldChange: true
                            });
                            // Save the record ignoring mandatory fields
                            employeeRecord.save({
                                enableSourcing: true,
                                ignoreMandatoryFields: true
                            });

                            log.debug({
                                title: 'Employee Record Updated',
                                details: 'Employee ID: ' + employeeId + ', Rejoin Date: ' + actualResumeDate
                            });
                            let empcompensql = "select * from customrecord_hris_employee_compen_change \
                    where custrecord_hris_empchange_employee_nam ="+ employeeId + " and isinactive ='F'"

                            log.debug('empcompensql', empcompensql);

                            let empcompensqlrecords = getResult(empcompensql);

                            if (empcompensqlrecords.length > 0) {
                                let compenid = empcompensqlrecords[0].id;
                                let EmployeecompenID = record.submitFields({
                                    type: 'customrecord_hris_employee_compen_change',
                                    id: compenid,
                                    values: {
                                        'custrecord_hris_empchange_emp_active_sts': 1
                                    }
                                });

                            }
                            log.debug("Info", "EmployeeCompensationStatus also Updated. Internal ID : " + EmployeecompenID);
                        }
                        else {
                            log.error({
                                title: 'Missing Data',
                                details: 'Actual Resume Date or Employee ID is missing.'
                            });
                        }

                    }
                }
                if (status == 2 && workResumptionDone == false && work_resume == true && sequenceNo == '11') {
                        
                    log.debug('sequenceNo', sequenceNo);
                    
                 
                    
                    let expected_resume_back_date = newRecord.getValue('custrecord_hris_lve_expectedresumebackdt');
                    let actual_work_resume_date = newRecord.getValue('custrecord_hris_lve_actualresumedate');
                    let leave_total_number_of_days = newRecord.getValue('custrecord_hris_lve_totalnodays');
                    let total_delay_days = newRecord.getValue('custrecord_hris_lve_actualtotdelaydays');
                    let total_updated_delay_days = newRecord.getValue('custrecord_hris_lve_totalupdateddelayday');
                    let leave_from_date = newRecord.getValue('custrecord_hris_lve_fromdate');
                    leave_from_date=format.parse({value: leave_from_date, type: format.Type.DATE})
                    
                   // let paid_leave_end_date = util.addDays(format.parse({value: leave_from_date, type: format.Type.DATE}), 45);
                    let paid_leave_end_date=  moment(leave_from_date).add(45, 'days');
                    log.debug('leave_from_date', leave_from_date);
                    log.debug('paid_leave_end_date', paid_leave_end_date);
                    
                    function monthDiff(dateFrom, dateTo) {
                        return dateTo.getMonth() - dateFrom.getMonth() + 1 +
                            (12 * (dateTo.getFullYear() - dateFrom.getFullYear()));
                    }
                    
                    let total_months_difference = monthDiff(new Date(format.parse({value: leave_from_date, type: format.Type.DATE})), new Date(paid_leave_end_date));
        
                    actual_work_resume_date = format.parse({value: actual_work_resume_date, type: format.Type.DATE});
                    expected_resume_back_date = format.parse({value: expected_resume_back_date, type: format.Type.DATE});
                    
                    if (!total_delay_days || total_delay_days == '' || total_delay_days == null || total_delay_days == 'null' || total_delay_days == NaN || total_delay_days == 'NaN') {
                        total_delay_days = 0;
                    }
                    
                    total_delay_days = parseInt(total_delay_days);
                    total_updated_delay_days = parseInt(total_updated_delay_days);
                    
                    let searchPayGrp = searchPayGroup(empployee_name);
                    
                    log.debug('actual_work_resume_date', actual_work_resume_date);
                    log.debug('expected_resume_back_date', expected_resume_back_date);
                    log.debug('total_delay_days', total_delay_days);
                    log.debug('total_updated_delay_days', total_updated_delay_days);
                    log.debug('todayDate', todayDate);
                    
                    let date_day = todayDate.getDate();
                    
                    let leave_month = actual_work_resume_date.getMonth() + 1;
                    let leave_year = actual_work_resume_date.getFullYear();
                    
                    log.debug('leave_month', leave_month);
                    log.debug('leave_year', leave_year);
                    
                    let leave_year_id = searchYear(leave_year);
                    
                    let arrear_month = leave_month;
                    let current_month = todayDate.getMonth() + 1;
                    log.debug('current_month', current_month);
                    
                    if (todayDate.getDate() > 24 && current_month == leave_month) {
                        leave_month = leave_month + 1;
                        if (leave_month == 12) {
                            leave_year = parseInt(leave_year) + 1;
                            leave_year_id = searchYear(leave_year);
                        }
                    }
                    
                    if (current_month != leave_month && todayDate.getDate() < 25) {
                        leave_month = leave_month + 1;
                        if (leave_month == 12) {
                            leave_year = parseInt(leave_year) + 1;
                            leave_year_id = searchYear(leave_year);
                        }
                    }
                    
                    log.debug('unpaid creation month ', leave_month);
                    log.debug('unpaid creation year', leave_year);
                    log.debug('unpaid creation year id', leave_year_id);
                    
                    let finalDate = remFormatedDate(leave_year, leave_month, '01');
                    let date = format.parse({value: finalDate, type: format.Type.DATE});
                    let lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                    let end_date = formatedDate(format.format({value: lastDay, type: format.Type.DATE}));
                    log.debug('formate end_date', end_date);
                    
                    if (work_resume == 'T') {
                        if (empployee_name && leaveType && total_delay_days != 0) {
                            let customrecord_hris_leavebalanceSearch = search.create({
                                type: 'customrecord_hris_leavebalance',
                                filters: [
                                    ['isinactive', 'is', 'F'],
                                    'AND',
                                    ['custrecord_hris_lvbal_employee_name', 'anyof', empployee_name],
                                    'AND',
                                    ['externalidstring', 'custrecord_hris_lvbal_leave_type', 'is', '1']
                                ],
                                columns: [
                                    'internalid',
                                    'custrecord_hris_lvbal_available_leave_ba',
                                    'custrecord_hris_lvbal_leave_balance_take'
                                ]
                            }).run().getRange({start: 0, end: 1});
                            
                            if (customrecord_hris_leavebalanceSearch.length > 0) {
                                let internal_id = customrecord_hris_leavebalanceSearch[0].getValue('internalid');
                                let _balace_record = record.load({
                                    type: 'customrecord_hris_leavebalance',
                                    id: internal_id,
                                    isDynamic: true,
                                });
                                
                                let avl_leave_bal = _balace_record.getValue('custrecord_hris_lvbal_available_leave_ba');
                                let leave_bal_taken = _balace_record.getValue('custrecord_hris_lvbal_leave_balance_take');
                                
                                avl_leave_bal = avl_leave_bal || 0;
                                leave_bal_taken = leave_bal_taken || 0;
                                
                                leave_bal_taken = parseFloat(leave_bal_taken) + parseFloat(total_delay_days);
                                _balace_record.setValue('custrecord_hris_lvbal_leave_balance_take', leave_bal_taken);
                                
                                let leave_balnce_submit = _balace_record.save();
                                log.debug('leave_balnce_submit', leave_balnce_submit);
                            }
                            
                            if (total_delay_days > 0) {
                                let filter = [];
                                let column = [];
                                leave_month = gethrisMonth(leave_month);
                                filter.push(['custrecord_hris_ule_leave_reference_no', null, 'is', _record_id]);
                                filter.push(['custrecord_hris_ule_pay_group', null, 'is', searchPayGrp]);
                                filter.push(['custrecord_hris_ule_month', null, 'is', leave_month]);
                                filter.push(['custrecord_hris_ule_year', null, 'is', leave_year_id]);
                                filter.push(['custrecord_hris_ule_leave_type', null, 'is', 3]);
                                filter.push(['isinactive', null, 'is', 'F']);
                                
                                column.push('internalid');
                                let unpLeaveSearch = search.create({
                                    type: 'customrecord_hris_unpaid_leave_entry',
                                    filters: filter,
                                    columns: column
                                }).run().getRange({start: 0, end: 1});
                                
                                if (unpLeaveSearch.length === 0) {
                                    log.debug('Inside !unpLeaveSearch Create part');
                                    let unpLeavRecord = record.create({
                                        type: 'customrecord_hris_unpaid_leave_entry',
                                        isDynamic: true,
                                    });
                                    
                                    unpLeavRecord.setValue('custrecord_hris_ule_leave_reference_no', _record_id);
                                    unpLeavRecord.setValue('custrecord_hris_ule_employee_name', empployee_name);
                                    unpLeavRecord.setValue('custrecord_hris_ule_leave_type', 3);
                                    unpLeavRecord.setValue('custrecord_hris_ule_noof_days', total_delay_days);
                                    unpLeavRecord.setValue('custrecord_hris_ule_pay_group', searchPayGrp);
                                    unpLeavRecord.setValue('custrecord_hris_ule_reason', 'Work Resumption');
                                    unpLeavRecord.setValue('custrecord_hris_ule_pay_date', end_date);
                                    unpLeavRecord.setValue('custrecord_hris_ule_month', leave_month);
                                    unpLeavRecord.setValue('custrecord_hris_ule_year', leave_year_id);
                                    unpLeavRecord.setValue('custrecord_hris_ule_final_days', total_delay_days);
                                    
                                    let createdRecordID = unpLeavRecord.save();
                                    log.debug('createdRecordID unpaid', createdRecordID);
                                } else {
                                    let unpaid_id = unpLeaveSearch[0].id;
                                    let load_record = record.load({
                                        type: 'customrecord_hris_unpaid_leave_entry',
                                        id: unpaid_id,
                                        isDynamic: true,
                                    });
                                    
                                    let no_of_days = load_record.getValue('custrecord_hris_ule_noof_days');
                                    no_of_days = parseInt(no_of_days);
                                    load_record.setValue('custrecord_hris_ule_noof_days', no_of_days + total_delay_days);
                                    load_record.setValue('custrecord_hris_ule_final_days', no_of_days + total_delay_days);
                                    
                                    let createdRecordID = load_record.save();
                                    log.debug('updated createdRecordID unpaid', createdRecordID);
                                }
                            }
                        }
                    }
                }
            }
            // Monthly Salary Input creation
            if (scriptContext.type == scriptContext.UserEventType.EDIT) {
               
                let newRecord = scriptContext.newRecord;
                let recordId= newRecord.id;
                log.debug('recordId', recordId);
                let o_leaveApp = record.load({ type: 'customrecord_hris_leaveapplication', id: recordId, isDynamic: true, });
    
                let emp_Id = o_leaveApp.getValue({ fieldId: 'custrecord_hris_lve_employeename' });
                log.debug('WFH', 'emp_Id --> ' + emp_Id);
    
                let leaveType = o_leaveApp.getValue({ fieldId: 'custrecord_hris_lve_leavetype' });
                log.debug('WFH', 'leaveType --> ' + leaveType);
    
                let leaveRefNo = o_leaveApp.getValue({ fieldId: 'name' });
                let LeaveApplication_Status = o_leaveApp.getValue({ fieldId: 'custrecord_hris_lve_hrmsapprovalstatus' });
                log.debug('WFH', 'LeaveApplication_Status --> ' + LeaveApplication_Status);
    
                let leaveCancelStatus = o_leaveApp.getValue({ fieldId: 'custrecord_hris_lve_cancel_leavestatus' });
                let cancel_check = o_leaveApp.getValue({ fieldId: 'custrecord_hris_lve_cancellation' });
                let salAmt = o_leaveApp.getValue({ fieldId: 'custrecord_hris_lve_airticketamount' });
                let airTicketChk = o_leaveApp.getValue({ fieldId: 'custrecord_hris_lve_airticketrequired' });
    
                log.debug('LeaveApplication_Status', LeaveApplication_Status);
                log.debug('cancel_check', cancel_check);
                log.debug('airTicketChk', airTicketChk);
    
                let seq_no = getLeaveConfigSequence(leaveType);
                if (airTicketChk == true && cancel_check == false && LeaveApplication_Status == '2') {
                    let fromDate = o_leaveApp.getValue({ fieldId: 'custrecord_hris_lve_fromdate' });
                    log.debug('Integration fromDate', fromDate);
                    fromDate = format.parse({ value: fromDate, type: format.Type.DATE });
                    
                    let searchPayGrp = searchPayGrp(emp_Id);
                    let payComp = searchPayComp(searchPayGrp);
    
                    fromDate = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 0);  // Get last day of the month
                    let lastDayDate_frmDate = fromDate.getDate();
                    let lastDayMonth_frmDate = fromDate.getMonth() + 1;
                    let lastDayYear_frmDate = fromDate.getFullYear();
    
                    let finalDate_toDate = remFormatedDate(lastDayYear_frmDate, lastDayMonth_frmDate, lastDayDate_frmDate);
                    log.debug('Integration finalDate_toDate', finalDate_toDate);
                    log.debug('payComp', payComp);
    
                    let year = lastDayYear_frmDate;
                    year = year.toString();
                    let YearId = searchYear(year);
    
                    let filters = [
                        ['custrecord_hris_mthsal_empname', 'is', emp_Id],
                        'AND',
                        ['custrecord_hris_mthsal_year', 'is', YearId],
                        'AND',
                        ['custrecord_hris_mthsal_paycomponent', 'is', payComp],
                        'AND',
                        ['custrecord_hris_mthsal_msileaverefno', 'anyof', recordId],
                        'AND',
                        ['isinactive', 'is', 'F']
                    ];
    
                    let searchResult = search.create({
                        type: 'customrecord_hris_monthlysalinput',
                        filters: filters,
                        columns: ['internalid']
                    }).run().getRange({ start: 0, end: 1 });
    
                    if (searchResult.length === 0) {
                        let msi_rec = record.create({ type: 'customrecord_hris_monthlysalinput', isDynamic: true, });
                        msi_rec.setValue({ fieldId: 'custrecord_hris_mthsal_empname', value: emp_Id });
                        msi_rec.setValue({ fieldId: 'custrecord_hris_mthsal_paygroup', value: searchPayGrp });
                        msi_rec.setValue({ fieldId: 'custrecord_hris_mthsal_paydt', value: finalDate_toDate });
    
                        lastDayMonth_frmDate = gethrisMonth(lastDayMonth_frmDate);  // Assuming this function returns the correct month format
                        msi_rec.setValue({ fieldId: 'custrecord_hris_mthsal_month', value: lastDayMonth_frmDate });
                        msi_rec.setValue({ fieldId: 'custrecord_hris_mthsal_year', value: YearId });
                        msi_rec.setValue({ fieldId: 'custrecord_hris_mthsal_paycomponent', value: payComp });
                        msi_rec.setValue({ fieldId: 'custrecord_hris_mthsal_salaryamount', value: salAmt });
                        msi_rec.setValue({ fieldId: 'custrecord_hris_mthsal_msileaverefno', value: recordId });
    
                        let id = msi_rec.save({ enableSourcing: true, ignoreMandatoryFields: true });
                        log.debug('created id', id);
                    }
                }
            }
        } catch (error) {
            log.error({
                title: 'Error in After Submit',
                details: error.message
            });
        }
    }
    function beforeSubmit(scriptContext){


        // Generate Reference No

      
        if (scriptContext.type === scriptContext.UserEventType.CREATE) {
            
                let newRecord = scriptContext.newRecord;
                
                let s_auto_prfix = '';
                let recordType = newRecord.type;
                log.debug('userEventBeforeLoad', 'Record Type: ' + recordType);
                if (recordType =="customrecord_hris_leaveapplication") {
                    s_auto_prfix = "LA";
                  }
                
                
                
                let i_rec_type_id = newRecord.getValue({ fieldId: 'rectype' });
                log.debug('i_rec_type_id', i_rec_type_id);
                
                let searchResults = search.create({
                    type: 'customrecord_hris_unique_reference_numbe',
                    filters: [
                        ['custrecord_hris_record_type', 'anyof', i_rec_type_id],
                        'AND',
                        ['isinactive', 'is', 'F']
                    ],
                    columns: ['custrecord_hris_record_type', 'custrecord_hris_unique_number']
                }).run().getRange({ start: 0, end: 1 });
                
                if (searchResults.length > 0) {
                    let uniqueRefRecord = searchResults[0];
                    let i_id_unique_ref = uniqueRefRecord.id;
                    let i_unique_num = parseInt(uniqueRefRecord.getValue('custrecord_hris_unique_number')) + 1;
                    
                    let d_current_date = new Date();
                    let i_fullYear = d_current_date.getFullYear();
                    
                    let i_employee;
                   
                            i_employee = newRecord.getValue({ fieldId: 'custrecord_hris_lve_employeename' });
                   
                    
                    let s_name = search.lookupFields({
                        type: 'employee',
                        id: i_employee,
                        columns: ['firstname']
                    }).firstname;
                    
                    let s_emp_char = '';
                    if (s_name) {
                        let nameParts = s_name.split(' ');
                        if (!isNaN(nameParts[0])) {
                            nameParts.shift();
                        }
                        s_name = nameParts.join(' ').toUpperCase();
                        s_emp_char = s_name.substring(0, 2);
                    }
                    
                    let s_auto_number = s_auto_prfix + '-' + i_unique_num + '-' + i_fullYear;
                    newRecord.setValue({ fieldId: 'name', value: s_auto_number });
                    
                    record.submitFields({
                        type: 'customrecord_hris_unique_reference_numbe',
                        id: i_id_unique_ref,
                        values: { 'custrecord_hris_unique_number': i_unique_num }
                    });
                }
           
    }

        // Pull Back Details

        if (scriptContext.type == scriptContext.UserEventType.DELETE) {
        
        
        let newRecord = scriptContext.newRecord;
        let custformscript =newRecord.getValue('custrecord_hris_lve_script_version');
       log.debug("custformscript",custformscript)
     if (custformscript == 1){ 
       
        // Get field values
        let EmployeeNAME = newRecord.getValue('custrecord_hris_lve_employeename');
        let EmployeeCODE = newRecord.getValue('custrecord_hris_lve_empcode');
        let Manager = newRecord.getValue('custrecord_hris_lve_supervisor');
        let ProjectSupervisor = newRecord.getValue('custrecord_hris_lve_project_supervisor');
        let LeaveType = newRecord.getValue('custrecord_hris_lve_leavetype');
        let LeaveBalance = newRecord.getValue('custrecord_hris_lve_leavebalance');
        let FromDate = newRecord.getValue('custrecord_hris_lve_fromdate');
        let FromHalfDay = newRecord.getValue('custrecord_hris_lve_fromhalfday');
        let ToDate = newRecord.getValue('custrecord_hris_lve_todate');
        let ToHalfDay = newRecord.getValue('custrecord_hris_lve_tohalfday');
        let TotalNoDays = newRecord.getValue('custrecord_hris_lve_totalnodays');
        let ValidTillDate = newRecord.getValue('custrecord_hris_lve_validtilldate');
        let LeaveReason = newRecord.getValue('custrecord_hris_lve_leavereason');
        let SupportDoc = newRecord.getValue('custrecord_hris_lve_supportdocument');
        let LeaveAppStatus = newRecord.getValue('custrecord_hris_lve_staus');
        
        // Create Pullback record
        let pullBackRecord = record.create({
            type: 'customrecord_hris_pullback_lveapplicatio',
            isDynamic: true
        });
        
        pullBackRecord.setValue('custrecord_hris_plb_employee_name', EmployeeNAME);
        pullBackRecord.setValue('custrecord_hris_plb_employee_code', EmployeeCODE);
        pullBackRecord.setValue('custrecord_hris_plb_supervisor', Manager);
        pullBackRecord.setValue('custrecord_hris_plb_hod', ProjectSupervisor);
        pullBackRecord.setValue('custrecord_hris_plb_leave_type', LeaveType);
        pullBackRecord.setValue('custrecord_hris_plb_leave_balance', LeaveBalance);
        pullBackRecord.setValue('custrecord_hris_plb_from_date', FromDate);
        pullBackRecord.setValue('custrecord_hris_plb_from_halfday', FromHalfDay);
        pullBackRecord.setValue('custrecord_hris_plb_todate', ToDate);
        pullBackRecord.setValue('custrecord_hris_plb_to_halfday', ToHalfDay);
        pullBackRecord.setValue('custrecord_hris_plb_total_days', TotalNoDays);
        pullBackRecord.setValue('custrecord_hris_plb_vaid_tilldate', ValidTillDate);
        pullBackRecord.setValue('custrecord_hris_plb_leave_reason', LeaveReason);
        pullBackRecord.setValue('custrecord_hris_plb_support_document', SupportDoc);
        pullBackRecord.setValue('custrecord_hris_plb_leave_applica_status', LeaveAppStatus);
        
        let pullBackRecord_ID = pullBackRecord.save({ enableSourcing: true, ignoreMandatoryFields: true });
        log.debug('Pullback Record Created', pullBackRecord_ID);
    }
}
// LA Delete Record Validation
let newRecord = scriptContext.newRecord;
let Tot_no_Days = newRecord.getValue('custrecord_hris_lve_totalnodays');
let LeaveApp_status = newRecord.getValue('custrecord_hris_lve_hrmsapprovalstatus');
let leaveEncash_Status = newRecord.getValue('custrecord_hris_lve_encashstatus');

/* if (Tot_no_Days < 0) {
    throw new Error('Please Select Comp-Off');
} */

if ((LeaveApp_status === '2' || LeaveApp_status === '3') && scriptContext.type === scriptContext.UserEventType.DELETE) {
    throw new Error('You cannot delete an Approved or Rejected Leave');
}

if ((leaveEncash_Status === '2' || leaveEncash_Status === '3') && scriptContext.type === scriptContext.UserEventType.DELETE) {
    throw new Error('You cannot delete an Approved or Rejected Leave Encashment record');
}
}
    function getCurrentDate() {
        let today = new Date();
        let dd = today.getDate();
        let mm = today.getMonth() + 1;
        let yyyy = today.getFullYear();
        return mm + '/' + dd + '/' + yyyy;
    }
    function getResult(pSQL) {
        // log.debug("QUERY", pSQL);
        let queryResults = QUERY.runSuiteQL({
            query: pSQL
        });
        let records = queryResults.asMappedResults();
        return records;
    }
    function searchWagePeriod(pay_group) {

        let wageperiodsql = " select * from customrecord_hris_wage_period_details \
                           where custrecord_hris_pay_group = "+ pay_group + " and isinactive='F'"

        log.debug('wageperiodsql',wageperiodsql);
        let wageperiodsqlrecords = getResult(wageperiodsql);

        if (wageperiodsqlrecords.length > 0) {
            let rec = wageperiodsqlrecords[0];
            let WagePeriod_EndDate = rec.custrecord_hris_end_date;

            let start_date = rec.custrecord_hris_start_date;

            let month = rec.custrecord_hris_month;

            let year = rec.custrecord_hris_year;

        }//End of if(searchResult !=null)
        return WagePeriod_EndDate + "#" + start_date + "#" + month + "#" + year;
    }
    function getLeaveConfigSequence(Leave_type) {
        try {

            let leavesequencesql = "select * from customrecord_hris_leaveconfig where id ='" + Leave_type + "' and isinactive ='F'"
            log.debug("leavesequencesql", leavesequencesql);
            let queryResult = query.runSuiteQL({
                query: leavesequencesql,
            });
            let leavesequencesqlrecords = queryResult.asMappedResults();


            log.debug(" leavesequencesqlrecords.length", leavesequencesqlrecords.length);
            if (leavesequencesqlrecords.length > 0) {


                let sequence_no = leavesequencesqlrecords[0].custrecord_hris_lvecnfg_seqno;
            }
            return sequence_no;
        }
        catch (e) {
            log.debug("error in get_sequence_no : " + e);

        }

    }
    function gethrisMonth(monthParameter) {
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
    } 
    function searchPaygroup(employee_name) {
       /*  let filters = new Array();
        let columns = new Array();
    
        filters.push(new nlobjSearchFilter('custrecord_hris_empchange_employee_nam', null, 'is', employee_name));
        filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
        columns.push(new nlobjSearchColumn('internalid'));
        columns.push(new nlobjSearchColumn('custrecord_hris_empchange_emp_pay_pro_gp'))
    
        columns[0].setSort(true);
    
        let s_result = nlapiSearchRecord('customrecord_hris_employee_compen_change', null, filters, columns)
    
        if (s_result != null) {
            let s_paygroup = s_result[0].getValue('custrecord_hris_empchange_emp_pay_pro_gp')
        } //End of if (s_result != null) 
 */
        let employeecompensql = "Select * from customrecord_hris_employee_compen_change where custrecord_hris_empchange_employee_nam = " + employee_name + "  and isinactive ='F'";
                log.debug('employeecompensql', employeecompensql);
             //   console.log(employeecompensql);
                let employeecompensqlrecords = getResult(employeecompensql);
            
                if (employeecompensqlrecords.length > 0) {
                    let rec = employeecompensqlrecords[0];
                  
                   let s_paygroup = rec.custrecord_hris_empchange_emp_pay_pro_gp;
                }
                    
        return s_paygroup
    }
    function searchPayCompold(i_paygroup_earn)
{
	let PTID;
	let Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'is',i_paygroup_earn));
	Filters.push(new nlobjSearchFilter('custrecord_hris__sequence_no_', null, 'equalto',36));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	let column = new Array();
	column.push(new nlobjSearchColumn('internalid'));	
	let searchPTCheck= nlapiSearchRecord('customrecord_hris_payroll_component',null, Filters, column);		
	if(searchPTCheck !=null)
	{
		PTID = searchPTCheck[0].getValue('internalid');	
	}//End if(searchNetCheck !=null)
	return PTID;
}//searchPTId(i_paygroup_earn)
function searchPayComp(i_paygroup_earn)
{
	let PTID;
	let employeecompensql = "Select * from customrecord_hris_payroll_component \
             where custrecord_hris_pay_process_group = " + i_paygroup_earn + " \
             and custrecord_hris__sequence_no_=36  and isinactive ='F'";
                log.debug('employeecompensql', employeecompensql);
               // console.log(employeecompensql);
                let employeecompensqlrecords = getResult(employeecompensql);
            
                if (employeecompensqlrecords.length > 0) {
                    let rec = employeecompensqlrecords[0];
                  
                    PTID = rec.id;
                }

	return PTID;
}//searchPTId(i_paygroup_earn)
    
    function formatedDateold(end_date) {
    
        let date_format = checkDateFormat();
        let endDate = nlapiStringToDate(end_date);
        let year = endDate.getFullYear();
        nlapiLogExecution('DEBUG', 'formated year', year)
        let Anvr_month = endDate.getMonth() + 1;
        nlapiLogExecution('DEBUG', 'formated Anvr_month', Anvr_month)
        let Anvr_DateVal = endDate.getDate();
        nlapiLogExecution('DEBUG', 'formated Anvr_DateVal', Anvr_DateVal)
    
        if (date_format == 'YYYY-MM-DD') {
            let newDate = year + '-' + Anvr_month + '-' + Anvr_DateVal;
        }
        if (date_format == 'DD/MM/YYYY') {
            let newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;
    
        }
        if (date_format == 'D/M/YYYY') {
            let newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;
    
        }
        if (date_format == 'MM/DD/YYYY') {
            let newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
        }
        if (date_format == 'M/D/YYYY') {
            let newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
        }
    
        if (date_format == 'DD-MM-YYYY') {
            let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
        }
    
        if (date_format == 'DD-Mon-YYYY') {
            let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
        }
    
        if (date_format == 'DD.MM.YYYY') {
            let newDate = Anvr_DateVal + '.' + Anvr_month + '.' + year;
        }
        if (date_format == 'DD-Month-YYYY') {
            let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
        }
        if (date_format == 'YYYY/MM/DD') {
            let newDate = year + '/' + Anvr_month + '/' + Anvr_DateVal;
        }
    
        if (date_format == 'DD MONTH, YYYY') {
    
            let newDate = Anvr_DateVal + ' ' + Anvr_month + ',' + year;
    
        }
        nlapiLogExecution('DEBUG', 'formated newDate', newDate);
        return newDate;
    
    }
    function formatedDate(end_date) {
        // Check the date format
        let date_format = checkDateFormat();  // Assuming checkDateFormat() is defined elsewhere
        let endDate = format.parse({ value: end_date, type: format.Type.DATE });

        let year = endDate.getFullYear();
        log.debug('Formatted year', year);
        let Anvr_month = endDate.getMonth() + 1;
        log.debug('Formatted Anvr_month', Anvr_month);
        let Anvr_DateVal = endDate.getDate();
        log.debug('Formatted Anvr_DateVal', Anvr_DateVal);

        let newDate;
        // Format based on the date_format variable
        if (date_format == 'YYYY-MM-DD') {
            newDate = year + '-' + (Anvr_month < 10 ? '0' + Anvr_month : Anvr_month) + '-' + (Anvr_DateVal < 10 ? '0' + Anvr_DateVal : Anvr_DateVal);
        }
        else if (date_format == 'DD/MM/YYYY') {
            newDate = (Anvr_DateVal < 10 ? '0' + Anvr_DateVal : Anvr_DateVal) + '/' + (Anvr_month < 10 ? '0' + Anvr_month : Anvr_month) + '/' + year;
        }
        else if (date_format == 'D/M/YYYY') {
            newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;
        }
        else if (date_format == 'MM/DD/YYYY') {
            newDate = (Anvr_month < 10 ? '0' + Anvr_month : Anvr_month) + '/' + (Anvr_DateVal < 10 ? '0' + Anvr_DateVal : Anvr_DateVal) + '/' + year;
        }
        else if (date_format == 'M/D/YYYY') {
            newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
        }
        else if (date_format == 'DD-MM-YYYY') {
            newDate = (Anvr_DateVal < 10 ? '0' + Anvr_DateVal : Anvr_DateVal) + '-' + (Anvr_month < 10 ? '0' + Anvr_month : Anvr_month) + '-' + year;
        }
        else if (date_format == 'DD-Mon-YYYY') {
            newDate = (Anvr_DateVal < 10 ? '0' + Anvr_DateVal : Anvr_DateVal) + '-' + getMonthAbbr(Anvr_month) + '-' + year; // You'll need to implement getMonthAbbr()
        }
        else if (date_format == 'DD.MM.YYYY') {
            newDate = (Anvr_DateVal < 10 ? '0' + Anvr_DateVal : Anvr_DateVal) + '.' + (Anvr_month < 10 ? '0' + Anvr_month : Anvr_month) + '.' + year;
        }
        else if (date_format == 'DD-Month-YYYY') {
            newDate = (Anvr_DateVal < 10 ? '0' + Anvr_DateVal : Anvr_DateVal) + '-' + getMonthName(Anvr_month) + '-' + year; // Implement getMonthName()
        }
        else if (date_format == 'YYYY/MM/DD') {
            newDate = year + '/' + (Anvr_month < 10 ? '0' + Anvr_month : Anvr_month) + '/' + (Anvr_DateVal < 10 ? '0' + Anvr_DateVal : Anvr_DateVal);
        }
        else if (date_format == 'DD MONTH, YYYY') {
            newDate = (Anvr_DateVal < 10 ? '0' + Anvr_DateVal : Anvr_DateVal) + ' ' + getMonthName(Anvr_month) + ',' + year;
        }

        log.debug('Formatted newDate', newDate);
        return newDate;
    }

  
    
    function searchYearold(year) {
        let yearVal = '';
        year = year.toString();
        nlapiLogExecution('DEBUG', 'Year in searchYear function', year);
        let filter = [];
        filter.push(new nlobjSearchFilter('name', null, 'contains', year));
        filter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    
        let column = [];
        column.push(new nlobjSearchColumn('internalid'));
    
        let search = nlapiSearchRecord('customlist_hris_year_master', null, filter, column);
        if (search) {
            yearVal = search[0].getValue('internalid')
        }
        nlapiLogExecution('DEBUG', 'yearVal in SearchYear  Func', yearVal);
        return yearVal;
    }
    
    function searchYear(year) {
        let yearVal = '';
        year = year.toString();
        log.debug('Year in searchYear function', year);

        // Create the search filters
        let filters = [
            ['name', 'contains', year],
            'AND',
            ['isinactive', 'is', 'F']
        ];

        // Create the search columns
        let columns = [
            search.createColumn({ name: 'internalid' })
        ];

        // Perform the search
        let searchResult = search.create({
            type: 'customlist_hris_year_master',
            filters: filters,
            columns: columns
        }).run().getRange({ start: 0, end: 1 });

        // Check if there are results
        if (searchResult.length > 0) {
            yearVal = searchResult[0].getValue('internalid');
        }

        log.debug('yearVal in SearchYear Func', yearVal);
        return yearVal;
    }
    
    function _Is_Valid(value) //
    {
        if (value != null && value != '' && value != 'undefined') // 
        {
            return true;
        }
        return false;
    }
    
    function remFormatedDate(remainMonth_year, remainMonth_month, lastdayOfEachMonth) {
    
        let date_format = checkDateFormat();
        let year = remainMonth_year;
        let Anvr_month = remainMonth_month
        let Anvr_DateVal = lastdayOfEachMonth;
    
        if (date_format == 'YYYY-MM-DD') {
            let newDate = year + '-' + Anvr_month + '-' + Anvr_DateVal;
        }
        if (date_format == 'DD/MM/YYYY') {
            let newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;
    
        }
        if (date_format == 'D/M/YYYY') {
            let newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;
    
        }
        if (date_format == 'MM/DD/YYYY') {
            let newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
        }
        if (date_format == 'M/D/YYYY') {
            let newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
        }
    
        if (date_format == 'DD-MM-YYYY') {
            let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
        }
    
        if (date_format == 'DD-Mon-YYYY') {
            let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
        }
    
        if (date_format == 'DD.MM.YYYY') {
            let newDate = Anvr_DateVal + '.' + Anvr_month + '.' + year;
        }
        if (date_format == 'DD-Month-YYYY') {
            let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
        }
        if (date_format == 'YYYY/MM/DD') {
            let newDate = year + '/' + Anvr_month + '/' + Anvr_DateVal;
        }
    
        if (date_format == 'DD MONTH, YYYY') {
    
            let newDate = Anvr_DateVal + ' ' + Anvr_month + ',' + year;
    
        }
    
        return newDate;
    
    }
    
    
    
    function checkDateFormatold() {
        let context = nlapiGetContext();
    
        let dateFormatPref = context.getPreference('dateformat');
    
        return dateFormatPref;
    }
    function checkDateFormat() {
        let context = runtime.getCurrentContext();
        let dateFormatPref = context.getPreference({ name: 'dateformat' });

        return dateFormatPref;
    }
    return {
        afterSubmit: afterSubmit,
        beforeSubmit: beforeSubmit,
        beforeLoad: beforeLoad
    };
});
