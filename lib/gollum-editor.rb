require 'mustache'

module Gollum
  module Editor
    def self.active_editor
      defined?(ACTIVE_EDITOR) ? self.const_get("ACTIVE_EDITOR") : Gollum::Editor::Default
    end

    def self.asset_paths
    	assets = {'/css/' => [Gollum::Editor::Default.css_path], '/javascript' => [Gollum::Editor::Default.js_path]}
    	active_editor_class = self.active_editor
    	unless active_editor_class == Gollum::Editor::Default
    		assets['/css/'] << active_editor_class.css_path
    		assets['/javascript'] << active_editor_class.js_path
    	end
    	assets.each do |type, paths|
    		paths.each do |path|
    			yield type, path
    		end
    	end
    end

    class Default
      DEFAULT_OPTS = {:js_path => 'javascript', :css_path => 'css', :editor_css => 'editor.css', :dialog_css => 'dialog.css', :highlight_css => 'highlightjs-github.css'}

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

      def self.html(replace = {}, options = {})
       options = DEFAULT_OPTS if options.empty?
       Mustache.render(::File.read(::File.join(self.path, 'editor.mustache')), replace.merge(options))
      end
    end

  end
end