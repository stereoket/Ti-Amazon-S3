/*
 * A Titanium Mobile Alloy friendly library for interacting with Amazon S3
 *
 * Obtain S3 credentials here: Secret is only ever shown once, please make a note of it.
 * https://console.aws.amazon.com/iam/home?#security_credential
 *
 * Expected date format for AWS: 
 * 
 * 'Mon, 30 May 2011 17:00:00 +0000' 
 * OR
 * 'Mon, 30 May 2011 17:00:00 GMT'
 * 
 * Note that S3 is case-sensitive so your file name must be an exact, case senstive match.
 *
 * Based on Terry Martin's  Semantic Press, Module. In the Process of rewriting it for Alloy
 * Ketan Majmudar
 * Spirit Quest Limited
 */

/*
 * Import SHA
 */
var SHA = require('sha-aws').load();

function createStringToSign(args) {
	Ti.API.warn(JSON.stringify(args, null, 2));
	Ti.API.log('StringToSign');

	var s2s = "";
	var addNL = function () {
		s2s += "\n";
	}
	// StringToSign = HTTP-Verb + "\n" +
	// Content-MD5 + "\n" +
	// Content-Type + "\n" +
	// Date + "\n" +
	// CanonicalizedAmzHeaders +
	// CanonicalizedResource;

	s2s += args.verb;
	addNL();

	s2s += args.content_md5;
	addNL();

	s2s += args.contentType;
	addNL();

	s2s += args.date;
	addNL();

	if (args.azmHeaders) {
		// TODO Must loop round this and sort them, 
		// will not work othersise
		s2s += args.azmHeaders;
		addNL();
	}

	s2s += args.resource;
	// addNL();
	_OBJ.log('StringToSign', s2s);
	var Utf8 = require('UTF8').load();

	return Utf8.encode(s2s);
}

function readUploadedFile(file) {
	var uploadFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, file);
	if (!uploadFile.exists()) {
		alert('File not found. Please check that ' + f + ' exists in your Data directory.');
	}
	return uploadFile;
}

function createDateString(timezone) {
	var moment = require('alloy/moment');
	var currDateString = moment().format('ddd, D MMM YYYY HH:mm:ss ZZ');
	return currDateString;
}


var _OBJ = {
	APIKey: false, // Set your API Key Here
	SecretKey: false, // Set your SECRET key here
	AWSBucketName: false,
	fileName: false,
	fileURL: false,
	timeout: 99000,
	debug: false,

	log: function (_obj) {
		if (this.debug) {
			Ti.API.log('TIAWS-S3', _obj);
		}
	},

	/*
	 * Create HTTP Object
	 */
	http: Ti.Network.createHTTPClient(),

	PUT: function (f, publicAccess) {
		_OBJ.log('Upload PUT method');
		if (publicAccess === undefined) {
			publicAccess = true;
		}
		if (f) {
			this.fileName = f;
		}
		var uploadFile = readUploadedFile(f);
		var fileContents = uploadFile.read();

		if (!uploadFile.exists()) {
			return;
		}

		_OBJ.fileURL = 'http://' + _OBJ.AWSBucketName + '.s3.amazonaws.com/' + _OBJ.fileName;

		var curDate = createDateString();

		var StringToSign = createStringToSign({
			verb: 'PUT',
			content_md5: '',
			contentType: fileContents.mimeType,
			date: curDate,
			azmHeaders: publicAccess ? 'x-amz-acl:public-read' : '',
			resource: '/' + _OBJ.AWSBucketName + '/' + this.fileName
		});

		// Create AWS Auth Header
		var AWSSignature = SHA.b64_hmac_sha1(_OBJ.SecretKey, StringToSign);
		var AWSAccessKeyID = 'AWS ' + _OBJ.APIKey + ':';
		var AWSAuthHeader = AWSAccessKeyID.concat(AWSSignature);

		var AuthHeader = AWSAuthHeader.toString();
		var ContentType = fileContents.mimeType;
		var ContentLength = uploadFile.size;
		var Host = _OBJ.AWSBucketName + '.s3.amazonaws.com';
		var URL = _OBJ.fileURL;

		_OBJ.log(AuthHeader);
		_OBJ.log(ContentType);
		_OBJ.log(Host);
		_OBJ.log(curDate);
		_OBJ.log(URL);

		_OBJ.http.open('PUT', URL, false);
		_OBJ.http.setTimeout(_OBJ.timeout);

		if (publicAccess) {
			_OBJ.http.setRequestHeader('x-amz-acl', 'public-read');
		}
		_OBJ.http.setRequestHeader('Authorization', AuthHeader);
		_OBJ.http.setRequestHeader('Content-Type', ContentType);
		_OBJ.http.setRequestHeader('Content-Length', ContentLength);
		_OBJ.http.setRequestHeader('Host', Host);
		_OBJ.http.setRequestHeader('Date', curDate);
		_OBJ.http.setRequestHeader('Accept-Encoding', 'gzip');
		_OBJ.http.setRequestHeader('Proxy-Connection', 'close');
		// _OBJ.http.setRequestHeader('User-Agent','Appcelerator Titanium/1.8.1.v20120126144634 (iPhone/5.0.1; iPhone OS; en_US;');

		_OBJ.http.send(fileContents);

	},

	listBuckets: function () {
		Ti.API.log('List Buckets GET method');

		_OBJ.fileURL = 'http://s3.amazonaws.com/';

		var curDate = createDateString();

		// var StringToSign = 'PUT\n'+fileContents.mimeType+'\n' + curDate + '\n/'+_OBJ.AWSBucketName+'/' + _OBJ.fileName;

		var StringToSign = createStringToSign({
			verb: 'GET',
			content_md5: '',
			contentType: '',
			date: curDate,
			azmHeaders: '',
			resource: '/'
		});

		var AWSSignature = SHA.b64_hmac_sha1(_OBJ.SecretKey, StringToSign);
		var AWSAccessKeyID = 'AWS ' + _OBJ.APIKey + ':';
		var AWSAuthHeader = AWSAccessKeyID.concat(AWSSignature);

		var AuthHeader = AWSAuthHeader.toString();
		var Host = 's3.amazonaws.com';
		var URL = _OBJ.fileURL;

		Ti.API.log(AWSAuthHeader);
		Ti.API.log(curDate);

		_OBJ.http.setRequestHeader('Authorization', AuthHeader);
		_OBJ.http.setRequestHeader('Host', Host);
		_OBJ.http.setRequestHeader('Date', curDate);

		_OBJ.http.open('GET', _OBJ.fileURL, false);
		_OBJ.http.send();
	},

	config: function (_args) {
		Ti.API.log(_OBJ.fileURL);
		if (_args.key) {
			this.APIKey = _args.key;
		}
		if (_args.secret) {
			this.SecretKey = _args.secret;
		}
		if (_args.bucket) {
			this.AWSBucketName = _args.bucket;
		}
		if (_args.fileName) {
			this.fileName = _args.fileName;
		}
		if (_args.timeout) {
			this.timeout = _args.timeout;
		}
		if (_args.onsendstream) {
			this.http.onsendstream = _args.onsendstream;
		}
		if (_args.error) {
			this.http.onerror = _args.error;
		}
		if (_args.success) {
			this.http.onload = _args.success;
		}
		if (_args.debug) {
			this.debug = _args.debug;
		}
	}
};

exports.load = function () {
	_OBJ.log(_OBJ.fileURL);
	// Set defaults
	_OBJ.http.onsendstream = function (e) {
		_OBJ.log('TEST1 - PROGRESS: ' + e.progress);
	};
	_OBJ.http.onload = function (e) {

		Ti.API.log('Success. Endpoint: ' + _OBJ.fileURL);
	};

	return _OBJ;
};