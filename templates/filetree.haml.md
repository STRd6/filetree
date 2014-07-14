Render a list of files as a filetree.

    %ul.filetree
      - selectedFile = @selectedFile
      - files = @files
      - each files, (file) ->
        - select = (e) -> selectedFile(file) if e.target.nodeName is 'LI'
        %li(click=select)= file.displayName
          - remove = -> files.remove(file) if confirm("Delete #{file.path()}?")
          .delete(click=remove)
            X
