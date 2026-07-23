function EventAfterSubmit(type)
{

    var o_context = nlapiGetContext();
    if (o_context.getExecutionContext() == 'userinterface')
    {
        var Rec = nlapiLoadRecord('employee', nlapiGetRecordId())
        var customform =Rec.getFieldValue('customform');
        nlapiLogExecution('DEBUG','customform',customform);
        if (customform == 167) {
        var Inactive = Rec.getFieldValue('isinactive');
        nlapiLogExecution('DEBUG', 'Inactive::::', Inactive);
        if (Inactive == 'T')
        {
            var EDCSEARCH = nlapiSearchRecord("customrecord_hris_employee_compen_change", null,
                    [
                        ["isinactive", "is", "F"],
                        "AND",
                        ["custrecord_hris_empchange_employee_nam", "anyof", nlapiGetRecordId()]
                    ],
                    [

                    ]
                    );

            if (EDCSEARCH)
            {
                var EDCID = EDCSEARCH[0].getId();
                var EDCREC = nlapiLoadRecord('customrecord_hris_employee_compen_change', EDCID);
                EDCREC.setFieldValue('isinactive', 'T');
                nlapiSubmitRecord(EDCREC, true, true)
            }


            var leave_balanceSearch = nlapiSearchRecord("customrecord_hris_leavebalance", null,
                    [
                        ["isinactive", "is", "F"],
                        "AND",
                        ["custrecord_hris_lvbal_employee_name", "anyof", nlapiGetRecordId()]
                    ],
                    [
                        new nlobjSearchColumn("custrecord_hris_lvbal_employee_name")
                    ]
                    );


            if (leave_balanceSearch)
            {
                for (var i = 0; i < leave_balanceSearch.length; i++)
                {
                    var LBRECID = leave_balanceSearch[i].getId();
                    var LBREC = nlapiLoadRecord('customrecord_hris_leavebalance', LBRECID);
                    LBREC.setFieldValue('isinactive', 'T');
                    nlapiSubmitRecord(LBREC, true, true)
                }

            }
            //Start Inactive Employee Data Sourcing record ==========================
            var EDSSEARCH = nlapiSearchRecord("customrecord_hris_employeedatasourcing", null,
                    [
                        ["isinactive", "is", "F"],
                        "AND",
                        ["custrecord_hris_eds_employee", "anyof", nlapiGetRecordId()]
                    ],
                    [

                    ]
                    );

            if (EDSSEARCH) {
                var EDSID = EDSSEARCH[0].getId();
                var EDSREC = nlapiLoadRecord('customrecord_hris_employeedatasourcing', EDSID);
                EDSREC.setFieldValue('isinactive', 'T');
                nlapiSubmitRecord(EDSREC, true, true)
            }
            //End Inactive Employee Data Sourcing record ==============================
            //Start Inactive Employee Compensation Change History record ==============
            var EDCHSEARCH = nlapiSearchRecord("customrecord_hris_employee_compensation", null,
                    [
                        ["isinactive", "is", "F"],
                        "AND",
                        ["custrecord_hris_employee_name_", "anyof", nlapiGetRecordId()]
                    ],
                    [

                    ]
                    );

            if (EDCHSEARCH)
            {
                for (var i = 0; i < EDCHSEARCH.length; i++)
                {
                    var EDCHID = EDCHSEARCH[i].getId();
                    var EDCHREC = nlapiLoadRecord('customrecord_hris_employee_compensation', EDCHID);
                    EDCHREC.setFieldValue('isinactive', 'T');
                    nlapiSubmitRecord(EDCHREC, true, true)
                }
            }
            //End Inactive Employee Compensation Change History ========================
        } else
        {
            var EDCSEARCH = nlapiSearchRecord("customrecord_hris_employee_compen_change", null,
                    [
                        ["isinactive", "is", "T"],
                        "AND",
                        ["custrecord_hris_empchange_employee_nam", "anyof", nlapiGetRecordId()]
                    ],
                    [

                    ]
                    );

            if (EDCSEARCH)
            {
                var EDCID = EDCSEARCH[0].getId();
                var EDCREC = nlapiLoadRecord('customrecord_hris_employee_compen_change', EDCID);
                EDCREC.setFieldValue('isinactive', 'F');
                nlapiSubmitRecord(EDCREC, true, true)
            }


            var leave_balanceSearch = nlapiSearchRecord("customrecord_hris_leavebalance", null,
                    [
                        ["isinactive", "is", "T"],
                        "AND",
                        ["custrecord_hris_lvbal_employee_name", "anyof", nlapiGetRecordId()]
                    ],
                    [
                        new nlobjSearchColumn("custrecord_hris_lvbal_employee_name")
                    ]
                    );


            if (leave_balanceSearch)
            {
                for (var i = 0; i < leave_balanceSearch.length; i++)
                {
                    var LBRECID = leave_balanceSearch[i].getId();
                    var LBREC = nlapiLoadRecord('customrecord_hris_leavebalance', LBRECID);
                    LBREC.setFieldValue('isinactive', 'F');
                    nlapiSubmitRecord(LBREC, true, true)
                }

            }
            //Start active Employee Data Sourcing record ==============================
            var EDSSEARCH = nlapiSearchRecord("customrecord_hris_employeedatasourcing", null,
                    [
                        ["isinactive", "is", "T"],
                        "AND",
                        ["custrecord_hris_eds_employee", "anyof", nlapiGetRecordId()]
                    ],
                    [

                    ]
                    );

            if (EDSSEARCH) {
                var EDSID = EDSSEARCH[0].getId();
                var EDSREC = nlapiLoadRecord('customrecord_hris_employeedatasourcing', EDSID);
                EDSREC.setFieldValue('isinactive', 'F');
                nlapiSubmitRecord(EDSREC, true, true)
            }
            //End active Employee Data Sourcing record ==================================
            //Start active Employee Compensation Change History record ==================
            var EDCHSEARCH = nlapiSearchRecord("customrecord_hris_employee_compensation", null,
                    [
                        ["isinactive", "is", "T"],
                        "AND",
                        ["custrecord_hris_employee_name_", "anyof", nlapiGetRecordId()]
                    ],
                    [

                    ]
                    );

            if (EDCHSEARCH)
            {
                for (var i = 0; i < EDCHSEARCH.length; i++)
                {
                    var EDCHID = EDCHSEARCH[i].getId();
                    var EDCHREC = nlapiLoadRecord('customrecord_hris_employee_compensation', EDCHID);
                    EDCHREC.setFieldValue('isinactive', 'F');
                    nlapiSubmitRecord(EDCHREC, true, true)
                }
            }
            //End active Employee Compensation Change History ============================
        }

    }
    }
}

//Functions
function CheckValidOrNot(value) {
    if ((value != null) && (value != '') && (value != undefined) && (value.toString() != 'NaN')) {
        return true;
    } else {
        return false;
    }
}
function ValueOrNot(Value) {
    if (CheckValidOrNot(Value) && Value != '- None -') {
        return Value;
    } else {
        return '';
    }
}
