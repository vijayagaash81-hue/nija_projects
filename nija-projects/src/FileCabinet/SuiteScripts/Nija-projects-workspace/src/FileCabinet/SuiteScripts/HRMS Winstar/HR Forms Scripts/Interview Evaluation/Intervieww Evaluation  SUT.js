/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define([
  "N/render",
  "N/log",
  "N/record",
  "N/email",
  "N/runtime",
  "N/encode",
  "N/file",
  "N/format",
  "N/query",
], function (render, log, record, email, runtime, encode, file, format, query) {
  function onRequest(context) {
    if (context.request.method == "GET" || context.request.method == "POST") {
      // Retrieve parameters from the Suitelet URL
      var customRecordId = context.request.parameters.customRecordId;
      log.debug("customRecordId", customRecordId);
      var customRecord = "";
      var namofcandidate = "";
      var compltedby = "";
      var positiontitle = "";
      var interviewer = "";
      var Department = "";
      var dateofinterview = "";
      var nssvsna1 = "";
      var nssvsna2 = "";
      var nssvsna3 = "";
      var nssvsna4 = "";
      var nssvsna5 = "";
      var nssvsna6 = "";
      var nssvsna7 = "";
      var nssvsna8 = "";
      var nssvsna9 = "";
      var nssvsna10 = "";
      var agreedisagree1 = "";
      var agreedisagree2 = "";
      var agreedisagree3 = "";
      var agreedisagree4 = "";
      var agreedisagree5 = "";
      var agreedisagree6 = "";
      var comment1 = "";
      var comment2 = "";
      var comment3 = "";
      var comment4 = "";
      var comment5 = "";
      var comment6 = "";
      var comment7 = "";
      var comment8 = "";
      var comment9 = "";
      var comment10 = "";
      var canstrength = "";
      var candweakness = "";
      var addcomments = "";

      if (customRecordId) {
        // Load the custom record with the correct record type 'customrecord_test_record_sctte'
        customRecord = record.load({
          type: "customrecord_hr_interview_evaluation_for",
          id: customRecordId,
          isDynamic: true,
        });

        log.debug("customRecord", customRecord);
        namofcandidate = customRecord.getText({
          fieldId: "custrecord_hr_interview_candidate_name",
        });
        log.debug("namofcandidate", namofcandidate);
        compltedby = customRecord.getValue({
          fieldId: "custrecord_hr_interview_completed_by",
        });
        log.debug("compltedby", compltedby);
        positiontitle = customRecord.getValue({
          fieldId: "custrecord_hr_interviewiew_position_titl",
        });
        log.debug("positiontitle", positiontitle);
        interviewer = customRecord.getText({
          fieldId: "custrecord_hr_interviewiew_interviewers",
        });
        log.debug("interviewer", interviewer);
        Department = customRecord.getText({
          fieldId: "custrecord_hr_interview_evl_dept",
        });
        log.debug("Department", Department);
        dateofinterview = customRecord.getValue({
          fieldId: "custrecord_hr_interview_evl_dateofintrvw",
        });
        log.debug("dateofinterview", dateofinterview);
        var poDate = format.format({
          value: dateofinterview,
          type: format.Type.DATE,
        });
        log.debug("poDate", poDate);
        nssvsna1 = customRecord.getValue({
          fieldId: "custrecord_hr_interview_evl_rating",
        });
        log.debug("nssvsna1", nssvsna1);
        nssvsna2 = customRecord.getValue({
          fieldId: "custrecord_hr_interview_evl_rating1",
        });
        log.debug("nssvsna2", nssvsna2);
        nssvsna3 = customRecord.getValue({
          fieldId: "custrecord_hr_interview_evl_rating2",
        });
        log.debug("nssvsna3", nssvsna3);
        nssvsna4 = customRecord.getValue({
          fieldId: "custrecord_hr_interview_evl_rating3",
        });
        log.debug("nssvsna4", nssvsna4);
        nssvsna5 = customRecord.getValue({
          fieldId: "custrecord_hr_interview_evl_rating4",
        });
        log.debug("nssvsna5", nssvsna5);
        nssvsna6 = customRecord.getValue({
          fieldId: "custrecord_hr_interview_evl_rating5",
        });
        log.debug("nssvsna6", nssvsna6);
        nssvsna7 = customRecord.getValue({
          fieldId: "custrecord_hr_interview_evl_rating6",
        });
        log.debug("nssvsna7", nssvsna7);
        nssvsna8 = customRecord.getValue({
          fieldId: "custrecord_hr_interview_evl_rating7",
        });
        log.debug("nssvsna8", nssvsna8);
        nssvsna9 = customRecord.getValue({
          fieldId: "custrecord_hr_interview_evl_rating8",
        });
        log.debug("nssvsna9", nssvsna9);
        nssvsna10 = customRecord.getValue({
          fieldId: "custrecord_hr_interview_evl_rating9",
        });
        log.debug("nssvsna10", nssvsna10);

        agreedisagree1 = customRecord.getValue({
          fieldId: "custrecord_hr_interview_evl_responses",
        });
        log.debug("agreedisagree1", agreedisagree1);
        agreedisagree2 = customRecord.getValue({
          fieldId: "custrecord_hr_interview_evl_responses2",
        });
        log.debug("agreedisagree2", agreedisagree2);
        agreedisagree3 = customRecord.getValue({
          fieldId: "custrecord_hr_interview_evl_responses3",
        });
        log.debug("agreedisagree3", agreedisagree3);
        agreedisagree4 = customRecord.getValue({
          fieldId: "custrecord_hr_interview_evl_responses4",
        });
        log.debug("agreedisagree4", agreedisagree4);
        agreedisagree5 = customRecord.getValue({
          fieldId: "custrecord_hr_interview_evl_responses5",
        });
        log.debug("agreedisagree5", agreedisagree5);
        agreedisagree6 = customRecord.getValue({
          fieldId: "custrecord_hr_interview_evl_responses6",
        });
        log.debug("agreedisagree6", agreedisagree6);
        comment1 = customRecord.getValue({
          fieldId: "custrecord_hr_interview_evl_comment1",
        });
        log.debug("comment1", comment1);
        comment2 = customRecord.getValue({
          fieldId: "custrecordhr_interview_evl_comments2",
        });
        log.debug("comment2", comment2);
        comment3 = customRecord.getValue({
          fieldId: "custrecordhr_interview_evl_comments3",
        });
        log.debug("comment3", comment3);
        comment4 = customRecord.getValue({
          fieldId: "custrecordhr_interview_evl_comments4",
        });
        log.debug("comment4", comment4);
        comment5 = customRecord.getValue({
          fieldId: "custrecordhr_interview_evl_comments5",
        });
        log.debug("comment5", comment5);
        comment6 = customRecord.getValue({
          fieldId: "custrecordhr_interview_evl_comments6",
        });
        log.debug("comment6", comment6);
        comment7 = customRecord.getValue({
          fieldId: "custrecordhr_interview_evl_comments7",
        });
        log.debug("comment7", comment7);
        comment8 = customRecord.getValue({
          fieldId: "custrecordhr_interview_evl_comments8",
        });
        log.debug("comment8", comment8);
        comment9 = customRecord.getValue({
          fieldId: "custrecordhr_interview_evl_comments9",
        });
        log.debug("comment9", comment9);
        comment10 = customRecord.getValue({
          fieldId: "custrecord_hr_interview_evl_comments1",
        });
        log.debug("comment10", comment10);
        canstrength = customRecord.getValue({
          fieldId: "custrecordhr_interview_evl_strengths",
        });
        log.debug("canstrength", canstrength);

        candweakness = customRecord.getValue({
          fieldId: "custrecordhr_interview_evl_weakness",
        });
        log.debug("candweakness", candweakness);

        addcomments = customRecord.getValue({
          fieldId: "custrecordhr_interview_evl_addition_cmts",
        });
        log.debug("addcomments", addcomments);

        var tableHTML1 = "";

        tableHTML1 += "<tr>";
        tableHTML1 += "<td style='width:10%;'></td>";
        tableHTML1 += "<td style='width:25%;'>";
        tableHTML1 +=
          agreedisagree1 == "1" ? "<b>Strongly Agree</b>" : "Strongly Agree";
        tableHTML1 += "</td>";
        tableHTML1 += "<td style='width:10%;'>";
        tableHTML1 += agreedisagree1 == "2" ? "<b>Agree</b>" : "Agree";
        tableHTML1 += "</td>";
        tableHTML1 += "<td style='width:20%;'>";
        tableHTML1 += agreedisagree1 == "3" ? "<b>Disagree</b>" : "Disagree";
        tableHTML1 += "</td>";
        tableHTML1 += "<td style='width:35%;'>";
        tableHTML1 +=
          agreedisagree1 == "4"
            ? "<b>Could not determine</b>"
            : "Could not determine";
        tableHTML1 += "</td>";
        tableHTML1 += "</tr>";

        var tableHTML2 = "";

        tableHTML2 += "<tr>";
        tableHTML2 += "<td style='width:10%;'></td>";
        tableHTML2 += "<td style='width:25%;'>";
        tableHTML2 +=
          agreedisagree2 == "1" ? "<b>Strongly Agree</b>" : "Strongly Agree";
        tableHTML2 += "</td>";
        tableHTML2 += "<td style='width:10%;'>";
        tableHTML2 += agreedisagree2 == "2" ? "<b>Agree</b>" : "Agree";
        tableHTML2 += "</td>";
        tableHTML2 += "<td style='width:20%;'>";
        tableHTML2 += agreedisagree2 == "3" ? "<b>Disagree</b>" : "Disagree";
        tableHTML2 += "</td>";
        tableHTML2 += "<td style='width:35%;'>";
        tableHTML2 +=
          agreedisagree2 == "4"
            ? "<b>Could not determine</b>"
            : "Could not determine";
        tableHTML2 += "</td>";
        tableHTML2 += "</tr>";

        var tableHTML3 = "";

        tableHTML3 += "<tr>";
        tableHTML3 += "<td style='width:10%;'></td>";
        tableHTML3 += "<td style='width:25%;'>";
        tableHTML3 +=
          agreedisagree3 == "1" ? "<b>Strongly Agree</b>" : "Strongly Agree";
        tableHTML3 += "</td>";
        tableHTML3 += "<td style='width:10%;'>";
        tableHTML3 += agreedisagree3 == "2" ? "<b>Agree</b>" : "Agree";
        tableHTML3 += "</td>";
        tableHTML3 += "<td style='width:20%;'>";
        tableHTML3 += agreedisagree3 == "3" ? "<b>Disagree</b>" : "Disagree";
        tableHTML3 += "</td>";
        tableHTML3 += "<td style='width:35%;'>";
        tableHTML3 +=
          agreedisagree3 == "4"
            ? "<b>Could not determine</b>"
            : "Could not determine";
        tableHTML3 += "</td>";
        tableHTML3 += "</tr>";

        var tableHTML4 = "";

        tableHTML4 += "<tr>";
        tableHTML4 += "<td style='width:10%;'></td>";
        tableHTML4 += "<td style='width:25%;'>";
        tableHTML4 +=
          agreedisagree4 == "1" ? "<b>Strongly Agree</b>" : "Strongly Agree";
        tableHTML4 += "</td>";
        tableHTML4 += "<td style='width:10%;'>";
        tableHTML4 += agreedisagree4 == "2" ? "<b>Agree</b>" : "Agree";
        tableHTML4 += "</td>";
        tableHTML4 += "<td style='width:20%;'>";
        tableHTML4 += agreedisagree4 == "3" ? "<b>Disagree</b>" : "Disagree";
        tableHTML4 += "</td>";
        tableHTML4 += "<td style='width:35%;'>";
        tableHTML4 +=
          agreedisagree4 == "4"
            ? "<b>Could not determine</b>"
            : "Could not determine";
        tableHTML4 += "</td>";
        tableHTML4 += "</tr>";

        var tableHTML5 = "";

        tableHTML5 += "<tr>";
        tableHTML5 += "<td style='width:10%;'></td>";
        tableHTML5 += "<td style='width:25%;'>";
        tableHTML5 +=
          agreedisagree5 == "1" ? "<b>Strongly Agree</b>" : "Strongly Agree";
        tableHTML5 += "</td>";
        tableHTML5 += "<td style='width:10%;'>";
        tableHTML5 += agreedisagree5 == "2" ? "<b>Agree</b>" : "Agree";
        tableHTML5 += "</td>";
        tableHTML5 += "<td style='width:20%;'>";
        tableHTML5 += agreedisagree5 == "3" ? "<b>Disagree</b>" : "Disagree";
        tableHTML5 += "</td>";
        tableHTML5 += "<td style='width:35%;'>";
        tableHTML5 +=
          agreedisagree5 == "4"
            ? "<b>Could not determine</b>"
            : "Could not determine";
        tableHTML5 += "</td>";
        tableHTML5 += "</tr>";

        var tableHTML6 = "";

        tableHTML6 += "<tr>";
        tableHTML6 += "<td style='width:10%;'></td>";
        tableHTML6 += "<td style='width:25%;'>";
        tableHTML6 +=
          agreedisagree6 == "1" ? "<b>Strongly Agree</b>" : "Strongly Agree";
        tableHTML6 += "</td>";
        tableHTML6 += "<td style='width:10%;'>";
        tableHTML6 += agreedisagree6 == "2" ? "<b>Agree</b>" : "Agree";
        tableHTML6 += "</td>";
        tableHTML6 += "<td style='width:20%;'>";
        tableHTML6 += agreedisagree6 == "3" ? "<b>Disagree</b>" : "Disagree";
        tableHTML6 += "</td>";
        tableHTML6 += "<td style='width:35%;'>";
        tableHTML6 +=
          agreedisagree6 == "4"
            ? "<b>Could not determine</b>"
            : "Could not determine";
        tableHTML6 += "</td>";
        tableHTML6 += "</tr>";

        // Get the content of the advanced template dynamically
        var templateContent = getTemplateContent(
          // "SuiteScripts/HRMS Layput/Intervieww Evaluaton form .xml"
          "SuiteScripts/HRMS Scripts/Interview Evaluation/Intervieww Evaluaton form.xml"
        ); // Replace with your advanced template ID
        log.debug("templateContent", templateContent);
        templateContent = templateContent.replace(
          "{{CANDNAME}}",
          namofcandidate
        );
        templateContent = templateContent.replace(
          "{{COMPLETEDBY}}",
          compltedby
        );
        templateContent = templateContent.replace(
          "{{POSITTLE}}",
          positiontitle
        );
        templateContent = templateContent.replace("{{INTRVWR}}", interviewer);
        templateContent = templateContent.replace("{{DEPTMNT}}", Department);
        templateContent = templateContent.replace("{{DOFINT}}", poDate);
        templateContent = templateContent.replace("{{TABLE1}}", tableHTML1);
        templateContent = templateContent.replace("{{TABLE2}}", tableHTML2);
        templateContent = templateContent.replace("{{TABLE3}}", tableHTML3);
        templateContent = templateContent.replace("{{TABLE4}}", tableHTML4);
        templateContent = templateContent.replace("{{TABLE5}}", tableHTML5);
        templateContent = templateContent.replace("{{TABLE6}}", tableHTML6);

        templateContent = templateContent.replace("{{COMMENT1}}", comment1);
        templateContent = templateContent.replace("{{COMMENT2}}", comment2);
        templateContent = templateContent.replace("{{COMMENT3}}", comment3);
        templateContent = templateContent.replace("{{COMMENT4}}", comment4);
        templateContent = templateContent.replace("{{COMMENT5}}", comment5);
        templateContent = templateContent.replace("{{COMMENT6}}", comment6);
        templateContent = templateContent.replace("{{COMMENT7}}", comment7);
        templateContent = templateContent.replace("{{COMMENT8}}", comment8);
        templateContent = templateContent.replace("{{COMMENT9}}", comment9);
        templateContent = templateContent.replace("{{COMMENT10}}", comment10);

        templateContent = templateContent.replace("{{STRENGTH}}", canstrength);
        templateContent = templateContent.replace("{{WEAKNESS}}", candweakness);
        templateContent = templateContent.replace(
          "{{ADDITIONAL}}",
          addcomments
        );
        var fix="yes"

        // templateContent=templateContent.replace("{{AMOUNT}}",salaryamount);
        // templateContent=templateContent.replace("{{MRORMRS}}",gendermrormrs);
        if (nssvsna1 == 1) {
          templateContent = templateContent.replace("{{NSa}}", fix);
          templateContent = templateContent.replace("{{Sa}}", "");
          templateContent = templateContent.replace("{{VSa}}", "");
          templateContent = templateContent.replace("{{NAa}}", "");
        }
        if (nssvsna1 == 2) {
          templateContent = templateContent.replace("{{NSa}}", "");
          templateContent = templateContent.replace("{{Sa}}", fix);
          templateContent = templateContent.replace("{{VSa}}", "");
          templateContent = templateContent.replace("{{NAa}}", "");
        }
        if (nssvsna1 == 3) {
          templateContent = templateContent.replace("{{NSa}}", "");
          templateContent = templateContent.replace("{{Sa}}", "");
          templateContent = templateContent.replace("{{VSa}}", fix);
          templateContent = templateContent.replace("{{NAa}}", "");
        }
        if (nssvsna1 == 4) {
          templateContent = templateContent.replace("{{NSa}}", "");
          templateContent = templateContent.replace("{{Sa}}", "");
          templateContent = templateContent.replace("{{VSa}}", "");
          templateContent = templateContent.replace("{{NAa}}", fix);
        }
        if (nssvsna1 == "") {
          templateContent = templateContent.replace(/{{NSa}}|{{Sa}}|{{VSa}}|{{NAa}}/g, "");
        }
        // 3
        if (nssvsna2 ==1) {
          templateContent = templateContent.replace("{{NSb}}", fix);
          templateContent = templateContent.replace("{{Sb}}", "");
          templateContent = templateContent.replace("{{VSb}}", "");
          templateContent = templateContent.replace("{{NAb}}", "");
        }
        if (nssvsna2 == 2) {
          templateContent = templateContent.replace("{{NSb}}", "");
          templateContent = templateContent.replace("{{Sb}}", fix);
          templateContent = templateContent.replace("{{VSb}}", "");
          templateContent = templateContent.replace("{{NAb}}", "");
        }
        if (nssvsna2 == 3) {
          templateContent = templateContent.replace("{{NSb}}", "");
          templateContent = templateContent.replace("{{Sb}}", "");
          templateContent = templateContent.replace("{{VSb}}", fix);
          templateContent = templateContent.replace("{{NAb}}", "");
        }
        if (nssvsna2 == 4) {
          templateContent = templateContent.replace("{{NSb}}", "");
          templateContent = templateContent.replace("{{Sb}}", "");
          templateContent = templateContent.replace("{{VSb}}", "");
          templateContent = templateContent.replace("{{NAb}}", fix);
        }
        if (nssvsna2 == "") {
          templateContent = templateContent.replace(/{{NSb}}|{{Sb}}|{{VSb}}|{{NAb}}/g, "");
        }
        // 3
        if (nssvsna3 ==1) {
          templateContent = templateContent.replace("{{NSc}}", fix);
          templateContent = templateContent.replace("{{Sc}}", "");
          templateContent = templateContent.replace("{{VSc}}", "");
          templateContent = templateContent.replace("{{NAc}}", "");
        }
        if (nssvsna3 == 2) {
          templateContent = templateContent.replace("{{NSc}}", "");
          templateContent = templateContent.replace("{{Sc}}", fix);
          templateContent = templateContent.replace("{{VSc}}", "");
          templateContent = templateContent.replace("{{NAc}}", "");
        }
        if (nssvsna3 == 3) {
          templateContent = templateContent.replace("{{NSc}}", "");
          templateContent = templateContent.replace("{{Sc}}", "");
          templateContent = templateContent.replace("{{VSc}}", fix);
          templateContent = templateContent.replace("{{NAc}}", "");
        }
        if (nssvsna3 == 4) {
          templateContent = templateContent.replace("{{NSc}}", "");
          templateContent = templateContent.replace("{{Sc}}", "");
          templateContent = templateContent.replace("{{VSc}}", "");
          templateContent = templateContent.replace("{{NAc}}", fix);
        }
        if (nssvsna3 == "") {
          templateContent = templateContent.replace(/{{NSc}}|{{Sc}}|{{VSc}}|{{NAc}}/g, "");
        }
        // 4
        if (nssvsna4 ==1) {
          templateContent = templateContent.replace("{{NSd}}", fix);
          templateContent = templateContent.replace("{{Sd}}", "");
          templateContent = templateContent.replace("{{VSd}}", "");
          templateContent = templateContent.replace("{{NAd}}", "");
        }
        if (nssvsna4 == 2) {
          templateContent = templateContent.replace("{{NSd}}", "");
          templateContent = templateContent.replace("{{Sd}}", fix);
          templateContent = templateContent.replace("{{VSd}}", "");
          templateContent = templateContent.replace("{{NAd}}", "");
        }
        if (nssvsna4 == 3) {
          templateContent = templateContent.replace("{{NSd}}", "");
          templateContent = templateContent.replace("{{Sd}}", "");
          templateContent = templateContent.replace("{{VSd}}", fix);
          templateContent = templateContent.replace("{{NAd}}", "");
        }
        if (nssvsna4 == 4) {
          templateContent = templateContent.replace("{{NSd}}", "");
          templateContent = templateContent.replace("{{Sd}}", "");
          templateContent = templateContent.replace("{{VSd}}", "");
          templateContent = templateContent.replace("{{NAd}}", fix);
        }
        if (nssvsna4 == "") {
          templateContent = templateContent.replace(/{{NSd}}|{{Sd}}|{{VSd}}|{{NAd}}/g, "");
        }
        // 5
        if (nssvsna5 ==1) {
          templateContent = templateContent.replace("{{NSe}}", fix);
          templateContent = templateContent.replace("{{Se}}", "");
          templateContent = templateContent.replace("{{VSe}}", "");
          templateContent = templateContent.replace("{{NAe}}", "");
        }
        if (nssvsna5 == 2) {
          templateContent = templateContent.replace("{{NSe}}", "");
          templateContent = templateContent.replace("{{Se}}", fix);
          templateContent = templateContent.replace("{{VSe}}", "");
          templateContent = templateContent.replace("{{NAe}}", "");
        }
        if (nssvsna5 == 3) {
          templateContent = templateContent.replace("{{NSe}}", "");
          templateContent = templateContent.replace("{{Se}}", "");
          templateContent = templateContent.replace("{{VSe}}", fix);
          templateContent = templateContent.replace("{{NAe}}", "");
        }
        if (nssvsna5 == 4) {
          templateContent = templateContent.replace("{{NSe}}", "");
          templateContent = templateContent.replace("{{Se}}", "");
          templateContent = templateContent.replace("{{VSe}}", "");
          templateContent = templateContent.replace("{{NAe}}", fix);
        }
        if (nssvsna5 == "") {
          templateContent = templateContent.replace(/{{NSe}}|{{Se}}|{{VSe}}|{{NAe}}/g, "");
        }
        // 6
        if (nssvsna6 ==1) {
          templateContent = templateContent.replace("{{NSf}}", fix);
          templateContent = templateContent.replace("{{Sf}}", "");
          templateContent = templateContent.replace("{{VSf}}", "");
          templateContent = templateContent.replace("{{NAf}}", "");
        }
        if (nssvsna6 == 2) {
          templateContent = templateContent.replace("{{NSf}}", "");
          templateContent = templateContent.replace("{{Sf}}", fix);
          templateContent = templateContent.replace("{{VSf}}", "");
          templateContent = templateContent.replace("{{NAf}}", "");
        }
        if (nssvsna6 == 3) {
          templateContent = templateContent.replace("{{NSf}}", "");
          templateContent = templateContent.replace("{{Sf}}", "");
          templateContent = templateContent.replace("{{VSf}}", fix);
          templateContent = templateContent.replace("{{NAf}}", "");
        }
        if (nssvsna6 == 4) {
          templateContent = templateContent.replace("{{NSf}}", "");
          templateContent = templateContent.replace("{{Sf}}", "");
          templateContent = templateContent.replace("{{VSf}}", "");
          templateContent = templateContent.replace("{{NAf}}", fix);
        }
        if (nssvsna6 == "") {
          templateContent = templateContent.replace(/{{NSf}}|{{Sf}}|{{VSf}}|{{NAf}}/g, "");
        }
        // 7

        if (nssvsna7 ==1) {
          templateContent = templateContent.replace("{{NSg}}", fix);
          templateContent = templateContent.replace("{{Sg}}", "");
          templateContent = templateContent.replace("{{VSg}}", "");
          templateContent = templateContent.replace("{{NAg}}", "");
        }
        if (nssvsna7 == 2) {
          templateContent = templateContent.replace("{{NSg}}", "");
          templateContent = templateContent.replace("{{Sg}}", fix);
          templateContent = templateContent.replace("{{VSg}}", "");
          templateContent = templateContent.replace("{{NAg}}", "");
        }
        if (nssvsna7 == 3) {
          templateContent = templateContent.replace("{{NSg}}", "");
          templateContent = templateContent.replace("{{Sg}}", "");
          templateContent = templateContent.replace("{{VSg}}", fix);
          templateContent = templateContent.replace("{{NAg}}", "");
        }
        if (nssvsna7 == 4) {
          templateContent = templateContent.replace("{{NSg}}", "");
          templateContent = templateContent.replace("{{Sg}}", "");
          templateContent = templateContent.replace("{{VSg}}", "");
          templateContent = templateContent.replace("{{NAg}}", fix);
        }
        if (nssvsna7 == "") {
          templateContent = templateContent.replace(/{{NSg}}|{{Sg}}|{{VSg}}|{{NAg}}/g, "");
        }
        // 8
        if (nssvsna8 ==1) {
          templateContent = templateContent.replace("{{NSh}}", fix);
          templateContent = templateContent.replace("{{Sh}}", "");
          templateContent = templateContent.replace("{{VSh}}", "");
          templateContent = templateContent.replace("{{NAh}}", "");
        }
        if (nssvsna8 == 2) {
          templateContent = templateContent.replace("{{NSh}}", "");
          templateContent = templateContent.replace("{{Sh}}", fix);
          templateContent = templateContent.replace("{{VSh}}", "");
          templateContent = templateContent.replace("{{NAh}}", "");
        }
        if (nssvsna8 == 3) {
          templateContent = templateContent.replace("{{NSh}}", "");
          templateContent = templateContent.replace("{{Sh}}", "");
          templateContent = templateContent.replace("{{VSh}}", fix);
          templateContent = templateContent.replace("{{NAh}}", "");
        }
        if (nssvsna8 == 4) {
          templateContent = templateContent.replace("{{NSh}}", "");
          templateContent = templateContent.replace("{{Sh}}", "");
          templateContent = templateContent.replace("{{VSh}}", "");
          templateContent = templateContent.replace("{{NAh}}", fix);
        }
        if (nssvsna8 == "") {
          templateContent = templateContent.replace(/{{NSh}}|{{Sh}}|{{VSh}}|{{NAh}}/g, "");
        }
        // 9
        if (nssvsna9 ==1) {
          templateContent = templateContent.replace("{{NSi}}", fix);
          templateContent = templateContent.replace("{{Si}}", "");
          templateContent = templateContent.replace("{{VSi}}", "");
          templateContent = templateContent.replace("{{NAi}}", "");
        }
        if (nssvsna9 == 2) {
          templateContent = templateContent.replace("{{NSi}}", "");
          templateContent = templateContent.replace("{{Si}}", fix);
          templateContent = templateContent.replace("{{VSi}}", "");
          templateContent = templateContent.replace("{{NAi}}", "");
        }
        if (nssvsna9 == 3) {
          templateContent = templateContent.replace("{{NSi}}", "");
          templateContent = templateContent.replace("{{Si}}", "");
          templateContent = templateContent.replace("{{VSi}}", fix);
          templateContent = templateContent.replace("{{NAi}}", "");
        }
        if (nssvsna9 == 4) {
          templateContent = templateContent.replace("{{NSi}}", "");
          templateContent = templateContent.replace("{{Si}}", "");
          templateContent = templateContent.replace("{{VSi}}", "");
          templateContent = templateContent.replace("{{NAi}}", fix);
        }
        if (nssvsna9 == "") {
          templateContent = templateContent.replace(/{{NSi}}|{{Si}}|{{VSi}}|{{NAi}}/g, "");
        }
        // 10
        if (nssvsna10 ==1) {
          templateContent = templateContent.replace("{{NSj}}", fix);
          templateContent = templateContent.replace("{{Sj}}", "");
          templateContent = templateContent.replace("{{VSj}}", "");
          templateContent = templateContent.replace("{{NAj}}", "");
        }
        if (nssvsna10 == 2) {
          templateContent = templateContent.replace("{{NSj}}", "");
          templateContent = templateContent.replace("{{Sj}}", fix);
          templateContent = templateContent.replace("{{VSj}}", "");
          templateContent = templateContent.replace("{{NAj}}", "");
        }
        if (nssvsna10 == 3) {
          templateContent = templateContent.replace("{{NSj}}", "");
          templateContent = templateContent.replace("{{Sj}}", "");
          templateContent = templateContent.replace("{{VSj}}", fix);
          templateContent = templateContent.replace("{{NAj}}", "");
        }
        if (nssvsna10 == 4) {
          templateContent = templateContent.replace("{{NSj}}", "");
          templateContent = templateContent.replace("{{Sj}}", "");
          templateContent = templateContent.replace("{{VSj}}", "");
          templateContent = templateContent.replace("{{NAj}}", fix);
        }
        if (nssvsna10 == "") {
          templateContent = templateContent.replace(/{{NSj}}|{{Sj}}|{{VSj}}|{{NAj}}/g, "");
        }

        if (agreedisagree1 == "Strongly Agree") {
        }
        // Create b renderer for the advanced template
        var renderer = render.create();
        renderer.templateContent = templateContent;
        renderer.addRecord({
          templateName: "record",
          record: customRecord,
        });

        // Render the PDF content
        var pdfContent = renderer.renderAsPdf();

        // Send the PDF back as b response
        context.response.writeFile({
          file: pdfContent,
          isInline: true,
        });
      } else {
        // Invalid or missing parameters
        context.response.write("Invalid or missing parameters.");
      }
    }
  }

  /**
   * Function to get the content of an advanced template by script ID
   * @param {string} templateScriptId - Script ID of the advanced template
   * @returns {string} - Content of the advanced template
   */
  function getTemplateContent(templateScriptId) {
    var templateFile = file.load({
      id: templateScriptId,
    });
    log.debug("templateFile", templateFile);
    return templateFile.getContents();
  }

  /**
   * Function to execute a SQL query and retrieve results
   * @param {string} sql - The SQL query to execute
   * @param {string} recordId - The ID of the record to filter the query
   * @returns {Array} - The result set of the query
   */
  function getResult(sql, recordId) {
    var queryResults = query.runSuiteQL({
      query: sql,
      params: [recordId],
    });

    return queryResults.asMappedResults();
  }

  return {
    onRequest: onRequest,
  };
});
