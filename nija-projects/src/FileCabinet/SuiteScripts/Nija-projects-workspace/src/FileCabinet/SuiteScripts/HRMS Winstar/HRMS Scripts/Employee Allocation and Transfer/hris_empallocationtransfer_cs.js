/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/record', 'N/currentRecord', 'N/query', 'N/format', './moment.js'],

    function (record, currentrecord, query, format, moment) {

        function pageInit(scriptContext) {
            debugger;
            var recordObj = currentrecord.get();
            var statusQuery = "select custrecord_hris_mr_sts,BUILTIN.DF(custrecord_hris_mr_sts)as name from customrecord_hris_mr_status_bar_rec where id=1";
            var queryResults = query.runSuiteQL({
                query: statusQuery
            });
            var records = queryResults.asMappedResults();
            var mrStatus = recordObj.getField('custpage_mr_status');
            mrStatus.removeSelectOption({ value: null });
            if (records.length > 0) {
                for (var r = 0; r < records.length; r++) {
                    var record = records[r];
                    var name = record.name;
                    var id = record.custrecord_hris_mr_sts;

                    mrStatus.insertSelectOption({
                        value: id,
                        text: name,
                        isSelected: true
                    });


                }
            }
            /*  scriptContext.recordObj.getField({
                 fieldId: 'custpage_remarks'
             }).isDisplay = false; 
             scriptContext.recordObj.getField({
                 fieldId: 'custpage_mr_status'
             }).isDisplay = false;  */
            var status = recordObj.getValue('custpage_mr_status');
            if (status == 2) {
                refreshPayProcess();
            }
        }
        function fieldChanged(context) {
            debugger;
            var recordObj = currentrecord.get();

            try {
                if (context.fieldId == 'custpage_from_date' || context.fieldId == 'custpage_to_date') {
                    var d_startDate = recordObj.getValue('custpage_from_date');
                    var d_endDate = recordObj.getValue('custpage_to_date');
                    var date = new Date();
                    //   var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                    var firstDay = date;

                    if (d_startDate) {
                        d_startDate = d_startDate + 1;
                        /*   d_startDate = format.parse({
                             value: d_startDate,
                             type: format.Type.DATE
                         });
                         firstDay = format.parse({
                              value:firstDay,
                              type: format.Type.DATE
                          });
                         d_startDate = moment(d_startDate).format('DD/MM/YYYY');
 
                          firstDay = moment().format('DD/MM/YYYY');  */

                        d_startDate = format.parse({
                            value: d_startDate,
                            type: format.Type.DATE
                        });
                        firstDay = format.parse({
                            value: firstDay,
                            type: format.Type.DATE
                        });

                        // Add one day
                        // d_startDate.setDate(d_startDate.getDate() + 1);  // Add 1 day to the date
                        d_startDate = moment(d_startDate).add(1, 'days').toDate();
                        // Format the new date (optional, if you need it in a specific format)
                        /*   d_startDate = format.format({
                              value: d_startDate,
                              type: format.Type.DATE
                          });
                         firstDay = format.format({
                              value: firstDay,
                              type: format.Type.DATE
                          });
   */
                        if (d_startDate < firstDay) {

                            alert("You are not allowed to allocate Employee for backdated dates. Please contact HR team.");

                            recordObj.setValue({
                                fieldId: 'custpage_from_date',
                                value: null,
                                ignoreFieldChange: true
                            });

                            //return false;
                        }
                    }

                    if (d_endDate) {
                        d_startDate = format.parse({
                            value: d_startDate,
                            type: format.Type.DATE
                        });
                        d_endDate = format.parse({
                            value: d_endDate,
                            type: format.Type.DATE
                        });
                        firstDay = format.parse({
                            value: firstDay,
                            type: format.Type.DATE
                        });

                        /*    d_startDate = moment(d_startDate).format('DD/MM/YYYY');
   
                           var firstDay = moment().format('DD/MM/YYYY');
                           d_endDate = moment(d_endDate).format('DD/MM/YYYY'); */

                        d_endDate = moment(d_endDate).add(1, 'days').toDate();

                        if (d_endDate < firstDay) {

                            alert("You are not allowed to allocate Employee for backdated dates. Please contact HR team.");

                            recordObj.setValue({
                                fieldId: 'custpage_to_date',
                                value: null,
                                ignoreFieldChange: true
                            });

                            //return false;
                        }
                        else if (d_endDate < d_startDate) {

                            alert('To Date should be greater than From Date');
                            recordObj.setValue({
                                fieldId: 'custpage_to_date',
                                value: null,
                                ignoreFieldChange: true
                            });
                        }

                    }
                }
                if (context.fieldId == 'custpage_allocationtype') {
                    var allocationtype = recordObj.getValue("custpage_allocationtype");
                    var allocationQuery =
                        "SELECT * from  customrecord_hris_empalloctype_list WHERE  id = " + allocationtype;


                    var queryResults = query.runSuiteQL({
                        query: allocationQuery,
                    });
                    var records = queryResults.asMappedResults();
                    // var visatextField = recordObj.getField("custpage_visaprocessingtext");

                    if (records.length > 0) {
                        var rec = records[0];
                        var seqno = rec.custrecord_hris_empalloctype_seqno;
                        recordObj.setValue({
                            fieldId: 'custpage_allocationtypeid',
                            value: seqno,
                            ignoreFieldChange: true
                        });
                        var remarkfield = recordObj.getField({
                            fieldId: 'custpage_remark'
                        });
                        var fromdate = recordObj.getField({
                            fieldId: 'custpage_from_date'
                        });
                        var todate = recordObj.getField({
                            fieldId: 'custpage_to_date'
                        });
                        var project = recordObj.getField({
                            fieldId: 'custpage_currproject'
                        });
                        var projectsegment = recordObj.getField({
                            fieldId:'custpage_currentprojectseg'
                        }) 
                        if (seqno == 3) {
                            remarkfield.isMandatory = true;                      
                            fromdate.isMandatory = true                      
                            todate.isMandatory=false;
                            project.isMandatory=false;
                            projectsegment.isMandatory = false

                        } else if (seqno == 1 || seqno ==2) {
                            remarkfield.isMandatory = false;                         
                            fromdate.isMandatory = true;                           
                            todate.isMandatory=true;                         
                            project.isMandatory=true; 
                            projectsegment.isMandatory = true                        

                        }
                       

                    }

                }
                /* if(context.fieldId == 'custpage_currproject'){
                    var currentproject = recordObj.getValue('custpage_currproject')
                   
                   var projectsegquery ="select distinct  a.cseg1 as projectsegmentid , BUILTIN.DF(a.cseg1) as projectsegname  from transaction  a   \
                       join transactionline b on a.id = b.transaction where a.type ='SalesOrd' and b.class = " + currentproject;
                    log.debug("Project Query",projectsegquery);
                    var queryResults = query.runSuiteQL({
                        query: projectsegquery
                    });
                    var projectsegqueryrecords = queryResults.asMappedResults();
                    var projseg= recordObj.getField('custpage_currentprojectseg');
                    projseg.removeSelectOption({ value: null });
                    if (projectsegqueryrecords.length > 0) {
                        for (var r = 0; r < projectsegqueryrecords.length; r++) {
                            var rec = projectsegqueryrecords[r];
                            var name = rec.projectsegname;
                            var id = rec.projectsegmentid; // Assuming 'id' is the value you want to set
        
                            projseg.insertSelectOption({
                                value: id,
                                text: name,
                                isSelected: true
                            });
        
        
                        }
                    }
                } */
                /* if(context.fieldId == 'custpage_prevproject'){
                    var currentproject = recordObj.getValue('custpage_prevproject')
                   
                   var projectsegquery ="select distinct  a.cseg1 as projectsegmentid , BUILTIN.DF(a.cseg1) as projectsegname  from transaction  a   \
                       join transactionline b on a.id = b.transaction where a.type ='SalesOrd' and b.class = " + currentproject;
                       log.debug("Project Query",projectsegquery);
                    var queryResults = query.runSuiteQL({
                        query: projectsegquery
                    });
                    var projectsegqueryrecords = queryResults.asMappedResults();
                    var projseg= recordObj.getField('custpage_prevprojectseg');
                    projseg.removeSelectOption({ value: null });
                    if (projectsegqueryrecords.length > 0) {
                        for (var r = 0; r < projectsegqueryrecords.length; r++) {
                            var rec = projectsegqueryrecords[r];
                            var name = rec.projectsegname;
                            var id = rec.projectsegmentid; // Assuming 'id' is the value you want to set
        
                            projseg.insertSelectOption({
                                value: id,
                                text: name,
                                isSelected: true
                            });
        
        
                        }
                    }
                } */
                

            } catch (ex) {
                console.error("Error occurred:", ex.message);
            }

        }


        function saveRecord(context) {
            debugger;
            var recordObj = currentrecord.get();
            var statusQuery = "select custrecord_hris_mr_sts,BUILTIN.DF(custrecord_hris_mr_sts)as name from customrecord_hris_mr_status_bar_rec where id=1";
            var queryResults = query.runSuiteQL({
                query: statusQuery
            });
            var records = queryResults.asMappedResults();
            var mrStatus = recordObj.getField('custpage_mr_status');
            mrStatus.removeSelectOption({ value: null });
            if (records.length > 0) {
                for (var r = 0; r < records.length; r++) {
                    var rec = records[r];
                    var name = rec.name;
                    var id = rec.custrecord_hris_mr_sts; // Assuming 'id' is the value you want to set

                    mrStatus.insertSelectOption({
                        value: id,
                        text: name,
                        isSelected: true
                    });


                }
            }
            var status = recordObj.getValue('custpage_mr_status');
            if (status == 2) {
                alert('Please wait for some times Employee Allocation in progressing.....');
                return false;
            } else if (status == 1) {
                return true;
            }

        }

        function refreshPayProcess() {
            // var Refreshtime=10000;  
            alert('Please wait for some times Employee Allocation in progressing.....');
            location.reload(true);

        }
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            saveRecord: saveRecord
        };
    });
