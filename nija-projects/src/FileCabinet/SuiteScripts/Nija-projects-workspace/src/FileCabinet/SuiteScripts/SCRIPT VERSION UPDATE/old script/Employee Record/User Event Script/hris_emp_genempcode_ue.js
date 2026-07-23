function generate_employee_code(type) {
    nlapiLogExecution('DEBUG', 'type', type);
    if (type == 'create') {
        try {
            var customform = nlapiGetFieldValue('customform');
            nlapiLogExecution('DEBUG', 'customform', customform);
            if (customform == 167) {
                var empCode = nlapiGetFieldValue('custentity_hris_empcode');
                var subsidiary = nlapiGetFieldValue('subsidiary');
                var empfullname = nlapiGetFieldValue('custentity_hris_emplegalname');
                nlapiLogExecution('DEBUG', 'empCode', empCode);
                nlapiLogExecution('DEBUG', 'subsidiary', subsidiary);
                nlapiLogExecution('DEBUG', 'empfullname', empfullname);

                if (!empCode) {
                    var s_auto_prfix = '';
                    _record_Type = nlapiGetRecordType().toString().toLowerCase();
                    nlapiLogExecution('DEBUG', 'userEventBeforeLoad', '_record_Type: ' + _record_Type);
                    var i_rec_type_id = nlapiGetFieldValue('rectype');
                    var a_filter_unique_rec = [];
                    a_filter_unique_rec[0] = new nlobjSearchFilter('custrecord_hris_record_type', null, 'anyof', '-4');
                    a_filter_unique_rec[1] = new nlobjSearchFilter('custrecord_hris_urn_subsidiary', null, 'anyof', subsidiary);
                    a_filter_unique_rec[2] = new nlobjSearchFilter('isinactive', null, 'is', 'F');

                    var a_col_unique_rec = [];
                    a_col_unique_rec[0] = new nlobjSearchColumn('custrecord_hris_record_type');
                    a_col_unique_rec[1] = new nlobjSearchColumn('custrecord_hris_unique_number');
                    a_col_unique_rec[2] = new nlobjSearchColumn('custrecord_hris_employee_code_prefix');

                    var o_search_unique_ref = nlapiSearchRecord('customrecord_hris_unique_reference_numbe', null, a_filter_unique_rec, a_col_unique_rec);

                    if (_logValidation(o_search_unique_ref)) {
                        var i_id_unique_ref = o_search_unique_ref[0].getId();
                        var i_unique_num = parseInt(o_search_unique_ref[0].getValue('custrecord_hris_unique_number')) + 1;
                        var unique_number = parseInt(o_search_unique_ref[0].getValue('custrecord_hris_unique_number')) + 1;

                        var a_auto_prefix = o_search_unique_ref[0].getValue('custrecord_hris_employee_code_prefix');

                        // Manually pad the unique number to 5 digits
                        var formattedUniqueNumber = padNumber(i_unique_num, 5);

                        nlapiLogExecution('DEBUG', 'formattedUniqueNumber', formattedUniqueNumber);
                        var emp_code = a_auto_prefix + formattedUniqueNumber + ' ' + empfullname;
                        var emp_code1 = a_auto_prefix + formattedUniqueNumber;
                  

                        nlapiLogExecution('DEBUG', 'emp_code', emp_code);
                       nlapiLogExecution('DEBUG', 'emp_code1', emp_code1);
                        nlapiSetFieldValue('entityid', emp_code);
                        nlapiSetFieldValue('custentity_hris_empcode', emp_code1);

                        // Update the unique number in the custom record
                        nlapiSubmitField('customrecord_hris_unique_reference_numbe', i_id_unique_ref, 'custrecord_hris_unique_number', unique_number);
                    }
                }else{
                   // If empCode exists, concatenate it with employee full name
            var entityIdValue = empCode + ' ' + empfullname;
            // Set the concatenated value to entityid field
            nlapiSetFieldValue('entityid', entityIdValue);
            // Log the concatenated value
            nlapiLogExecution('DEBUG', 'entityIdValue', entityIdValue);
                }
            }
        } catch (e) {
            if (e instanceof nlobjError) {
                nlapiLogExecution('DEBUG', 'SearchRecforSameidformed_1 system error', e.getCode() + '\n' + e.getDetails());
            } else {
                nlapiLogExecution('DEBUG', 'SearchRecforSameidformed_1 unexpected error', e.toString());
            }
        }
    }
}

function _logValidation(value) {
    return value != null && value != undefined && value != '' && value != 'undefined';
}

function padNumber(number, length) {
    var str = number.toString();
    while (str.length < length) {
        str = '0' + str;
    }
    return str;
}