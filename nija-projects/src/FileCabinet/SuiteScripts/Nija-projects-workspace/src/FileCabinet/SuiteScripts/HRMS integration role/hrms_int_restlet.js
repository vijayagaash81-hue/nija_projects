/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/search'], (search) => {

    const getEmployeeData = (request) => {
        try {

            // Optional: pass employee id from request
            let empId = request.empId ? parseInt(request.empId, 10) : null;

            let filters = [
                ['isinactive', 'is', 'F']
            ];

            // If empId is provided, filter it
            if (empId) {
                filters.push('and', ['internalid', 'anyof', empId]);
            }

            let employeeSearch = search.create({
                type: search.Type.EMPLOYEE,
                filters: filters,
                columns: [
                    'custentity_hris_empheight',
                    'custentity_hris_empmaritalstatus',
                    'custentity_hris_empgender'
                ]
            });

            let results = [];
            employeeSearch.run().each(result => {
                results.push({
                    id: result.id,
                    custentity_hris_empheight: result.getValue('custentity_hris_empheight'),
                    custentity_hris_empmaritalstatus: result.getValue('custentity_hris_empmaritalstatus'),
                    custentity_hris_empgender: result.getValue('custentity_hris_empgender')
                });
                return true;
            });

            return {
                status: "success",
                count: results.length,
                data: results
            };

        } catch (e) {
            return {
                status: "error",
                message: e.message
            };
        }
    };

    return {
        get: getEmployeeData
    };

});