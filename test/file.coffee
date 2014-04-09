File = require "../file"
Filetree = require "../filetree"

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

      file.content "i ♥ u\n"

      assert.equal file.sha(), "e6816bf5d113d19e69e0052e359d11144efcd7f1"

    it "should know it's initial sha", ->
      file = File
        path: "test"

      assert file.initialSha(), "Initial SHA is #{file.initialSha()}"

    it "should keep it's initial sha if a sha is passed in", ->
      file = File
        path: "test"
        sha: "e6816bf5d113d19e69e0052e359d11144efcd7f1"

      file.content "something else"

      assert.equal file.initialSha(), "e6816bf5d113d19e69e0052e359d11144efcd7f1"

  it "should know its extension", ->
    file = File
      path: "hello.coffee.md"

    assert.equal file.extension(), "md", "Extension is #{file.extension()}"

  it "should not have both sha and content in github tree", ->
    filetree = Filetree()

    filetree.load [
      path: "yolo"
      content: "wat"
    ]

    f = filetree.githubTree()[0]

    assert (!f.sha and f.content) or (f.sha and !f.content)
