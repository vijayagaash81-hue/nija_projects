/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/https'], function(https) {

    // Helper function to render a clean, professional HTML UI
    function renderCustomUI() {
        var formHtml = 
            '<div id="statusContainer"></div>' +
            '<form id="uploadForm">' +
                '<div class="form-group">' +
                '<label for="fileInput">Select File <span class="required">*</span></label>' +
                '<input type="file" id="fileInput" required>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label for="custpage_custom_name">Rename File (Optional)</label>' +
                    '<input type="text" id="custpage_custom_name" placeholder="Enter a new file name">' +
                '</div>' +
                '<button type="button" id="submitBtn">Upload File</button>' +
            '</form>';

        var scriptHtml = 
            '<script>' +
            'document.getElementById("submitBtn").addEventListener("click", function() {' +
                'var fileInput = document.getElementById("fileInput");' +
                'if (fileInput.files.length === 0) return;' +
                'var file = fileInput.files[0];' +
                'var customName = document.getElementById("custpage_custom_name").value;' +
                'var btn = document.getElementById("submitBtn");' +
                'btn.innerText = "Processing File...";' +
                'btn.disabled = true;' +
                'btn.style.opacity = "0.7";' +
                'var reader = new FileReader();' +
                'reader.onload = function(event) {' +
                    'var dataUrl = event.target.result;' +
                    'var base64Data = dataUrl.split(",")[1];' +
                    'var mimeType = dataUrl.split(";")[0].split(":")[1];' +
                    'var payload = {' +
                        'fileName: customName ? customName : file.name,' +
                        'mimeType: mimeType || file.type || "application/octet-stream",' +
                        'fileData: base64Data' +
                    '};' +
                    'btn.innerText = "Uploading to Drive...";' +
                    
                    'fetch("https://script.google.com/macros/s/AKfycbwgDfumc2lxenbmZe0PKddnu63jIMA3x1wcCuR--yMpSOm2pfgm_OerjNDwP5AWaUXE/exec", {' +
                        'method: "POST",' +
                        'headers: { "Content-Type": "text/plain;charset=utf-8" },' +
                        'body: JSON.stringify(payload)' +
                    '})' +
                    '.then(function(response) { return response.json(); })' +
                    '.then(function(data) {' +
                        'if (data.success) {' +
                            'var line = new URLSearchParams(window.location.search).get("line");' +
                            'if (window.opener && line !== null) {' +
                                'window.opener.setUploadedFile(line, data.url);' +
                                'window.close();' +
                            '}' +
                            'document.getElementById("uploadForm").style.display = "none";' +
                            'document.getElementById("statusContainer").innerHTML = ' +
                                '\'<div class="alert alert-success">\' +' +
                                    '\'<strong>Upload Successful!</strong><br>\' +' +
                                    '\'Your file has been safely uploaded to Google Drive.<br>\' +' +
                                    '\'<div class="link-container">\' +' +
                                        '\'<a href="\' + data.url + \'" target="_blank">View File in Google Drive &rarr;</a>\' +' +
                                    '\'</div>\' +' +
                                '\'</div>\' +' +
                                '\'<div style="text-align: center; margin-top: 20px;">\' +' +
                                    '\'<a href="" style="color: #3b82f6; text-decoration: none; font-weight: 500;">&larr; Upload Another File</a>\' +' +
                                '\'</div>\';' +
                        '} else {' +
                            'document.getElementById("statusContainer").innerHTML = ' +
                                '\'<div class="alert alert-error"><strong>Upload Failed:</strong><br>\' + data.message + \'</div>\';' +
                            'btn.innerText = "Upload File";' +
                            'btn.disabled = false;' +
                            'btn.style.opacity = "1";' +
                        '}' +
                    '})' +
                    '.catch(function(err) {' +
                        'document.getElementById("statusContainer").innerHTML = ' +
                            '\'<div class="alert alert-error"><strong>Connection Error:</strong><br>Failed to fetch from Google Apps Script.</div>\';' +
                        'btn.innerText = "Upload File";' +
                        'btn.disabled = false;' +
                        'btn.style.opacity = "1";' +
                    '});' +
                '};' +
                'reader.readAsDataURL(file);' +
            '});' +
            '</script>';

        return '<!DOCTYPE html>' +
            '<html lang="en">' +
            '<head>' +
                '<meta charset="UTF-8">' +
                '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
                '<title>NetSuite to Google Drive</title>' +
                '<style>' +
                    'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; color: #374151; }' +
                    '.container { background: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); width: 100%; max-width: 480px; box-sizing: border-box; }' +
                    '.header { text-align: center; margin-bottom: 30px; }' +
                    '.header h2 { margin: 0; color: #111827; font-size: 24px; font-weight: 600; }' +
                    '.header p { margin: 8px 0 0 0; color: #6b7280; font-size: 14px; }' +
                    '.form-group { margin-bottom: 24px; }' +
                    'label { display: block; margin-bottom: 8px; font-weight: 500; font-size: 14px; color: #374151; }' +
                    'input[type="file"] { background: #f9fafb; padding: 10px; border: 1px dashed #d1d5db; width: 100%; border-radius: 8px; box-sizing: border-box; cursor: pointer; }' +
                    'input[type="text"] { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; box-sizing: border-box; font-size: 14px; transition: border-color 0.15s ease-in-out; }' +
                    'input[type="text"]:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }' +
                    'button { width: 100%; background-color: #3b82f6; color: #ffffff; border: none; padding: 14px; border-radius: 8px; font-size: 16px; font-weight: 500; cursor: pointer; transition: background-color 0.15s ease-in-out; }' +
                    'button:hover { background-color: #2563eb; }' +
                    '.alert { padding: 16px; border-radius: 8px; margin-bottom: 24px; font-size: 14px; line-height: 1.5; }' +
                    '.alert-success { background-color: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }' +
                    '.alert-error { background-color: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }' +
                    '.link-container { margin-top: 12px; padding: 12px; background: rgba(255,255,255,0.6); border-radius: 6px; }' +
                    '.link-container a { color: #059669; text-decoration: none; font-weight: 600; display: inline-block; }' +
                    '.link-container a:hover { text-decoration: underline; }' +
                    '.required { color: #ef4444; }' +
                '</style>' +
            '</head>' +
            '<body>' +
                '<div class="container">' +
                    '<div class="header">' +
                        '<h2>Upload to Google Drive</h2>' +
                        '<p>Select a file to securely push it to your workspace</p>' +
                    '</div>' +
                    formHtml +
                '</div>' +
            scriptHtml +
            '</body>' +
            '</html>';
    }

    function onRequest(context) {
        // Serve the UI. The upload is seamlessly handled asynchronously by the client's browser!
        context.response.write(renderCustomUI());
    }

    return {
        onRequest: onRequest
    };
});
