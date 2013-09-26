(function() {
  var File, Filetree;

  Filetree = require("./filetree");

  File = require("./file");

  module.exports = {
    File: File,
    Filetree: Filetree
  };

  require("./demo");

}).call(this);
