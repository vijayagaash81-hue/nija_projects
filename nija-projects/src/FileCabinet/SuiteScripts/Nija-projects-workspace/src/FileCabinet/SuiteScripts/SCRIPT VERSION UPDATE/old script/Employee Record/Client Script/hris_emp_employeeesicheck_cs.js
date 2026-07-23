function employee_fieldchange(type, name, linenum)
{  debugger;
	try{
		if (name == 'custentity_hris_isesiapplicable') 
		{		
			//var ESICCheck = nlapiGetFieldValue('custentity_hris_isesiapplicable')
		
			//if(ESICCheck =='T')
			var customform = nlapiGetFieldValue('customform');
								log.debug('customform',customform);
			if (customform == 167) 
			{
				var ESICCheck = nlapiGetFieldValue('custentity_hris_isesiapplicable')
				if(ESICCheck =='F')
				{
					alert('ESIC has to deducted till September or March. Verify Employee Salary details')
				}
			}	
				
			}
		
		
	
	}
	catch (e) {
		log.debug("Error: " + e.message);
	  }

	}







