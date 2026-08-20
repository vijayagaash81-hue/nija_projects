/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 * Description: Criteria form for Employee Daily Attendance Project Costing
 *              Redirects selected filters to the Process Suitelet
 */
define(["N/ui/serverWidget", "N/search", "N/log", "N/task", "N/redirect", "N/record", "N/runtime", "N/format", "N/query", "N/currentRecord", "N/https", "N/url"],
    function (serverWidget, search, log, task, redirect, record, runtime, format, query, currentRecord, https, urlMod) {

        function onRequest(context) {
            var form = serverWidget.createForm({
                title: "Employee Project Costing"
            });

            // Month
            var monthField = form.addField({
                id: "custpage_month",
                type: serverWidget.FieldType.SELECT,
                label: "Month",
                source: "customlist_hris_month_list"
            });
            monthField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

            // Year
            var yearField = form.addField({
                id: "custpage_year",
                type: serverWidget.FieldType.SELECT,
                label: "Year",
                source: "customlist_hris_year_master"
            });
            yearField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

            // Pay Group
            var paygroupField = form.addField({
                id: "custpage_paygroup",
                type: serverWidget.FieldType.SELECT,
                label: "Pay Group",
                source: "customrecord_hris_process_groupmaster"
            });
            paygroupField.isMandatory = true;

            // Subsidiary
            var subsidiaryField = form.addField({
                id: "custpage_subsi",
                type: serverWidget.FieldType.SELECT,
                label: "Subsidiary",
                source: "subsidiary"
            });
            subsidiaryField.isMandatory = true;

            form.addSubmitButton({
                label: "Generate Report"
            });

            if (context.request.method === "GET") {
                context.response.writePage(form);
            } else if (context.request.method === "POST") {

                var paygroupVal = context.request.parameters.custpage_paygroup;
                var subsidiaryVal = context.request.parameters.custpage_subsi;

                var monthVal = null;
                var yearVal = null;

                if (paygroupVal) {
                    try {
                        // Look up Pay Group record to get wage_from and wage_to
                        var lookupResults = search.lookupFields({
                            type: 'customrecord_hris_process_groupmaster',
                            id: paygroupVal,
                            columns: ['custrecord_hris_wage_from', 'custrecord_hris_wage_to']
                        });
                        
                        var wageFromStr = lookupResults.custrecord_hris_wage_from;
                        log.debug("Wage dates", {
                            from: wageFromStr,
                            to: lookupResults.custrecord_hris_wage_to
                        });

                        if (wageFromStr) {
                            var wageFromDate = format.parse({
                                value: wageFromStr,
                                type: format.Type.DATE
                            });
                            
                            monthVal = wageFromDate.getMonth() + 1; // 1-12
                            
                            var yearStr = String(wageFromDate.getFullYear()); // e.g. "2026"
                            
                            // Query customlist_hris_year_master to find the year ID matching the year name
                            var yearQuery = query.runSuiteQL({
                                query: "SELECT id FROM customlist_hris_year_master WHERE name = ?",
                                params: [yearStr]
                            }).asMappedResults();
                            
                            if (yearQuery && yearQuery.length > 0) {
                                yearVal = yearQuery[0].id;
                            } else {
                                yearVal = yearStr;
                            }
                        }
                    } catch (err) {
                        log.error("Error retrieving paygroup dates", err);
                    }
                }

                log.debug("Criteria Params", {
                    month: monthVal,
                    year: yearVal,
                    paygroup: paygroupVal,
                    subsidiary: subsidiaryVal
                });

                // Redirect to Process Suitelet with the selected filters
                redirect.toSuitelet({
                    scriptId: 'customscript_hris_proj_costing_process',
                    deploymentId: 'customdeploy_hris_proj_costing_process',
                    parameters: {
                        custparam_month: monthVal,
                        custparam_year: yearVal,
                        custparam_paygroup: paygroupVal,
                        custparam_subsi: subsidiaryVal
                    }
                });
            }
        }

        return {
            onRequest: onRequest
        };
    });
