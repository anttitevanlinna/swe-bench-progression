#!/usr/bin/env ruby
require 'webrick'

server = WEBrick::HTTPServer.new(
  :Port => 8001,
  :DocumentRoot => Dir.pwd
)

trap('INT') { server.shutdown }

puts "Starting server at http://localhost:8001"
puts "Press Ctrl+C to stop"

server.start