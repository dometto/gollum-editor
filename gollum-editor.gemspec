Gem::Specification.new do |s|
  s.name    = "gollum-editor"
  s.version = "0.1b"

  s.homepage = "https://github.com/dometto/gollum-editor"
  s.summary  = "Extracted gollum's editor"
  s.description = "Editor from the gollum project"

  s.files = Dir["lib/**/*"]

  s.add_dependency "mustache"

  s.author = "Dawa Ometto"
  s.email  = "d.ometto@gmail.com"
end