function suitelet_Pullback(request, response) {
    if (request.getMethod() == 'GET') {
        try //
        {
            nlapiLogExecution('DEBUG', '', '*** Into Get Method ***');

            var PullbackForm = nlapiCreateForm('Do you want to Pullback Request?');
           PullbackForm.setScript('customscript_hris_lve_pullbackcall_cs');
            PullbackForm.addField('custpage_remark', 'LONGTEXT', 'PullBack Reason', null, null).setMandatory(true);
            var redirectTrigger = request.getParameter('custscript_trigger_open')
            nlapiLogExecution('DEBUG', '', '*** redirectTrigger***' + redirectTrigger);
           o_triggerObj = PullbackForm.addField('custpage_triggerredirect', 'text', 'RedirecT tRIGGER', null, null).setDisplayType('hidden');
         //  o_triggerObj = PullbackForm.addField('custpage_triggerredirect', 'text', 'RedirecT tRIGGER', null, null);
            o_triggerObj.setDefaultValue(redirectTrigger);
          //  PullbackForm.setScript('customscript_hris_lve_pullbackcall_cs');
            var a_Parameteres = request.getParameter('leavid')
            nlapiLogExecution('DEBUG', '', '*** a_Parameteres ***' + a_Parameteres);

            var f_Parameters = PullbackForm.addField('custpage_parameter', 'LONGTEXT', 'Remarks:', null, null).setDisplayType('hidden');
           // var f_Parameters = PullbackForm.addField('custpage_parameter', 'LONGTEXT', 'Remarks:', null, null);
        
            f_Parameters.setDefaultValue(a_Parameteres);

            PullbackForm.addSubmitButton('Submit');
            PullbackForm.addButton('custombutton_Back', 'Back', "window.history.back();");
            nlapiLogExecution('DEBUG', '', '*** Into Get Method out ***');

            response.writePage(PullbackForm);
        } catch (ex) //
        {
            nlapiLogExecution('DEBUG', '', '*** a_Parameteres ***');
            nlapiLogExecution('DEBUG', '', '*** a_Parameteres ***' + ex.getDetails);
        }
    }
    if (request.getMethod() == 'POST') {
        nlapiLogExecution('DEBUG', '', '*** Into Post Method ***');

        var s_Remark = request.getParameter('custpage_remark');
        nlapiLogExecution('DEBUG', '', 's_Remark: ' + s_Remark);

        var s_Parameters = request.getParameter('custpage_parameter');
        nlapiLogExecution('DEBUG', '', 's_Parameters' + s_Parameters);

        var LeaveRecord = nlapiLoadRecord('customrecord_hris_leaveapplication', s_Parameters);

        var EmployeeNAME = LeaveRecord.getFieldValue('custrecord_hris_lve_employeename');
        var EmployeeCODE = LeaveRecord.getFieldValue('custrecord_hris_lve_empcode');
        var Manager = LeaveRecord.getFieldValue('custrecord_hris_lve_supervisor');
        var ProjectSupervisor = LeaveRecord.getFieldValue('custrecord_hris_lve_project_supervisor');
        var LeaveType = LeaveRecord.getFieldValue('custrecord_hris_lve_leavetype');
        var LeaveBalance = LeaveRecord.getFieldValue('custrecord_hris_lve_leavebalance');
        var FromDate = LeaveRecord.getFieldValue('custrecord_hris_lve_fromdate');
        var FromHalfDay = LeaveRecord.getFieldValue('custrecord_hris_lve_fromhalfday');
        var ToDate = LeaveRecord.getFieldValue('custrecord_hris_lve_todate');
        var ToHalfDay = LeaveRecord.getFieldValue('custrecord_hris_lve_tohalfday');
        var TotalNoDays = LeaveRecord.getFieldValue('custrecord_hris_lve_totalnodays');
        var ValidTillDate = LeaveRecord.getFieldValue('custrecord_hris_lve_validtilldate');
        var LeaveReason = LeaveRecord.getFieldValue('custrecord_hris_lve_leavereason');
        var SupportDoc = LeaveRecord.getFieldValue('custrecord_hris_lve_supportdocument');
        var LeaveAppStatus = LeaveRecord.getFieldValue('custrecord_hris_lve_staus');

        var LeaveName = LeaveRecord.getFieldValue('name');
        var s_lms_approver0 = LeaveRecord.getFieldValue('custrecord_hris_lve_approver0');
        var s_lms_approver1 = LeaveRecord.getFieldValue('custrecord_hris_lve_approver1');
        var s_lms_approver2 = LeaveRecord.getFieldValue('custrecord_hris_lve_approver2');
        var s_lms_approver3 = LeaveRecord.getFieldValue('custrecord_hris_lve_approver3');
        var s_lms_approver4 = LeaveRecord.getFieldValue('custrecord_hris_lve_approver4');
        var s_lms_currentapproverlevel = LeaveRecord.getFieldValue('custrecord_hris_lve__current_wflevel_no');
        var s_lms_currentapprover = LeaveRecord.getFieldValue('custrecord_hris_lve_current_approver');
        nlapiLogExecution('DEBUG', '', 'check 4');

        var PullBackRecord = nlapiCreateRecord('customrecord_hris_pullback_lveapplicatio');
        PullBackRecord.setFieldValue('custrecord_hris_plb_employee_name', EmployeeNAME);
        PullBackRecord.setFieldValue('custrecord_hris_plb_employee_code', EmployeeCODE);
        PullBackRecord.setFieldValue('custrecord_hris_plb_supervisor', Manager);
        PullBackRecord.setFieldValue('custrecord_hris_plb_hod', ProjectSupervisor);
        PullBackRecord.setFieldValue('custrecord_hris_plb_leave_type', LeaveType);
        PullBackRecord.setFieldValue('custrecord_hris_plb_leave_balance', LeaveBalance);
        PullBackRecord.setFieldValue('custrecord_hris_plb_from_date', FromDate);
        PullBackRecord.setFieldValue('custrecord_hris_plb_from_halfday', FromHalfDay);
        PullBackRecord.setFieldValue('custrecord_hris_plb_todate', ToDate);
        PullBackRecord.setFieldValue('custrecord_hris_plb_to_halfday', ToHalfDay);
        PullBackRecord.setFieldValue('custrecord_hris_plb_total_days', TotalNoDays);
        PullBackRecord.setFieldValue('custrecord_hris_plb_vaid_tilldate', ValidTillDate);
        PullBackRecord.setFieldValue('custrecord_hris_plb_leave_reason', LeaveReason);
        PullBackRecord.setFieldValue('custrecord_hris_plb_support_document', SupportDoc);
        PullBackRecord.setFieldValue('custrecord_hris_plb_leave_applica_status', LeaveAppStatus);
        PullBackRecord.setFieldValue('custrecord_hris_plb_lve_pullback_reason', s_Remark);

        PullBackRecord.setFieldValue('custrecord_hris_plb_leave_ref_no', LeaveName);
        PullBackRecord.setFieldValue('custrecord_hris_plb_approver0', s_lms_approver0);
        PullBackRecord.setFieldValue('custrecord_hris_plb_approver1', s_lms_approver1);
        PullBackRecord.setFieldValue('custrecord_hris_plb_approver2', s_lms_approver2);
        PullBackRecord.setFieldValue('custrecord_hris_plb_approver3', s_lms_approver3);
        PullBackRecord.setFieldValue('custrecord_hris_plb_approver4', s_lms_approver4);
        PullBackRecord.setFieldValue('custrecord_hris_plb_currentapprolevel', s_lms_currentapproverlevel);
        PullBackRecord.setFieldValue('custrecord_hris_plb_currentapprover', s_lms_currentapprover);

        var PullBackRecord_ID = nlapiSubmitRecord(PullBackRecord, true, true)
        nlapiLogExecution('DEBUG', '', 'check 5');
        var customrecord_hris_lveapproval_result = nlapiSearchRecord("customrecord_hris_lveapprovalhistory", null,
            [
                ["custrecord_hris_lveapphis_leavelnk", "anyof", s_Parameters]
            ],
            [
                new nlobjSearchColumn("internalid"),
                new nlobjSearchColumn("custrecord_hris_lveapphis_leavelnk")
            ]
        );
        if (customrecord_hris_lveapproval_result != null) 

			{
                for (var i = 0; i < customrecord_hris_lveapproval_result .length; i++) { 
			    var id = customrecord_hris_lveapproval_result[i].getValue('internalid')
				var leaveappid = nlapiDeleteRecord('customrecord_hris_lveapprovalhistory', id)
               // nlapiLogExecution('DEBUG', '', 'leaveappid : ' + leaveappid );
                }
			}  
            nlapiLogExecution('DEBUG', '', 'check 6');  
            nlapiLogExecution('DEBUG', '', 's_Parameters1' + s_Parameters);

        //var Leaveid = nlapiDeleteRecord('customrecord_hris_leaveapplication', s_Parameters);
        var Leaveid = nlapiSubmitField('customrecord_hris_leaveapplication', s_Parameters, 'isinactive', 'T');
        nlapiLogExecution('DEBUG', '', 'check 1');
      //  nlapiLogExecution('DEBUG', '', 'Leaveid: ' + Leaveid);a

        /* var leavelistURL = 'https://system.na1.netsuite.com/app/common/custom/custrecordentrylist.nl?rectype=1701&whence=';

         nlapiRequestURL(leavelistURL); */
  /* var leavelistURL = 'https://system.na1.netsuite.com/app/common/custom/custrecordentry.nl?rectype=1701&whence=';

         nlapiRequestURL(leavelistURL);  */

      //   var newWindow = window.open('https://5250636-sb2.app.netsuite.com/app/common/custom/custrecordentrylist.nl?rectype=1701', '_self');
 var params = new Array();
        params['custscript_trigger_open'] = 'open';
        nlapiLogExecution('DEBUG', '', 'check 2');
        var createURL = nlapiSetRedirectURL('SUITELET', 'customscript_hris_lve_pullbkwindow_sl', 'customdeploy_hris_lve_pullbkwindow_sl', null, params);
        nlapiLogExecution('DEBUG', '', 'check 3');
          // createURL  =  createURL + '&leavid=' + LeaveRecID ;
        // nlapiSetRedirectURL(type, identifier, id, editmode, parameters)

      /*   createURL  =  createURL + '&leavid=' + LeaveRecID ;
 
   var newWindow = window.open(createURL, '_self');
 */
    }

}

