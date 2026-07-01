/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/search'], (search) => {

    const getEmployeeData = (request) => {
        try {

            // Optional: pass employee id from request
            let empId = request.empId ? parseInt(request.empId, 10) : null;

            // Use explicit search objects to prevent UNEXPECTED_ERROR parsing issues
            let searchFilters = [
                search.createFilter({ name: 'isinactive', operator: 'is', values: 'F' })
            ];

            // If empId is provided, filter it
            if (empId) {
                searchFilters.push(
                    search.createFilter({ name: 'internalid', operator: 'anyof', values: empId })
                );
            }

            let colHeight = search.createColumn({ name: 'custentity_hris_empheight' });
            let colMarital = search.createColumn({ name: 'custentity_hris_empmaritalstatus' });
            let colGender = search.createColumn({ name: 'custentity_hris_empgender' });

            let employeeSearch = search.create({
                type: search.Type.EMPLOYEE,
                filters: searchFilters,
                columns: [colHeight, colMarital, colGender]
            });

            let results = [];
            employeeSearch.run().each(result => {
                results.push({
                    id: result.id,
                    custentity_hris_empheight: result.getValue(colHeight),
                    custentity_hris_empmaritalstatus: result.getValue(colMarital),
                    custentity_hris_empgender: result.getValue(colGender)
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