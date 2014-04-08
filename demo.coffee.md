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
      textarea.value = file.content()
      textarea.onchange = ->
        console.log "yo/o"
        file.content textarea.value

        return

    document.body.appendChild template(filetree)

    textarea = document.createElement "textarea"
    
    document.body.appendChild textarea
