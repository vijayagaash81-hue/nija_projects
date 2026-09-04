    
    function beforeLoadRecord(type,form)
    {
    
        
        
    }
    
    // END BEFORE LOAD ====================================================
    // BEGIN BEFORE SUBMIT ================================================
    function RestLet_PrePayprocessRec_AfterSubmit()
    {
        try
        {
            if (type != 'delete') {
            var recId = nlapiGetRecordId();
            nlapiLogExecution('DEBUG', 'suiteletFunction', ' RecId----->' + recId)           
            var signatureKeyParam  =  getSign();
			
        
            nlapiLogExecution('DEBUG', 'suiteletFunction', ' signatureKeyParam----->' + signatureKeyParam)  
            var o_payprocess = nlapiLoadRecord('customrecord_hris_pre_pay_process_record', recId);								
            var checked_pay_process = o_payprocess.getFieldValue('custrecord_hris_pre_pay_pr_checked');//Check box		
            var checked_prePayfrq_seq = o_payprocess.getFieldValue('custrecord_hris_pre_pay_pr_pay_freq_seq');		
            var count=0
            if(checked_pay_process=='F')
            {
                    nlapiLogExecution('DEBUG', 'suiteletFunction', '  Result Of checked_prePayfrq_seq----->' + checked_prePayfrq_seq)
                    //vazr cred = new credentials();
                    //var hello;
                    var data ={ Record_id: recId						
                          }
                    var myJson = JSON.stringify(data);				
                    
                     nlapiLogExecution('DEBUG', 'Suitelet', 'normalizedParameters=' + signatureKeyParam[0].toString());
                    nlapiLogExecution('DEBUG', 'Suitelet', 'signatureBaseString=' + signatureKeyParam[1].toString());
                    nlapiLogExecution('DEBUG', 'Suitelet', 'signature=' + signatureKeyParam[2].toString());
                
                    var header  = signatureKeyParam[3];			
                    var headerVal  = header.Authorization;
                
                    var ckey  = '5fcba891195d7716f0bd043d07e50cecea948d41564ba16926276c5a1a4b5ae7';
                    var tkey  = '3b7ebf0c85399d09a17fc06992f1d70b0d4e3374a39fc1a287c6d26761872a17';
                
                    var signatureKey  = signatureKeyParam[2];
                
                    if(signatureKey.indexOf("+") != -1)
                    {
                        signatureKey.replace("+","%2B");
                    }
                
                    signatureKey	=	encodeURIComponent(signatureKey);
                
                    var nonce  		= 	signatureKeyParam[4];
                    var timestamp   = 	signatureKeyParam[5];
                           
                    var  header = "OAuth ";
                    header += "oauth_signature=\"" + signatureKey + "\",";
                    header += "oauth_version=\"1.0\",";
                    header += "oauth_nonce=\"" + nonce + "\",";
                    header += "oauth_signature_method=\"HMAC-SHA256\",";
                    header += "oauth_consumer_key=\"" + ckey + "\",";
                    header += "oauth_token=\"" + tkey + "\",";
                    header += "oauth_timestamp=\"" + timestamp+ "\",";
                    header += "realm=\"9691235_SB1\"";
                
                    nlapiLogExecution('DEBUG', 'Header', 'AuthorizationHeader=' + header);
                
                
                    //var Url = "https://rest.na1.netsuite.com/app/site/hosting/restlet.nl?script=551&deploy=1";
                    var restletResponse;
                    var headType = new Array();
                    headType['Action'] = 'POST';
                      headType['Content-Type'] = 'application/json';
                    headType['Authorization'] = header;
    
     

                   /*  var headType = new Array();
                    headType['Action'] = 'POST';
                      headType['Content-Type'] = 'application/json';
                    headType['Authorization'] = header; */
                    if(checked_prePayfrq_seq== 1)
                    {
                        nlapiLogExecution('DEBUG', 'Checked Freuency:', '  Result Of recId----->' + recId);
                       // restletResponse = nlapiRequestURL('https://9691235-sb2.app.netsuite.com/app/site/hosting/restlet.nl?script=243&deploy=1', myJson, 'POST');
                      // restletResponse = nlapiRequestURL('https://9691235.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=1689&deploy=1', myJson, headType, 'POST');
                        restletResponse = nlapiRequestURL('https://9691235-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=243&deploy=1', myJson,headType, 'POST');
                    }
               
                            
                    var coderesult = restletResponse.getCode();
                    nlapiLogExecution('DEBUG', 'suiteletFunction', '  Result Of coderesult----->' + coderesult)
                    var total_count = restletResponse.getBody();				
                    count = total_count +count;
                    var Param = new Array();
                    nlapiLogExecution('DEBUG', 'suiteletFunction', '  Result Of total_count----->' + total_count)
                    nlapiLogExecution('DEBUG', 'suiteletFunction', '  Result Of  count----->' +  count)
                    Param['custscript_apm_payprocess_totalcount']=count;
                    Param['custscript_apm_payprocess_truecount']=total_count;
                    nlapiSetRedirectURL('suitelet', 'customscript_hris_prepayprocessstatus', 'customdeploy_hris_prepayprocessstatus', null, Param);
                    
                 
                    //	var restResponse = nlapiRequestURL(Url, myJson  , headType, null, "POST");
                    nlapiLogExecution('DEBUG', 'Response Code', 'Code=' + restletResponse.getCode());
                        
                        
            }
        }
    }
        catch(e)
        {
            nlapiLogExecution('DEBUG', 'suiteletFunction', '  Result Of coderesult----->' + e.getCode());
        }			
        
    }
    
    function getSign() {
        
       // var restletUrl = "https://9691235.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=1689&deploy=1";
        var restletUrl = "https://9691235-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=243&deploy=1";
        var param = '';
                    
            
        var accessor = { consumerSecret: 'f5c1cef64c2e26295144977b39d3d9d860ce1a23d7a546d1b876eafc55ff29f7'
                       , tokenSecret   : '46d6c23187a27957cd78fa0c2e1648b8af8baf4481e713f8cf796585929ec899'
                       };
                       
        var message = { method: 'POST'
                      , action: restletUrl
                      , parameters: OAuth.decodeForm(param)
                      };
      
        
        var timeStamp 		=	OAuth.timestamp();
        var nonce 			=	OAuth.nonce(11);
        
        
        message.parameters.push(['oauth_consumer_key', '5fcba891195d7716f0bd043d07e50cecea948d41564ba16926276c5a1a4b5ae7']);  // Consumer Key
        message.parameters.push(['oauth_nonce', nonce]);	
        message.parameters.push(['oauth_signature_method', 'HMAC-SHA256']);
        message.parameters.push(['oauth_timestamp',timeStamp]);		
        message.parameters.push(['oauth_token', '3b7ebf0c85399d09a17fc06992f1d70b0d4e3374a39fc1a287c6d26761872a17']);   // Token Key
        message.parameters.push(['oauth_version', '1.0']);
        
        OAuth.SignatureMethod.sign(message, accessor);
        
        var arrSign		=		[];
        
        arrSign [0] =  OAuth.SignatureMethod.normalizeParameters(message.parameters);
        arrSign [1] =  OAuth.SignatureMethod.getBaseString(message);
        arrSign [2] =  OAuth.getParameter(message.parameters, "oauth_signature");
        arrSign [3] =  OAuth.getAuthorizationHeader("9691235_SB1", message.parameters);
        arrSign [4] =  nonce;
        arrSign [5] =  timeStamp;
        
        return arrSign;
    }