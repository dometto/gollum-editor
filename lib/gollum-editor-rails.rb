require 'gollum-editor'
require "gollum-editor-rails/version"
require "gollum-editor-rails/form_builder"
require "gollum-editor-rails/form_helper"

ActionView::Helpers::FormHelper.send(:include, GollumEditor::FormHelper)

module Rails
	if defined?(Rails::Engine) then
      class GollumEditor < Engine
        initializer :assets do |config|
          Rails.application.config.assets.precompile += %w( gollum_editor/gollum.css gollum_editor/gollum.js )
        end
      end
    end
end