File Model
==========

The `File` model represents a file in a file system. It is populated by data
returned from the Github API.

    Composition = require "composition"
    Observable = require "observable"
    {defaults} = require "util"

Attributes
----------
`modified` tracks whether the file has been changed since it was created.



    File = (I={}) ->
      defaults I,
        content: ""
        modified: false
        path: ""

      throw "File must have a path" unless I.path

      self = Composition(I)

      self.attrObservable Object.keys(I)...

      self.extend

The extension is the last part of the filename after the `.`, for example
`"coffee"` for a file named `"main.coffee"` or `"haml"` for a file named
`"filetree.haml"`.

        extension: ->
          self.path().extension()

The `mode` of the file is what editor mode to use for our text editor.

        mode: ->
          switch extension = self.extension()
            when "js"
              "javascript"
            when "md" # TODO: See about nested markdown code modes for .haml.md, .js.md, and .coffee.md
              "markdown"
            when "cson"
              "coffee"
            when ""
              "text"
            else
              extension

The `displayName` is how the file appears in views.

        displayName: Observable(self.path())

When our content changes we assume we are modified. In the future we may want to
track the original content and compare with that to get a more accurate modified
status.

      self.content.observe ->
        self.modified(true)

When our modified state changes we adjust the `displayName` to provide a visual
indication.

      self.modified.observe (modified) ->
        if modified
          self.displayName("*#{self.path()}")
        else
          self.displayName(self.path())

      return self

Export

    module.exports = File
