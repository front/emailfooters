function initEditor() {
    var auto = false, userid;
    function setScope(elem, angexpr, val) {
        var scope = angular.element(elem).scope();
        scope.$apply(function() {
            scope[angexpr] = val;
        });
    }
    function getScope(elem, angexpr) {
        var scopes = angular.element(elem).scope();
        if (scopes)
            return scopes[angexpr];
        else
            return undefined;
    }
    function CKtextareChange(newhtml) {
        setScope($('#CKeditor'), 'body_value', newhtml);
    }

    function checkCkeditData() {
        var iframeb = height = $('iframe')[0].contentDocument.body,
                iform = $("form"),
                height = iframeb.clientHeight,
                width = iframeb.clientWidth;
        iform.find('[name="ckwidth"]').val(width);
        iform.find('[name="ckheight"]').val(height);
    }

    function OnDocNodeInserted(e) {
        var newhtml,
                flag = CKEDITOR.instances['CKeditor'].checkDirty();
        if (flag) {
            newhtml = $('iframe')[0].contentDocument.body.innerHTML;
            if (newhtml) {
                CKtextareChange('<div>' + newhtml + '</div>');
            } else {
                CKtextareChange('<div> </div>');
            }
        }
    }

    $('#form input[name="autocheck"]').change(function() {
        var autock = $(this);
        if (autock.is(':checked')) {
            auto = true;
            checkCkeditData();
        } else {
            auto = false;
        }
    });

    function initCKEditorObserver() {
        var elem = $('iframe')[0].contentDocument.getElementsByTagName("body")[0],
                MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        if (MutationObserver) {
            var options_insert = {
                childList: false,
                attributes: true,
                subtree: true,
                characterData: true
            }, observer_document = new MutationObserver(function(mutations) {
                mutations.forEach(function(e) {
                    OnDocNodeInserted(e);
                });
            });
            observer_document.observe(elem, options_insert);
        } else {
            if (elem.addEventListener) {
                // elem.removeEventListener('DOMSubtreeModified');
                elem.addEventListener('DOMSubtreeModified', OnDocNodeInserted, false);
            } else if (elem.attachEvent) {
                // elem.detachEvent("onDOMSubtreeModified");
                elem.attachEvent("onDOMSubtreeModified", OnDocNodeInserted, false);
            } else {
                elem["onDOMSubtreeModified"] = OnDocNodeInserted;
            }
        }
    }
    setTimeout(function() {
        userid = getScope($("#ad-form"), 'idelem');
        CKEDITOR.replace('CKeditor', {
            filebrowserBrowseUrl: '/uploaded/' + userid
                    //   filebrowserUploadUrl: '/adddata/'+window.idelem
        });
        try {
            CKEDITOR.uploadedList = getScope($("#ad-form"), 'uploadedList');
        } catch (er) {
            CKEDITOR.uploadedList = "";
        }
    }, 200);

    CKEDITOR.on('instanceReady', function() {
        initCKEditorObserver();
        CKEDITOR.instances['CKeditor'].idrel = userid;
        if (auto) {
            checkCkeditData();
        }
        CKEDITOR.instances['CKeditor'].on('blur', function(e) {
            var flag = e.editor.checkDirty();
            if (auto && flag) {
                checkCkeditData();
            }
            if (flag) {
                var newhtml = $('iframe')[0].contentDocument.body.innerHTML;
                CKtextareChange(newhtml);
            }
        });
    });
}