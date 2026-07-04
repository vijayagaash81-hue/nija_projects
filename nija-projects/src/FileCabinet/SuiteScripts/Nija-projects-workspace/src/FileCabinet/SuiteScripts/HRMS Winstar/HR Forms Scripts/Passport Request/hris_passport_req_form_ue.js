/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
var QUERY;
define(['N/record', 'N/log', 'N/currentRecord', 'N/ui/serverWidget', 'N/query', 'N/format', './moment.js','N/search',],
 
    function (record, log, currentRecord, serverWidget, query, format, moment,search) {
QUERY = query;
        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type
         * @param {Form} scriptContext.form - Current form
         * @Since 2015.2
         */
        function beforeLoad(scriptContext) {
            try {
                var form = scriptContext.form;
                var recordObj = scriptContext.newRecord;

                if (scriptContext.type == 'create' || scriptContext.type == 'edit') {
                    var leaveAppField = form.addField({
                        id: 'custpage_leave_app_no',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Leave Application'
                        // source: "customrecord_leave_app_"
                    });
                    form.insertField({
                        field: leaveAppField,
                        nextfield: 'custrecord_hris_pass_leave_application'
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
            } catch (e) {
                log.error("Error in beforeLoad", e);
            }
        }


        function afterSubmit(scriptContext) {
            //     try {
            var newRecordObj = scriptContext.newRecord;
            if (scriptContext.type != 'delete') {
                var jvarray = [];
                var passId = newRecordObj.id;

                var approvalStatus = newRecordObj.getValue('custrecord_hris_pass_approvalstatus');

                log.debug("approvalStatus", approvalStatus);


                var leaveAppNo = newRecordObj.getValue('custrecord_hris_pass_leave_application') || '';
                log.debug("leaveAppNo", leaveAppNo);
                var purposetype =newRecordObj.getValue('custrecord_hris_pass_purpose');
          var purposeseq = purposesequence(purposetype);

  if (approvalStatus == 2 && leaveAppNo && purposeseq==1) {
                var fromdate = newRecordObj.getValue('custrecord_hris_pass_from_date') || '';
                log.debug('fromdate', fromdate);
                 var todate = newRecordObj.getValue('custrecord_hris_pass_to_date');
                log.debug('todate', todate);
                var totaldays1 = newRecordObj.getValue('custrecord_hris_pass_total_days');
               // var todate = moment(fromdate).add(totaldays, 'days');//.format('D/M/YYYY');
            
              /* var todate = new Date(fromdate);
        todate.setDate(fromdate.getDate() + totaldays);
                fromdate = format.parse({
                    value: fromdate,
                    type: format.Type.DATE
                });
                todate = format.parse({
                    value: todate,
                    type: format.Type.DATE
                }); */
               // Parse dates
            fromdate = format.parse({
                value: fromdate,
                type: format.Type.DATE
            });
            todate = format.parse({
                value: todate,
                type: format.Type.DATE
            });

            // Calculate totaldays as the difference between todate and fromdate
            var totaldays = Math.ceil((todate - fromdate) / (1000 * 60 * 60 * 24)) + 1;
            log.debug('totaldays', totaldays);
              // Calculate expected resume back date (todate + 1)
var expectedResumeBackDate = new Date(todate);
expectedResumeBackDate.setDate(todate.getDate() + 1);
              
                    var leaveAppID = record.submitFields({
                        type: 'customrecord_hris_leaveapplication',
                        id: leaveAppNo,
                        values: {
                            'custrecord_hris_lve_fromdate': fromdate,
                            'custrecord_hris_lve_todate': todate,
                             'custrecord_hris_lve_totalnodays':totaldays,
                            'custrecord_hris_lve_pass_issue':true,
                          'custrecord_hris_lve_expectedresumebackdt': expectedResumeBackDate
                        }
                    });
                    log.debug("Info", "Leave Application also Updated. Internal ID : " + leaveAppID);




                }
            }
            /*  } catch (e) {
                 log.error('Error in afterSubmit', e);
             } */
        }

function beforeSubmit(scriptContext) {
         //   try {
            log.debug('type',scriptContext.type);
            if (scriptContext.type == 'create') {
         
                    var currentRecord = scriptContext.newRecord;
                  
                    var s_auto_prfix = '';
                    var recordType = currentRecord.type.toLowerCase();
    
                    if (recordType == 'customrecord_hris_passport_requestform') {
                        s_auto_prfix = 'PR';
                    } 
                    log.debug('prefix',s_auto_prfix);
                    var i_rec_type_id = currentRecord.getValue({
                         fieldId: 'rectype'
                         });
                    log.debug({
                         title: 'i_rec_type_id',
                          details: i_rec_type_id 
                        });
    
                    
             

                var customrecord_hris_unique_reference_numbeSearchObj = search.create({
                    type: "customrecord_hris_unique_reference_numbe",
                    filters:
                    [
                       ["custrecord_hris_record_type","anyof",i_rec_type_id ],
                       "AND", 
                      ["isinactive","is","F"]
                    ],
                    columns:
                    [
                       search.createColumn({name: "custrecord_hris_record_type", label: "Record Type"}),
                       search.createColumn({name: "custrecord_hris_unique_number", label: "Unique Number"}),
                       search.createColumn({name: "custrecord_hris_employee_code_prefix", label: "Employee Code Prefix"}),
                       search.createColumn({name: "internalid", label: "Internal ID"})
                    ]
                 });
                 var searchResultCount = customrecord_hris_unique_reference_numbeSearchObj.runPaged().count;
                 log.debug("customrecord_hris_unique_reference_numbeSearchObj result count",searchResultCount);
                 var i_id_unique_ref = '';
                 var i_unique_num = '';
               if (searchResultCount > 0){  
                 customrecord_hris_unique_reference_numbeSearchObj.run().each(function(result){
                     i_id_unique_ref= result.getValue({name: "internalid", label: "Internal ID"});
                    log.debug('i_id_unique_ref',i_id_unique_ref);
                    i_unique_num  = result.getValue({ name : 'custrecord_hris_unique_number'});
                    log.debug('i_unique_num ',i_unique_num );
                 });     
            	i_unique_num = parseInt(i_unique_num) + 1;
               
                var i_employee;
               
            	//var d_current_date = getCompanyCurrentDateTime();
            	
               
                var d_current_date = new Date();
              
                var i_fullYear = d_current_date.getFullYear();

             
                log.debug('d_current_date',d_current_date)   
                log.debug('i_fullYear',i_fullYear);    
                        if (recordType == 'customrecord_hris_passport_requestform') {
                            i_employee = currentRecord.getValue({ fieldId: 'custrecord_hris_pass_empname' });
                        }
                        var s_name = '';
                        var s_emp_char = '';
                        log.debug('Employee',i_employee);
                        if (i_employee) {
                            log.debug('Employee loop')
                          
							
							
							
                            var employeeLookup = record.load({
                                type: 'employee',
                                id: i_employee,
                                isDynamic: true      
                            });
                            var s_name = employeeLookup.getValue({ fieldId: 'firstname' })
                            log.debug('First name',s_name);
                            if (s_name) {
                                s_name = s_name.toUpperCase();
                                s_emp_char = s_name.substring(0, 1);
                                var lastFour = s_name.substring(s_name.length - 3);
                                log.debug('lastFour',lastFour);
                                var s_auto_number = s_auto_prfix + '-' + (s_emp_char.toString() + lastFour.toString()) + '-' + i_unique_num + '-' + i_fullYear;
                                log.debug('s_auto_number',s_auto_number);
                                currentRecord.setValue({ fieldId: 'name', value: s_auto_number });
    
                                record.submitFields({
                                    type: 'customrecord_hris_unique_reference_numbe',
                                    id: i_id_unique_ref,
                                    values: {
                                        'custrecord_hris_unique_number': i_unique_num
                                    }
                                });
                            }
                        }
                        
    
                    }

                } 
                
            
            }

              function purposesequence(purposetype) {
      var purposesql = "Select * from customrecord_hris_purpose_type where id =" + purposetype;
      var purposesqlrecords = getResult(purposesql);
      log.debug('purposesql', purposesql);

      if (purposesqlrecords.length > 0) {
        var purposeseq = purposesqlrecords[0].custrecord_hris_purpose_seqno
        log.audit('Purpose Sequence', purposeseq);
      }
      return purposeseq;

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
            //beforeLoad: beforeLoad,
           // beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };

    });
