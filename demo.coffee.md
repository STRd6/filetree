A demo application displaying the filetree.

    File = require "./file"
    Filetree = require "./filetree"

    template = require("./templates/filetree")

    demoData = [
      {
        path: "hey.yolo"
        content: "wat"
        type: "blob"
      }
    ]

    filetree = Filetree()
    filetree.load demoData

    filetree.selectedFile.observe (file) ->
      console.log file

    document.body.appendChild template(filetree)
