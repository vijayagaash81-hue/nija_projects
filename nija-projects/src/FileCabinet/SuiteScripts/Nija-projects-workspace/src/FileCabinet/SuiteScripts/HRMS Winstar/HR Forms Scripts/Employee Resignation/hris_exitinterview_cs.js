/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 *@NModuleScope Public
 */

var SEARCH, MOMENT, RECORD, QUERY;
define(['N/currentRecord', 'N/record', 'N/search', './moment.js', 'N/format', 'N/query', 'N/url'],
    function (currentRecord, record, search, moment, format, query, url) {
        SEARCH = search;
        MOMENT = moment;
        RECORD = record;
        QUERY = query;

        function pageInit(context) {
            try {
                var resignrecord = context.currentRecord;
                var flag = getUrlParameter('flag');
                log.debug('Flag Check', flag);

                if (flag == 1) {
                    var empid = getUrlParameter('empid');
                    resignrecord.setValue({
                        fieldId: 'custrecord_hr_exit_employee_name',
                        value: empid,
                        ignoreFieldChange: false,
                        forceSyncSourcing: true
                    });

                    var resignrecordid = getUrlParameter('resignrecordid');
                    resignrecord.setValue({
                        fieldId: 'custrecord_hr_exit_interview_resignlink',
                        value: resignrecordid,
                        ignoreFieldChange: false,
                        forceSyncSourcing: true
                    });
                }

                // --- POPULATE QUESTIONNAIRE SUBLIST ---
                if (context.mode === 'create') {
                    var questionSql = "Select * from customrecord_exit_questionnaire_master where isinactive ='F' ";
                    var questionRecords = getResult(questionSql);
                    log.debug('Questionnaire Records Count', questionRecords.length);

                    var sublistId = 'recmachcustrecord_eqr_employee_exit_form';

                    for (var i = 0; i < questionRecords.length; i++) {
                        var questionId = questionRecords[i].id;
                        var question = questionRecords[i].custrecord_eqm_question || '';
                        
                        resignrecord.selectNewLine({
                            sublistId: sublistId
                        });

                        resignrecord.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord_eqr_question',
                            value: questionId,
                            ignoreFieldChange: true
                        });
                        
                        resignrecord.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord_eqr_exitquestion',
                            value: question,
                            ignoreFieldChange: true
                        });

                        resignrecord.commitLine({
                            sublistId: sublistId
                        });
                    }
                }

            } catch (e) {
                log.error('Error in pageInit', e);
            }
        }

        function fieldChanged(context) {
            try {
                var recordObj = context.currentRecord;

                if (context.fieldId == "custrecord_hr_exit_employee_name") {
                    var empID = recordObj.getValue('custrecord_hr_exit_employee_name');
                    
                    if (empID) {
                        var resignsql = "select id from customrecord_hris_resign_form where custrecord_hris_res_employee_code = " + empID + " \
                                         and custrecord_hris_res_exitcheck = 'F' and custrecord_hris_res_approvalstatus = 2";
                        
                        var resignsqlrecords = getResult(resignsql);
                        log.debug('resignsql', resignsql);
                      
                        if (resignsqlrecords.length > 0) {
                            var resignid = resignsqlrecords[0].id;
                            recordObj.setValue({
                                fieldId: 'custrecord_hr_exit_interview_resignlink',
                                value: resignid,
                                ignoreFieldChange: true
                            });
                        }
                    }
                }
            } catch (e) {
                log.error("Error in fieldChanged", e);
            }
        }
       
        function getUrlParameter(param) {
            var queryStr = window.location.search.substring(1);
            var vars = queryStr.split("&");
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split("=");
                if (pair[0] == param) {
                    return decodeURIComponent(pair[1]);
                }
            }
            return false;
        }

        function getResult(pSQL) {
            var queryResults = QUERY.runSuiteQL({
                query: pSQL
            });
            return queryResults.asMappedResults();
        }

        // FIXED: Reverted to standard function structure and fixed property retrieval method
        function printMemo() {
            var rec = currentRecord.get();
            var subsidid = rec.getValue({ fieldId: 'custrecord_hr_exit_interview_subsidiary' });
            
            // Resolve Suitelet URL
            var suiteletUrl = url.resolveScript({
                scriptId: 'customscript_hris_exitformlayout_sl', 
                deploymentId: 'customdeploy_hris_exitformlayout_sl', 
                params: {
                    recid: rec.id,
                    rectype: rec.type,
                    subsidiaryid: subsidid
                }
            });

            // Open PDF in new tab
            window.open(suiteletUrl);
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            printMemo: printMemo
        };
    });