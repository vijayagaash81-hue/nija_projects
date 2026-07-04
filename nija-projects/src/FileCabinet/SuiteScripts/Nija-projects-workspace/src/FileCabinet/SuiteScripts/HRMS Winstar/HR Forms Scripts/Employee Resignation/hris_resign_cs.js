/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 *@NModuleScope Public
 */
 define(['N/search', 'N/query', 'N/format', 'N/record', 'N/currentRecord', 'N/url'],
    function (search, query, format, record, currentRecord, url) {


        function pageInit(scriptContext) {
           // debugger;
            try {

              

            }
            catch (e) {
                console.log("error in pageinit : " + e);

            }

        }
        

        function Exitclick(){
            try{
                   debugger;
              
                 
                  var resignrecord1 = currentRecord.get();
                  var resignrecordid = resignrecord1.id;
                  log.debug('resignrecordid', resignrecordid);
                  var resignrecord = record.load({
                      type: 'customrecord_hris_resign_form',
                      id: resignrecordid,
                      isDynamic: true
                  });
                  var empid =resignrecord.getValue({
                    fieldId:'custrecord_hris_res_employee_code'
                  })
                  var flagid =1;
                  var url = '/app/common/custom/custrecordentry.nl?rectype=823&resignrecordid=' + resignrecordid + '&flag=' + flagid +'&empid='+empid;
                  window.location.href = url; 
              
        } 
           catch (e) {
               console.log("error in open: " + e);
           }
       }  

       






        function getResult(pSQL) {
            // log.debug("QUERY", pSQL);

            var queryResults = query.runSuiteQL({
                query: pSQL
            });
            var records = queryResults.asMappedResults();
            return records;
        }
        function getUrlParameter(param) {
            debugger;
            var query = window.location.search.substring(1);
            var vars = query.split("&");
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split("=");
                if (pair[0] == param) {
                    return decodeURIComponent(pair[1]);
                }
            }
            return (false);
        }

        return {
            pageInit: pageInit,
            Exitclick:Exitclick

        }
    });

function _logValidation(value) {
    if (value != null && value !== '' && value != undefined && value.toString() != 'NaN' && value != NaN) {
        return true;
    } else {
        return false;
    }
}






