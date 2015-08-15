initGollumEditor = function ( newFile, baseUrl, uploadDest, markupType, livePreview ) {
    var gollum_editor = ace.edit('gollum-editor-body');

    gollum_editor.setTheme("ace/theme/chrome");
    gollum_editor.setHighlightActiveLine(false);
    gollum_editor.renderer.setShowGutter(false);
    gollum_editor.$blockScrolling = Infinity;
    gollum_editor.setOptions({
      indentedSoftWrap: false
    });
    gollum_editor.getSession().setUseWrapMode(true);
    gollum_editor.getSession().setWrapLimitRange();
    gollum_editor.setShowPrintMargin(false);
    gollum_editor.focus();

    $.GollumEditor({ Editor: gollum_editor, NewFile: newFile, MarkupType: markupType, UploadDest: uploadDest, BaseUrl: baseUrl });

    if (typeof(livePreview) == 'object') {
      livePreview['MarkupSource'] = gollum_editor;
      $.GollumPreview(livePreview);
    }
};
