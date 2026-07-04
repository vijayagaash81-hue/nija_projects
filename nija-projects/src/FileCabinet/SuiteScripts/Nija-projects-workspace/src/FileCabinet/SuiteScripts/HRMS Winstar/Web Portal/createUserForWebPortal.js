/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/record", "N/https", "N/log", "N/search", "N/email", "N/file"], (
  record,
  https,
  log,
  search,
  email,
  file,
) => {
  const afterSubmit = (context) => {
    if (context.type === context.UserEventType.EDIT) {
      try {
        const employeeRecord = context.newRecord;

        const fileId = employeeRecord.getValue("image");

        let attachment = "";

        if (fileId) {
          const fileObj = file.load({ id: fileId });

          attachment = {
            fileName: fileObj.name,
            fileType: fileObj.fileType,
            fileContent: fileObj.getContents(),
          };
        }

        const employeeData = {
          internalId: employeeRecord.id,
          employeeId: employeeRecord.id,
          employeeCode: employeeRecord.getValue("entityid"),
          employeeName: employeeRecord.getValue(
            "entityid",
          ),
          email: employeeRecord.getValue("email"),
          phone: employeeRecord.getValue("mobilephone"),
          password: employeeRecord.getValue("custentity_njt_password_access"),
          department: employeeRecord.getText("department"),
          departmentId: employeeRecord.getValue("department"),
          location: employeeRecord.getText("location"),
          locationId: employeeRecord.getValue("location"),
          userImg: attachment.fileContent,
        };

        log.debug({
          title: "Employee Data",
          details: employeeData,
        });

        
        const isActive = employeeRecord.getValue("custentity_njt_web_access");

        if (isActive) {
          const response = https.post({
            url: "https://1mnmfu0au2.execute-api.ap-south-1.amazonaws.com/api/v1/register",
            body: JSON.stringify(employeeData),
            headers: {
              "Content-Type": "application/json",
            },
          });

          const responseBody = JSON.parse(response.body);

          log.debug({
            title: "Status",
            details: responseBody,
          });
        }
        
      } catch (error) {
        log.error({
          title: "Error sending data",
          details: error.message,
        });
      }
    }
  };

  return {
    afterSubmit,
  };
});
