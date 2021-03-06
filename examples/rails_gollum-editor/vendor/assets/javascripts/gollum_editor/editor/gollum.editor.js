/**
 *  gollum.editor.js
 *  A jQuery plugin that creates the Gollum Editor.
 *
 *  Usage:
 *  $.GollumEditor(); on DOM ready.
 */

(function($) {

  // Editor options
  var DefaultOptions = {
    MarkupType: 'markdown',
    EditorMode: 'code',
    BaseUrl: null,
    UploadDest: '/uploadFile',
    Editor: null,
    NewFile: false,
    HasFunctionBar: true,
    Debug: false,
    NoDefinitionsFor: []
  };
  var ActiveOptions = {};

  var formatSelectorInstance;

  /**
   *  $.GollumEditor
   *
   *  You don't need to do anything. Just run this on DOM ready.
   */
  $.GollumEditor = function( IncomingOptions ) {
    ActiveOptions = $.extend( DefaultOptions, IncomingOptions );

    debug('GollumEditor loading');

    if ( EditorHas.baseEditorMarkup() ) {

      if ( EditorHas.titleDisplayed() ) {
        $('#gollum-editor-title-field').addClass('active');
      }

      if ( EditorHas.editSummaryMarkup() ) {
        $.GollumEditor.Placeholder.add($('#gollum-editor-edit-summary input'));
        $('#gollum-editor form[name="gollum-editor"]').submit(function( e ) {
          e.preventDefault();
          // Do not clear default place holder text
          // Updated home (markdown)
          // $.GollumEditor.Placeholder.clearAll();
          debug('submitting');
          $(this).unbind('submit');
          $(this).submit();
        });
      }

      if ( EditorHas.collapsibleInputs() ) {
        $('#gollum-editor .collapsed a.button, ' +
          '#gollum-editor .expanded a.button').click(function( e ) {
          e.preventDefault();
          $(this).parent().toggleClass('expanded');
          $(this).parent().toggleClass('collapsed');
        });
      }

      // Initialize the function bar by loading proper definitions
      if ( EditorHas.functionBar() ) {

        var htmlSetMarkupLang =
          $('#gollum-editor-body').attr('data-markup-lang');

        if ( htmlSetMarkupLang ) {
          ActiveOptions.MarkupType = htmlSetMarkupLang;
        }

        // load language definition
        LanguageDefinition.setActiveLanguage( ActiveOptions.MarkupType );
        if ( EditorHas.formatSelector() ) {
          formatSelectorInstance = new FormatSelector(ActiveOptions.Editor, $, $('#gollum-editor-format-selector select'));
        }

        if ( EditorHas.help() ) {
          $('#gollum-editor-help').hide();
          $('#gollum-editor-help').removeClass('jaws');
        }
      } // EditorHas.functionBar

      if ( EditorHas.dragDropUpload() ) {
        var $editorBody = ActiveOptions.Editor;
        var editorBody = ActiveOptions.Editor[0];
        editorBody.ondragover = function(e) {
          $editorBody.addClass('dragging');
          return false;
        };
        editorBody.ondragleave = function() {
          $editorBody.removeClass('dragging');
          return false;
        };
        editorBody.ondrop = function(e) {
          debug("dropped file");
          e.preventDefault();
          $editorBody.removeClass('dragging').addClass('uploading');

          var file = e.dataTransfer.files[0],
              formData = new FormData();
          formData.append('upload_dest', ActiveOptions.UploadDest);
          formData.append('file', file);

          $.ajax({
            url: ActiveOptions.BaseUrl + ActiveOptions.UploadDest,
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            type: 'POST',
            success: function(){
              $editorBody.removeClass('uploading');
              var text = '[[/' + ActiveOptions.UploadDest + '/' + file.name + ']]';
              $.GollumEditor.replaceSelection(text);
            },
            error: function(r, textStatus) {
              alert('Error uploading file: ' + textStatus);
              $editorBody.removeClass('uploading');
            }
          });

          return false;
        };
      } // EditorHas.dragDropUpload
    } // EditorHas.baseEditorMarkup
  };

  /**
   * $.GollumEditor.replaceSelection
   * Replace the current selection with repText
   * Reselect the replacement if reselect == true 
  **/
  $.GollumEditor.replaceSelection = function ( repText, selPos ) {
     if (typeof selPos === 'undefined') { selPos = ActiveOptions.Editor.getSelectionRange(); }
     if ( repText ) {
       ActiveOptions.Editor.session.replace(selPos, repText)
      }
  };

  /**
   *  $.GollumEditor.defineLanguage
   *  Defines a set of language actions that Gollum can use.
   *  Used by the definitions in langs/ to register language definitions.
   */
  $.GollumEditor.defineLanguage = function( language_name, languageObject ) {
    if ( typeof languageObject == 'object' ) {
      LanguageDefinition.define( language_name, languageObject );
    } else {
      debug('GollumEditor.defineLanguage: definition for ' + language_name +
            ' is not an object');
    }
  };


  /**
   *  debug
   *  Prints debug information to console.log if debug output is enabled.
   *
   *  @param  mixed  Whatever you want to dump to console.log
   *  @return void
   */
  var debug = function(m) {
    if ( ActiveOptions.Debug &&
         typeof console != 'undefined' ) {
      console.log( m );
    }
  };



  /**
   *  LanguageDefinition
   *  Language definition file handler
   *  Loads language definition files as necessary.
   */
  var LanguageDefinition = {

    _ACTIVE_LANG: '',
    _LOADED_LANGS: [],
    _LANG: {},

    /**
     *  Defines a language
     *
     *  @param name string  The name of the language
     *  @param name object  The definition object
     */
    define: function( name, definitionObject ) {
      LanguageDefinition._ACTIVE_LANG = name;
      LanguageDefinition._LOADED_LANGS.push( name );
      if ( typeof $.GollumEditor.WikiLanguage == 'object' ) {
        var definition = {};
        $.extend(definition, $.GollumEditor.WikiLanguage, definitionObject);
        LanguageDefinition._LANG[name] = definition;
      } else {
        LanguageDefinition._LANG[name] = definitionObject;
      }
    },

    getActiveLanguage: function() {
      return LanguageDefinition._ACTIVE_LANG;
    },

    setActiveLanguage: function( name ) {
      // On first load _ACTIVE_LANG.length is 0 and evtChangeFormat isn't called.
      if ( LanguageDefinition._ACTIVE_LANG != null && LanguageDefinition._ACTIVE_LANG.length <= 0 ) {
        if (!!formatSelectorInstance) {
          formatSelectorInstance.updateCommitMessage(name);
        }
      }

      if(LanguageDefinition.getHookFunctionFor("deactivate")) {
        LanguageDefinition.getHookFunctionFor("deactivate")();
      }
      if ( !LanguageDefinition.isLoadedFor(name) ) {
        LanguageDefinition._ACTIVE_LANG = null;
        LanguageDefinition.loadFor( name, function(x, t) {
          if ( t != 'success' ) {
            debug('Failed to load language definition for ' + name);
            // well, fake it and turn everything off for this one
            LanguageDefinition.define( name, {} );
          }

          // update features that rely on the language definition
          if ( EditorHas.functionBar() ) {
            FunctionBar.refresh();
          }

          if ( LanguageDefinition.isValid() && EditorHas.formatSelector() ) {
            formatSelectorInstance.updateSelected();
          }

          if(LanguageDefinition.getHookFunctionFor("activate")) {
            LanguageDefinition.getHookFunctionFor("activate")();
          }

          function hotkey( cmd ){
            var def = LanguageDefinition.getDefinitionFor( cmd );
            if ( typeof def == 'object' ) {
              FunctionBar.executeAction( def );
            }
          }

          ActiveOptions.Editor.commands.addCommand({
            name: 'h1',
            bindKey: {win: 'Ctrl-1', mac: 'Command-1', sender: 'editor|cli'},
            exec: function () { hotkey( 'function-h1' ) }
          });
          ActiveOptions.Editor.commands.addCommand({
            name: 'h2',
            bindKey: {win: 'Ctrl-2', mac: 'Command-2', sender: 'editor|cli'},
            exec: function () { hotkey( 'function-h2' ) }
          });
          ActiveOptions.Editor.commands.addCommand({
            name: 'h3',
            bindKey: {win: 'Ctrl-3', mac: 'Command-3', sender: 'editor|cli'},
            exec: function () { hotkey( 'function-h3' ) }
          });
          ActiveOptions.Editor.commands.addCommand({
            name: 'b',
            bindKey: {win: 'Ctrl-b', mac: 'Command-b', sender: 'editor|cli'},
            exec: function () { hotkey( 'function-bold' ) }
          });
          ActiveOptions.Editor.commands.addCommand({
            name: 'i',
            bindKey: {win: 'Ctrl-i', mac: 'Command-i', sender: 'editor|cli'},
            exec: function () { hotkey( 'function-italic' ) }
          });
          ActiveOptions.Editor.commands.addCommand({
            name: 'save',
            bindKey: {win: 'Ctrl-s', mac: 'Command-s', sender: 'editor|cli'},
            exec: function () {
              $("#gollum-editor-submit").trigger("click");
              return false;
            }
          });

        } );
      } else {
        LanguageDefinition._ACTIVE_LANG = name;
        FunctionBar.refresh();

        if(LanguageDefinition.getHookFunctionFor("activate")) {
          LanguageDefinition.getHookFunctionFor("activate")();
        }
      }
    },

    getHookFunctionFor: function(attr, specified_lang) {
      if ( !specified_lang ) {
        specified_lang = LanguageDefinition._ACTIVE_LANG;
      }

      if ( LanguageDefinition.isLoadedFor(specified_lang) &&
           LanguageDefinition._LANG[specified_lang][attr] &&
           typeof LanguageDefinition._LANG[specified_lang][attr] == 'function' ) {
        return LanguageDefinition._LANG[specified_lang][attr];
      }

      return null;
    },

    /**
     *  gets a definition object for a specified attribute
     *
     *  @param  string  attr    The specified attribute.
     *  @param  string  specified_lang  The language to pull a definition for.
     *  @return object if exists, null otherwise
     */
    getDefinitionFor: function( attr, specified_lang ) {
      if ( !specified_lang ) {
        specified_lang = LanguageDefinition._ACTIVE_LANG;
      }

      if ( LanguageDefinition.isLoadedFor(specified_lang) &&
           LanguageDefinition._LANG[specified_lang][attr] &&
           typeof LanguageDefinition._LANG[specified_lang][attr] == 'object' ) {
        return LanguageDefinition._LANG[specified_lang][attr];
      }

      return null;
    },


    /**
     *  loadFor
     *  Asynchronously loads a definition file for the current markup.
     *  Definition files are necessary to use the code editor.
     *
     *  @param  string  markup_name  The markup name you want to load
     *  @return void
     */
    loadFor: function( markup_name, on_complete ) {
      // Keep us from hitting 404s on our site, check the definition blacklist
      if ( ActiveOptions.NoDefinitionsFor.length ) {
        for ( var i=0; i < ActiveOptions.NoDefinitionsFor.length; i++ ) {
          if ( markup_name == ActiveOptions.NoDefinitionsFor[i] ) {
            // we don't have this. get out.
            if ( typeof on_complete == 'function' ) {
              on_complete( null, 'error' );
              return;
            }
          }
        }
      }

      // attempt to load the definition for this language
      var script_uri = '/javascript/editor/langs/' + markup_name + '.js';
      $.ajax({
                url: script_uri,
                dataType: 'script',
                complete: function( xhr, textStatus ) {
                  if ( typeof on_complete == 'function' ) {
                    on_complete( xhr, textStatus );
                  }
                }
            });
    },


    /**
     *  isLoadedFor
     *  Checks to see if a definition file has been loaded for the
     *  specified markup language.
     *
     *  @param  string  markup_name   The name of the markup.
     *  @return boolean
     */
    isLoadedFor: function( markup_name ) {
      if ( LanguageDefinition._LOADED_LANGS.length === 0 ) {
        return false;
      }

      for ( var i=0; i < LanguageDefinition._LOADED_LANGS.length; i++ ) {
        if ( LanguageDefinition._LOADED_LANGS[i] == markup_name ) {
          return true;
        }
      }
      return false;
    },

    isValid: function() {
      return ( LanguageDefinition._ACTIVE_LANG &&
               typeof LanguageDefinition._LANG[LanguageDefinition._ACTIVE_LANG] ==
               'object' );
    }

  };

  // Bridge
  $.LanguageDefinition = {
    setActiveLanguage: function(name) {
      LanguageDefinition.setActiveLanguage(name);
    },
    getActiveLanguage: function() {
      return LanguageDefinition.getActiveLanguage();
    }
  };
  


  /**
   *  EditorHas
   *  Various conditionals to check what features of the Gollum Editor are
   *  active/operational.
   */
  var EditorHas = {


    /**
     *  EditorHas.baseEditorMarkup
     *  True if the basic editor form is in place.
     *
     *  @return boolean
     */
    baseEditorMarkup: function() {
      return ( $('#gollum-editor').length &&
               ActiveOptions.Editor );
    },


    /**
     *  EditorHas.collapsibleInputs
     *  True if the editor contains collapsible inputs for things like the
     *  sidebar or footer, false otherwise.
     *
     *  @return boolean
     */
    collapsibleInputs: function() {
      return $('#gollum-editor .collapsed, #gollum-editor .expanded').length;
    },


    /**
     *  EditorHas.formatSelector
     *  True if the editor has a format selector (for switching between
     *  language types), false otherwise.
     *
     *  @return boolean
     */
    formatSelector: function() {
      return $('#gollum-editor-format-selector select').length;
    },


    /**
     *  EditorHas.functionBar
     *  True if the Function Bar markup exists.
     *
     *  @return boolean
     */
    functionBar: function() {
      return ( ActiveOptions.HasFunctionBar &&
               $('#gollum-editor-function-bar').length );
    },


    /**
     *  EditorHas.ff4Environment
     *  True if in a Firefox 4.0 Beta environment.
     *
     *  @return boolean
     */
    ff4Environment: function() {
      var ua = new RegExp(/Firefox\/4.0b/);
      return ( ua.test( navigator.userAgent ) );
    },


    /**
     *  EditorHas.editSummaryMarkup
     *  True if the editor has a summary field (Gollum's commit message),
     *  false otherwise.
     *
     *  @return boolean
     */
    editSummaryMarkup: function() {
      return ( $('input#gollum-editor-message-field').length > 0 );
    },


    /**
     *  EditorHas.help
     *  True if the editor contains the inline help sector, false otherwise.
     *
     *  @return boolean
     */
    help: function() {
      return ( $('#gollum-editor #gollum-editor-help').length &&
               $('#gollum-editor #function-help').length );
    },


    /**
     *  EditorHas.titleDisplayed
     *  True if the editor is displaying a title field, false otherwise.
     *
     *  @return boolean
     */
    titleDisplayed: function() {
      return ( ActiveOptions.NewFile );
    },


    /**
     *  EditorHas.dragDropUpload
     *  True if the editor is supports drag and drop file uploads, false otherwise.
     *
     *  @return boolean
     */
    dragDropUpload: function() {
      return $('#gollum-editor.uploads-allowed').length;
    }

  };

  /**
   *  FunctionBar
   *
   *  Things the function bar does.
   */
   var FunctionBar = {

      isActive: false,


      /**
       *  FunctionBar.activate
       *  Activates the function bar, attaching all click events
       *  and displaying the bar.
       *
       */
      activate: function() {
        debug('Activating function bar');

        // check these out
        $('#gollum-editor-function-bar a.function-button').each(function() {
          if ( LanguageDefinition.getDefinitionFor( $(this).attr('id') ) ) {
            $(this).click( FunctionBar.evtFunctionButtonClick );
            $(this).removeClass('disabled');
          }
          else if ( $(this).attr('id') != 'function-help' ) {
            $(this).addClass('disabled');
          }
        });

        // show bar as active
        $('#gollum-editor-function-bar').addClass( 'active' );
        FunctionBar.isActive = true;
      },


      deactivate: function() {
        $('#gollum-editor-function-bar a.function-button').unbind('click');
        $('#gollum-editor-function-bar').removeClass( 'active' );
        FunctionBar.isActive = false;
      },


      /**
       *  FunctionBar.evtFunctionButtonClick
       *  Event handler for the function buttons. Traps the click and
       *  executes the proper language action.
       *
       *  @param jQuery.Event jQuery event object.
       */
      evtFunctionButtonClick: function(e) {
        e.preventDefault();
        var def = LanguageDefinition.getDefinitionFor( $(this).attr('id') );
        if ( typeof def == 'object' ) {
          FunctionBar.executeAction( def );
        }
      },


      /**
       *  FunctionBar.executeAction
       *  Executes a language-specific defined action for a function button.
       *
       */
      executeAction: function( definitionObject ) {
        var selPos = ActiveOptions.Editor.getSelectionRange();
        var selText = ActiveOptions.Editor.session.getTextRange(selPos);
        var repText = selText;
        var reselect = true;
        var cursor = null;

        // execute a replacement function if one exists
        if ( definitionObject.exec &&
             typeof definitionObject.exec == 'function' ) {
          definitionObject.exec( selText, $('#gollum-editor-body') );
          ActiveOptions.Editor.focus();
          return;
        }

        // execute a search/replace if they exist
        var searchExp = /([^\n]+)/gi;
        if ( definitionObject.search &&
             typeof definitionObject.search == 'object' ) {
          debug('Replacing search Regex');
          searchExp = null;
          searchExp = new RegExp ( definitionObject.search );
          debug( searchExp );
        }
        debug('repText is ' + '"' + repText + '"');
        // replace text
        if ( definitionObject.replace &&
             typeof definitionObject.replace == 'string' ) {
          debug('Running replacement - using ' + definitionObject.replace);
          var rt = definitionObject.replace;

          repText = escape( repText );
          repText = repText.replace( searchExp, rt );
          // remove backreferences
          repText = repText.replace( /\$[\d]/g, '' );
          repText = unescape( repText );

          if ( repText === '' ) {
            debug('Search string is empty');

            // find position of $1 - this is where we will place the cursor
            cursor = rt.indexOf('$1');

            // we have an empty string, so just remove backreferences
            repText = rt.replace( /\$[\d]/g, '' );

            // if the position of $1 doesn't exist, stick the cursor in
            // the middle
            if ( cursor == -1 ) {
              cursor = Math.floor( rt.length / 2 );
            }
          }
        }

        // append if necessary
        if ( definitionObject.append &&
             typeof definitionObject.append == 'string' ) {
          if ( repText == selText ) {
            reselect = false;
          }
          repText += definitionObject.append;
        }

        if ( repText ) {
          $.GollumEditor.replaceSelection(repText, selPos);
        }

        ActiveOptions.Editor.selection.moveCursorToPosition(selPos);

        if ( reselect ) {
          if ( cursor ) {
            selPos.setStart(selPos.start.row, selPos.start.column + cursor)
            selPos.setEnd(selPos.end.row, selPos.end.column + cursor)
          } else {
            selPos.setEnd(selPos.end.row, selPos.start.column + repText.length);
          }
          ActiveOptions.Editor.selection.setRange(selPos);
          ActiveOptions.Editor.focus();
        }

      },

      isShown: function() {
        return ($('#gollum-editor-function-bar').is(':visible'));
      },

      refresh: function() {
        if ( EditorHas.functionBar() ) {
          debug('Refreshing function bar');
          if ( LanguageDefinition.isValid() ) {
            $('#gollum-editor-function-bar a.function-button').unbind('click');
            FunctionBar.activate();
            if ( Help ) {
              Help.setActiveHelp( LanguageDefinition.getActiveLanguage() );
            }
          } else {
            debug('Language definition is invalid.');
            if ( FunctionBar.isShown() ) {
              // deactivate the function bar; it's not gonna work now
              FunctionBar.deactivate();
            }
            if ( Help.isShown() ) {
              Help.hide();
            }
          }
        }
      }
    };

   /**
    *  Help
    *
    *  Functions that manage the display and loading of inline help files.
    */
  var Help = {

    _ACTIVE_HELP: '',
    _LOADED_HELP_LANGS: [],
    _HELP: {},

    /**
     *  Help.define
     *
     *  Defines a new help context and enables the help function if it
     *  exists in the Gollum Function Bar.
     *
     *  @param string name   The name you're giving to this help context.
     *                       Generally, this should match the language name.
     *  @param object definitionObject The definition object being loaded from a
     *                                 language / help definition file.
     *  @return void
     */
    define: function( name, definitionObject ) {
      if ( Help.isValidHelpFormat( definitionObject ) ) {
        debug('help is a valid format');

        Help._ACTIVE_HELP_LANG = name;
        Help._LOADED_HELP_LANGS.push( name );
        Help._HELP[name] = definitionObject;

        if ( $("#function-help").length ) {
          if ( $('#function-help').hasClass('disabled') ) {
            $('#function-help').removeClass('disabled');
          }
          $('#function-help').unbind('click');
          $('#function-help').click( Help.evtHelpButtonClick );

          // generate help menus
          Help.generateHelpMenuFor( name );

          if ( $('#gollum-editor-help').length &&
               typeof $('#gollum-editor-help').attr('data-autodisplay') !== 'undefined' &&
               $('#gollum-editor-help').attr('data-autodisplay') === 'true' ) {
            Help.show();
          }
        }
      } else {
        if ( $('#function-help').length ) {
          $('#function-help').addClass('disabled');
        }
      }
    },

    /**
     *  Help.generateHelpMenuFor
     *  Generates the markup for the main help menu given a context name.
     *
     *  @param string  name  The context name.
     *  @return void
     */
    generateHelpMenuFor: function( name ) {
      if ( !Help._HELP[name] ) {
        debug('Help is not defined for ' + name.toString());
        return false;
      }
      var helpData = Help._HELP[name];

      // clear this shiz out
      $('#gollum-editor-help-parent').html('');
      $('#gollum-editor-help-list').html('');
      $('#gollum-editor-help-content').html('');

      // go go inefficient algorithm
      for ( var i=0; i < helpData.length; i++ ) {
        if ( typeof helpData[i] != 'object' ) {
          break;
        }

        var $newLi = $('<li><a href="#" rel="' + i + '">' +
                       helpData[i].menuName + '</a></li>');
        $('#gollum-editor-help-parent').append( $newLi );
        if ( i === 0 ) {
          // select on first run
          $newLi.children('a').addClass('selected');
        }
        $newLi.children('a').click( Help.evtParentMenuClick );
      }

      // generate parent submenu on first run
      Help.generateSubMenu( helpData[0], 0 );
      $($('#gollum-editor-help-list li a').get(0)).click();

    },

    /**
     *  Help.generateSubMenu
     *  Generates the markup for the inline help sub-menu given the data
     *  object for the submenu and the array index to start at.
     *
     *  @param object subData The data for the sub-menu.
     *  @param integer index  The index clicked on (parent menu index).
     *  @return void
     */
    generateSubMenu: function( subData, index ) {
      $('#gollum-editor-help-list').html('');
      $('#gollum-editor-help-content').html('');
      for ( var i=0; i < subData.content.length; i++ ) {
        if ( typeof subData.content[i] != 'object' ) {
          break;
        }

        var $subLi = $('<li><a href="#" rel="' + index + ':' + i + '">' +
                       subData.content[i].menuName + '</a></li>');


        $('#gollum-editor-help-list').append( $subLi );
        $subLi.children('a').click( Help.evtSubMenuClick );
      }
    },

    hide: function() {
      if ( $.browser.msie ) {
        $('#gollum-editor-help').css('display', 'none');
      } else {
        $('#gollum-editor-help').animate({
          opacity: 0
        }, 200, function() {
          $('#gollum-editor-help')
            .animate({ height: 'hide' }, 200);
        });
      }
    },

    show: function() {
      if ( $.browser.msie ) {
        // bypass effects for internet explorer, since it does weird crap
        // to text antialiasing with opacity animations
        $('#gollum-editor-help').css('display', 'block');
      } else {
        $('#gollum-editor-help').animate({
          height: 'show'
        }, 200, function() {
          $('#gollum-editor-help')
            .animate({ opacity: 1 }, 300);
        });
      }
    },

    /**
     *  Help.showHelpFor
     *  Displays the actual help content given the two menu indexes, which are
     *  rendered in the rel="" attributes of the help menus
     *
     *  @param integer index1  parent index
     *  @param integer index2  submenu index
     *  @return void
     */
    showHelpFor: function( index1, index2 ) {
      var html =
        Help._HELP[Help._ACTIVE_HELP_LANG][index1].content[index2].data;
      $('#gollum-editor-help-content').html(html);
    },

    /**
     *  Help.isLoadedFor
     *  Returns true if help is loaded for a specific markup language,
     *  false otherwise.
     *
     *  @param string name   The name of the markup language.
     *  @return boolean
     */
    isLoadedFor: function( name ) {
      for ( var i=0; i < Help._LOADED_HELP_LANGS.length; i++ ) {
        if ( name == Help._LOADED_HELP_LANGS[i] ) {
          return true;
        }
      }
      return false;
    },

    isShown: function() {
      return ($('#gollum-editor-help').is(':visible'));
    },

    /**
     *  Help.isValidHelpFormat
     *  Does a quick check to make sure that the help definition isn't in a
     *  completely messed-up format.
     *
     *  @param object (Array) helpArr  The help definition array.
     *  @return boolean
     */
    isValidHelpFormat: function( helpArr ) {
      return ( typeof helpArr == 'object' &&
               helpArr.length &&
               typeof helpArr[0].menuName == 'string' &&
               typeof helpArr[0].content == 'object' &&
               helpArr[0].content.length );
    },

    /**
     *  Help.setActiveHelp
     *  Sets the active help definition to the one defined in the argument,
     *  re-rendering the help menu to match the new definition.
     *
     *  @param string  name  The name of the help definition.
     *  @return void
     */
    setActiveHelp: function( name ) {
      if ( !Help.isLoadedFor( name ) ) {
        if ( $('#function-help').length ) {
          $('#function-help').addClass('disabled');
        }
        if ( Help.isShown() ) {
          Help.hide();
        }
      } else {
        Help._ACTIVE_HELP_LANG = name;
        if ( $("#function-help").length ) {
          if ( $('#function-help').hasClass('disabled') ) {
            $('#function-help').removeClass('disabled');
          }
          $('#function-help').unbind('click');
          $('#function-help').click( Help.evtHelpButtonClick );
          Help.generateHelpMenuFor( name );
        }
      }
    },

    /**
     *  Help.evtHelpButtonClick
     *  Event handler for clicking the help button in the function bar.
     *
     *  @param jQuery.Event e  The jQuery event object.
     *  @return void
     */
    evtHelpButtonClick: function( e ) {
      e.preventDefault();
      if ( Help.isShown() ) {
        // turn off autodisplay if it's on
        if ( $('#gollum-editor-help').length &&
             $('#gollum-editor-help').attr('data-autodisplay') !== 'undefined' &&
             $('#gollum-editor-help').attr('data-autodisplay') === 'true' ) {
          $.post('/wiki/help?_method=delete');
          $('#gollum-editor-help').attr('data-autodisplay', '');
        }
        Help.hide(); }
      else { Help.show(); }
    },

    /**
     *  Help.evtParentMenuClick
     *  Event handler for clicking on an item in the parent menu. Automatically
     *  renders the submenu for the parent menu as well as the first result for
     *  the actual plain text.
     *
     *  @param jQuery.Event e  The jQuery event object.
     *  @return void
     */
    evtParentMenuClick: function( e ) {
      e.preventDefault();
      // short circuit if we've selected this already
      if ( $(this).hasClass('selected') ) { return; }

      // populate from help data for this
      var helpIndex = $(this).attr('rel');
      var subData = Help._HELP[Help._ACTIVE_HELP_LANG][helpIndex];

      $('#gollum-editor-help-parent li a').removeClass('selected');
      $(this).addClass('selected');
      Help.generateSubMenu( subData, helpIndex );
      $($('#gollum-editor-help-list li a').get(0)).click();
    },

    /**
     *  Help.evtSubMenuClick
     *  Event handler for clicking an item in a help submenu. Renders the
     *  appropriate text for the submenu link.
     *
     *  @param jQuery.Event e  The jQuery event object.
     *  @return void
     */
    evtSubMenuClick: function( e ) {
      e.preventDefault();
      if ( $(this).hasClass('selected') ) { return; }

      // split index rel data
      var rawIndex = $(this).attr('rel').split(':');
      $('#gollum-editor-help-list li a').removeClass('selected');
      $(this).addClass('selected');
      Help.showHelpFor( rawIndex[0], rawIndex[1] );
    }
  };

  // Publicly-accessible function to Help.define
  $.GollumEditor.defineHelp = Help.define;

  $.GollumEditor.Dialog = $.GollumDialog;

  $.GollumEditor.isStringURL = function(str) {
    var pattern = /^(https?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(\:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(\#[-a-z\d_]*)?$/i;
    return !!pattern.test(str);
  };

  $.GollumEditor.Placeholder = $.GollumPlaceholder;

})(jQuery);
