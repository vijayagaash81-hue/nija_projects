/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @description HR45 Exit Interview Form - Fixed Attribute Mapping and Logo.
 */
define(['N/record', 'N/search', 'N/log', 'N/file', 'N/url', 'N/format'], (record, search, log, file, url, format) => {

    const onRequest = (scriptContext) => {
        const { request, response } = scriptContext;

        if (request.method === 'GET') {
            const recordId = request.parameters.recid;
            if (!recordId) {
                response.write('Error: Missing required parameter "recid".');
                return;
            }

            const recordData = getExitInterviewData(recordId);
            const logoUrl = getLogoUrl(recordData.subsidiaryId);
            const pdfFilename = `HR45_ExitInterview_${(recordData.empName || 'Record').replace(/\s+/g, '_')}.pdf`;

            const htmlContent = generateHtml(recordData, logoUrl, pdfFilename);
            response.write(htmlContent);
        }
    };

    function generateHtml(data, logoUrl, pdfFilename) {
        const chk = (val) => (val === true || val === 'T') ? '&#9745;' : '&#9744;';
        const esc = (val) => val ? val.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : '';

        let matrixRows = '';
        if (data.matrixQuestions && data.matrixQuestions.length > 0) {
            data.matrixQuestions.forEach(q => {
                matrixRows += `
                <tr>
                    <td style="text-align: left; font-weight: normal;">${esc(q.questionText)}</td>
                    <td class="text-center">${q.rating == "5" ? '●' : '○'}</td>
                    <td class="text-center">${q.rating == "4" ? '●' : '○'}</td>
                    <td class="text-center">${q.rating == "3" ? '●' : '○'}</td>
                    <td class="text-center">${q.rating == "2" ? '●' : '○'}</td>
                    <td class="text-center">${q.rating == "1" ? '●' : '○'}</td>
                    <td style="text-align: left; font-size: 8pt; word-break: break-all;">${esc(q.remarks)}</td>
                </tr>`;
            });
        } else {
            matrixRows = '<tr><td colspan="7" class="text-center" style="padding:15px; color:#999;">No attributes found for this record.</td></tr>';
        }

        const header = `
            <table style="border: none; margin-bottom: 10px;">
                <tr style="border: none;">
                    <td style="border: none; width: 15%; text-align: left;">
                        ${logoUrl ? `<img src="${logoUrl}" style="width: 75px; height: 75px; object-fit: contain;"/>` : ''}
                    </td>
                    <td style="border: none; text-align: center; vertical-align: middle;">
                        <div style="color: #1e395b; font-weight: bold; font-size: 13pt;">AL NAJMA AL FAREEDA INTERNATIONAL GROUP</div>
                        <div style="font-size: 11pt; font-weight: bold; color: #305496; text-decoration: underline;">Exit Interview Form (HR45)</div>
                    </td>
                    <td style="border: none; width: 15%;"></td>
                </tr>
            </table>`;

        const footer = (pageNum) => `
            <div class="footer-meta">
                <table style="border: none; width: 100%;">
                    <tr style="border: none;">
                        <td style="border: none; width: 33%; font-size: 8pt; color: #333;">Reviewed by HR Manager:</td>
                        <td style="border: none; width: 34%; font-size: 8pt; color: #333; text-align: center;">Approved by CEO:</td>
                        <td style="border: none; width: 33%; font-size: 8pt; color: #333; text-align: right;">Page ${pageNum} of 2</td>
                    </tr>
                </table>

             <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: flex-end;">
                    <div>
                        <div style="font-size: 18pt; font-weight: bold; color: #94b2ff; letter-spacing: 2px;">CONTROLLED</div>
                        <div style="font-size: 7.5pt; color: #555;">
                            Document Code: ${data.docno || 'HRD/HR45/2024'}<br/>Issue No. 5<br/>Effective date: ${data.resignationDate || '07.11.2024'}
                        </div>
                    </div>
                </div>        
        
            </div>`;

        return `<!DOCTYPE html>
<html>
<head>
<style type="text/css">
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
    body { font-family: Calibri, sans-serif; font-size: 9pt; background-color: #525659; margin: 0; padding: 0; color: #000; }
    .btn-bar { position: fixed; top: 15px; right: 15px; z-index: 999; display: flex; gap: 10px; }
    .btn-bar button { padding: 12px 20px; cursor: pointer; border: none; border-radius: 4px; font-weight: bold; color: white; background: #305496; font-size: 10pt; display: flex; align-items: center; gap: 8px; }
    .page { width: 210mm; margin: 10mm auto; padding: 12mm 15mm 25mm 15mm; background: white; min-height: 297mm; position: relative; box-shadow: 0 0 15px rgba(0,0,0,0.5); }
    @media print { body { background: none; } .page { margin: 0; box-shadow: none; page-break-after: always; width: 100%; } .no-print { display: none !important; } }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: -1px; }
    td { border: 1px solid #000; padding: 5px 8px; vertical-align: top; font-size: 8.5pt; }
    th { border: 1px solid #000; background-color: #F2F2F2; font-weight: bold; text-align: center; padding: 5px; font-size: 8.5pt; }
    .label { font-weight: bold; }
    .text-center { text-align: center; }
    .section-blue { background-color:  #F2F2F2; color: #000000; font-weight: bold; text-align: center; padding: 4px; border: 1px solid #000; font-size: 9pt; margin-top: 10px; }
    .footer-meta { position: absolute; bottom: 8mm; left: 15mm; right: 15mm; }
    .loading-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: none; justify-content: center; align-items: center; z-index: 1000; }
    .spinner { width: 60px; height: 60px; border: 6px solid #f3f3f3; border-top: 6px solid #305496; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
</head>
<body>
<div class="loading-overlay" id="loadingOverlay"><div class="spinner"></div></div>
<div class="btn-bar no-print">
    <button onclick="window.print()">PRINT FORM</button>
    <button style="background: #1e7e34;" onclick="downloadPDF()">DOWNLOAD PDF</button>
</div>

<div class="page" id="page1">
    ${header}
    <div style="border: 1px solid #000; padding: 6px; font-size: 8pt; margin-bottom: 5px; background: #f9f9f9;">
        Al Najma Al Fareeda HR Department is conducting an exit interview survey. As a former employee, your views help identify factors which led to your exit and improve employee retention. All views are confidential.
    </div>
  

    <table>
            <tr>
                <td style="width:44%;"><strong>Employee Name</strong>: ${esc(data.empName)}</td>
                <td style="width:21.5%;"><strong>Employee No</strong>: ${esc(data.empCode)}</td>
                <td style="width:34.5%;"><strong>Designation</strong>: ${esc(data.designation)}</td>
            </tr>
            <tr>
                <td><strong>Date</strong>: ${esc(data.docDate)}</td>
                <td><strong>Department</strong>: ${esc(data.department)}</td>
                <td><strong>Date of Joining</strong>:  ${esc(data.hireDate)}</td>
            </tr>
            <tr>
                <td colspan="2"><strong>Last Working Date</strong>: ${esc(data.lastWorkingDate)}</td>
                <td><strong>Duration of Work</strong>: ${esc(data.yearsOfService)}</td>
            </tr>
            <tr>
                <td><strong>Grade</strong>: ${esc(data.grade)}</td>
                <td colspan="2"><strong>Immediate Supervisor</strong>: ${esc(data.supervisor || data.lineManager)}</td>
            </tr>
        </table>

    <div style="background-color: #F2F2F2; text-align: center; border: 1px solid #000; font-weight: bold; padding: 3px; font-size: 8pt; margin-top: 10px;">
        5=Fully Satisfied, 4=Satisfied, 3=Partially satisfied 2=Not Satisfied 1=Disappointed
    </div>
    <table>
        <thead>
            <tr>
                <th width="45%">Attribute</th>
                <th width="5%">5</th><th width="5%">4</th><th width="5%">3</th><th width="5%">2</th><th width="5%">1</th>
                <th width="30%">Remarks</th>
            </tr>
        </thead>
        <tbody>
            ${matrixRows}
        </tbody>
    </table>

    <div class="section-blue">Reason for leaving Al Najma Al Fareeda</div>
    <table>
        <tr>
            <td><span style="font-size:12pt;">${chk(data.endcontract)}</span> End of contract</td>
            <td><span style="font-size:12pt;">${chk(data.notsatisfysalary)}</span> Not satisfied with salary</td>
            <td colspan="2"><span style="font-size:12pt;">${chk(data.notsatisfycompany)}</span> Not Satisfied with company policy</td>
        </tr>
        <tr>
            <td><span style="font-size:12pt;">${chk(data.norecognition)}</span> No Recognition</td>
            <td><span style="font-size:12pt;">${chk(data.notsatisfysuperior)}</span> Not satisfied with supervisor</td>
            <td><span style="font-size:12pt;">${chk(data.personalreason)}</span> Personal Reason</td>
            <td><span style="font-size:12pt;">${chk(data.vacationnotschedule)}</span> Vacation not per schedule</td>
        </tr>
        <tr><td colspan="4" style="height: 35px;"><span class="label">Others specify:</span> ${esc(data.othersSpecify)}</td></tr>
    </table>

    <div class="section-blue">Will you re-join if</div>
    <table class="text-center">
        <tr>
            <td><span style="font-size:12pt;">${chk(data.rejoinSalaryRevised)}</span> Salary is revised</td>
            <td><span style="font-size:12pt;">${chk(data.rejoinRecognitionImproved)}</span> Recognition improved</td>
            <td><span style="font-size:12pt;">${chk(data.rejoinVacationSchedule)}</span> Vacation per schedule</td>
        </tr>
    </table>

    <div class="section-blue">Retention Focus Areas</div>
    <table>
        <tr>
            <td><span style="font-size:12pt;">${chk(data.focusStdSalary)}</span> Standard salary structure</td>
            <td><span style="font-size:12pt;">${chk(data.focusPerfAppraisal)}</span> Performance appraisal</td>
            <td><span style="font-size:12pt;">${chk(data.focusCommunication)}</span> Communication</td>
        </tr>
        <tr>
            <td><span style="font-size:12pt;">${chk(data.focusSalaryOnDate)}</span> Salary on date</td>
            <td><span style="font-size:12pt;">${chk(data.focusRecognizingEmp)}</span> Recognizing employees</td>
            <td><span style="font-size:12pt;">${chk(data.focusSettlementBenefit)}</span> Settlement & Benefit</td>
        </tr>
    </table>

    <div class="section-blue">Would you recommend join?</div>
    <table class="text-center">
        <tr>
            <td><span style="font-size:12pt;">${chk(data.mostlike)}</span> Most likely</td>
            <td><span style="font-size:12pt;">${chk(data.like)}</span> Likely</td>
            <td><span style="font-size:12pt;">${chk(data.possible)}</span> Possible</td>
            <td><span style="font-size:12pt;">${chk(data.probable)}</span> Probable</td>
            <td><span style="font-size:12pt;">${chk(data.notpossible)}</span> Not possible</td>
        </tr>
    </table>
    ${footer(1)}
</div>

<div class="page" id="page2">
    ${header}
    <div class="section-blue">Things learned during employment</div>
    <table style="text-align: center;">
        <tr style="background:#F2F2F2; font-weight:bold;">
            <td>External Training</td><td>Internal Training</td><td>Site/Office Learning</td><td>Knowledge sharing</td>
        </tr>
        <tr><td style="height: 100px;"></td><td style="height: 100px;"></td><td style="height: 100px;"></td><td style="height: 100px;"></td></tr>
    </table>
    <table style="margin-top: 15px;">
        <tr><td style="height: 100px;"><span class="label">Any other comments:</span></td></tr>
        <tr><td style="height: 60px; vertical-align: middle;"><span class="label">Employee Signature:</span> ________________________________</td></tr>
        <tr><td style="height: 80px;"><span class="label">Interviewer’s Comments:</span></td></tr>
    </table>
    <table style="margin-top: 10px;">
        <tr>
            <td width="50%" style="height: 50px;"><span class="label">Interviewed by:</span></td>
            <td width="50%" style="height: 50px;"><span class="label">Designation:</span></td>
        </tr>
        <tr><td colspan="2" style="height: 50px;"><span class="label">Signature & Date:</span></td></tr>
    </table>
    ${footer(2)}
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script>
    async function downloadPDF() {
        document.getElementById('loadingOverlay').style.display = 'flex';
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const canvas1 = await html2canvas(document.getElementById('page1'), { scale: 2 });
        pdf.addImage(canvas1.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, 210, 297);
        pdf.addPage();
        const canvas2 = await html2canvas(document.getElementById('page2'), { scale: 2 });
        pdf.addImage(canvas2.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, 210, 297);
        pdf.save('${pdfFilename}');
        document.getElementById('loadingOverlay').style.display = 'none';
    }
</script>
</body>
</html>`;
    }

    const getLogoUrl = (subsidiaryId) => {
        try {
            if (!subsidiaryId) return '';
            const subRec = record.load({ type: record.Type.SUBSIDIARY, id: subsidiaryId });
            const logoId = subRec.getValue({ fieldId: 'logo' }) || subRec.getValue({ fieldId: 'pagelogo' });
            if (!logoId) return '';
            const logoFile = file.load({ id: logoId });
            return 'https://' + url.resolveDomain({ hostType: url.HostType.APPLICATION }) + logoFile.url;
        } catch (e) { return ''; }
    };

    function getExitInterviewData(recordId) {
        let data = {
            docno: "", empName: "", empCode: "", designation: "", department: "",
            docDate: "", lastWorkingDate: "", yearsOfService: "", grade: "",
            subsidiaryId: "", subsidiaryName: "", othersSpecify: "", matrixQuestions: [],
            lineManager: "", hod: "", supervisor: "", hireDate: "", resignationDate: ""
        };

        try {
            const exitSearch = search.create({
                type: "customrecord_hr_exit_interview_form",
                filters: [["internalid", "anyof", recordId]],
                columns: [
                    search.createColumn({name: "name", label: "Name"}),
                    search.createColumn({name: "custrecord_hr_exit_employee_name"}),
                    search.createColumn({name: "custrecord_hr_exit_interview__emp_code"}),
                    search.createColumn({name: "custrecord_hr_exit_interview_designation"}),
                    search.createColumn({name: "custrecord_hr_exit_interview_department"}),
                    search.createColumn({name: "custrecord_hr_exit_interview_doc_date"}),
                    search.createColumn({name: "custrecord_hr_exit_intervi_lst_wkng_date"}),
                    search.createColumn({name: "custrecord_hris_res_tot_years_of_service", join: "CUSTRECORD_HR_EXIT_INTERVIEW_RESIGNLINK"}),
                    search.createColumn({name: "custentity_emp_grade_", join: "CUSTRECORD_HR_EXIT_EMPLOYEE_NAME"}),
                    search.createColumn({name: "custrecord_hr_exit_interview_subsidiary"}),

                    search.createColumn({name: "custrecord_eqr_response_text", join: "CUSTRECORD_EQR_EMPLOYEE_EXIT_FORM"}),
                    search.createColumn({name: "custrecord_eqr_response_rating", join: "CUSTRECORD_EQR_EMPLOYEE_EXIT_FORM"}),
                    search.createColumn({name: "custrecord_eqr_exitquestion", join: "CUSTRECORD_EQR_EMPLOYEE_EXIT_FORM"}),

                    search.createColumn({name: "custrecord_hr_exit_end_of_contract"}),
                    search.createColumn({name: "custrecord_hr_exit_not_saied_with_salary"}),
                    search.createColumn({name: "custrecord_hr_exi_not_sated_with_cony_po"}),
                    search.createColumn({name: "custrecord_hr_exit_no_recognition"}),
                    search.createColumn({name: "custrecord_hr_e_not_sied_with_your_super"}),
                    search.createColumn({name: "custrecord_hr_exit_personal_reason"}),
                    search.createColumn({name: "custrecord_hr_exit_ann_vac_not_send_as"}),
                    search.createColumn({name: "custrecord_hr_exit_others_specify"}),
                    search.createColumn({name: "custrecordhr_exit_salary_is_revised"}),
                    search.createColumn({name: "custrecordhr_exit_rec_prog_are_imp"}),
                    search.createColumn({name: "custrecordhr_exit_ann_vac_sent_as_per_s"}),
                    search.createColumn({name: "custrecord_hr_exit_possible"}),
                    search.createColumn({name: "custrecordhr_exit_sta_salary_str"}),
                    search.createColumn({name: "custrecordhr_exit_sett_employee_benefit"}),
                    search.createColumn({name: "custrecord_hr_exit_salary_on_date"}),
                    search.createColumn({name: "custrecord_hr_exit_recognizing_employees"}),
                    search.createColumn({name: "custrecord_hr_exit_most_likely"}),
                    search.createColumn({name: "custrecord_hr_exit_likely"}),
                    search.createColumn({name: "custrecord_hr_exit_not_possible"}),
                    search.createColumn({name: "custrecord_hr_exit_probable"}),
                    search.createColumn({name: "custrecord_hr_exit_per_appraisal"}),
                    search.createColumn({name: "custrecordhr_exit_communication"}),
                    search.createColumn({
                        name: "custentity_hris_emplinemanger",
                        join: "CUSTRECORD_HR_EXIT_EMPLOYEE_NAME",
                        label: "Line Manager"
                    }),
                    search.createColumn({
                        name: "custentity_hris_emphod",
                        join: "CUSTRECORD_HR_EXIT_EMPLOYEE_NAME",
                        label: "HOD"
                    }),
                    search.createColumn({
                        name: "supervisor",
                        join: "CUSTRECORD_HR_EXIT_EMPLOYEE_NAME",
                        label: "Supervisor"
                    }),
                    search.createColumn({
                        name: "hiredate",
                        join: "CUSTRECORD_HR_EXIT_EMPLOYEE_NAME",
                        label: "Hire Date"
                    }),
                    search.createColumn({
                        name: "custrecord_hris_res_resignation_date",
                        join: "CUSTRECORD_HR_EXIT_INTERVIEW_RESIGNLINK",
                        label: "Resignation Date"
                    })
                ]
            });

            exitSearch.run().each((result) => {
                data.docno = result.getValue({name: 'name'}) || "";
                data.empName = result.getText({name: "custrecord_hr_exit_employee_name"}) || result.getValue({name: "custrecord_hr_exit_employee_name"}) || "";
                data.empCode = result.getValue({name: "custrecord_hr_exit_interview__emp_code"}) || "";
                data.designation = result.getText({name: "custrecord_hr_exit_interview_designation"}) || "";
                data.department = result.getText({name: "custrecord_hr_exit_interview_department"}) || "";
                data.docDate = result.getValue({name: "custrecord_hr_exit_interview_doc_date"}) || "";
                data.lastWorkingDate = result.getValue({name: "custrecord_hr_exit_intervi_lst_wkng_date"}) || "";
                data.yearsOfService = result.getValue({name: "custrecord_hris_res_tot_years_of_service", join: "CUSTRECORD_HR_EXIT_INTERVIEW_RESIGNLINK"}) || "";
                data.grade = result.getText({name: "custentity_emp_grade_", join: "CUSTRECORD_HR_EXIT_EMPLOYEE_NAME"}) || "";
                data.subsidiaryId = result.getValue({name: "custrecord_hr_exit_interview_subsidiary"}) || "";
                data.subsidiaryName = result.getText({name: "custrecord_hr_exit_interview_subsidiary"}) || "";

                const parseBool = (fName) => {
                    let v = result.getValue({name: fName});
                    return v === true || v === "T";
                };

                data.endcontract = parseBool("custrecord_hr_exit_end_of_contract");
                data.notsatisfysalary = parseBool("custrecord_hr_exit_not_saied_with_salary");
                data.notsatisfycompany = parseBool("custrecord_hr_exi_not_sated_with_cony_po");
                data.norecognition = parseBool("custrecord_hr_exit_no_recognition");
                data.notsatisfysuperior = parseBool("custrecord_hr_e_not_sied_with_your_super");
                data.personalreason = parseBool("custrecord_hr_exit_personal_reason");
                data.vacationnotschedule = parseBool("custrecord_hr_exit_ann_vac_not_send_as");
                data.othersSpecify = result.getValue({name: "custrecord_hr_exit_others_specify"}) || "";

                data.rejoinSalaryRevised = parseBool("custrecordhr_exit_salary_is_revised");
                data.rejoinRecognitionImproved = parseBool("custrecordhr_exit_rec_prog_are_imp");
                data.rejoinVacationSchedule = parseBool("custrecordhr_exit_ann_vac_sent_as_per_s");

                data.focusStdSalary = parseBool("custrecordhr_exit_sta_salary_str");
                data.focusPerfAppraisal = parseBool("custrecord_hr_exit_per_appraisal");
                data.focusCommunication = parseBool("custrecordhr_exit_communication");
                data.focusSalaryOnDate = parseBool("custrecord_hr_exit_salary_on_date");
                data.focusRecognizingEmp = parseBool("custrecord_hr_exit_recognizing_employees");
                data.focusSettlementBenefit = parseBool("custrecordhr_exit_sett_employee_benefit");

                data.mostlike = parseBool("custrecord_hr_exit_most_likely");
                data.like = parseBool("custrecord_hr_exit_likely");
                data.possible = parseBool("custrecord_hr_exit_possible");
                data.probable = parseBool("custrecord_hr_exit_probable");
                data.notpossible = parseBool("custrecord_hr_exit_not_possible");

                data.lineManager = result.getText({ name: "custentity_hris_emplinemanger", join: "CUSTRECORD_HR_EXIT_EMPLOYEE_NAME" }) || "";
                data.hod = result.getText({ name: "custentity_hris_emphod", join: "CUSTRECORD_HR_EXIT_EMPLOYEE_NAME" }) || "";
                data.supervisor = result.getText({ name: "supervisor", join: "CUSTRECORD_HR_EXIT_EMPLOYEE_NAME" }) || "";

                data.hireDate = result.getValue({ name: "hiredate", join: "CUSTRECORD_HR_EXIT_EMPLOYEE_NAME" }) || "";
                data.resignationDate = result.getValue({ name: "custrecord_hris_res_resignation_date", join: "CUSTRECORD_HR_EXIT_INTERVIEW_RESIGNLINK" }) || "";

                let questionText = result.getText({name: "custrecord_eqr_exitquestion", join: "CUSTRECORD_EQR_EMPLOYEE_EXIT_FORM"}) || result.getValue({name: "custrecord_eqr_exitquestion", join: "CUSTRECORD_EQR_EMPLOYEE_EXIT_FORM"}) || "";
                let rating = result.getValue({name: "custrecord_eqr_response_rating", join: "CUSTRECORD_EQR_EMPLOYEE_EXIT_FORM"}) || "";
                let remarks = result.getValue({name: "custrecord_eqr_response_text", join: "CUSTRECORD_EQR_EMPLOYEE_EXIT_FORM"}) || "";

                if (questionText) {
                    data.matrixQuestions.push({ questionText: questionText, rating: rating, remarks: remarks });
                }
                return true;
            });
        } catch (e) {
            log.error("Error retrieving data for ID " + recordId, e);
        }
        return data;
    }

    return { onRequest };
});