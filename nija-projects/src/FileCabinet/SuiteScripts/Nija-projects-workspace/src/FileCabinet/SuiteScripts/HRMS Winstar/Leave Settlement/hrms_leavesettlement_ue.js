/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
var QUERY;
define(['N/record', 'N/ui/serverWidget', 'N/search', 'N/query', 'N/format'], function (record, serverWidget, search, query, format) {
  QUERY = query;
  function beforeLoad(scriptContext) {
    var form = scriptContext.form;
    var newRecordObj = scriptContext.newRecord;
    var form = scriptContext.form;
    var type = scriptContext.type;
    log.debug("Type", type);
    // var currentRecordObj = scriptContext.newRecord;


    var approvalStatus = newRecordObj.getValue('custrecord_hrms_lveset_approvalstatus');

    log.debug("approvalStatus", approvalStatus);
    var leaveAppNo = newRecordObj.getValue('custrecord_hrms_lveset_leaverefno') || '';
    log.debug("leaveAppNo", leaveAppNo);
    var jeno = newRecordObj.getValue('custrecord_hrms_lveset_jevoucherno') || '';
    log.debug('jeno', jeno);
    var directpayment = newRecordObj.getValue('custrecord_hrms_lveset_directpayment');
    log.debug('directpayment', directpayment);

    if (scriptContext.type == 'create' || scriptContext.type == 'edit') {
      var leaveAppField = form.addField({
        id: 'custpage_leave_app_no',
        type: serverWidget.FieldType.SELECT,
        label: 'Leave Application'
        // source: "customrecord_leave_app_"
      });
      /* form.insertField({
        field: leaveAppField,
        nextfield: 'custrecord_hrms_lveset_lastworkingdate'
      }); */
      form.insertField({
        field: leaveAppField,
        nextfield: 'custrecord_hrms_lveset_leaverefno'
      });
      if (scriptContext.type == 'create') {
        leaveAppField.isMandatory = true;
      }
      if (scriptContext.type == 'edit') {

        leaveAppField.updateDisplayType({
          displayType: serverWidget.FieldDisplayType.ENTRY
        });

      }
    }
    if ((scriptContext.type == 'create' || scriptContext.type == 'edit') && approvalStatus == 1) {
      //if (scriptContext.type == 'view'){
      form.addButton({
        id: 'custpage_invoice',
        label: 'Load Details',
        functionName: 'leavesalary()'
      });
    }
    else if (scriptContext.type == 'view' && approvalStatus == 2 && jeno == '') {
      //if (scriptContext.type == 'view'){

      //   if (scriptContext.type != 'delete' ) {


      //  }

      form.addButton({
        id: 'custpage_jvcreation',
        label: 'Post JV',
        functionName: 'jvcreation()'
      });
    }

    form.clientScriptModulePath = './hrms_leavesettlement_validation_cs.js';





  }

  function beforeSubmit(scriptContext) {
    var newRecordObj = scriptContext.newRecord;
    if (scriptContext.type === scriptContext.UserEventType.CREATE) {
      var currentRecord = scriptContext.newRecord;

      var s_auto_prfix = "";
      var recordType = currentRecord.type.toLowerCase();

      if (recordType === "customrecord_hrms_leavesettlement") {
        s_auto_prfix = "LS";
      }

      var i_rec_type_id = currentRecord.getValue({
        fieldId: "rectype",
      });

      var customrecord_hris_unique_reference_numbeSearchObj = search.create({
        type: "customrecord_hris_unique_reference_numbe",
        filters: [
          ["custrecord_hris_record_type", "anyof", i_rec_type_id],
          "AND",
          ["isinactive", "is", "F"],
        ],
        columns: [
          search.createColumn({
            name: "custrecord_hris_unique_number",
            label: "Unique Number",
          }),
          search.createColumn({ name: "internalid", label: "Internal ID" }),
        ],
      });

      var searchResultCount =
        customrecord_hris_unique_reference_numbeSearchObj.runPaged().count;

      if (searchResultCount > 0) {
        customrecord_hris_unique_reference_numbeSearchObj
          .run()
          .each(function (result) {
            var i_id_unique_ref = result.getValue({ name: "internalid" });
            var i_unique_num = result.getValue({
              name: "custrecord_hris_unique_number",
            });

            i_unique_num = parseInt(i_unique_num) + 1;

            var zeros = "";
            if (i_unique_num.toString().length == 1) {
              zeros = "00";
            }
            if (i_unique_num.toString().length == 2) {
              zeros = "0";
            }
            // if (i_unique_num.toString().length == 3) { zeros = '0'; }
            // if (i_unique_num.toString().length == 4) { zeros = '0'; }

            // log.debug('Internal No :', prefix1 + '-' + prefix2 + '-' + shortYear + '-' + zeros + docno);
            var refnumber = zeros + i_unique_num;
            log.debug("refnumber", refnumber);
            var d_current_date = new Date();
            var i_fullYear = d_current_date.getFullYear();

            // var s_name = "";
            var s_auto_number =
              s_auto_prfix + "-" + "NO" + "-" + refnumber + "-" + i_fullYear;

            currentRecord.setValue({
              fieldId: "name",
              value: s_auto_number,
            });
            record.submitFields({
              type: "customrecord_hris_unique_reference_numbe",
              id: i_id_unique_ref,
              values: {
                custrecord_hris_unique_number: i_unique_num,
              },
            });

            // currentRecord.setValue({
            //   fieldId: "name",
            //   value: s_unique_ref_num,
            // });

            return true;
          });
      }
    }
    if (scriptContext.type == 'edit') {
      var approvalStatus = newRecordObj.getValue('custrecord_hrms_lveset_approvalstatus');
      var leavesettleid = scriptContext.newRecord.id;
      log.debug('leavesettleid', leavesettleid);
      log.debug("approvalStatus", approvalStatus);
      var leaveAppNo = newRecordObj.getValue('custrecord_hrms_lveset_leaverefno') || '';
      log.debug("leaveAppNo", leaveAppNo);
      var jeno = newRecordObj.getValue('custrecord_hrms_lveset_jevoucherno') || '';
      log.debug('jeno', jeno);
      var empid = newRecordObj.getValue('custrecord_hrms_lveset_empname');
      log.debug('Emp id', empid);
      var directpayment = newRecordObj.getValue('custrecord_hrms_lveset_directpayment');
      log.debug('directpayment', directpayment);
      var paidpayroll = newRecordObj.getValue('custrecord_hrms_lveset_paidthropayroll');
      log.debug('paidpayroll', paidpayroll);
      var empcategory = newRecordObj.getValue('custrecord_hrms_lveset_empcatagory');
      log.debug('empcatagory', empcategory);
      var docdate = newRecordObj.getValue('custrecord_hrms_lveset_docdate');
      log.debug('docdate', docdate);
      var leavesalaryamt = newRecordObj.getValue('custrecord_hrms_lveset_lvesalaryamount') || 0;
      log.debug('leavesalaryamt', leavesalaryamt);
      var airticketamount = newRecordObj.getValue('custrecord_hrms_lveset_airticketamount') || 0;
      log.debug('airticketamount', airticketamount);
      var accuraldays = newRecordObj.getValue('custrecord_hrms_lveset_accuraldays') || 1;
      log.debug('accuraldays', accuraldays);
      var todate = newRecordObj.getValue('custrecord_hrms_lveset_todate');
      var paydate = newRecordObj.getValue('custrecord_hrms_lveset_paydt');;
      paydate = format.parse({ value: paydate, type: format.Type.DATE })
      log.debug('paydate', paydate);
      var paygroup = newRecordObj.getValue('custrecord_hrms_lveset_paygroup');
      log.debug(' paygroup', paygroup);
      var paymonth = newRecordObj.getValue('custrecord_hrms_lveset_month');;
      log.debug('paymonth', paymonth);
      var payyear = newRecordObj.getValue('custrecord_hrms_lveset_year');;
      log.debug('payyear', payyear);
      docdate = format.parse({
        value: docdate,
        type: format.Type.DATE,
      });
      todate = format.parse({
        value: todate,
        type: format.Type.DATE,
      });
      if (approvalStatus == 2 && leaveAppNo) {
        var leaveAppID = record.submitFields({
          type: 'customrecord_hris_leaveapplication',
          id: leaveAppNo,
          values: {
            'custrecord_hris_lve_settlement_refno': scriptContext.newRecord.id
          }
        });
        log.debug("Info", "Leave Application also Updated. Internal ID : " + leaveAppID);

        var monthlysalary = getgrosssalary(empid);
        var monthlysql = "SELECT * FROM  customrecord_hris_monthly_accural_trans a\
    JOIN \
        customrecord_hris_accuraltype_master b ON a.custrecord_hris_accural_type = b.id\
         where b.custrecord_hris_accural_seqno = 1  and \
        a.custrecord_hris_accural_empid=" + empid + "\
        and a.custrecord_hris_accural_leave_settleno = " + leavesettleid + "\
        and a.isinactive='F'"
        log.debug("monthlysql", monthlysql);
        var queryResult = query.runSuiteQL({
          query: monthlysql,
        });
        var monthlysqlrecords = queryResult.asMappedResults();
        if (monthlysqlrecords.length == 0 && leavesalaryamt != 0) {
          var accuralseq = 1;
          var accuraltranseq = 3;
          var accuraltypeid = getaccuraltypesequence(accuralseq);
          var accuraltranid = getaccuraltransactiontypesequence(accuraltranseq);

          var monthlyaccuralrecord = record.create({
            type: 'customrecord_hris_monthly_accural_trans'
          });
          monthlyaccuralrecord.setValue({
            fieldId: 'custrecord_hris_accural_date',
            value: paydate
          });
          monthlyaccuralrecord.setValue({
            fieldId: 'custrecord_hris_accural_month',
            value: paymonth
          });
          monthlyaccuralrecord.setValue({
            fieldId: 'custrecord_hris_accural_year',
            value: payyear
          });
          monthlyaccuralrecord.setValue({
            fieldId: 'custrecord_hris_accural_paygroup',
            value: paygroup
          });
          monthlyaccuralrecord.setValue({
            fieldId: 'custrecord_hris_accural_empid',
            value: empid
          });
          monthlyaccuralrecord.setValue({
            fieldId: 'custrecord_hris_accural_grosssalary',
            value: monthlysalary
          });
          monthlyaccuralrecord.setValue({
            fieldId: 'custrecord_hris_accural_leave_settleno',
            value: leavesettleid
          });

          monthlyaccuralrecord.setValue({
            fieldId: 'custrecord_hris_accural_type',
            value: accuraltypeid
          });
          monthlyaccuralrecord.setValue({
            fieldId: 'custrecord_hris_accural_trans_type',
            value: accuraltranid
          });
          monthlyaccuralrecord.setValue({
            fieldId: 'custrecord_hris_accural_emp_catagory',
            value: empcategory
          });

          monthlyaccuralrecord.setValue({
            fieldId: 'custrecord_hris_accural_utilised_amount',
            value: leavesalaryamt
          });
          monthlyaccuralrecord.setValue({
            fieldId: 'custrecord_hris_accural_utilised_leave',
            value: accuraldays
          });
          var monthlyaccuralid = monthlyaccuralrecord.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });

          log.debug('Record Created', 'Monthly Leave Cancel ID: ' + monthlyaccuralid);
        }
        var monthlysql = "SELECT * FROM  customrecord_hris_monthly_accural_trans a\
            JOIN \
                customrecord_hris_accuraltype_master b ON a.custrecord_hris_accural_type = b.id\
                 where b.custrecord_hris_accural_seqno = 2  and \
                a.custrecord_hris_accural_empid=" + empid + "\
                and a.custrecord_hris_accural_leave_settleno = " + leavesettleid + "\
                and a.isinactive='F'"
        log.debug("monthlysql", monthlysql);
        var queryResult = query.runSuiteQL({
          query: monthlysql,
        });
        var monthlysqlrecords = queryResult.asMappedResults();
        if (monthlysqlrecords.length == 0 && airticketamount != 0) {
          var accuralseq = 2;
          var accuraltranseq = 4;
          var accuraltypeid = getaccuraltypesequence(accuralseq);
          var accuraltranid = getaccuraltransactiontypesequence(accuraltranseq);

          var monthlyaccuralrecord = record.create({
            type: 'customrecord_hris_monthly_accural_trans'
          });
          monthlyaccuralrecord.setValue({
            fieldId: 'custrecord_hris_accural_date',
            value: paydate
          });
          monthlyaccuralrecord.setValue({
            fieldId: 'custrecord_hris_accural_month',
            value: paymonth
          });
          monthlyaccuralrecord.setValue({
            fieldId: 'custrecord_hris_accural_year',
            value: payyear
          });
          monthlyaccuralrecord.setValue({
            fieldId: 'custrecord_hris_accural_paygroup',
            value: paygroup
          });
          monthlyaccuralrecord.setValue({
            fieldId: 'custrecord_hris_accural_empid',
            value: empid
          });
          monthlyaccuralrecord.setValue({
            fieldId: 'custrecord_hris_accural_grosssalary',
            value: monthlysalary
          });
          monthlyaccuralrecord.setValue({
            fieldId: 'custrecord_hris_accural_leave_settleno',
            value: leavesettleid
          });

          monthlyaccuralrecord.setValue({
            fieldId: 'custrecord_hris_accural_type',
            value: accuraltypeid
          });
          monthlyaccuralrecord.setValue({
            fieldId: 'custrecord_hris_accural_trans_type',
            value: accuraltranid
          });
          monthlyaccuralrecord.setValue({
            fieldId: 'custrecord_hris_accural_emp_catagory',
            value: empcategory
          });

          monthlyaccuralrecord.setValue({
            fieldId: 'custrecord_hris_accural_utilised_amount',
            value: airticketamount
          });
          monthlyaccuralrecord.setValue({
            fieldId: 'custrecord_hris_accural_utilised_leave',
            value: accuraldays
          });
          var monthlyaccuralid = monthlyaccuralrecord.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });

          log.debug('Record Created', 'Monthly Leave Cancel ID: ' + monthlyaccuralid);
        }




        if (paidpayroll == false) {

          var values = {
            'custentity_hris_empemploymentstatus': 5,
            /*   'custentity_hris_last_leavesalaryamount': leavesalaryamt,
              'custentity_hris_last_airticketamount': airticketamount,
           */
          };

          /*  if (leavesalaryamt != 0) {
             values['custentity_hris_last_leavesalarydate'] = todate;
           }
           if(airticketamount !=0){
             values['custentity_hris_last_airticketdate'] = todate;
           } */
          var EmployeeID = record.submitFields({
            type: 'employee',
            id: empid,
            values: values
          });
          log.debug("Info", "Employee Status also Updated. Internal ID : " + EmployeeID);

          var empcompensql = "select * from customrecord_hris_employee_compen_change \
              where custrecord_hris_empchange_employee_nam ="+ empid + " and isinactive ='F'"

          log.debug('empcompensql', empcompensql);

          var empcompensqlrecords = getResult(empcompensql);

          if (empcompensqlrecords.length > 0) {
            var compenid = empcompensqlrecords[0].id;
            var EmployeecompenID = record.submitFields({
              type: 'customrecord_hris_employee_compen_change',
              id: compenid,
              values: {
                'custrecord_hris_empchange_emp_active_sts': 5
              }
            });

          }
          log.debug("Info", "EmployeeCompensationStatus also Updated. Internal ID : " + EmployeecompenID);
        }
        else if (paidpayroll == true) {

          var values = {
            'custentity_hris_empemploymentstatus': 1,
            /*  'custentity_hris_last_leavesalaryamount': leavesalaryamt,
             'custentity_hris_last_airticketamount': airticketamount,
             */
          };

          /*   if (leavesalaryamt != 0) {
              values['custentity_hris_last_leavesalarydate'] = todate;
            }
            if(airticketamount !=0){
              values['custentity_hris_last_airticketdate'] = todate;
            } */
          var EmployeeID = record.submitFields({
            type: 'employee',
            id: empid,
            values: values
          });

          log.debug("Info", "Employee Status also Updated. Internal ID : " + EmployeeID);

          var empcompensql = "select * from customrecord_hris_employee_compen_change \
      where custrecord_hris_empchange_employee_nam ="+ empid + " and isinactive ='F'"

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
      }



    }
  }
  function getgrosssalary(empid) {
    var empquery = "select * from  customrecord_hris_employee_compen_change where\
  custrecord_hris_empchange_employee_nam = "+ empid + " and isinactive='F'";
    var monthlysalary = 0;
    var queryResults = query.runSuiteQL({
      query: empquery
    });
    log.debug("Empquery", empquery);
    var empqueryrecords = queryResults.asMappedResults();
    var accuralamount = 0;
    if (empqueryrecords.length > 0) {
      monthlysalary = empqueryrecords[0].custrecord_hris_empchange_month_cross_sy;
      log.audit('monthlysalary', monthlysalary);
    }
    return monthlysalary;
  }
  function getaccuraltypesequence(accuralseqno) {
    var accuraltypesql = "select * from customrecord_hris_accuraltype_master where custrecord_hris_accural_seqno =" + accuralseqno;
    var queryResults = query.runSuiteQL({
      query: accuraltypesql
    });
    log.debug("accuraltypesql", accuraltypesql);
    var accuraltypesqlrecords = queryResults.asMappedResults();

    if (accuraltypesqlrecords.length > 0) {
      var accuraltypeid = accuraltypesqlrecords[0].id;

    }
    return accuraltypeid;
  }
  function getaccuraltransactiontypesequence(accuraltranseqno) {
    var accuraltypesql = "select * from customrecord_hrms_accural_transactiontyp where custrecord_hris_accural_trans_seqno =" + accuraltranseqno;
    var queryResults = query.runSuiteQL({
      query: accuraltypesql
    });
    log.debug("accuraltypesql", accuraltypesql);
    var accuraltypesqlrecords = queryResults.asMappedResults();

    if (accuraltypesqlrecords.length > 0) {
      var accuraltypeid = accuraltypesqlrecords[0].id;

    }
    return accuraltypeid;
  }
  function getResult(pSQL) {
    // log.debug("QUERY", pSQL);
    var queryResults = QUERY.runSuiteQL({
      query: pSQL
    });
    var records = queryResults.asMappedResults();
    return records;
  }
  return {
    beforeLoad: beforeLoad,
    beforeSubmit: beforeSubmit
  };
});



