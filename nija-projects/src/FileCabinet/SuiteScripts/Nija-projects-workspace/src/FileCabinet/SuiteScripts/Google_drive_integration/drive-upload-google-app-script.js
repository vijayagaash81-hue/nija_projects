function doPost(e) {
  try {
    // 1. Parse the incoming payload from NetSuite
    var data = JSON.parse(e.postData.contents);
    var fileData = data.fileData; 
    var fileName = data.fileName;
    var mimeType = data.mimeType;

    // 2. Decode the Base64 string back into binary data
    var decodedData = Utilities.base64Decode(fileData);
    var blob = Utilities.newBlob(decodedData, mimeType, fileName);

    // 3. Create the file in Google Drive
    // Optional: If you want to save to a specific folder, use: 
    // var folder = DriveApp.getFolderById('YOUR_FOLDER_ID');
    // var file = folder.createFile(blob);
    var file = DriveApp.createFile(blob);

    // 4. (Optional) Set permissions so anyone with the link can view it
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // 5. Construct the success response
    var response = {
      success: true,
      url: 'https://drive.google.com/file/d/' + file.getId() + '/view'
    };

    // Return JSON back to NetSuite
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Return Error back to NetSuite
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      message: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
