/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define([
  "N/render",
  "N/log",
  "N/record",
  "N/email",
  "N/runtime",
  "N/encode",
  "N/file",
  "N/format"
], function (render, log, record, email, runtime, encode, file, format) {
  function onRequest(context) {
    if (context.request.method === "GET") {
      var customRecordId = context.request.parameters.customRecordId;
      log.debug("customRecordId", customRecordId);

      if (customRecordId) {
         var customRecord = record.load({
          type: "customrecord_hrms_leavesettlement",
          id: customRecordId,
          isDynamic: true,
        });

        log.debug("customRecord", customRecord); 
        var empID=customRecord.getValue({
          fieldId:"custrecord_hrms_lveset_empname"
        });
        if(empID){
          var emprec=record.load({
            type:"employee",
            id:empID,
            isDynamic:true
          });

        }
        var img_floorA = emprec.getValue({ fieldId: "image" });
        var floorImg = "";
        var logotag2 = "";  // Initialize logotag2 variable
        
        if (img_floorA) {
            try {
                var logotag = file.load({ id: img_floorA }).url;
                logotag = logotag.replace(/&/gi, "&amp;");
                logotag2 = '<img src="' + logotag + '" style="width: 100%;height: 100%;"/>';
            } catch (e) {
                log.error("Image loading failed", e);
            }
        }
        
        log.debug("logotag2", logotag2);
       var subsidiaryId = customRecord.getValue({
          fieldId: "custrecord_hrms_lveset_subsidiary",
        });
        var salarynoOfDays = customRecord.getValue({
  fieldId: "custrecord_hrms_lveset_totleavedays",
}) || 0; // Default to 0 if null/undefined

var leaveSalary = customRecord.getValue({
  fieldId: "custrecord_hrms_lveset_lvesalaryamount",
}) || 0;

var airTicket = customRecord.getValue({
  fieldId: "custrecord_hrms_lveset_airticketamount",
}) || 0;

var salaryAdvance = customRecord.getValue({
  fieldId: "custrecord_hrms_lveset_salaryadvance",
}) || 0;

// Convert values to numbers (in case they are returned as strings)
salarynoOfDays = parseFloat(salarynoOfDays) || 0;
leaveSalary = parseFloat(leaveSalary) || 0;
airTicket = parseFloat(airTicket) || 0;
salaryAdvance = parseFloat(salaryAdvance) || 0;

// Calculate the total
var totalAmount = leaveSalary + airTicket + salaryAdvance;
var totalAmount1 = leaveSalary + airTicket + salaryAdvance;

// Log the total
log.debug("Total Amount", totalAmount);
        var salarynoOfDays1 = customRecord.getValue({
          fieldId: "custrecord_hrms_lveset_totleavedays",
        });
        var leaveSalary1 = customRecord.getValue({
          fieldId: "custrecord_hrms_lveset_lvesalaryamount",
        });
        var airTicket1 = customRecord.getValue({
          fieldId: "custrecord_hrms_lveset_airticketamount",
        });
        var salaryAdvance1 = customRecord.getValue({
          fieldId: "custrecord_hrms_lveset_salaryadvance",
        });
         var dateOfJoining = customRecord.getValue({
          fieldId: "custrecord_hrms_lveset_dateofjoin",
        });
         var lastWorkingDay = customRecord.getValue({
          fieldId: "custrecord_hrms_lveset_lastworkingdate",
        });
         var formattedDateOfJoining = dateOfJoining
      ? format.format({
          value: dateOfJoining,
          type: format.Type.DATE,
      })
      : "";

  var formattedLastWorkingDay = lastWorkingDay
      ? format.format({
          value: lastWorkingDay,
          type: format.Type.DATE,
      })
      : "";

     

  // Log formatted dates
  log.debug("Formatted Dates", {
      dateOfJoining: formattedDateOfJoining,
      lastWorkingDay: formattedLastWorkingDay,
  });
        
        if (dateOfJoining && lastWorkingDay) {
  var joiningDate = new Date(dateOfJoining);
  var workingDate = new Date(lastWorkingDay);

  // Calculate the difference in time (milliseconds)
  var timeDifference = workingDate.getTime() - joiningDate.getTime();

  // Convert time difference to days
  var numberOfDays = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

  // Calculate the number of years
  var numberOfYears = workingDate.getFullYear() - joiningDate.getFullYear();
  if (
      workingDate.getMonth() < joiningDate.getMonth() ||
      (workingDate.getMonth() === joiningDate.getMonth() && workingDate.getDate() < joiningDate.getDate())
  ) {
      numberOfYears--; // Adjust if the last working day is before the joining date's anniversary
  }

  log.debug("Calculated Period", {
      numberOfDays: numberOfDays,
      numberOfYears: numberOfYears,
  });
} else {
  log.debug("Date fields are missing", {
      dateOfJoining: dateOfJoining,
      lastWorkingDay: lastWorkingDay,
  });
}
        
        var subsidiaryRecord = record.load({
          type: record.Type.SUBSIDIARY,
          id: subsidiaryId,
          isDynamic: true,
        });

        log.debug("subsidiaryRecord", subsidiaryRecord);
        var subLegalName =
          subsidiaryRecord.getText({
            fieldId: "name",
          }) || "";
          var wordCountA = subLegalName.trim().split(/\s+/).length;

log.debug("Number of words:", wordCountA);
        var subAddress =
          subsidiaryRecord.getValue({
            fieldId: "mainaddress_text",
          }) || "";
        log.debug("subAddress", subAddress);  

        var img_floor = subsidiaryRecord.getValue({ fieldId: "logo" });
        var floorImg = "";
        if (img_floor) {
          var logotag = file.load({
            id: img_floor,
          }).url;
          logotag = logotag.replace(/&/gi, "&amp;");
          logotag1 =
            '<img src="' + logotag + '" style="width: 100%;height: 100%;"/>';
        }
        log.debug("logotag1", logotag1);

        // Get the employee ID from the custom record field
var employeeId = customRecord.getValue({
  fieldId: "custrecord_hrms_lveset_empname",
});

if (employeeId) {
  // Load the employee record
  var employeeRecord = record.load({
      type: record.Type.EMPLOYEE,
      id: employeeId,
      isDynamic: true,
  });

  log.debug("employeeRecord", employeeRecord);
  

  // Retrieve the values of the required fields
  var empLegalName = employeeRecord.getValue({
      fieldId: "custentity_hris_emplegalname",
  }) || "";
  var empCode = employeeRecord.getValue({
      fieldId: "custentity_hris_empcode",
  }) || "";
  var empDesignation = employeeRecord.getText({
      fieldId: "custentity_hris_empdesignation",
  }) || "";

  var empNationality = employeeRecord.getText({
      fieldId: "custentity_hris_empnationality",
  }) || "";

  // Log the values for debugging
  log.debug("Employee Legal Name", empLegalName);
  log.debug("Employee Designation", empDesignation);
  log.debug("Employee Nationality", empNationality);

  // Use these values as needed
} else {
  log.debug("No employee ID found in the field 'custrecord_hrms_lveset_empname'");
}


      
              
       var currentDate = new Date();

// Format the date as DD/MM/YYYY
var day = ("0" + currentDate.getDate()).slice(-2);
var month = ("0" + (currentDate.getMonth() + 1)).slice(-2); // Months are 0-based
var year = currentDate.getFullYear();
var formattedDate = day + "/" + month + "/" + year; // Format: DD/MM/YYYY

// Format the time as HH:MM:SSAM/PM
var hours = currentDate.getHours();
var minutes = ("0" + currentDate.getMinutes()).slice(-2);
var seconds = ("0" + currentDate.getSeconds()).slice(-2);
var ampm = hours >= 12 ? "PM" : "AM";
hours = hours % 12 || 12; // Convert to 12-hour format
      var formattedTime = hours + ":" + minutes + ":" + seconds + ampm; 

var sublistId = 'recmachcustrecord_hrms_saladv_settlelink';
var sublistLineCount = customRecord.getLineCount({
  sublistId: sublistId
});

// Initialize HTML output and total variable
var htmlOutput = "";
var netTotalTable = "";
var totalMonthlyAmount = 0;

// Loop through each line in the sublist and get the values
for (var i = 0; i < sublistLineCount; i++) {
  var payrollComponent = customRecord.getSublistValue({
      sublistId: sublistId,
      fieldId: 'custrecord_hrms_saladv_payrollcomponent_display',
      line: i
  });

  var monthlyAmount = customRecord.getSublistValue({
      sublistId: sublistId,
      fieldId: 'custrecord_hrms_saladv_salaryamount',
      line: i
  });

  // Ensure monthlyAmount is a valid number and add it to the total
  if (!isNaN(monthlyAmount) && monthlyAmount !== null) {
      totalMonthlyAmount += parseFloat(monthlyAmount);
  }

  // Format HTML for each line in the sublist
  htmlOutput += "<tr>";
  htmlOutput += "<td style='width: 60%; font-size: 8pt; color: grey;'>" + payrollComponent + "</td>";
  htmlOutput += "<td align='right' style='width: 20%; font-size: 8pt; color: grey; text-align: right;'>" + monthlyAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")+ "</td>";
  htmlOutput += "<td align='right' style='width: 20%; font-size: 8pt; color: grey; text-align: right;'><b>" + monthlyAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")+ "</b></td>";
  htmlOutput += "</tr>";
}

// Add total row to the HTML
/* htmlOutput += "<tr>";
htmlOutput += "<td style='width: 70%; font-size: 8pt; color: grey;'><b>Net Total</b></td>";
htmlOutput += "<td align='right' style='width: 15%; font-size: 8pt; color: grey; text-align: right;'><b>" + totalMonthlyAmount.toFixed(2) + "</b></td>";
htmlOutput += "<td align='right' style='width: 15%; font-size: 8pt; color: grey; text-align: right;'><b>" + totalMonthlyAmount.toFixed(2) + "</b></td>";
htmlOutput += "</tr>"; */
netTotalTable += "<table style='width:100%;border-bottom:1px solid black;border-left:1px solid black;border-right:1px solid black;'>";
netTotalTable += "<tr>";
netTotalTable += "<td align='left' style='width:65%;'><b>Net Total</b></td>";
netTotalTable += "<td align='right' style='width:15%;'>" + totalMonthlyAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "</td>";
netTotalTable += "<td align='right' style='width:20%;'><b>" + totalMonthlyAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "</b></td>";
netTotalTable += "</tr>";
netTotalTable += "</table>";

// Log the HTML output
log.debug("Generated HTML", htmlOutput);
log.debug("Generated HTML for Net Total Table", netTotalTable);

function numberToWords(num) {
  if (num === 0) return "Zero";

  var a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  var b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  var c = ["Hundred", "Thousand", "Lakh", "Crore"];

  var words = "";

  function convertToWords(n) {
    if (n < 20) return a[n];
    else if (n < 100)
      return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    else if (n < 1000) {
      return (
        a[Math.floor(n / 100)] +
        " " +
        c[0] +
        (n % 100 !== 0 ? " " + convertToWords(n % 100) : "")
      );
    }
    return "";
  }

  var i = 0;
  while (num > 0) {
    var chunk = num % 1000;
    if (chunk > 0) {
      words =
        convertToWords(chunk) +
        (i > 0 ? " " + c[i] : "") +
        (words ? " " + words : "");
    }
    num = Math.floor(num / 1000);
    i++;
  }

  return words.trim();
}

function getCurrencyLabel(currency) {
  // Default to "Dirhams" if currency is not defined or empty
  if (!currency) return "Dirhams";

  // Map currency internal values to labels
  switch (currency) {
    case "AED":
      return "Dirhams";
    case "USD":
      return "Dollars";
    case "MAD":
      return "Dirhams";
    default:
      return "Currency"; // Default fallback for undefined currencies
  }
}


  // Get the total amount field value
  var amount = customRecord.getValue({fieldId: "custrecord_hrms_lveset_settleamount"});

  // Get the currency field value (adjust "currency" to your actual field ID)
  var currency = "";
  var currencyLabel = getCurrencyLabel(currency); // Get the currency label

  // Convert the integer part to words
  var integerPart = Math.floor(amount);
  var amountInWords = numberToWords(integerPart);

  // Extract the fractional part (i.e., paise/cents)
  var fractionalPart = (amount - integerPart).toFixed(2).split(".")[1];
  var fractionalInWords = "";

  if (fractionalPart && parseInt(fractionalPart, 10) > 0) {
    // Convert fractional part (paise/cents) to words
    fractionalInWords = " and " + numberToWords(parseInt(fractionalPart, 10));

    // Map fractional part to the currency-specific term
    // switch (currency) {
      
    //   case "AED":
    //     fractionalInWords += " Fils";
    //     break;
    //   case "USD":
    //     fractionalInWords += " Cents";
    //     break;
    //   case "MAD":
    //     fractionalInWords += " Centimes";
    //     break;
    //   default:
    //     fractionalInWords += " Paise"; // Default fallback
    //     break;
    // }
    fractionalInWords += " Fils"
  }
  var finalWords =    amountInWords + " " + currencyLabel + fractionalInWords + " only";
    
    // var nett = customRecord.getValue({fieldId: "custrecord_hrms_lveset_settleamount"});
    // var amountInWords = numberToWordsWithDecimal(nett);
    log.debug("Amount in Words with Cents", amountInWords);
    var pendmonth = customRecord.getText({fieldId: "custrecord_hrms_lveset_month"});
    var pendyear = customRecord.getText({fieldId: "custrecord_hrms_lveset_year"});
    var templateContent = getTemplateContent(
      "SuiteScripts/Leave settlement layout/standard leave settlement layout.xml"
    );
    log.debug("templateContent", templateContent);
    
    if (pendmonth) {
      templateContent = templateContent.replace("{{pendingmonth}}", pendmonth);
    } else {
      templateContent = templateContent.replace("{{pendingmonth}}", "");
    }
    
    if (pendyear) {
      templateContent = templateContent.replace("{{pendingyear}}", pendyear);
    } else {
      templateContent = templateContent.replace("{{pendingyear}}", "");
    }
    
        templateContent = templateContent.replace("{{logotag1}}", logotag1);
       
        var addressLines = subLegalName.split('\n');
        log.debug("addressLines", addressLines);
       
        
        var processedAddressLines = [];
       
        for (var i = 0; i < addressLines.length; i++) {
            if (addressLines[i]) {
                var words = addressLines[i].trim().split(/\s+/);
                var wordCount = words.length;
                log.debug("Line " + (i + 1) + " has " + wordCount + " words.");
           
                if (wordCount > 4) {
                    
                    var newLines = [];
                    var maxWordsPerLine = 4;
           
                   
                    for (var j = 0; j < words.length; j += maxWordsPerLine) {
                        var lineChunk = words.slice(j, j + maxWordsPerLine).join(" ");
                        newLines.push(lineChunk);
                        log.debug("lineChunk", lineChunk);
                    }
           
                   
                    processedAddressLines = processedAddressLines.concat(newLines);
                   
                } else {
                   
                    processedAddressLines.push(addressLines[i].trim());
                }
           
            } else {
                log.debug("Line " + (i + 1) + " is empty or undefined.");
            }
        }
       
       
        // var processedAddress = processedAddressLines.join('\n');
        var processedAddress = processedAddressLines.join('<br /><br />');


      



        var subsitable="";
      if(wordCountA>3){
       
        subsitable += "<table style='width:100%;border-bottom:1px solid black;'>";
        subsitable += "<tr>";
        subsitable += "<td align='right' style='width:60%;padding-left:10px;'>";
        subsitable += "<span style='font-size:10pt;font-weight:bold;'><span style='text-decoration:underline;'>" + processedAddress + "</span><br /><br /><span style='font-size:7pt;padding-left:50px;'>P.O BOX NO :30790</span></span>";
        subsitable += "</td>";
        subsitable += "<td align='right' style='width:40%;'>";
        subsitable += logotag1;
        subsitable += "</td>";
        subsitable += "</tr>";
        subsitable += "</table>";
        
      }
      else{
        subsitable += "<table style='width:100%;border-bottom:1px solid black;'>";
        subsitable += "<tr>";
        subsitable += "<td align='right' style='width:60%;padding-right:60px;'>";
        subsitable += "<span style='font-size:10pt;font-weight:bold;'><span style='text-decoration:underline;'>" + processedAddress + "</span><br /><br /><span style='font-size:7pt;'>P.O BOX NO :30790</span></span>";
        subsitable += "</td>";
        subsitable += "<td align='right' style='width:40%;'>";
        subsitable += logotag1;
        subsitable += "</td>";
        subsitable += "</tr>";
        subsitable += "</table>";

      }


         
        templateContent = templateContent.replace(
          "{{subLegalName}}",
          subsitable
        );
        templateContent = templateContent.replace(
          "{{subAddress}}",
          subAddress
        );
         templateContent = templateContent.replace(
          "{{htmlOutput}}",
          htmlOutput
        ); 
        
        if (logotag2) {
          templateContent = templateContent.replace("{{employeeimage}}", logotag2);
      }
      else{
        templateContent = templateContent.replace("{{employeeimage}}", "");
      }
      var rejoindate=customRecord.getValue(({
        fieldId:"custrecord_hrms_lveset_rejoindate"
      }))
      if(rejoindate){
      var formattedDateOfReJoining = rejoindate
      ? format.format({
          value: rejoindate,
          type: format.Type.DATE,
      })
      : "";

      var dateParts = formattedDateOfReJoining.split('/');
      var day = dateParts[0];  
      var monthIndex = parseInt(dateParts[1], 10) - 1;  
      var year = dateParts[2];  

     
      var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

     
      var month = months[monthIndex];

     
      var formatrejoindate = day + '-' + month + '-' + year;   
    }

  var dateParts = formattedDateOfJoining.split('/');
        var day = dateParts[0];  
        var monthIndex = parseInt(dateParts[1], 10) - 1;  
        var year = dateParts[2];  

       
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

       
        var month = months[monthIndex];

       
        var combinedDate = day + '-' + month + '-' + year;


        var datePartsA = formattedLastWorkingDay.split('/');
        var dayA = datePartsA[0];  
        var monthIndexA = parseInt(dateParts[1], 10) - 1;  
        var yearA = datePartsA[2];  

       
        var monthAs = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

       
        var monthA = monthAs[monthIndexA];

       
        var combinedDateA = dayA + '-' + monthA + '-' + yearA;
        
        if(rejoindate){
          templateContent = templateContent.replace("{{rejoindate}}", formatrejoindate);
      }
      else{
        templateContent = templateContent.replace("{{rejoindate}}", combinedDate);
      }
        templateContent = templateContent.replace("{{netTotalTable}}", netTotalTable);
       templateContent = templateContent.replace("{{empLegalName}}", empLegalName);
       templateContent = templateContent.replace("{{empDesignation}}", empDesignation);
       templateContent = templateContent.replace("{{empNationality}}", empNationality);
       templateContent = templateContent.replace("{{empCode}}", empCode);
       templateContent = templateContent.replace("{{currentDate}}", formattedDate);
       templateContent = templateContent.replace("{{currentTime}}", formattedTime);
        templateContent = templateContent.replace("{{formattedDateOfJoining}}", combinedDate);
        templateContent = templateContent.replace("{{formattedLastWorkingDay}}", combinedDateA);
        templateContent = templateContent.replace("{{numberOfDays}}", numberOfDays || "");
         templateContent = templateContent.replace("{{numberOfYears}}", numberOfYears || "");
         templateContent = templateContent.replace("{{salarynoOfDays}}", salarynoOfDays + " Days");
         templateContent = templateContent.replace("{{NoofdaysA}}", customRecord.getValue({fieldId:"custrecord_hrms_lveset_noofdays"}) + " Days");

         templateContent = templateContent.replace("{{Nofodays}}", customRecord.getValue({fieldId:"custrecord_hrms_lveset_noofdays"}) + " Days");
         
         templateContent = templateContent.replace("{{leaveSalary}}", leaveSalary.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") );
        templateContent = templateContent.replace("{{airTicket}}", airTicket.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","));
        templateContent = templateContent.replace("{{salaryAdvance}}", salaryAdvance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","));
        templateContent = templateContent.replace("{{salarynoOfDays1}}", salarynoOfDays1 + " Days");
        templateContent = templateContent.replace("{{leaveSalary1}}", leaveSalary1.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","));
        templateContent = templateContent.replace("{{airTicket1}}", airTicket1.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","));
        templateContent = templateContent.replace("{{Basesalary}}", customRecord.getValue({fieldId:"custrecord_hrms_lveset_basicsalary"}).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","));
        templateContent = templateContent.replace("{{Ratesperday}}", customRecord.getValue({fieldId:"custrecord_hrms_lveset_rateperday"}).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","));
        

        templateContent = templateContent.replace("{{otheraddition}}", customRecord.getValue({fieldId:"custrecord_hrms_lveset_additionamount"}).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","));
        templateContent = templateContent.replace("{{otherdeduction}}", customRecord.getValue({fieldId:"custrecord_hrms_lveset_deductionamount"}).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","));
        templateContent = templateContent.replace("{{netamtbottom}}", customRecord.getValue({fieldId:"custrecord_hrms_lveset_settleamount"}).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","));

       
        templateContent = templateContent.replace("{{salaryAdvance1}}", salaryAdvance1.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","));
        templateContent = templateContent.replace("{{totalAmount}}", totalAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","));
        templateContent = templateContent.replace("{{totalAmount1}}", totalAmount1.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","));
        templateContent = templateContent.replace("{{amtinwrd}}", finalWords)
        
       
        
        

        log.debug("Updated templateContent", templateContent);

       /*  var sublistValues = getSublistValues(customRecord);
        log.debug("Sublist Values", sublistValues); */

        var renderer = render.create();
        renderer.templateContent = templateContent;
        renderer.addRecord({
          templateName: "record",
          record: customRecord,
        });

        var pdfContent = renderer.renderAsPdf();

        context.response.writeFile({
          file: pdfContent,
          isInline: true,
        });
      } else {
        context.response.write("Invalid or missing parameters.");
      }
    }
  }

  /**
   * Function to get the content of an advanced template by script ID
   * @param {string} templateScriptId - Script ID of the advanced template
   * @returns {string} - Content of the advanced template
   */
  function getTemplateContent(templateScriptId) {
    var templateFile = file.load({
      id: templateScriptId,
    });
    log.debug("templateFile", templateFile);
    return templateFile.getContents();
  }

  /**
   * Function to retrieve values from the sublist
   * @param {object} customRecord - The custom record object
   * @returns {Array} - Array containing sublist values
   */
  /* function getSublistValues(customRecord) {
    var sublistValues = [];
    var lineCount = customRecord.getLineCount({
      sublistId: "recmachcustrecord_njt_proforma_ch_link",
    });

    for (var i = 0; i < lineCount; i++) {
      var itemID = customRecord.getSublistValue({
        sublistId: "recmachcustrecord_njt_proforma_ch_link",
        fieldId: "custrecord_njt_proforma_ch_item",
        line: i,
      });
      var taxID = customRecord.getSublistValue({
        sublistId: "recmachcustrecord_njt_proforma_ch_link",
        fieldId: "custrecord_njt_proforma_invoice_ch_rec",
        line: i,
      });
      var vatAmount = customRecord.getSublistValue({
        sublistId: "recmachcustrecord_njt_proforma_ch_link",
        fieldId: "custrecord_njt_proforma_ch_tax_amt",
        line: i,
      });

      var sublistValue = {
        itemID: itemID,
        taxID: taxID,
        vatAmount: vatAmount,
      };
      sublistValues.push(sublistValue);
      log.debug("Sublist Value", sublistValue);
    }{{formattedLastWorkingDay}}
    return sublistValues;
  } */
  /**
   * Function to add commas as thousand separators to a number
   * @param {number} x - The number to format
   * @returns {string} - The formatted number with commas
   */
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  } 

  return {
    onRequest: onRequest,
  };
});
