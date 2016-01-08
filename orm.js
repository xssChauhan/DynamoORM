var utilityParams = {
	reservedKeys : ['name','names','value','values','url','location'],
	keywordsSplitRe : /[. ]/

};

var credentials = {
	accessKeyId : '',
	secretAccessKey : ''
};

	
AWS.config.update({accessKeyId:credentials.accessKeyId, secretAccessKey:credentials.secretAccessKey}); 
AWS.config.region = 'ap-southeast-1';
AWS.config.endpoint = 'dynamodb.ap-southeast-1.amazonaws.com';
AWS.config.apiVersions = {
	dynamodb: '2012-08-10'
};



var dynamodb =  new AWS.DynamoDB();

function co(data){
	console.log(data);
};

function inArray(needle, haystack){
	if(haystack.indexOf(needle) != -1){
		return true;
	}
	return false;
};

String.prototype.reverse = function(){
	return Array.prototype.reverse.apply(this.split('')).join('');
};

function logData(err, data){
	d = [];
	if(err){
		console.log("Error is : " + JSON.stringify(err, null, 2));
	}
	else{
		data.Items.forEach(function(item){
			d.push(item); 
        })
	}
	co(d);
};

function getDataSimply(TableName){
	var params = {
		TableName :  TableName,
		Limit : 100
	};
	dynamodb.scan(params, logData);
}


function BuildBaseQuery(TableName,retrievalValues){
    var params = {
        TableName : TableName,
        ProjectionExpression:'',
        FilterExpression : '',
        ExpressionAttributeNames : {},
        ExpressionAttributeValues : {}
    };
    retrievalValues.forEach(function(i){
    	if(inArray(i, utilityParams.reservedKeys)){
    		params.ProjectionExpression += "#" + i.reverse() +",";
    		params.ExpressionAttributeNames["#" + i.reverse()] = i;
    	}
    	else{
    		params.ProjectionExpression += i+",";
    	}
    });
    params.ProjectionExpression = params.ProjectionExpression.slice(0,params.ProjectionExpression.length-1);
    return params;
};

function keywordScan(TableName, retrievalValues, conditions, limit){
		var params = BuildBaseQuery(TableName, retrievalValues);
		if(conditions.length > 0){
			conditions.forEach(function(condition){
				conHash = ':' + condition[2].split(utilityParams.keywordsSplitRe).join('');
				if( inArray(condition[0], utilityParams.reservedKeys) ){
					con0Hash = "#"+condition[0].reverse();
					if(!inArray(condition[0],Object.keys(params.ExpressionAttributeNames))){
						params.ExpressionAttributeNames[con0Hash] =  condition[0];
					}
				}else{
					con0Hash = condition[0];
				}
				switch(condition[1]){
					case 'contains': 
						params.FilterExpression += 'contains(' + con0Hash +','+ conHash + ')' +" and ";
						params.ExpressionAttributeValues[conHash] = {"S":condition[2]};
						break;
					case '=' :
						params.FilterExpression += con0Hash + '=' + conHash;
						params.ExpressionAttributeValues[conHash] = {"S" : condition[2] };
						break;
					default:
						break;
				}
			});
		}else{
	        delete params.ExpressionAttributeValues;
	    }
		if(Object.keys(params.ExpressionAttributeNames).length = 0){
			delete parms.ExpressionAttributeNames;
		}
		params.FilterExpression = params.FilterExpression.slice(0,params.FilterExpression.length-4);
	    limit !== 'undefined'?params.Limit = limit:params.Limit = 100;
	    dynamodb.scan(params, logData);
};