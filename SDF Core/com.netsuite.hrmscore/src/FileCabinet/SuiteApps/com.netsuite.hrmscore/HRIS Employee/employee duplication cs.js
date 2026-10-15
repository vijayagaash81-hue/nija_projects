/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/message', 'N/https', 'N/query', 'N/log'], function (currentRecord, message, https, query, log) {
    // Function to execute before record is saved
    function saveRecord(context) {
        // Enable debugger for troubleshooting
        debugger;
        
        // Get the current record using currentRecord.get()
        var currentRec = currentRecord.get();
        
        // Get the custom form ID
        var customFormId = currentRec.getValue({
            fieldId: 'customform'
        });
        
        // Only proceed if custom form ID is 129
        if (customFormId != '129') {
            // Allow save if form is not 129
            return true;
        }
        
        // Get the employee legal name from the main record using getValue
        var empLegalName = currentRec.getValue({
            fieldId: 'custentity_hris_emplegalname'
        });
        
        // Log the employee name for debugging
        log.debug("empLegalName", empLegalName);
        
        // Check if employee name is provided
        if (empLegalName) {
            // Construct SQL query to check for duplicate employee name
            var nameSql = "SELECT id " +
                         "FROM employee " +
                         "WHERE custentity_hris_emplegalname = '" + empLegalName + "'";
            
            // Log the SQL query for debugging
            log.debug('Step 1: Name SQL Query', nameSql);
            
            // Execute the SQL query
            var nameResult = query.runSuiteQL({
                query: nameSql
            }).asMappedResults();
            
            // Log the query results for debugging
            log.debug('Step 2: Name Query Results', nameResult);
            
            // Check if duplicate name exists
            if (nameResult && nameResult.length > 0) {
                // Show alert for duplicate name
                alert("An employee with the name " + empLegalName + " already exists. Please use a different name.");
                return false; // Prevent save due to duplicate name
            }
        }
        
        // Define the sublist ID for employee ID information
        var sublistId = 'recmachcustrecord_hris_emp_link';
        
        // Get the number of lines in the sublist
        var lineCount = currentRec.getLineCount({ sublistId: sublistId });
        
        // Flag to track if a duplicate is found
        var hasDuplicate = false;
        
        // Loop through each line in the sublist
        for (var i = 0; i < lineCount; i++) {
            // Get the ID type for the current line
            var idType = currentRec.getSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord_hris_emp_id_type',
                line: i
            });
            
            // Check if the ID type is passport (value '1')
            if (idType == '1') {
                // Get the passport number for the current line
                var idNum = currentRec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_hris_id_no',
                    line: i
                });
                
                // Proceed only if passport number exists
                if (idNum) {
                    // Construct SQL query to check for duplicate passport number and employee name
                    var passportSql = "SELECT c.custrecord_hris_emp_link " +
                                    "FROM customrecord_hris_emp_id_info c " +
                                    "INNER JOIN employee e ON c.custrecord_hris_emp_link = e.id " +
                                    "WHERE c.custrecord_hris_id_no = '" + idNum + "' " +
                                    "AND c.custrecord_hris_emp_id_type = 1 " +
                                    "AND e.custentity_hris_emplegalname = '" + empLegalName + "'";
                    
                    // Log the SQL query for debugging
                    log.debug('Step 3: Passport SQL Query', passportSql);
                    
                    // Execute the SQL query
                    var resultSet = query.runSuiteQL({
                        query: passportSql
                    }).asMappedResults();
                    
                    // Log the query results for debugging
                    log.debug('Step 4: Passport Query Results', resultSet);
                    
                    // Check if duplicate passport number and name exist
                    if (resultSet && resultSet.length > 0) {
                        // Show alert for duplicate name and passport number
                        alert("This employee already has the same name (" + empLegalName + ") and passport number (" + idNum + "). Please change.");
                        hasDuplicate = true;
                        break; // Exit loop as duplicate is found
                    }
                }
            }
        }
        
        // Return false to prevent save if duplicate is found, otherwise allow save
        return !hasDuplicate;
    }
    
    // Expose the saveRecord function to NetSuite
    return {
        saveRecord: saveRecord
    };
});