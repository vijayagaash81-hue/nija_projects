/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/query', 'N/ui/serverWidget', 'N/record'], function (query, ui, record) {

    function onRequest(context) {

        var form = ui.createForm({
            title: 'Employee Salary Update & Lookup ꗈ'
        });

        // Input field for Employee ID
        var empField = form.addField({
            id: 'custpage_empid',
            type: ui.FieldType.TEXT,
            label: 'Employee Internal ID'
        });

        // Input field to optionally set a new salary
        var updateSalField = form.addField({
            id: 'custpage_new_sal',
            type: ui.FieldType.TEXT,
            label: 'New Salary (Enter to Update)'
        });

        if (context.request.method === 'POST') {

            var empId = context.request.parameters.custpage_empid;
            var newSal = context.request.parameters.custpage_new_sal;

            // Update the salary if a new value was provided
            if (empId && newSal) {
                try {
                    record.submitFields({
                        type: record.Type.EMPLOYEE,
                        id: empId,
                        values: {
                            custentity_hris_test_sal: newSal
                        }
                    });
                } catch (e) {
                    form.addField({
                        id: 'custpage_error',
                        type: ui.FieldType.INLINEHTML,
                        label: 'Error'
                    }).defaultValue = `<div style="color:red;">Error updating salary: ${e.message}</div><br/>`;
                }
            }

            // SuiteQL Query
            var sql = `
                SELECT 
                    id,
                    entityid,
                    custentity_hris_test_sal
                FROM employee
                WHERE id = ?
            `;

            var resultSet = query.runSuiteQL({
                query: sql,
                params: [empId]
            });

            var results = resultSet.asMappedResults();

            if (results.length > 0) {
                var emp = results[0];

                var resultField = form.addField({
                    id: 'custpage_result',
                    type: ui.FieldType.INLINEHTML,
                    label: 'Result'
                });

                var updateMsg = newSal ? `<span style="color:green;">Salary successfully updated!</span><br/><br/>` : '';

                resultField.defaultValue = `
                    <div style="font-size:14px;">
                        ${updateMsg}
                        <b>Employee Name:</b> ${emp.entityid} <br/>
                        <b>Salary:</b> ${emp.custentity_hris_test_sal || 'Not Available'}
                    </div>
                `;
            } else {
                form.addField({
                    id: 'custpage_result',
                    type: ui.FieldType.INLINEHTML,
                    label: 'Result'
                }).defaultValue = `<div style="color:red;">No Employee Found</div>`;
            }
        }

        form.addSubmitButton({
            label: 'Submit'
        });

        context.response.writePage(form);
    }

    return {
        onRequest: onRequest
    };
});