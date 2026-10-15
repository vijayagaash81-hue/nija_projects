/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/record', 'N/ui/serverWidget', 'N/search'], function (record, serverWidget, search) {
  function beforeSubmit(scriptContext) {
    if (scriptContext.type === scriptContext.UserEventType.CREATE) {
      var currentRecord = scriptContext.newRecord;

      var s_auto_prfix = "";
      var recordType = currentRecord.type.toLowerCase();

      //   if (recordType === "customrecord_njt_hr_recruitement_form") {
      //     s_auto_prfix = "RF";
      //   } \
      var customform = currentRecord.getValue({ fieldId: 'customform' });

      log.debug('customform', customform);

      if (customform == 144) {
        var Grade = scriptContext.newRecord.getValue({
          fieldId: "custentity_emp_grade_"
        });
        var gradeRec = record.load({
          type: 'customrecordgrade_master',  // your custom record type
          id: Grade,
          isDynamic: true
        });

        var gradeName = gradeRec.getValue({
          fieldId: 'name'
        });

        log.debug('Grade Name:', gradeName);


        var subsidiaryId = scriptContext.newRecord.getValue({
          fieldId: "subsidiary"
        });
        log.debug("subsidiaryId", subsidiaryId);
        var subsidaryrec = record.load({
          type: "subsidiary",
          id: subsidiaryId,
          isDynamic: true
        });
        log.debug("subsidaryrec", subsidaryrec);
        var subsiprefix = subsidaryrec.getValue({
          fieldId: "tranprefix"
        });
        log.debug("subsiprefix", subsiprefix);
        if (subsiprefix) {
          var match = subsiprefix.match(/[A-Za-z]+/g);
          s_auto_prfix = (match) ? match.join('') : '';
          log.debug("Alphabetic Prefix Only", s_auto_prfix);
        }
        else {
          s_auto_prfix = "BD"
        }




        var i_rec_type_id = currentRecord.getValue({
          fieldId: "baserecordtype",
        });

        if (!i_rec_type_id) {
          log.error("Missing Record Type", "rectype field is empty or null");
          return;
        }

        var customrecord_hris_unique_reference_numbeSearchObj = search.create({
          type: "customrecord_hris_unique_reference_numbe",
          filters: [
            ["custrecord_hris_record_type", "anyof", i_rec_type_id],
            "AND",
            ["isinactive", "is", "F"]
          ],
          columns: [
            search.createColumn({
              name: "custrecord_hris_unique_number",
              label: "Unique Number"
            }),
            search.createColumn({ name: "internalid", label: "Internal ID" })
          ]
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
              var zeros = "";

              if (i_unique_num.toString().length == 1) {
                zeros = "000";
              } else if (i_unique_num.toString().length == 2) {
                zeros = "00";
              } else {
                zeros = "";
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
                s_auto_prfix + "-" + gradeName + "-" + refnumber;

              currentRecord.setValue({
                fieldId: "custentity_hris_empcode",
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
    }
  }
  return {
    beforeSubmit: beforeSubmit
  };
});