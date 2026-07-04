/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/record', 'N/ui/serverWidget','N/search'], function(record, serverWidget,search) {
    function beforeLoad(scriptContext) {
        var form = scriptContext.form;
        var recordObj = scriptContext.newRecord;
        var form = scriptContext.form;
        var type = scriptContext.type;
        log.debug("Type",type);
      var approvalStatus = recordObj.getValue('custrecord_hris_loan_approval_status');

                log.debug("approvalStatus", approvalStatus);
       var jeno = recordObj.getValue('custrecord_hris_loan_allo_je_no')||'';
              log.debug('jeno',jeno);
       
        if ( scriptContext.type == 'view' && approvalStatus ==2 && jeno=='') {

            form.addButton({
                id: 'custpage_jvcreation',
                label: 'Post JV',
                functionName: 'jvcreation()'
            });
        }
        form.clientScriptModulePath = './je creation in loan allocation cs.js';
      
       
  
    }
  
    
    return {
      beforeLoad: beforeLoad,
  };
  });
  
  
  
    