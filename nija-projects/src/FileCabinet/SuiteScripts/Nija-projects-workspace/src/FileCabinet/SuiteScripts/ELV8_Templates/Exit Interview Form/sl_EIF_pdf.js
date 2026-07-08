/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/render', 'N/file', 'N/record', 'N/search', 'N/log', 'N/xml'], function (render, file, record, search, log, xml) {
    function onRequest(context) {
        var request = context.request;
        var response = context.response;

        if (request.method === 'GET') {
            try {
                var recordId = request.parameters.recId;

                var logoUrl = '';
                try {
                    var logoFile = file.load({ id: 5448 });
                    logoUrl = logoFile.url;
                } catch (logoErr) {
                    log.error('Error loading main logo file 5448', logoErr.message);
                }

                // Construct the data object to pass to the FreeMarker template
                var data = {
                    logoUrl: logoUrl,
                    empName: '',
                    joinDate: '',
                    designation: '',
                    endDate: '',

                    // Section 1
                    chk_career: false, chk_dissatisfied: false, chk_termination: false,
                    chk_salary: false, chk_benefits: false, chk_others: false,
                    chk_family: false, chk_school: false, othersSpecify: '',
                    chk_relocation: false, chk_worklife: false,

                    // Section 2
                    resign_1_2: false, resign_6_9: false, resign_3_5: false, resign_others: false,

                    // Section 3
                    spec_event_yes: false, spec_event_no: false, spec_event_explain: '',
                    discuss_yes: false, discuss_no: false,

                    // Ratings (1-5) & Comments
                    rate_training: 0, rate_training_comments: '',
                    rate_supervisor: 0, rate_supervisor_comments: '',
                    rate_employees: 0, rate_employees_comments: '',
                    rate_salary: 0, rate_salary_comments: '',
                    rate_benefits: 0, rate_benefits_comments: '',
                    rate_workload: 0, rate_workload_comments: '',
                    rate_satisfaction: 0, rate_satisfaction_comments: '',

                    // Problems & Enjoyment
                    prob_yes: false, prob_no: false, prob_comments: '',
                    enjoy_most: '', enjoy_least: '',

                    // Recommendation
                    recomm_yes: false, recomm_no: false, recomm_comments: '',

                    // Additional
                    additional_comments: '',
                    conductedByName: '', conductedDate: ''
                };

                // If recordId is provided, you can load the record and populate the data object here
                if (recordId) {
                    // Example:
                    // var exitRec = record.load({ type: 'customrecord_hr_exit_interview_form', id: recordId });
                    // data.empName = exitRec.getText({ fieldId: 'custrecord_hr_exit_employee_name' }) || '';
                    // ... map other fields accordingly ...
                }

                // Load the XML template file
                // IMPORTANT: Replace the ID with the actual internal ID of xml_EIF_pdf.xml in the File Cabinet
                var xmlTemplateFile = file.load({
                    id: 5459 // Update with correct path or ID
                });

                var renderer = render.create();
                renderer.templateContent = xmlTemplateFile.getContents();

                // Add the custom data object to the renderer
                renderer.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: 'data',
                    data: data
                });

                // Render PDF
                var pdfFile = renderer.renderAsPdf();

                response.setHeader({ name: 'Content-Type', value: 'application/pdf' });
                response.setHeader({
                    name: 'Content-Disposition',
                    value: 'inline; filename="Exit_Interview_Form.pdf"'
                });
                response.writeFile({ file: pdfFile, isInline: true });

            } catch (e) {
                log.error({ title: 'Error generating PDF', details: e });
                response.write('Error generating PDF: ' + e.message);
            }
        }
    }

    return {
        onRequest: onRequest
    };
});
