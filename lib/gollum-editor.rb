module Gollum
  module Editor
  	PATH = File.expand_path("..", __FILE__)

  	def self.path
  		PATH
  	end

  	def self.init_assets
  		set :assets_prefix, settings.assets_prefix + File.join(self.path, 'assets')
  	end
  end
end