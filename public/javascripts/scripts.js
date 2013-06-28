/* jshint esnext: true, strict: true, jquery: true */

(function($) {
    $('#take-screenshot').live('click', function() {
      var request = $.ajax({
        url: '/getScreenshot?callback=screenshotCallback'
      });
      request.done(function(msg) {
      });
    });

    $('#form .title').live('input', function() {
      var txt = $(this).val();
      txt = txt.replace(/\n\r?/g, '<br />');
      $('#preview .title').html(txt);
    });

    $('#form .body').live('input', function() {
      var txt = $(this).val();
      txt = txt.replace(/\n\r?/g, '<br />');
      $('#preview .body').html(txt);
    });

    $('#form .url').live('input', function() {
      var url = $(this).val();
      $('#preview .url').attr('href', url);
    });

})(jQuery);

function initEditor(idelem) {
  var auto = false;
  function checkCkeditData() {
    var height = $('iframe')[0].contentDocument.body.clientHeight;
    var width = $('iframe')[0].contentDocument.body.clientWidth;
    $('form').find('[name="ckwidth"]').val(width);
    $('form').find('[name="ckheight"]').val(height);
  }
  $('#form input[name="autocheck"]').change(function() {
    var autock = $(this);
    var auto = false;

    if (autock.is(':checked')) {
      auto = true;
      checkCkeditData();
    }
  });

  CKEDITOR.replace('CKeditor', {
    filebrowserBrowseUrl: '/uploaded/' + window.idelem
    //   filebrowserUploadUrl: '/adddata/'+window.idelem
  });
  CKEDITOR.on('instanceReady', function() {
    //console.log(CKEDITOR);
    // console.log(CKEDITOR.currentInstance)
    // console.log(JSON.stringify(CKEDITOR.instances.CKeditor.plugins.image.init))
    CKEDITOR.instances.CKeditor.idrel = idelem;
    if (auto)
      checkCkeditData();
    CKEDITOR.instances.CKeditor.on('blur', function(e) {
      if (auto && e.editor.checkDirty()) {
        checkCkeditData();
      }
    });
  });
}

function generateUrl(data, urldata) {
  //  myWindow = window.open('/campaign/screenshot/' + urldata, '', 'fullscreen=no,width=200,height=200');
  //  self.focus();
  var dial = $('#openModal'), inp = dial.find('.content .inpdata');
  inp.val('<img src="' + data + '.png"/>');
  inp.click().focus();
  dial.find('.close').unbind('click').click(function() {
    dial.addClass('hidden');
  });
  dial.removeClass('hidden');
  // myWindow.onload = function() {
  //     myWindow.close();
  // }
}
