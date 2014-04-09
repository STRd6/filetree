{File, Filetree, template} = require "../main"

describe "Filetree", ->
  it "should expose a template", ->
    assert template

  it "should expose a Filetree constructor", ->
    assert Filetree

  it "should expose a File constructor", ->
    assert File
      path: "duder.txt"

  it "should return an array of data", ->
    tree = Filetree()

    tree.load

    data = tree.data()
