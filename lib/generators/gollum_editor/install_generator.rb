require 'rails/generators'

module GollumEditor
  class InstallGenerator < ::Rails::Generators::Base
    source_root File.expand_path("../../../", __FILE__)
    desc "This generator installs Gollum Editor to Asset Pipeline"

    def add_assets
      directory "assets/js", "vendor/assets/javascripts"
      directory "assets/css", "vendor/assets/stylesheets"
      gsub_file "vendor/assets/stylesheets/gollum_editor/editor.css", "/images/icon-sprite.png", "icon-sprite.png"
      directory "assets/images", "vendor/assets/images"
    end

  end
end