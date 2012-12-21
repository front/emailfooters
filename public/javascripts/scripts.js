$('#take-screenshot').live('click',function(){
	// alert('bar');

	var request = $.ajax({
		url: "/getScreenshot?callback=screenshotCallback"
	});
	request.done(function(msg){
	});
});


$('#form .title').live('input',function(){
	txt = $(this).val();
	txt = txt.replace(/\n\r?/g, '<br />'); 
	$('#preview .title').html (txt);
});

$('#form .body').live('input',function(){
	txt = $(this).val();
	txt = txt.replace(/\n\r?/g, '<br />'); 
	$('#preview .body').html ( txt );
});

$('#form .url').live('input',function(){
	url = $(this).val();
	$('#preview .url').attr ( 'href', url );
});