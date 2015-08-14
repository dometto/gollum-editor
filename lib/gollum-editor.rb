require 'mustache'

module Gollum
  module Editor
  	def self.active_editor
  		defined?(ACTIVE_EDITOR) ? self.const_get("ACTIVE_EDITOR") : Gollum::Editor::Default
    end

  	class Default

	  	def self.path
	  		::File.expand_path("..", __FILE__)
	  	end

	  	def self.assets_path
	  		::File.join(self.path, 'assets')
	  	end

	  	def self.css_path
	  		::File.join(self.assets_path, 'css')
	  	end

	  	def self.js_path
	  		::File.join(self.assets_path, 'js')
	  	end

	    def self.html(replace = {}, js_path = 'javascript', css = {:css_path => = 'css', :editor_css => 'editor.css', :dialog_css => 'dialog.css', :highlight_css => 'highlightjs-github.css'})
	      options = replace.merge(css)[:js_path] = js_path
	  	  Mustache.render(::File.read(::File.join(self.path, 'editor.mustache')), options)
	  	end
    end

  end
end