/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * Description: Status bar Suitelet for Employee Project Costing processing
 */
define(['N/task', 'N/ui/serverWidget', 'N/runtime', 'N/log', 'N/url', 'N/file', 'N/search'],
(task, serverWidget, runtime, log, url, file, search) => {

    const onRequest = (context) => {
        const { request, response } = context;
        const parameters = request.parameters;
        const taskId = parameters.custscript_chqall_tskid;
        const isAjax = parameters.isajax === 'true';
        const progressPercent = parseInt(parameters.custscript_chqall_progress) || 0;

        const result = {
            progress: 0,
            statusText: 'Not started',
            redirectUrl: ''
        };

        try {
            if (taskId) {
                const objTaskStatus = task.checkStatus({ taskId: taskId });

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
                            const userId = runtime.getCurrentUser().id;
                            const fileName = `projectcost_user_${userId}.json`;
                            let fileId = null;
                            let folderId = null;

                            // Dynamic folder search to find result file
                            const folderSearch = search.create({
                                type: 'folder',
                                filters: [['name', 'is', 'HRIS Employee Project Costing']],
                                columns: ['internalid']
                            });
                            folderSearch.run().each(res => {
                                folderId = res.id;
                                return false;
                            });

                            if (!folderId) {
                                const suiteScriptsSearch = search.create({
                                    type: 'folder',
                                    filters: [['name', 'is', 'SuiteScripts']],
                                    columns: ['internalid']
                                });
                                suiteScriptsSearch.run().each(res => {
                                    folderId = res.id;
                                    return false;
                                });
                            }

                            if (folderId) {
                                search.create({
                                    type: 'file',
                                    filters: [
                                        ['name', 'is', fileName],
                                        'AND',
                                        ['folder', 'anyof', folderId]
                                    ]
                                }).run().each(res => {
                                    fileId = res.id;
                                    return false; // Stop iteration
                                });
                            }

                            if (fileId) {
                                try {
                                    file.delete({ id: fileId });
                                    log.audit('FILE_DELETED', fileId);
                                } catch (e) {
                                    log.error('Error deleting file', e);
                                }
                            }
                            result.redirectUrl = '/app/common/custom/custrecordentrylist.nl?rectype=1246';
                        } catch (fileErr) {
                            log.error("File Read/Redirect Error", fileErr);
                        }
                        break;

                    case task.TaskStatus.FAILED:
                        result.statusText = 'Failed';
                        result.progress = 0;
                        break;

                    default:
                        result.statusText = objTaskStatus.status;
                        result.progress = 0;
                }
            } else {
                result.statusText = 'No Task ID provided';
                result.progress = 0;
            }

        } catch (e) {
            result.statusText = 'Error checking task status';
            result.progress = 0;
            log.error("CheckStatus Error", e);
        }

        if (isAjax) {
            response.setHeader({
                name: 'Content-Type',
                value: 'application/json'
            });
            response.write(JSON.stringify(result));
            return;
        }

        // Default redirect fallback URL
        const fallbackUrl = '/app/common/custom/custrecordentrylist.nl?rectype=1246';

        const form = serverWidget.createForm({ title: 'Record Creation Status' });

        const inlineField = form.addField({
            id: 'custpage_inlinehtml',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'Progress Display'
        });

        // HTML Progress UI Design
        let html = '<html><head>';
        html += '<style>';
        html += 'body { font-family: "Open Sans", Helvetica, Arial, sans-serif; text-align:center; padding-top:100px; background-color: #f0f0f0; color: #333333; }';
        html += '.ns-loading-box { background: #ffffff; max-width: 450px; margin: auto; padding: 30px; border: 1px solid #cccccc; border-radius: 3px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }';
        html += '.ns-title { color: #333333; font-size: 16px; font-weight: bold; margin-bottom: 20px; font-family: inherit; }';
        html += '.progress-container { width:100%; background:#e0e0e0; border-radius:2px; overflow:hidden; margin-bottom: 15px; border: 1px solid #b5b5b5; }';
        html += '.progress-bar { height:15px; width:0%; background-color: #607799; color:white; font-size:10px; font-weight:bold; line-height:15px; transition: width 1s ease;}';
        html += '.spinner { margin:0 auto 20px auto; border:3px solid #e0e0e0;';
        html += 'border-top:3px solid #607799; border-radius:50%;';
        html += 'width:32px; height:32px;';
        html += 'animation: spin 0.8s linear infinite;}';
        html += '@keyframes spin {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}';
        html += '#status-text { font-size: 13px; color: #555555; font-family: inherit; }';
        html += '</style>';
        html += '</head><body>';

        html += '<div class="ns-loading-box">';
        html += '<div class="ns-title">Creating Cost Details Records</div>';
        html += '<div class="spinner"></div>';
        html += '<div class="progress-container">';
        html += '<div id="progress-bar" class="progress-bar">0%</div>';
        html += '</div>';
        html += '<p id="status-text"><strong>Status:</strong> Initializing...</p>';
        html += '</div>';

        html += '<script>';
        html += 'var fallbackUrl = "' + fallbackUrl + '";';

        html += 'function updateProgress(){';
        html += ' var xhr = new XMLHttpRequest();';
        html += ' xhr.open("GET", window.location.href + "&isajax=true&custscript_chqall_progress=" + encodeURIComponent(document.getElementById("progress-bar").innerHTML.replace("%","")), true);';

        html += ' xhr.onreadystatechange = function(){';
        html += '   if(xhr.readyState === 4 && xhr.status === 200){';
        html += '     var data = JSON.parse(xhr.responseText);';
        html += '     var bar = document.getElementById("progress-bar");';
        html += '     var text = document.getElementById("status-text");';

        html += '     bar.style.width = data.progress + "%";';

        html += '     if(data.statusText === "Processing..."){';
        html += '         bar.innerHTML = data.progress + "%";';
        html += '     } else if(data.progress >= 100){';
        html += '         bar.innerHTML = "100%";';
        html += '     } else { bar.innerHTML = ""; }';

        html += '     text.innerHTML = "<strong>Status:</strong> " + data.statusText;';

        html += '     if(data.progress >= 100){';
        html += '         clearInterval(timer);';
        html += '         setTimeout(function(){';
        html += '             if(window.opener && !window.opener.closed){';
        html += '                 var msg = (data.createdIds && data.createdIds.length > 1) ? "Project Cost records created successfully!" : "Project Cost record created successfully!";';
        html += '                 window.opener.alert(msg);';
        html += '                 window.opener.location.reload();';
        html += '             }';
        html += '             var finalUrl = data.redirectUrl || fallbackUrl;';
        html += '             window.location.href = finalUrl;';
        html += '         }, 1500);';
        html += '     }';
        html += '   }';
        html += ' };';
        html += ' xhr.send();';
        html += '}';

        html += 'var timer = setInterval(updateProgress, 3000);';
        html += 'updateProgress();';

        html += '</script>';
        html += '</body></html>';

        inlineField.defaultValue = html;
        response.writePage(form);
    };

    const calculateSimulatedProgress = (currentProgress) => {
        try {
            if (currentProgress < 30) return currentProgress + 10;
            if (currentProgress < 60) return currentProgress + 15;
            if (currentProgress < 85) return currentProgress + 10;
            if (currentProgress < 98) return currentProgress + 5;
            return 98;
        } catch (e) {
            log.error("SimulatedProgress Error", e);
            return currentProgress;
        }
    };

    return { onRequest };
});
