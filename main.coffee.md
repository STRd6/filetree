Filetree
========

An interactive HTML filetree that presents file data in the style of Github API
requests.

    module.exports =
      File: require "./file"
      Filetree: require "./filetree"
      template: require "./templates/filetree"

    # Check if package is root package and then run demo
    if PACKAGE.name is "ROOT"
      global.Observable = require "observable" # TODO: Hack for templating

      require "./demo"
