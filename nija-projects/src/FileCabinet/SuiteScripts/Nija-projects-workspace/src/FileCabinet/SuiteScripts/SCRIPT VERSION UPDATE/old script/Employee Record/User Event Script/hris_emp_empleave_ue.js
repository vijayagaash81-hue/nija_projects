function beforeLoadAction(type, form, request) {
     if (type == "view") {
        var recid = nlapiGetRecordId();
        var rectype = nlapiGetRecordType();
        
             if (recid){
                var customform = nlapiGetFieldValue('customform');
                nlapiLogExecution('DEBUG','customform',customform);
                if (customform == 167) {
                 var res = nlapiLoadRecord("employee", recid);
                 var baserecordtype = res.getFieldValue("baserecordtype");
                 
                 if (baserecordtype == "employee") {                  
                     form.setScript("customscript_hris_empleave_cs");                   
                     
                 }

             }
             } 
     }
}