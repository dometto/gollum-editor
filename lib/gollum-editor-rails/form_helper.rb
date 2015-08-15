module GollumEditor
  module FormHelper
    def gollum_editor(object_name, method, options = {})
      if options[:id]
        options[:id] << " gollum-editor-body"
      else
        options[:id] = "gollum-editor-body"
      end
      controls = Gollum::Editor::Default.html(options, :require_assets => nil)
      content_tag(:div, (controls.html_safe), { :id => 'gollum-editor' })
    end
    
    def self.included(arg)
      ActionView::Helpers::FormBuilder.send(:include, GollumEditor::FormBuilder)
    end
  end
end
ActionView::Helpers::FormHelper.send(:include, GollumEditor::FormHelper)
