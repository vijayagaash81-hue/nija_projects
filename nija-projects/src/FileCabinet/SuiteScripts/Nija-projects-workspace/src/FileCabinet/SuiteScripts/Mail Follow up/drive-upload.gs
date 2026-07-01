function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var fileData = data.fileData; 
    var fileName = data.fileName;
    var mimeType = data.mimeType;

    // Decode the Base64 string back into binary data
    var decodedData = Utilities.base64Decode(fileData);
    var blob = Utilities.newBlob(decodedData, mimeType, fileName);

    // TODO: Replace with your actual Google Drive Folder ID
    var folderId = 'YOUR_GOOGLE_DRIVE_FOLDER_ID'; 
    var folder = DriveApp.getFolderById(folderId);
    var file = folder.createFile(blob);

    // Set permissions so anyone with the link can view it (useful for embedding in your app)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Construct the success response returning the file URL
    var response = {
      success: true,
      url: file.getUrl()
    };

    return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}