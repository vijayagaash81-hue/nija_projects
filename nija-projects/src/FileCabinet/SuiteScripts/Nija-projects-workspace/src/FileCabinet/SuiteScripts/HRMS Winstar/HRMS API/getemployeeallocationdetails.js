/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 */
define(['N/search', 'N/log'], function (search, log) {

    function doGet(params) {
        try {
            // 1. Capture the parameter from the URL (e.g., ?empid=123)
            var employeeId = params.empid; 
            
            var filters = [];
            // 2. If an ID is provided, add it to the filter array
            if (employeeId) {
                filters.push(['custrecord_njt_daily_atten_emp', 'anyof', employeeId]);
            }

            const customrecord_njt_emp_daily_atten_chSearchObj = search.create({
                type: "customrecord_njt_emp_daily_atten_ch",
                filters: filters, // 3. Use the dynamic filters here
                columns: [
                    search.createColumn({name: "isinactive", label: "Inactive"}),
                    search.createColumn({name: "internalid", label: "Internal ID"}),    
                    search.createColumn({name: "custrecord_njt_emp_daily_date", label: "Start Date"}),
                    search.createColumn({name: "custrecord_njt_daily_atten_emp", label: "employee"}),
                    search.createColumn({name: "custrecord_hris_shiftmaser", label: "Shift"}),
                    search.createColumn({name: "custrecord_njt_emp_daily_project", label: "Project"})
                ]
            });

            var response = {
                Status: "Success",
                ResponseCode: "200",
                records: []
            };

            customrecord_njt_emp_daily_atten_chSearchObj.run().each(function(result){

                var resultObj = {
                    internalId: result.getValue({ name: "internalid" }),
                    inactive: result.getValue({ name: "isinactive" }),
                    employee:result.getValue({ name: "custrecord_njt_daily_atten_emp" }),
                    shift:result.getValue({ name: "custrecord_hris_shiftmaser" }),
                    startdate : result.getValue({name: "custrecord_njt_emp_daily_date"}),
                    project :  result.getValue({name: "custrecord_njt_emp_daily_project"}),
                     };
                response.records.push(resultObj);
                //resultsArray.push(resultObj);
                return true;
});

               
            return JSON.stringify(response);

        } catch (e) {
            log.error({ title: 'Error executing search', details: e });
            return JSON.stringify({ Status: "Error", Message: e.message });
        }
    }

    return {
        get: doGet
    };
});