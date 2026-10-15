/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
var QUERY;
define(['N/record', 'N/ui/serverWidget', 'N/search', 'N/query','./moment.js', 'N/runtime','N/format'], function (record, serverWidget, search, query,moment,runtime,format) {
    QUERY = query;
    function beforeLoad(scriptContext) {
        // Leave Cancel / Leave Settlement  Before Load
        var form = scriptContext.form;
        form.clientScriptModulePath = './hris_leave_cancel_cs.js';
        var currentrecord = scriptContext.newRecord;
        var Leaverecordid = currentrecord.id;
        log.debug(' Leaverecordid',  Leaverecordid);
        var currentUser = runtime.getCurrentUser();
        var userRole = currentUser.role;
        log.debug('Current User Role', userRole);
        var user = runtime.getCurrentUser().id;
        var approvalstatus = currentrecord.getValue({
            fieldId: 'custrecord_hris_lve_hrmsapprovalstatus'
        });
        log.debug('Approval Status',approvalstatus);
        var cancelstatus = currentrecord.getValue({
            fieldId: 'custrecord_hris_lve_cancel_leavestatus'
        })||1;
        log.debug('Cancel Status',cancelstatus);
        var cancelcheck = currentrecord.getValue({
            fieldId: 'custrecord_hris_lve_cancellation'
        });
        var EmpName = currentrecord.getValue('custrecord_hris_lve_employeename');
        var Requestor = currentrecord.getValue('custrecordhris_lve_requestor');
              log.debug('Cancel Check',cancelcheck);
              var settlecheck =currentrecord.getValue({
                fieldId:'custrecord_hris_lve_leavesettlement'
              });
              log.debug('Settle check',settlecheck);
              var settlementrefid=currentrecord.getValue({
                fieldId:'custrecord_hris_lve_settlerefno'
              })||'';
              var settlementid=currentrecord.getValue({
                fieldId:'custrecord_hris_lve_settlement_refno'
              })||'';
              
              var workresumecheck = currentrecord.getValue({
                fieldId: 'custrecord_hris_lve_workresume'
            });
                  log.debug('workresumecheck',workresumecheck);     
        if ( Leaverecordid) {
            var LeaveRecord = record.load({
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
        
        var status = currentrecord.getValue({ fieldId: 'custrecord_hris_lve_staus' });
        var statusInColor = '<BR><font size=2>STATUS</font><BR><font color="red" size=2>' + (status ? status : 'Draft') + '</font>';
        currentrecord.setValue({ fieldId: 'custrecord_hris_lve_status_incolor', value: statusInColor });
        
        var statusInColorfield = form.getField({ id: 'custrecord_hris_lve_status_incolor' });
        statusInColorfield.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
        
        var namefield = form.getField({ id: 'custrecord_hris_lve_staus' });
        namefield.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

// LA Delete Record


        var newType = runtime.executionContext;
        var LeaveApp_status = currentrecord.getValue('custrecord_hris_lve_hrmsapprovalstatus');
        var leaveEncash_Status = currentrecord.getValue('custrecord_hris_lve_encashstatus');
        var role = runtime.getCurrentUser().role;

        if (scriptContext.type == 'view' && newType === runtime.ContextType.USER_INTERFACE) {
            var editButton = form.getButton('edit');
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
            var newRecord = scriptContext.newRecord;
            var _record_id = newRecord.id;
            // Section Record Check This record is already present for the applied date

            if (scriptContext.type == scriptContext.UserEventType.CREATE) {
              
                var empName = scriptContext.newRecord.getValue({ fieldId: 'custrecord_hris_lve_employeename' });
                var errorMessage = 'This record is already present for the applied date';
                var fromDate = scriptContext.newRecord.getValue({ fieldId: 'custrecord_hris_lve_fromdate' });
                var toDate = scriptContext.newRecord.getValue({ fieldId: 'custrecord_hris_lve_todate' });

                var filters = [
                    ['custrecord_hris_lve_employeename', 'anyof', empName], 'AND', [
                        ['custrecord_hris_lve_fromdate', 'onorafter', fromDate], 'AND',
                        ['custrecord_hris_lve_todate', 'onorbefore', toDate]
                    ], 'OR', [
                        ['custrecord_hris_lve_fromdate', 'within', fromDate, toDate]
                    ], 'OR', [
                        ['custrecord_hris_lve_todate', 'within', fromDate, toDate]
                    ]
                ];

                var columns = [
                    search.createColumn({ name: 'internalid' }),
                    search.createColumn({ name: 'custrecord_hris_lve_cancellation' }),
                    search.createColumn({ name: 'custrecord_hris_lve_hrmsapprovalstatus' }),
                    search.createColumn({ name: 'custrecord_hris_lve_cancel_leavestatus' })
                ];

                var leaveSearch = search.create({
                    type: 'customrecord_hris_leaveapplication',
                    filters: filters,
                    columns: columns
                }).run().getRange({ start: 0, end: 1000 });

                if (leaveSearch.length > 0) {
                    leaveSearch.forEach(function (result) {
                        var cancelStatus = result.getValue({ name: 'custrecord_hris_lve_cancel_leavestatus' });
                        var approveStatus = result.getValue({ name: 'custrecord_hris_lve_hrmsapprovalstatus' });
                        var cancelChkBox = result.getValue({ name: 'custrecord_hris_lve_cancellation' });

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
                var newRecord = record.load({ type: 'customrecord_hris_leaveapplication', id: _record_id, isDynamic: true, });
                var todayDate = new Date();
                var workResume = newRecord.getValue('custrecord_hris_lve_workresume');
                var leaveType = newRecord.getValue('custrecord_hris_lve_leavetype');
                var status = newRecord.getValue('custrecord_hris_lve_hrmsapprovalstatus');
                var workResumptionDone = newRecord.getValue('custrecord_hris_lve_workresumptiondone');
                var empployee_name = newRecord.getValue('custrecord_hris_lve_employeename');
                var sequenceNo = getLeaveConfigSequence(leaveType);
                log.debug(" workResumptionDone Sequence No", sequenceNo);
                if (status == 2 && workResumptionDone === false && sequenceNo !== '11' && sequenceNo !== '22') {
                    log.debug('Processing Work Resumption');

                    var workResume = newRecord.getValue('custrecord_hris_lve_workresume');
                    if (workResume) {


                        var expected_resume_back_date = newRecord.getValue('custrecord_hris_lve_expectedresumebackdt');
                        var actual_work_resume_date = newRecord.getValue('custrecord_hris_lve_actualresumedate');
                        var leave_total_number_of_days = newRecord.getValue('custrecord_hris_lve_totalnodays');
                        var total_delay_days = newRecord.getValue('custrecord_hris_lve_actualtotdelaydays');
                        var total_updated_delay_days = newRecord.getValue('custrecord_hris_lve_totalupdateddelayday') || 0;
                        var leave_from_date = newRecord.getValue('custrecord_hris_lve_fromdate');
        
                        actual_work_resume_date = format.parse({ value: actual_work_resume_date, type: format.Type.DATE });
                        expected_resume_back_date = format.parse({ value: expected_resume_back_date, type: format.Type.DATE });
        
                        if (!total_delay_days || total_delay_days === '' || total_delay_days === null || total_delay_days === 'null' || total_delay_days === NaN || total_delay_days === 'NaN') {
                            total_delay_days = 0;
                        }
        
                        total_delay_days = parseInt(total_delay_days, 10);
                        total_updated_delay_days = parseInt(total_updated_delay_days, 10);
        
                        var searchPayGrp = searchPaygroup(empployee_name);
                        log.debug('actual_work_resume_date', actual_work_resume_date);
                        log.debug('expected_resume_back_date', expected_resume_back_date);
                        log.debug('total_delay_days', total_delay_days);
                        log.debug('total_updated_delay_days', total_updated_delay_days);
                        log.debug('todayDate', todayDate);
        
                        var date_day = todayDate.getDate();
                        var wageDate = searchWagePeriod(searchPayGrp);
                        var wDate = wageDate.split('#');
                        log.debug('w_Date', wDate);
                        var end_date = wDate[0];
                       end_date= format.parse({value: end_date, type: format.Type.DATE})
                        log.debug('end_date', end_date);
                        var start_date = wDate[1];
                        start_date=format.parse({value: start_date, type: format.Type.DATE})
                        log.debug('start_date', start_date);
                        var leave_month = wDate[2];
                        log.debug('leave_month', leave_month);
                        var leave_year_id = wDate[3];
                        log.debug('leave_year_id', leave_year_id);
        
                        var mth = actual_work_resume_date.getMonth() + 1;
                        log.debug('mth', mth);
                        var arrear_month = mth;
        
                        if (workResume == true) {
                            if ((actual_work_resume_date < todayDate || total_delay_days < total_updated_delay_days) && sequenceNo !== '2') {
                                log.debug('Called Sequence not equal to 2 $$$$$$$$$$$$$$$$$$$$$$');
        
                                if (empployee_name && leaveType && total_delay_days < 0) {
                                    total_delay_days = Math.abs(total_delay_days);
                                    var leaveBalanceSearch = search.create({
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
        
                                    var leaveBalanceResult = leaveBalanceSearch.run().getRange({ start: 0, end: 1 });
        
                                    if (leaveBalanceResult.length > 0) {
                                        var internal_id = leaveBalanceResult[0].getValue('internalid');
                                        var balanceRecord = record.load({ type: 'customrecord_hris_leavebalance', id: internal_id });
        
                                        var avl_leave_bal = balanceRecord.getValue('custrecord_hris_lvbal_available_leave_ba');
                                        var leave_bal_taken = balanceRecord.getValue('custrecord_hris_lvbal_leave_balance_take');
        
                                        avl_leave_bal = avl_leave_bal || 0;
                                        leave_bal_taken = leave_bal_taken || 0;
        
                                        avl_leave_bal = parseFloat(avl_leave_bal) + parseFloat(total_delay_days);
                                        leave_bal_taken = parseFloat(leave_bal_taken) - parseFloat(total_delay_days);
        
                                        if (sequenceNo !== '2') {
                                            balanceRecord.setValue('custrecord_hris_lvbal_available_leave_ba', avl_leave_bal);
                                        }
                                        balanceRecord.setValue('custrecord_hris_lvbal_leave_balance_take', leave_bal_taken);
        
                                        var leaveBalanceSubmit = record.submitFields({
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
                                    var leaveBalanceSearch = search.create({
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
                        
                                    var leaveBalanceResult = leaveBalanceSearch.run().getRange({ start: 0, end: 1 });
                        
                                    if (leaveBalanceResult.length > 0) {
                                        var balanceRecordId = leaveBalanceResult[0].getValue('internalid');
                                        var balanceRecord = record.load({
                                            type: 'customrecord_hris_leavebalance',
                                            id: balanceRecordId,
                                            isDynamic: true,
                                        });
                        
                                        var leave_bal_taken = parseFloat(balanceRecord.getValue('custrecord_hris_lvbal_leave_balance_take')) || 0;
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
                                        var calculate_date;
                                        if (actual_work_resume_date < expected_resume_back_date) {
                                            calculate_date = expected_resume_back_date;
                                        } else {
                                            calculate_date = actual_work_resume_date;
                                        }
                    
                                        var daysDiff = Math.round((todayDate.getTime() - calculate_date.getTime()) / (24 * 60 * 60 * 1000));
                                        log.debug('create arrear entry daysDiff', daysDiff);
                    
                                        if (daysDiff > 0) { // arrears create only greater than 0 days
                                            var arrears_record = search.create({
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
                    
                                                var create_arrears = record.create({
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
                    
                                                var create_arrears_id = create_arrears.save({ enableSourcing: true, ignoreMandatoryFields: true });
                                                log.debug('create_arrears submit', create_arrears_id);
                                            } else {
                                                var internal_id = arrears_record[0].id;
                                                var load_record = record.load({
                                                    type: 'customrecord_hris_unpaid_arrear_entry',
                                                   
                                                    id: internal_id,
                                                    isDynamic: true,
                                                });
                    
                                                load_record.setValue({
                                                    fieldId: 'custrecord_hris_uae_arrear_days',
                                                    value: daysDiff
                                                });
                    
                                                var load_arrears_submit = load_record.save({ enableSourcing: true, ignoreMandatoryFields: true });
                                                log.debug('load_arrears_submit', load_arrears_submit);
                                            }
                                        }
                                    }
                                }
                            }
                            if (sequenceNo == '2') {
                                log.debug('Called Sequence equal to 2 ***********************');
                    
                                var employeeName = newRecord.getValue({ fieldId: 'employee_name' });
                                var leaveType = newRecord.getValue({ fieldId: 'leave_type' });
                                var totalDelayDays = newRecord.getValue({ fieldId: 'total_delay_days' });
                                var actualWorkResumeDate =newRecord.getValue({ fieldId: 'actual_work_resume_date' });
                                var todayDate = new Date();
                    
                                if (employeeName && leaveType) {
                                    var leaveBalanceSearch = search.create({
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
                    
                                    var searchResult = leaveBalanceSearch.run().getRange({ start: 0, end: 1 });
                    
                                    if (searchResult.length > 0) {
                                        var internalId = searchResult[0].getValue({ name: 'internalid' });
                                        var balanceRecord = record.load({
                                            type: 'customrecord_hris_leavebalance',
                                            id: internalId,
                                            isDynamic: true,
                                        });
                    
                                        var leaveBalTaken = balanceRecord.getValue({ fieldId: 'custrecord_hris_lvbal_leave_balance_take' });
                                        if (!leaveBalTaken) {
                                            leaveBalTaken = 0;
                                        }
                    
                                        leaveBalTaken = parseFloat(leaveBalTaken) + parseFloat(totalDelayDays);
                                        balanceRecord.setValue({
                                            fieldId: 'custrecord_hris_lvbal_leave_balance_take',
                                            value: leaveBalTaken
                                        });
                    
                                        var leaveBalanceSubmit = balanceRecord.save({ enableSourcing: true, ignoreMandatoryFields: true });
                                        log.debug('leave_balance_submit for sequence_no 2', leaveBalanceSubmit);
                    
                                        var oneDay = 24 * 60 * 60 * 1000;
                                        var daysDiff = Math.round((new Date(actualWorkResumeDate).getTime() - todayDate.getTime()) / oneDay);
                    
                                        if (daysDiff > 0) {
                                            var arrearsSearch = search.create({
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
                    
                                            var arrearsResult = arrearsSearch.run().getRange({ start: 0, end: 1 });
                    
                                            if (arrearsResult.length === 0) {
                                                log.debug('Arrear creation for sequence_no 2');
                                                var createArrears = record.create({
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
                    
                                                var createArrearsSubmit = createArrears.save({ enableSourcing: true, ignoreMandatoryFields: true });
                                                log.debug('create_arrears submit', createArrearsSubmit);
                                            } else {
                                                var internalIdArrears = arrearsResult[0].getValue({ name: 'internalid' });
                                                var loadRecord = record.load({
                                                    type: 'customrecord_hris_unpaid_arrear_entry',
                                                    id: internalIdArrears,
                                                    isDynamic: true,
                                                });
                    
                                                loadRecord.setValue({ fieldId: 'custrecord_hris_uae_arrear_days', value: daysDiff });
                    
                                                var loadArrearsSubmit = loadRecord.save({ enableSourcing: true, ignoreMandatoryFields: true });
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
                        var actualResumeDate = newRecord.getValue('custrecord_hris_lve_actualresumedate');
                        var employeeId = newRecord.getValue('custrecord_hris_lve_employeename');

                        if (actualResumeDate && employeeId) {
                            var employeeRecord = record.load({
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
                            var empcompensql = "select * from customrecord_hris_employee_compen_change \
                    where custrecord_hris_empchange_employee_nam ="+ employeeId + " and isinactive ='F'"

                            log.debug('empcompensql', empcompensql);

                            var empcompensqlrecords = getResult(empcompensql);

                            if (empcompensqlrecords.length > 0) {
                                var compenid = empcompensqlrecords[0].id;
                                var EmployeecompenID = record.submitFields({
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
                    
                 
                    
                    var expected_resume_back_date = newRecord.getValue('custrecord_hris_lve_expectedresumebackdt');
                    var actual_work_resume_date = newRecord.getValue('custrecord_hris_lve_actualresumedate');
                    var leave_total_number_of_days = newRecord.getValue('custrecord_hris_lve_totalnodays');
                    var total_delay_days = newRecord.getValue('custrecord_hris_lve_actualtotdelaydays');
                    var total_updated_delay_days = newRecord.getValue('custrecord_hris_lve_totalupdateddelayday');
                    var leave_from_date = newRecord.getValue('custrecord_hris_lve_fromdate');
                    leave_from_date=format.parse({value: leave_from_date, type: format.Type.DATE})
                    
                   // var paid_leave_end_date = util.addDays(format.parse({value: leave_from_date, type: format.Type.DATE}), 45);
                    var paid_leave_end_date=  moment(leave_from_date).add(45, 'days');
                    log.debug('leave_from_date', leave_from_date);
                    log.debug('paid_leave_end_date', paid_leave_end_date);
                    
                    function monthDiff(dateFrom, dateTo) {
                        return dateTo.getMonth() - dateFrom.getMonth() + 1 +
                            (12 * (dateTo.getFullYear() - dateFrom.getFullYear()));
                    }
                    
                    var total_months_difference = monthDiff(new Date(format.parse({value: leave_from_date, type: format.Type.DATE})), new Date(paid_leave_end_date));
        
                    actual_work_resume_date = format.parse({value: actual_work_resume_date, type: format.Type.DATE});
                    expected_resume_back_date = format.parse({value: expected_resume_back_date, type: format.Type.DATE});
                    
                    if (!total_delay_days || total_delay_days == '' || total_delay_days == null || total_delay_days == 'null' || total_delay_days == NaN || total_delay_days == 'NaN') {
                        total_delay_days = 0;
                    }
                    
                    total_delay_days = parseInt(total_delay_days);
                    total_updated_delay_days = parseInt(total_updated_delay_days);
                    
                    var searchPayGrp = searchPayGroup(empployee_name);
                    
                    log.debug('actual_work_resume_date', actual_work_resume_date);
                    log.debug('expected_resume_back_date', expected_resume_back_date);
                    log.debug('total_delay_days', total_delay_days);
                    log.debug('total_updated_delay_days', total_updated_delay_days);
                    log.debug('todayDate', todayDate);
                    
                    var date_day = todayDate.getDate();
                    
                    var leave_month = actual_work_resume_date.getMonth() + 1;
                    var leave_year = actual_work_resume_date.getFullYear();
                    
                    log.debug('leave_month', leave_month);
                    log.debug('leave_year', leave_year);
                    
                    var leave_year_id = searchYear(leave_year);
                    
                    var arrear_month = leave_month;
                    var current_month = todayDate.getMonth() + 1;
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
                    
                    var finalDate = remFormatedDate(leave_year, leave_month, '01');
                    var date = format.parse({value: finalDate, type: format.Type.DATE});
                    var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                    var end_date = formatedDate(format.format({value: lastDay, type: format.Type.DATE}));
                    log.debug('formate end_date', end_date);
                    
                    if (work_resume == 'T') {
                        if (empployee_name && leaveType && total_delay_days != 0) {
                            var customrecord_hris_leavebalanceSearch = search.create({
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
                                var internal_id = customrecord_hris_leavebalanceSearch[0].getValue('internalid');
                                var _balace_record = record.load({
                                    type: 'customrecord_hris_leavebalance',
                                    id: internal_id,
                                    isDynamic: true,
                                });
                                
                                var avl_leave_bal = _balace_record.getValue('custrecord_hris_lvbal_available_leave_ba');
                                var leave_bal_taken = _balace_record.getValue('custrecord_hris_lvbal_leave_balance_take');
                                
                                avl_leave_bal = avl_leave_bal || 0;
                                leave_bal_taken = leave_bal_taken || 0;
                                
                                leave_bal_taken = parseFloat(leave_bal_taken) + parseFloat(total_delay_days);
                                _balace_record.setValue('custrecord_hris_lvbal_leave_balance_take', leave_bal_taken);
                                
                                var leave_balnce_submit = _balace_record.save();
                                log.debug('leave_balnce_submit', leave_balnce_submit);
                            }
                            
                            if (total_delay_days > 0) {
                                var filter = [];
                                var column = [];
                                leave_month = gethrisMonth(leave_month);
                                filter.push(['custrecord_hris_ule_leave_reference_no', null, 'is', _record_id]);
                                filter.push(['custrecord_hris_ule_pay_group', null, 'is', searchPayGrp]);
                                filter.push(['custrecord_hris_ule_month', null, 'is', leave_month]);
                                filter.push(['custrecord_hris_ule_year', null, 'is', leave_year_id]);
                                filter.push(['custrecord_hris_ule_leave_type', null, 'is', 3]);
                                filter.push(['isinactive', null, 'is', 'F']);
                                
                                column.push('internalid');
                                var unpLeaveSearch = search.create({
                                    type: 'customrecord_hris_unpaid_leave_entry',
                                    filters: filter,
                                    columns: column
                                }).run().getRange({start: 0, end: 1});
                                
                                if (unpLeaveSearch.length === 0) {
                                    log.debug('Inside !unpLeaveSearch Create part');
                                    var unpLeavRecord = record.create({
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
                                    
                                    var createdRecordID = unpLeavRecord.save();
                                    log.debug('createdRecordID unpaid', createdRecordID);
                                } else {
                                    var unpaid_id = unpLeaveSearch[0].id;
                                    var load_record = record.load({
                                        type: 'customrecord_hris_unpaid_leave_entry',
                                        id: unpaid_id,
                                        isDynamic: true,
                                    });
                                    
                                    var no_of_days = load_record.getValue('custrecord_hris_ule_noof_days');
                                    no_of_days = parseInt(no_of_days);
                                    load_record.setValue('custrecord_hris_ule_noof_days', no_of_days + total_delay_days);
                                    load_record.setValue('custrecord_hris_ule_final_days', no_of_days + total_delay_days);
                                    
                                    var createdRecordID = load_record.save();
                                    log.debug('updated createdRecordID unpaid', createdRecordID);
                                }
                            }
                        }
                    }
                }
            }
            // Monthly Salary Input creation
            if (scriptContext.type == scriptContext.UserEventType.EDIT) {
               
                var newRecord = scriptContext.newRecord;
                var recordId= newRecord.id;
                log.debug('recordId', recordId);
                var o_leaveApp = record.load({ type: 'customrecord_hris_leaveapplication', id: recordId, isDynamic: true, });
    
                var emp_Id = o_leaveApp.getValue({ fieldId: 'custrecord_hris_lve_employeename' });
                log.debug('WFH', 'emp_Id --> ' + emp_Id);
    
                var leaveType = o_leaveApp.getValue({ fieldId: 'custrecord_hris_lve_leavetype' });
                log.debug('WFH', 'leaveType --> ' + leaveType);
    
                var leaveRefNo = o_leaveApp.getValue({ fieldId: 'name' });
                var LeaveApplication_Status = o_leaveApp.getValue({ fieldId: 'custrecord_hris_lve_hrmsapprovalstatus' });
                log.debug('WFH', 'LeaveApplication_Status --> ' + LeaveApplication_Status);
    
                var leaveCancelStatus = o_leaveApp.getValue({ fieldId: 'custrecord_hris_lve_cancel_leavestatus' });
                var cancel_check = o_leaveApp.getValue({ fieldId: 'custrecord_hris_lve_cancellation' });
                var salAmt = o_leaveApp.getValue({ fieldId: 'custrecord_hris_lve_airticketamount' });
                var airTicketChk = o_leaveApp.getValue({ fieldId: 'custrecord_hris_lve_airticketrequired' });
    
                log.debug('LeaveApplication_Status', LeaveApplication_Status);
                log.debug('cancel_check', cancel_check);
                log.debug('airTicketChk', airTicketChk);
    
                var seq_no = getLeaveConfigSequence(leaveType);
                if (airTicketChk == true && cancel_check == false && LeaveApplication_Status == '2') {
                    var fromDate = o_leaveApp.getValue({ fieldId: 'custrecord_hris_lve_fromdate' });
                    log.debug('Integration fromDate', fromDate);
                    fromDate = format.parse({ value: fromDate, type: format.Type.DATE });
                    
                    var searchPayGrp = searchPayGrp(emp_Id);
                    var payComp = searchPayComp(searchPayGrp);
    
                    fromDate = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 0);  // Get last day of the month
                    var lastDayDate_frmDate = fromDate.getDate();
                    var lastDayMonth_frmDate = fromDate.getMonth() + 1;
                    var lastDayYear_frmDate = fromDate.getFullYear();
    
                    var finalDate_toDate = remFormatedDate(lastDayYear_frmDate, lastDayMonth_frmDate, lastDayDate_frmDate);
                    log.debug('Integration finalDate_toDate', finalDate_toDate);
                    log.debug('payComp', payComp);
    
                    var year = lastDayYear_frmDate;
                    year = year.toString();
                    var YearId = searchYear(year);
    
                    var filters = [
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
    
                    var searchResult = search.create({
                        type: 'customrecord_hris_monthlysalinput',
                        filters: filters,
                        columns: ['internalid']
                    }).run().getRange({ start: 0, end: 1 });
    
                    if (searchResult.length === 0) {
                        var msi_rec = record.create({ type: 'customrecord_hris_monthlysalinput', isDynamic: true, });
                        msi_rec.setValue({ fieldId: 'custrecord_hris_mthsal_empname', value: emp_Id });
                        msi_rec.setValue({ fieldId: 'custrecord_hris_mthsal_paygroup', value: searchPayGrp });
                        msi_rec.setValue({ fieldId: 'custrecord_hris_mthsal_paydt', value: finalDate_toDate });
    
                        lastDayMonth_frmDate = gethrisMonth(lastDayMonth_frmDate);  // Assuming this function returns the correct month format
                        msi_rec.setValue({ fieldId: 'custrecord_hris_mthsal_month', value: lastDayMonth_frmDate });
                        msi_rec.setValue({ fieldId: 'custrecord_hris_mthsal_year', value: YearId });
                        msi_rec.setValue({ fieldId: 'custrecord_hris_mthsal_paycomponent', value: payComp });
                        msi_rec.setValue({ fieldId: 'custrecord_hris_mthsal_salaryamount', value: salAmt });
                        msi_rec.setValue({ fieldId: 'custrecord_hris_mthsal_msileaverefno', value: recordId });
    
                        var id = msi_rec.save({ enableSourcing: true, ignoreMandatoryFields: true });
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
            
                var newRecord = scriptContext.newRecord;
                
                var s_auto_prfix = '';
                var recordType = newRecord.type;
                log.debug('userEventBeforeLoad', 'Record Type: ' + recordType);
                if (recordType =="customrecord_hris_leaveapplication") {
                    s_auto_prfix = "LA";
                  }
                
                
                
                var i_rec_type_id = newRecord.getValue({ fieldId: 'rectype' });
                log.debug('i_rec_type_id', i_rec_type_id);
                
                var searchResults = search.create({
                    type: 'customrecord_hris_unique_reference_numbe',
                    filters: [
                        ['custrecord_hris_record_type', 'anyof', i_rec_type_id],
                        'AND',
                        ['isinactive', 'is', 'F']
                    ],
                    columns: ['custrecord_hris_record_type', 'custrecord_hris_unique_number']
                }).run().getRange({ start: 0, end: 1 });
                
                if (searchResults.length > 0) {
                    var uniqueRefRecord = searchResults[0];
                    var i_id_unique_ref = uniqueRefRecord.id;
                    var i_unique_num = parseInt(uniqueRefRecord.getValue('custrecord_hris_unique_number')) + 1;
                    
                    var d_current_date = new Date();
                    var i_fullYear = d_current_date.getFullYear();
                    
                    var i_employee;
                   
                            i_employee = newRecord.getValue({ fieldId: 'custrecord_hris_lve_employeename' });
                   
                    
                    var s_name = search.lookupFields({
                        type: 'employee',
                        id: i_employee,
                        columns: ['firstname']
                    }).firstname;
                    
                    var s_emp_char = '';
                    if (s_name) {
                        var nameParts = s_name.split(' ');
                        if (!isNaN(nameParts[0])) {
                            nameParts.shift();
                        }
                        s_name = nameParts.join(' ').toUpperCase();
                        s_emp_char = s_name.substring(0, 2);
                    }
                    
                    var s_auto_number = s_auto_prfix + '-' + i_unique_num + '-' + i_fullYear;
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
        
        
        var newRecord = scriptContext.newRecord;
        var custformscript =newRecord.getValue('custrecord_hris_lve_script_version');
       log.debug("custformscript",custformscript)
     if (custformscript == 1){ 
       
        // Get field values
        var EmployeeNAME = newRecord.getValue('custrecord_hris_lve_employeename');
        var EmployeeCODE = newRecord.getValue('custrecord_hris_lve_empcode');
        var Manager = newRecord.getValue('custrecord_hris_lve_supervisor');
        var ProjectSupervisor = newRecord.getValue('custrecord_hris_lve_project_supervisor');
        var LeaveType = newRecord.getValue('custrecord_hris_lve_leavetype');
        var LeaveBalance = newRecord.getValue('custrecord_hris_lve_leavebalance');
        var FromDate = newRecord.getValue('custrecord_hris_lve_fromdate');
        var FromHalfDay = newRecord.getValue('custrecord_hris_lve_fromhalfday');
        var ToDate = newRecord.getValue('custrecord_hris_lve_todate');
        var ToHalfDay = newRecord.getValue('custrecord_hris_lve_tohalfday');
        var TotalNoDays = newRecord.getValue('custrecord_hris_lve_totalnodays');
        var ValidTillDate = newRecord.getValue('custrecord_hris_lve_validtilldate');
        var LeaveReason = newRecord.getValue('custrecord_hris_lve_leavereason');
        var SupportDoc = newRecord.getValue('custrecord_hris_lve_supportdocument');
        var LeaveAppStatus = newRecord.getValue('custrecord_hris_lve_staus');
        
        // Create Pullback record
        var pullBackRecord = record.create({
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
        
        var pullBackRecord_ID = pullBackRecord.save({ enableSourcing: true, ignoreMandatoryFields: true });
        log.debug('Pullback Record Created', pullBackRecord_ID);
    }
}
// LA Delete Record Validation
var newRecord = scriptContext.newRecord;
var Tot_no_Days = newRecord.getValue('custrecord_hris_lve_totalnodays');
var LeaveApp_status = newRecord.getValue('custrecord_hris_lve_hrmsapprovalstatus');
var leaveEncash_Status = newRecord.getValue('custrecord_hris_lve_encashstatus');

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
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1;
        var yyyy = today.getFullYear();
        return mm + '/' + dd + '/' + yyyy;
    }
    function getResult(pSQL) {
        // log.debug("QUERY", pSQL);
        var queryResults = QUERY.runSuiteQL({
            query: pSQL
        });
        var records = queryResults.asMappedResults();
        return records;
    }
    function searchWagePeriod(pay_group) {

        var wageperiodsql = " select * from customrecord_hris_wage_period_details \
                           where custrecord_hris_pay_group = "+ pay_group + " and isinactive='F'"

        log.debug('wageperiodsql',wageperiodsql);
        var wageperiodsqlrecords = getResult(wageperiodsql);

        if (wageperiodsqlrecords.length > 0) {
            var rec = wageperiodsqlrecords[0];
            var WagePeriod_EndDate = rec.custrecord_hris_end_date;

            var start_date = rec.custrecord_hris_start_date;

            var month = rec.custrecord_hris_month;

            var year = rec.custrecord_hris_year;

        }//End of if(searchResult !=null)
        return WagePeriod_EndDate + "#" + start_date + "#" + month + "#" + year;
    }
    function getLeaveConfigSequence(Leave_type) {
        try {

            var leavesequencesql = "select * from customrecord_hris_leaveconfig where id ='" + Leave_type + "' and isinactive ='F'"
            log.debug("leavesequencesql", leavesequencesql);
            var queryResult = query.runSuiteQL({
                query: leavesequencesql,
            });
            var leavesequencesqlrecords = queryResult.asMappedResults();


            log.debug(" leavesequencesqlrecords.length", leavesequencesqlrecords.length);
            if (leavesequencesqlrecords.length > 0) {


                var sequence_no = leavesequencesqlrecords[0].custrecord_hris_lvecnfg_seqno;
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
       /*  var filters = new Array();
        var columns = new Array();
    
        filters.push(new nlobjSearchFilter('custrecord_hris_empchange_employee_nam', null, 'is', employee_name));
        filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
        columns.push(new nlobjSearchColumn('internalid'));
        columns.push(new nlobjSearchColumn('custrecord_hris_empchange_emp_pay_pro_gp'))
    
        columns[0].setSort(true);
    
        var s_result = nlapiSearchRecord('customrecord_hris_employee_compen_change', null, filters, columns)
    
        if (s_result != null) {
            var s_paygroup = s_result[0].getValue('custrecord_hris_empchange_emp_pay_pro_gp')
        } //End of if (s_result != null) 
 */
        var employeecompensql = "Select * from customrecord_hris_employee_compen_change where custrecord_hris_empchange_employee_nam = " + employee_name + "  and isinactive ='F'";
                log.debug('employeecompensql', employeecompensql);
             //   console.log(employeecompensql);
                var employeecompensqlrecords = getResult(employeecompensql);
            
                if (employeecompensqlrecords.length > 0) {
                    var rec = employeecompensqlrecords[0];
                  
                   var s_paygroup = rec.custrecord_hris_empchange_emp_pay_pro_gp;
                }
                    
        return s_paygroup
    }
    function searchPayCompold(i_paygroup_earn)
{
	var PTID;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'is',i_paygroup_earn));
	Filters.push(new nlobjSearchFilter('custrecord_hris__sequence_no_', null, 'equalto',36));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var column = new Array();
	column.push(new nlobjSearchColumn('internalid'));	
	var searchPTCheck= nlapiSearchRecord('customrecord_hris_payroll_component',null, Filters, column);		
	if(searchPTCheck !=null)
	{
		PTID = searchPTCheck[0].getValue('internalid');	
	}//End if(searchNetCheck !=null)
	return PTID;
}//searchPTId(i_paygroup_earn)
function searchPayComp(i_paygroup_earn)
{
	var PTID;
	var employeecompensql = "Select * from customrecord_hris_payroll_component \
             where custrecord_hris_pay_process_group = " + i_paygroup_earn + " \
             and custrecord_hris__sequence_no_=36  and isinactive ='F'";
                log.debug('employeecompensql', employeecompensql);
               // console.log(employeecompensql);
                var employeecompensqlrecords = getResult(employeecompensql);
            
                if (employeecompensqlrecords.length > 0) {
                    var rec = employeecompensqlrecords[0];
                  
                    PTID = rec.id;
                }

	return PTID;
}//searchPTId(i_paygroup_earn)
    
    function formatedDateold(end_date) {
    
        var date_format = checkDateFormat();
        var endDate = nlapiStringToDate(end_date);
        var year = endDate.getFullYear();
        nlapiLogExecution('DEBUG', 'formated year', year)
        var Anvr_month = endDate.getMonth() + 1;
        nlapiLogExecution('DEBUG', 'formated Anvr_month', Anvr_month)
        var Anvr_DateVal = endDate.getDate();
        nlapiLogExecution('DEBUG', 'formated Anvr_DateVal', Anvr_DateVal)
    
        if (date_format == 'YYYY-MM-DD') {
            var newDate = year + '-' + Anvr_month + '-' + Anvr_DateVal;
        }
        if (date_format == 'DD/MM/YYYY') {
            var newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;
    
        }
        if (date_format == 'D/M/YYYY') {
            var newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;
    
        }
        if (date_format == 'MM/DD/YYYY') {
            var newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
        }
        if (date_format == 'M/D/YYYY') {
            var newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
        }
    
        if (date_format == 'DD-MM-YYYY') {
            var newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
        }
    
        if (date_format == 'DD-Mon-YYYY') {
            var newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
        }
    
        if (date_format == 'DD.MM.YYYY') {
            var newDate = Anvr_DateVal + '.' + Anvr_month + '.' + year;
        }
        if (date_format == 'DD-Month-YYYY') {
            var newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
        }
        if (date_format == 'YYYY/MM/DD') {
            var newDate = year + '/' + Anvr_month + '/' + Anvr_DateVal;
        }
    
        if (date_format == 'DD MONTH, YYYY') {
    
            var newDate = Anvr_DateVal + ' ' + Anvr_month + ',' + year;
    
        }
        nlapiLogExecution('DEBUG', 'formated newDate', newDate);
        return newDate;
    
    }
    function formatedDate(end_date) {
        // Check the date format
        var date_format = checkDateFormat();  // Assuming checkDateFormat() is defined elsewhere
        var endDate = format.parse({ value: end_date, type: format.Type.DATE });

        var year = endDate.getFullYear();
        log.debug('Formatted year', year);
        var Anvr_month = endDate.getMonth() + 1;
        log.debug('Formatted Anvr_month', Anvr_month);
        var Anvr_DateVal = endDate.getDate();
        log.debug('Formatted Anvr_DateVal', Anvr_DateVal);

        var newDate;
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
        var yearVal = '';
        year = year.toString();
        nlapiLogExecution('DEBUG', 'Year in searchYear function', year);
        var filter = [];
        filter.push(new nlobjSearchFilter('name', null, 'contains', year));
        filter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    
        var column = [];
        column.push(new nlobjSearchColumn('internalid'));
    
        var search = nlapiSearchRecord('customlist_hris_year_master', null, filter, column);
        if (search) {
            yearVal = search[0].getValue('internalid')
        }
        nlapiLogExecution('DEBUG', 'yearVal in SearchYear  Func', yearVal);
        return yearVal;
    }
    
    function searchYear(year) {
        var yearVal = '';
        year = year.toString();
        log.debug('Year in searchYear function', year);

        // Create the search filters
        var filters = [
            ['name', 'contains', year],
            'AND',
            ['isinactive', 'is', 'F']
        ];

        // Create the search columns
        var columns = [
            search.createColumn({ name: 'internalid' })
        ];

        // Perform the search
        var searchResult = search.create({
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
    
        var date_format = checkDateFormat();
        var year = remainMonth_year;
        var Anvr_month = remainMonth_month
        var Anvr_DateVal = lastdayOfEachMonth;
    
        if (date_format == 'YYYY-MM-DD') {
            var newDate = year + '-' + Anvr_month + '-' + Anvr_DateVal;
        }
        if (date_format == 'DD/MM/YYYY') {
            var newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;
    
        }
        if (date_format == 'D/M/YYYY') {
            var newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;
    
        }
        if (date_format == 'MM/DD/YYYY') {
            var newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
        }
        if (date_format == 'M/D/YYYY') {
            var newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
        }
    
        if (date_format == 'DD-MM-YYYY') {
            var newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
        }
    
        if (date_format == 'DD-Mon-YYYY') {
            var newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
        }
    
        if (date_format == 'DD.MM.YYYY') {
            var newDate = Anvr_DateVal + '.' + Anvr_month + '.' + year;
        }
        if (date_format == 'DD-Month-YYYY') {
            var newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
        }
        if (date_format == 'YYYY/MM/DD') {
            var newDate = year + '/' + Anvr_month + '/' + Anvr_DateVal;
        }
    
        if (date_format == 'DD MONTH, YYYY') {
    
            var newDate = Anvr_DateVal + ' ' + Anvr_month + ',' + year;
    
        }
    
        return newDate;
    
    }
    
    
    
    function checkDateFormatold() {
        var context = nlapiGetContext();
    
        var dateFormatPref = context.getPreference('dateformat');
    
        return dateFormatPref;
    }
    function checkDateFormat() {
        var context = runtime.getCurrentContext();
        var dateFormatPref = context.getPreference({ name: 'dateformat' });

        return dateFormatPref;
    }
    return {
        afterSubmit: afterSubmit,
        beforeSubmit: beforeSubmit,
        beforeLoad: beforeLoad
    };
});
