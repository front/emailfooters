(function() {
//Section 1 : Code to execute when the toolbar button is pressed
    var 
//Section 2 : Create the button and add the functionality to it
    b = 'addTags';
    CKEDITOR.plugins.add(b, {
        init: function(editor) {
//editor.addCommand(b,a);
            editor.addCommand(b, new CKEDITOR.dialogCommand(b));
            editor.ui.addButton(b, {
                label: 'Add Tag',
                icon: this.path + "icons.png",
                style: 'background-position: -6px;',
                command: b
            });
            CKEDITOR.dialog.add(b, function(editor) {
                return {
                    title: 'Your uploaded files:',
                    resizable: CKEDITOR.DIALOG_RESIZE_BOTH,
                    minWidth: 500,
                    minHeight: 400,
                    contents: [
                        {
                            id: 'tab1',
                            label: 'First Tab',
                            title: 'First Tab Title',
                            accessKey: 'Q',
                            elements: [
                                {
                                    type: 'html',
                                    html: '<p>' + 'List of uploaded files: '
                                            + '<ul>'+(function(){ 
                                                    var v = CKEDITOR.uploadedList.replace(/&quot;/g, '').split(","), temp = [];
                                                    for(var i in v){
                                                        temp.push('<li>'+v[i]+'</li>')
                                                    }
                                                    return temp.join("")
                                                })()+'</ul>'
                                            + '</p>'
                                            + '<form id="form" class="navbar-form pull-left" action="/adddata/'+CKEDITOR.instances['CKeditor'].idrel+'" method="post" enctype="multipart/form-data">'
                                            + '<input type="file" name="image">'
                                            + '<button type="submit"  class="btn">Submit</button>'
                                            + '</form>'

                                }
                            ]
                        }
                    ]
                };
            });
        }
    });
})();