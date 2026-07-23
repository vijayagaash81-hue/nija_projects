/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope Public
 */

define(["N/record", "N/log", './moment.js', 'N/format'], function (record, log, moment, format) {

  //define(["N/record", "N/log"], function (record, log) {
  function pageInit(scriptContext) {

    debugger;
    var currentObjRecord = scriptContext.currentRecord;
    log.debug('scriptcontext', scriptContext.mode);

    /* if(scriptContext.mode == 'create'){ 
       currentObjRecord.setValue("custentity_hris_mobile_user_name","")
       currentObjRecord.setValue("custentity_hris_mobile_password","")
    
     } 
     else if(scriptContext.mode != 'create'){ */
    var customform = currentObjRecord.getValue({
      fieldId: 'customform'
    });
    log.debug('customform', customform);
    if (customform == 167) {
      var employeecheck = currentObjRecord.getValue({
        fieldId: 'custentity_hris_emp_employeecheck'
      })
      log.debug('Employee check', employeecheck);
      currentObjRecord.setValue("custentity_hris_emp_employeecheck", true);
      /*  var accessmobile = currentObjRecord.getValue({
         fieldId: 'custentity_hris_emp_accesstomobile'
       })
       log.debug('accessmobile',accessmobile);
       if (accessmobile == false){ 
         currentObjRecord.setValue("custentity_hris_mobile_user_name","")
       currentObjRecord.setValue("custentity_hris_mobile_password","")
    
       }   */
    }
    else {
      var employeecheck = currentObjRecord.getValue({
        fieldId: 'custentity_hris_emp_employeecheck'
      })
      log.debug('Employee check', employeecheck);
      currentObjRecord.setValue("custentity_hris_emp_employeecheck", false);


    }
    // }

  }


  function fieldChanged(scriptContext) {
    debugger;

    try {
      var currentObjRecord = scriptContext.currentRecord;
      var customform = currentObjRecord.getValue({
        fieldId: 'customform'
      });
      log.debug('customform', customform);
      if (customform == 167) {
        // Setting the legal name
        // if ((scriptContext.fieldId == "firstname") ||(scriptContext.fieldId == "middlename")||(scriptContext.fieldId == "lastname")) {
        if ((scriptContext.fieldId == " custentity_hris_empfname") || (scriptContext.fieldId == "custentity_hris_empmname") || (scriptContext.fieldId == "custentity_hris_emplname")) {
          var fullName = '';


          var firstName = currentObjRecord.getValue("custentity_hris_empfname") || '';
          log.debug('First Name', firstName);
          var middleName = currentObjRecord.getValue("custentity_hris_empmname") || '';
          log.debug('middleName', middleName);
          var lastName = currentObjRecord.getValue("custentity_hris_emplname") || '';
          log.debug('Last Name', lastName);
          if (firstName != '') {
            fullName += firstName;
          }
          if (middleName != '') {
            fullName += ' ';
            fullName += middleName;
          }
          if (lastName != '') {
            fullName += ' ';
            fullName += lastName;
          }

          /* var firstName = currentObjRecord.getValue("firstname")||'';
          log.debug('First Name',firstName);
          var middleName = currentObjRecord.getValue("middlename")||'';
          log.debug('middleName',middleName);
          var lastName =currentObjRecord.getValue("lastname")||'';
          log.debug('Last Name',lastName);
          if(firstName !=''){
             fullName += firstName ;
          }
          if(middleName !=''){
              fullName += ' ';
              fullName += middleName;
          }
          if(lastName != ''){
              fullName += ' ';
              fullName += lastName;
          }        */
          log.debug('Full Name', fullName);
          currentObjRecord.setValue("firstname", firstName);
          currentObjRecord.setValue("middlename", middleName);
          currentObjRecord.setValue("lastname", lastName);
          currentObjRecord.setValue("custentity_hris_emplegalname", fullName);

        }
        // Auto calculate job confirmation date according to probation days
        if ((scriptContext.fieldId == 'custentity_hris_empprobationperiod')) {
          var probationdays = currentObjRecord.getText('custentity_hris_empprobationperiod') || 0;
          log.debug('probationdays', probationdays);
          var hire_date = currentObjRecord.getValue({
            fieldId: 'hiredate'
          })
          var jobconform_dt = moment(hire_date).add(probationdays, 'days').format('D/M/YYYY');
          var jobdate = format.parse({
            value: jobconform_dt,
            type: format.Type.DATE
          });

          currentObjRecord.setValue({
            fieldId: 'custentity_hris_empjobconfirmationdt',
            value: jobdate,
            ignoreFieldChange: true,
            forceSyncSourcing: true

          })

        }
        if ((scriptContext.fieldId == 'custentity_hris_emp_rotationalleave_appl')) {

          var rosterleave = currentObjRecord.getValue({
            fieldId: 'custentity_hris_emp_rotationalleave_appl'
          })
          if (rosterleave == true) {
            currentObjRecord.getField("custentity_hris_emprotationlvecatagory").isDisabled = false;
            currentObjRecord.getField("custentity_hris_emprotationlvecatagory").isMandatory = true;
            currentObjRecord.setValue({
              fieldId: 'custentity_hris_emprotationlvecatagory',
              value: '',
              ignoreFieldChange: true,
              forceSyncSourcing: true

            })

          }
          else {
            currentObjRecord.getField("custentity_hris_emprotationlvecatagory").isDisabled = true;
            currentObjRecord.getField("custentity_hris_emprotationlvecatagory").isMandatory = false;
            currentObjRecord.setValue({
              fieldId: 'custentity_hris_emprotationlvecatagory',
              value: '',
              ignoreFieldChange: true,
              forceSyncSourcing: true

            })

          }

        }
        if (scriptContext.fieldId == 'custentity_hris_emp_accesstomobile') {
          var accessmobile = currentObjRecord.getValue({
            fieldId: 'custentity_hris_emp_accesstomobile'
          })
          if (accessmobile == true) {
            currentObjRecord.getField("custentity_hris_mobile_user_name").isDisabled = false;
            currentObjRecord.getField("custentity_hris_mobile_password").isDisabled = false;
            currentObjRecord.getField("custentity_hris_empmobileemail").isDisabled = false;
            currentObjRecord.getField("custentity_hris_mobile_user_name").isMandatory = true;
            currentObjRecord.getField("custentity_hris_mobile_password").isMandatory = true;
            currentObjRecord.getField("custentity_hris_empmobileemail").isMandatory = true;
          }
          else {

            currentObjRecord.getField("custentity_hris_mobile_user_name").isDisabled = true;
            currentObjRecord.getField("custentity_hris_mobile_password").isDisabled = true;
            currentObjRecord.getField("custentity_hris_empmobileemail").isDisabled = true;
            currentObjRecord.getField("custentity_hris_mobile_user_name").isMandatory = false;
            currentObjRecord.getField("custentity_hris_mobile_password").isMandatory = false;
            currentObjRecord.getField("custentity_hris_empmobileemail").isMandatory = false;
          }


        }
      }
    }
    catch (e) {
      log.debug("Error: " + e.message);
    }
  }
  function saveRecord(scriptContext) {
    try {
      debugger;
      var currentObjRecord = scriptContext.currentRecord;
      var customform = currentObjRecord.getValue({
        fieldId: 'customform'
      });
      log.debug('customform', customform);
      if (customform == 167) {
        var accessmobile = currentObjRecord.getValue({
          fieldId: 'custentity_hris_emp_accesstomobile'
        })
        if (accessmobile == true) {
          var empemail = currentObjRecord.getValue({
            fieldId: 'custentity_hris_empmobileemail'
          }) || '';
          if (empemail == '') {
            alert('Please Enter Mobile E-Mail');
            return false;

          }
          else {
            return true;
          }

        }
        return true;
      }
      else{
        return true;
      }
    }
    catch (e) {
      log.debug("Error: " + e.message);
    }
  }

  return {
    fieldChanged: fieldChanged,
    //pageInit: pageInit,
    saveRecord: saveRecord,
  }

});
