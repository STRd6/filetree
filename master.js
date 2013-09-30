(function() {
  module.exports = {
    File: require("./filetree"),
    Filetree: require("./file"),
    template: require("./templates/filetree")
  };

  require("./demo");

}).call(this);
