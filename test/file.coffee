File = require "../file"

describe "file", ->
  describe "git SHA1s", ->
    it "should keep it's sha up to date", ->
      file = File
        path: "test"

      assert.equal file.sha(), "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391"

      file.content "yolo"

      file.sha.observe (sha) ->
        assert.equal sha, "eeabc605bfdfc792a48ea3d65e47a6f9263e2801"

      assert.equal file.sha(), "eeabc605bfdfc792a48ea3d65e47a6f9263e2801"

    it "should work with utf-8", ->
      file = File
        path: "test"

      file.content "i ♥ u"

      assert.equal file.sha(), "1fe83d4f113d765a7cecddf9c71baaa875b83064"

  it "should know its extension", ->
    file = File
      path: "hello.coffee.md"

    assert.equal file.extension(), "md", "Extension is #{file.extension()}"
