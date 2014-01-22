var AWS = require("amazon").load();

function getMediaExtension(mimeType) {
	var a = mimeType.split('/');
	var b;
	Ti.API.warn(JSON.stringify(a, null, 2));
	if( a.length === 1 || ( a[0] === "" && a.length === 2 ) ) {
	    return "";
	}
	Ti.API.log('media extension');
	switch (a.pop()){
		case 'jpeg':
		b = '.jpg';
		break;

		case 'png':
		b = '.png';
		break;

		case 'gif':
		b = '.gif';
		break;

	}
	return b; 
}

function mainImage(e) {
    var a = Titanium.UI.createAlertDialog({
		title:'Select Gallery Option',
		buttonNames: ['Upload Image/Video','Open Remote','Cancel'],
		message:'You can upload a new photo or open a link to previously uploaded image.'
	});
	a.show();
	a.addEventListener('click', function(e) {
		if (e.index == 0) {
			Ti.Media.openPhotoGallery({
				success:function(e) {
					// Reset Ind
					$.ind.message = 'Uploading Image';
					$.ind.opacity = 1;
					$.ind.show();
					
					// File
					var d = new Date();
					var FILENAME = d.getTime()+ getMediaExtension(e.media.mimeType);
					Ti.API.log(FILENAME);
					var f = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory,FILENAME);
					f.write(e.media);

					// False flag will make the upload private and non-accessible to public
					AWS.PUT(FILENAME, true);
				}
			});
		}
		if (e.index == 1) {
			Titanium.Platform.openURL($.mainImage.image);
		}
	});
}



AWS.config({
	key: '', // Overide API Key Here
	secret: '', // Overide SECRET key here
	bucket: '',
	debug:true,
	onsendstream: function(e) {
		$.ind.value = e.progress ;
		Ti.API.info('PROGRESS: ' + e.progress);
	},
	error: function(e) {
		Ti.API.warn(JSON.stringify(e.message, null, 2));
		Ti.API.error(e);
	},
	success: function(e) {
		Ti.API.log('AWS Upload S3 success');
		$.startLabel.hide();
		$.ind.message = 'Success!';
		$.mainImage.image = AWS.fileURL;
		
		// Hide Indicator
		setTimeout(function() {
			$.ind.animate({opacity:0,duration:500},function() {
				$.ind.hide();
				$.ind.value = 0;
			});

		},1200);
	}
});



$.index.open();
$.mainImage.addEventListener('click', mainImage);
