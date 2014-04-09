File = require "../file"

describe "file", ->
  it "should keep it's sha up to date", ->
    file = File
      path: "test"

    assert.equal file.sha(), "da39a3ee5e6b4b0d3255bfef95601890afd80709"

    file.content "yolo"

    file.sha.observe (sha) ->
      assert.equal sha, "9d25f3b6ab8cfba5d2d68dc8d062988534a63e87"

    assert.equal file.sha(), "9d25f3b6ab8cfba5d2d68dc8d062988534a63e87"

  it "should know its extension", ->
    file = File
      path: "hello.coffee.md"

    assert.equal file.extension(), "md", "Extension is #{file.extension()}"
