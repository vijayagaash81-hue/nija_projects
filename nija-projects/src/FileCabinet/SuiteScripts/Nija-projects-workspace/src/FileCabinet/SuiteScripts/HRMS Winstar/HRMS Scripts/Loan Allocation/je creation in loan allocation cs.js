/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 *@NModuleScope Public
 */

 var SEARCH, MOMENT, RECORD, QUERY;
 define(['N/currentRecord', 'N/record', 'N/search', './moment.js', 'N/format', 'N/query'],
     function (currentRecord, record, search, moment, format, query) {
         SEARCH = search;
         MOMENT = moment;
         RECORD = record;
         QUERY = query;
 
         function pageInit(context) {
             
                 }

 
         function jvcreation() {
            debugger;
        
            try {
        
        
                var jvarray = [];
                var currentrecord = currentRecord.get()
                var leaveSettlemenID = currentrecord.id;
                var newRecordObj = record.load({
                    type: 'customrecord_hris_empchange_loan_applicn',
                    id: leaveSettlemenID,
                    isDynamic: true,
                });
        
                var approvalStatus = newRecordObj.getValue('custrecord_hris_loan_approval_status');
        
                log.debug("approvalStatus", approvalStatus);
               /*  var leaveAppNo = newRecordObj.getValue('custrecord_hrms_lveset_leaverefno') || '';
                log.debug("leaveAppNo", leaveAppNo); */
                var jeno = newRecordObj.getValue('custrecord_hris_loan_allo_je_no') || '';
                log.debug('jeno', jeno);
        
                var empid = newRecordObj.getValue('custrecord_hris_loan_emp_name');
                var empname = newRecordObj.getValue('custrecord_hris_loan_emp_name');
                var paygroup = newRecordObj.getValue('custrecord_hris_loan_process_group'); 
                var subsidiaries = newRecordObj.getValue('custrecord_hris_loan_subsidiary');
                var loanamt = newRecordObj.getValue('custrecord_hris_loan_amount') || 0;
                var loanType = newRecordObj.getValue('custrecord_hris_loan_loan_type');
                var loanDate=newRecordObj.getValue('custrecord_hris_loan_amount_issue_date');
                var loanTypeRec = record.load({
                    type: 'customrecord_hris_loan_master',
                    id: loanType,
                    isDynamic: true,
                });

                var paycomponent = loanTypeRec.getValue('custrecord_hris_loan_component');
              
                jvarray.push({
                    'leavesettleid': leaveSettlemenID,
                    'empid': empid,
                    'empname': empname,
                    'paygroup': paygroup,
                    'paycomponent': paycomponent,
                    'subsidiary': subsidiaries,
                    'loanamt': loanamt,
                    'loanDate':loanDate
        
                });
                log.debug('JV Array', jvarray);
        
                /* var paycomponent = jvarray[0].paycomponent;
                log.debug('Paycomponent', paycomponent); */
                var subsidiariesRes = jvarray[0].subsidiary;
                var paygroupParameter = jvarray[0].paygroup;
                var emp = jvarray[0].empid;
                var empTxt = jvarray[0].empname;
                var today=jvarray[0].loanDate;
                var loanamtsalaryamt = jvarray[0].loanamt;
                var componentsql = " select * from  customrecord_hris_payroll_component where id  =" + paycomponent;
        
                log.debug('componentsql  ', componentsql);
        
        
                var queryResults = query.runSuiteQL({
                    query: componentsql
                });
        
                var componentsqlrecords = queryResults.asMappedResults();
                if (componentsqlrecords.length > 0) {
                    var sett_comp_accountCodeID = componentsqlrecords[0].custrecord_hris_account_name || '';
                    log.debug('Account id', sett_comp_accountCodeID);
                }
        
        
        
                var jvObject = record.create({
                    type: 'journalentry',
                    isDynamic: true
                });
                var debit = 0;
                jvObject.setValue('customform', 135);
        
                jvObject.setValue('approvalstatus', 2);
                jvObject.setValue('subsidiary', subsidiariesRes);
                jvObject.setValue('trandate', today);
                //by florence
                //jvObject.setValue('custbody_auto_num_business_area', 12);
                jvObject.setValue('memo', 'JE creation for loan allocation ');
                //jvObject.setValue('custbody_dept_jv', departmentParam);
                jvObject.setValue('custbody_hris_paygroup_jv', paygroupParameter);
                //jvObject.setValue('custbody_hris_passjv_processtype', processType);
                /* if(processType == '2')
                { */
                jvObject.setValue('custbody_hris_jv_employeename', emp);
                //jvObject.setValue('custbody_hris_jv_emplegalname', empTxt);
                //}
        
                if (loanamtsalaryamt > 0) {
                    Deduct = parseFloat(loanamtsalaryamt)
                    var get_paycomponent = getleavesalarycomponent(paygroup,paycomponent);
                    var getpaycomponent = get_paycomponent.toString().split("#");
        
                    var comp_accountCodeID = getpaycomponent[0];
                    var paycompname = getpaycomponent[2];
                    jvObject.selectNewLine('line');
                    jvObject.setCurrentSublistValue('line', 'account', comp_accountCodeID); //Credit Account code//Component_Code
                    jvObject.setCurrentSublistValue('line', 'debit', Deduct.toFixed(2));
                    jvObject.setCurrentSublistValue('line', 'credit', 0.0);
                    jvObject.setCurrentSublistValue('line', 'memo', paycompname);
                    //jvObject.setCurrentSublistValue('line', 'entity', emp);
                    jvObject.commitLine('line')
        
                }

                if (loanamtsalaryamt > 0) {
                    Deduct = parseFloat(loanamtsalaryamt)
                    var get_paycomponent = getEmloyeecomponent(emp);
                   // var getpaycomponent = get_paycomponent.toString().split("#");
                    var comp_accountCodeID = get_paycomponent;
                    //var paycompname = getpaycomponent[2];
                    jvObject.selectNewLine('line');
                    jvObject.setCurrentSublistValue('line', 'account', comp_accountCodeID); //Credit Account code//Component_Code
                    jvObject.setCurrentSublistValue('line', 'debit',0.0 );
                    jvObject.setCurrentSublistValue('line', 'credit', Deduct.toFixed(2));
                    jvObject.setCurrentSublistValue('line', 'memo', 'payable Account');
                  //  jvObject.setCurrentSublistValue('line', 'entity', emp);
                    jvObject.commitLine('line')
        
                }
                var jvrecordId = jvObject.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug("jvrecordid", jvrecordId);
        
                var leavesettleID = record.submitFields({
                    type: 'customrecord_hris_empchange_loan_applicn',
                    id: leaveSettlemenID,
                    values: {
                        'custrecord_hris_loan_allo_je_no': jvrecordId
                    }
                });
        
                log.debug("Info", "Leave settlement voucher Updated. Internal ID : " + leavesettleID);
        
                var url = '/app/common/custom/custrecordentry.nl?rectype=282&id=' + leavesettleID
             
        
                window.location.href = url; 
            }
            catch (e) {
                log.error("Error in JV Creation", e);
                // log.debug("Error in getEmpTotalLeaveTaken : " + e);
            }
        
        }
        
        
        function getleavesalarycomponent(paygroup,paycomponent) {
            var comp_accountCodeID = ''
            //var componentsqlsal = "select id as paycompid,BUILTIN.DF(id) paycompname,custrecord_hris_account_name as accountid from  customrecord_hris_payroll_component where custrecord_hris__sequence_no_ = 62 and custrecord_hris_pay_process_group  =" + paygroup;
           var componentsqlsal ="SELECT id AS paycompid, BUILTIN.DF(id) AS paycompname, custrecord_hris_account_name AS accountid " +
"FROM customrecord_hris_payroll_component " +
"WHERE custrecord_hris__sequence_no_ = 62 " +
"AND custrecord_hris_pay_process_group = " + paygroup + " " +
"AND id = " + paycomponent;
            log.debug('componentsqlsal  ', componentsqlsal);
        
        
            var queryResults = query.runSuiteQL({
                query: componentsqlsal
            });
        
            var componentsqlrecords = queryResults.asMappedResults();
            if (componentsqlrecords.length > 0) {
                var paycompid = componentsqlrecords[0].paycompid;
                var paycompname = componentsqlrecords[0].paycompname;
                comp_accountCodeID = componentsqlrecords[0].accountid;
                log.debug('Account id', comp_accountCodeID);
            }
        
            return comp_accountCodeID + "#" + paycompid + "#" + paycompname;
        }





        function getEmloyeecomponent(emp) {
            var comp_accountCodeID = ''
            var componentsql = "select custentity_hris_payable_account as accountid from  employee where id =" + emp;
        
            log.debug('componentsql  ', componentsql);
        
        
            var queryResults = query.runSuiteQL({
                query: componentsql
            });
        
            var componentsqlrecords = queryResults.asMappedResults();
            if (componentsqlrecords.length > 0) {
                comp_accountCodeID = componentsqlrecords[0].accountid;
                log.debug('Account id', comp_accountCodeID);
            }
        
            return comp_accountCodeID
        }
         return {
             pageInit: pageInit,
             jvcreation:jvcreation,
         }
     });
 
 
 
 
 
