File Model
==========

The `File` model represents a file in a file system. It is populated by data
returned from the Github API.

    Composition = require "composition"
    Observable = require "observable"
    {defaults} = require "util"

    {SHA1} = require "sha1"
    utf8 = require "./lib/utf8"

Attributes
----------
`modified` tracks whether the file has been changed since it was created.

`path` is the path to the file.

`content` contains the text content of the file.

`sha` is the git SHA1 of the file.

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
          extension self.path()

TODO: mode should be moved out of here.

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

When our content changes we assume we are modified. In the future we may want to
track the original content and compare with that to get a more accurate modified
status.

      self.content.observe ->
        self.modified(true)

      self.sha = Observable ->
        gitSHA(self.content())

The `displayName` is how the file appears in views.

When our modified state changes we adjust the `displayName` to provide a visual
indication.

      self.displayName = Observable ->
        changed = ""
        if self.modified()
          changed = "*"

        "#{changed}#{self.path()}"

      return self

Export

    module.exports = File

Helpers
-------

    extension = (path) ->
      if match = path.match(/\.([^\.]*)$/, '')
        match[1]
      else
        ''

    gitSHA = (string) ->
      length = byteCount(string)
      header = "blob #{length}\0"

      SHA1("#{header}#{string}").toString()

    byteCount = (string) ->
      utf8.encode(string).length

TODO
----

- Handle Binary data!
