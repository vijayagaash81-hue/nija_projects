/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/url'], (serverWidget, url) => {
    const onRequest = (scriptContext) => {
        const { request, response } = scriptContext;

        if (request.method === 'GET') {
            const form = serverWidget.createForm({ title: 'Salary Comparison - Select Filters' });
            
            // 1. Employee Field (Mandatory)
            const empField = form.addField({
                id: 'custpage_employee_ref',
                type: serverWidget.FieldType.SELECT,
                label: 'Employee',
                source: 'employee'
            });
            empField.isMandatory = true;

            // 2. Subsidiary Field (Optional)
            form.addField({
                id: 'custpage_subsidiary',
                type: serverWidget.FieldType.SELECT,
                label: 'Subsidiary',
                source: 'subsidiary'
            });

            // 3. Paygroup Field (Optional)
            form.addField({
                id: 'custpage_paygroup',
                type: serverWidget.FieldType.SELECT,
                label: 'Pay Group',
                source: 'customrecord_hris_process_groupmaster'
            });

            form.addSubmitButton({ label: 'Generate Report' });
            response.writePage(form);

        } else {
            const employeeId = request.parameters.custpage_employee_ref;
            const subsidiary = request.parameters.custpage_subsidiary;
            const paygroup = request.parameters.custpage_paygroup;
            
            response.sendRedirect({
                type: 'SUITELET',
                identifier: 'customscript_hris_salary_com_post_report', 
                id: 'customdeploy_hris_salary_com_post_report',
                parameters: { 
                    custparam_empid: employeeId,
                    custparam_sub: subsidiary || '',
                    custparam_pg: paygroup || ''
                }
            });
        }
    };

    return { onRequest };
});