/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 *@NModuleScope Public
 */

 
 define(['N/currentRecord', 'N/record', 'N/search',  'N/format', 'N/query'],
     function (currentRecord, record, search,  format, query) {
        
 
         function pageInit(context) {
             debugger;
             try {
 
                 var leaverecord = context.currentRecord;
 
              
 
 
             } catch (e) {
                 log.error('Error in pageInit', e);
             }
         }
 
         
 
 
 
 
 
 
 
         function dutydeletion() {
 
             debugger;
             try {
                 var recordObj = currentRecord.get();
                 var empattenid = recordObj.getValue('id') || '';

                  var dailyattenchildquery = "select * from customrecord_njt_emp_daily_atten_ch where custrecord_njt_emp_daily_parent = "+ empattenid +"";
                log.debug("dailyattenchildquery", dailyattenchildquery);
                var queryResults = query.runSuiteQL({
                    query: dailyattenchildquery
                });

                var dailyattenchildqueryrecords = queryResults.asMappedResults();

                if (dailyattenchildqueryrecords.length > 0) {

                    for (var j = 0; j < dailyattenchildqueryrecords.length; j++) {
                        var employeeattenchildid = dailyattenchildqueryrecords[j].id;
                        var deleteemployeeattenchildid = record.delete({
                            type: 'customrecord_njt_emp_daily_atten_ch',
                            id: employeeattenchildid,
                        });
                        log.debug('delete employeeattenchildid', deleteemployeeattenchildid);

                    }

                    var deleteemployeeattenid = record.delete({
                        type: 'customrecord_njt_emp_daily_attendance',
                        id: empattenid,
                    });
                    log.debug('deleteemployeeattenid', deleteemployeeattenid);

                }
               // var url='https://11929899.app.netsuite.com/app/common/custom/custrecordentrylist.nl?rectype=822'
                var url='https://11906425.app.netsuite.com/app/common/custom/custrecordentrylist.nl?rectype=226'
 
                 window.location.href = url;
              
 
             }
             catch (e) {
                 log.error("Error in dutydeletion", e);
                 // log.debug("Error in getEmpTotalLeaveTaken : " + e);
             }
 
         }
         
         
         
        
         return {
             pageInit: pageInit,       
          
             dutydeletion: dutydeletion,
          
         }
     });
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 