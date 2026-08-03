/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(['N/task', 'N/ui/serverWidget', 'N/runtime', 'N/log', 'N/url', 'N/file', 'N/query', 'N/search'],
function(task, serverWidget, runtime, log, url, file, query, search) {

    function onRequest(context) {

        var parameters = context.request.parameters;
        var taskId = parameters.custscript_chqall_tskid;
        var isAjax = parameters.isajax === 'true';
        var progressPercent = parseInt(parameters.custscript_chqall_progress) || 0;

        var result = {
            progress: 0,
            statusText: 'Not started'
        };

      
        try {
            var objTaskStatus = task.checkStatus({ taskId: taskId });

            switch (objTaskStatus.status) {

                case task.TaskStatus.PENDING:
                    result.statusText = 'Pending...';
                    result.progress = 0;
                    break;

                case task.TaskStatus.PROCESSING:
                    result.statusText = 'Processing...';
                    result.progress = calculateSimulatedProgress(progressPercent);
                    break;

                case task.TaskStatus.COMPLETE:
                    result.statusText = 'Completed!';
                    result.progress = 100;
                    try {
                        var userId = runtime.getCurrentUser().id;
                        var fileName = 'picklist_user_' + userId + '.json';
                        
                        var fileId = null;
                        try {
                            // var search = require('N/search');
                            search.create({
                                type: 'file',
                                filters: [
                                    ['name', 'is', fileName],
                                    'AND',
                                    ['folder', 'anyof', 574]
                                ]
                            }).run().each(function(res) {
                                fileId = res.id;
                                return false; // Stop iteration
                            });
                        } catch (searchErr) {
                            log.error('Search error for file', searchErr);
                        }
                        
                        log.audit('COMPLETE_FILE_READ', { userId: userId, fileFound: fileId !== null });
                        
                        if (fileId) {
                            var fileObj = file.load({ id: fileId });
                            var cachedValue = fileObj.getContents();
                            log.audit('FILE_CONTENT', { cachedValue: cachedValue });
                            
                            if (cachedValue) {
                                var createdIds = JSON.parse(cachedValue);
                                if (createdIds && createdIds.length > 0) {
                                    result.createdIds = createdIds;
                                    if (createdIds.length === 1) {
                                        result.redirectUrl = url.resolveRecord({
                                            recordType: 'customrecord_njt_pick_list',
                                            recordId: createdIds[0],
                                            isEditMode: false
                                        });
                                    } else {
                                        result.redirectUrl = url.resolveRecord({
                                            recordType: 'customrecord_njt_pick_list',
                                            isEditMode: false
                                        });
                                    }
                                    log.audit('RESOLVED_REDIRECT_URL', result.redirectUrl);
                                }
                            }
                            
                            file.delete({ id: fileId });
                            log.audit('FILE_DELETED', fileId);
                        } else {
                            log.audit('COMPLETE_FILE_READ', 'No file found for user ' + userId);
                        }
                    } catch (fileErr) {
                        log.error("File Read/Redirect Error", fileErr);
                    }
                    break;

                default:
                    result.statusText = objTaskStatus.status;
                    result.progress = 0;
            }

        } catch (e) {
            result.statusText = 'Error retrieving task status';
            result.progress = 0;
            log.error("CheckStatus Error", e);
        }

       
        if (isAjax) {
            context.response.setHeader({
                name: 'Content-Type',
                value: 'application/json'
            });
            context.response.write(JSON.stringify(result));
            return;
        }

      
        var redirectUrl = url.resolveScript({
            scriptId: 'customscript_pick_list_wizard_filter',   // 🔁 change this
            deploymentId: 'customdeploy_pick_list_wizard_filter' // 🔁 change this
        });

      
        var form = serverWidget.createForm({ title: 'Creation Status' });

        var inlineField = form.addField({
            id: 'custpage_inlinehtml',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'Progress Display'
        });

       
        var html = '<html><head>';
        html += '<style>';
        html += 'body { font-family: Arial; text-align:center; padding-top:60px; }';

        html += '.progress-container { width:60%; margin:auto; background:#eee; border-radius:30px; overflow:hidden; box-shadow:0 0 10px rgba(0,0,0,0.1);}';

        html += '.progress-bar { height:35px; width:0%; border-radius:30px;';
        html += 'background: linear-gradient(270deg,#4facfe,#00f2fe,#43e97b,#38f9d7);';
        html += 'background-size:600% 600%;';
        html += 'animation: gradientMove 3s ease infinite;';
        html += 'color:white; font-weight:bold; line-height:35px;';
        html += 'transition: width 1s ease;}';

        html += '@keyframes gradientMove {';
        html += '0%{background-position:0% 50%}';
        html += '50%{background-position:100% 50%}';
        html += '100%{background-position:0% 50%}}';

        html += '.spinner { margin:25px auto; border:6px solid #f3f3f3;';
        html += 'border-top:6px solid #4facfe; border-radius:50%;';
        html += 'width:40px; height:40px;';
        html += 'animation: spin 1s linear infinite;}';

        html += '@keyframes spin {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}';
        html += '</style>';
        html += '</head><body>';

        html += '<div class="spinner"></div>';

        html += '<div class="progress-container">';
        html += '<div id="progress-bar" class="progress-bar">0%</div>';
        html += '</div>';

        html += '<p id="status-text" style="margin-top:15px;"><strong>Status:</strong> Loading...</p>';

       
        html += '<script>';

        html += 'var redirectUrl = "' + redirectUrl + '";';

        html += 'function updateProgress(){';
        html += ' var xhr=new XMLHttpRequest();';
        html += ' xhr.open("GET", window.location.href + "&isajax=true&custscript_chqall_progress=" + encodeURIComponent(document.getElementById("progress-bar").innerHTML.replace("%","")), true);';

        html += ' xhr.onreadystatechange=function(){';
        html += '   if(xhr.readyState===4 && xhr.status===200){';

        html += '     var data=JSON.parse(xhr.responseText);';
        html += '     var bar=document.getElementById("progress-bar");';
        html += '     var text=document.getElementById("status-text");';

        html += '     bar.style.width=data.progress+"%";';

        html += '     if(data.statusText==="Processing..."){';
        html += '         bar.innerHTML=data.progress+"%";';
        html += '     }else if(data.progress>=100){';
        html += '         bar.innerHTML="100%";';
        html += '     }else{ bar.innerHTML=""; }';

        html += '     text.innerHTML="<strong>Status:</strong> "+data.statusText;';

       
        html += '     if(data.progress>=100){';
        html += '         clearInterval(timer);';

        html += '         setTimeout(function(){';

        html += '             if(window.opener && !window.opener.closed){';
        html += '                 var msg = (data.createdIds && data.createdIds.length > 1) ? "Pick Lists Created Successfully!" : "Pick List Created Successfully!";';
        html += '                 window.opener.alert(msg);';
        html += '                 window.opener.location.reload();';
        html += '             }';

        html += '             var finalUrl = data.redirectUrl || redirectUrl;';
        html += '             window.location.href = finalUrl;';

        html += '         },1500);';
        html += '     }';

        html += '   }';
        html += ' };';
        html += ' xhr.send();';
        html += '}';

        html += 'var timer=setInterval(updateProgress,3000);';
        html += 'updateProgress();';

        html += '</script>';

        html += '</body></html>';

        inlineField.defaultValue = html;
        context.response.writePage(form);
    }

    
    function calculateSimulatedProgress(currentProgress) {
        try {
            if (currentProgress < 30) return currentProgress + 10;
            if (currentProgress < 60) return currentProgress + 15;
            if (currentProgress < 80) return currentProgress + 20;
            if (currentProgress < 98) return currentProgress + 10;
            return 98;
        } catch (e) {
            log.error("SimulatedProgress Error", e);
            return currentProgress;
        }
    }

    return {
        onRequest: onRequest
    };

});