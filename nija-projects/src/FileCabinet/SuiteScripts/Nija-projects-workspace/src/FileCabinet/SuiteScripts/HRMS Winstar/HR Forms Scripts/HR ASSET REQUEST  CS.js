    /**
     * @NApiVersion 2.0
     * @NScriptType ClientScript
     * @NModuleScope Public
     */
    define(['N/record', 'N/log', 'N/format', './moment.js', 'N/currentRecord', 'N/query'], function (record, log, format, moment, currentRecord, query) {
        function pageInit(context) {
            debugger;
            var rec = currentRecord.get();

            
            
        }

    
        function assetissue() {
            debugger;
            try {
                var rec = currentRecord.get();
                var id = rec.id;
                var recordType = rec.type;

                log.debug("Record ID", id);
                log.debug("Record Type", recordType);

                var currentObjRecordA = record.load({
                    type: recordType,
                    id: id,
                });

            

                var requestorname = currentObjRecordA.getValue({ fieldId: "name" }) || "";
                var Reqdate=currentObjRecordA.getValue({ fieldId: "custrecord_hris_asset_req_date" }) || "";
                var parsedToDate = "";
                if (Reqdate) {
                    // var parsedDateA = moment(Reqdate, "DD/MM/YYYY").toDate();
                    parsedToDate = format.format({
                        value: Reqdate,
                        type: format.Type.DATE
                    });
                    log.debug("parsedToDate", parsedToDate);
                }
                var EmployeeName=currentObjRecordA.getValue({
                    fieldId:"custrecord_hris_asset_emp_name"
                });
                log.debug("EmployeeName",EmployeeName);
                var AssetType=currentObjRecordA.getValue({
                    fieldId:"custrecord_hris_asset_type"
                });
                log.debug("AssetType",AssetType);
                var EmpCode=currentObjRecordA.getValue({
                    fieldId:"custrecord_hris_asset_employee_code"
                });
                log.debug("EmpCode",EmpCode);
                var Location=currentObjRecordA.getValue({
                    fieldId:"custrecord_hris_asset_location"
                });
                log.debug("Location",Location);
                var Remarks=currentObjRecordA.getValue({
                    fieldId:"custrecord_hris_asset_remarks"
                });
                log.debug("Remarks",Remarks);

                var Dept=currentObjRecordA.getValue({
                    fieldId:"custrecord_hris_asset_request_depart_n"
                });
                log.debug("Dept",Dept);
                var subdept=currentObjRecordA.getValue({
                    fieldId:"custrecord_hris_asset_subdepartment"
                });
                log.debug("subdept",subdept);
                var Assetname=currentObjRecordA.getValue({
                    fieldId:"custrecord_hris_asset_name"
                });
                log.debug("Assetname",Assetname);

                
               


            

                
window.location.href = "/app/common/custom/custrecordentry.nl?rectype=562&whence=" +
"&custscript_recordid=" + encodeURIComponent(id) +
"&custscript_reqid=" + encodeURIComponent(requestorname) +
"&custscript_empcode=" + encodeURIComponent(EmpCode) +
"&custscript_empname=" + encodeURIComponent(EmployeeName) +
"&custscript_assettype=" + encodeURIComponent(AssetType) +
"&custscript_location=" + encodeURIComponent(Location) +
"&custscript_remarks=" + encodeURIComponent(Remarks) +
"&custscript_dept=" + encodeURIComponent(Dept) +
"&custscript_Subdept=" + encodeURIComponent(subdept) +
"&custscript_assetname=" + encodeURIComponent(Assetname) +
"&custscript_parsedToDate=" +parsedToDate;

            } catch (e) {
                log.debug("Error: " + e.message);
            }
        }

        function getUrlParameter(param) {
            var query = window.location.search.substring(1);
            var vars = query.split("&");
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split("=");
                if (pair[0] == param) {
                    return decodeURIComponent(pair[1]);
                }
            }
            return (false);
        }

        return {
            pageInit: pageInit,
            // fieldChanged: fieldChanged,
            assetissue: assetissue
        };
    });
