window["STRd6/filetree:v0.3.1-pre.4"]({
  "source": {
    "LICENSE": {
      "path": "LICENSE",
      "mode": "100644",
      "content": "The MIT License (MIT)\n\nCopyright (c) 2013 Daniel X Moore\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of\nthis software and associated documentation files (the \"Software\"), to deal in\nthe Software without restriction, including without limitation the rights to\nuse, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of\nthe Software, and to permit persons to whom the Software is furnished to do so,\nsubject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS\nFOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR\nCOPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER\nIN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN\nCONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n",
      "type": "blob"
    },
    "README.md": {
      "path": "README.md",
      "mode": "100644",
      "content": "filetree\n========\n\nA simple filetree\n",
      "type": "blob"
    },
    "demo.coffee.md": {
      "path": "demo.coffee.md",
      "mode": "100644",
      "content": "A demo application displaying the filetree.\n\n    File = require \"./file\"\n    Filetree = require \"./filetree\"\n\n    template = require(\"./templates/filetree\")\n\n    demoData = [\n      {\n        path: \"hey.yolo\"\n        content: \"wat\"\n        type: \"blob\"\n      }\n    ]\n\n    filetree = Filetree()\n    filetree.load demoData\n\n    filetree.selectedFile.observe (file) ->\n      textarea.value = file.content()\n      textarea.onchange = ->\n        file.content textarea.value\n\n        return\n\n    document.body.appendChild template(filetree)\n\n    textarea = document.createElement \"textarea\"\n    \n    document.body.appendChild textarea\n",
      "type": "blob"
    },
    "file.coffee.md": {
      "path": "file.coffee.md",
      "mode": "100644",
      "content": "File Model\n==========\n\nThe `File` model represents a file in a file system. It is populated by data\nreturned from the Github API.\n\n    Composition = require \"composition\"\n    Observable = require \"observable\"\n    {defaults} = require \"util\"\n\n    {SHA1} = require \"sha1\"\n    utf8 = require \"./lib/utf8\"\n\nAttributes\n----------\n`modified` tracks whether the file has been changed since it was created.\n\n`path` is the path to the file.\n\n`content` contains the text content of the file.\n\n`mode` is the file mode for saving to github.\n\n`sha` is the git SHA1 of the file.\n\n    File = (I={}) ->\n      defaults I,\n        content: \"\"\n        modified: false\n        mode: \"100644\"\n        path: \"\"\n        initialSha: null\n\n      throw \"File must have a path\" unless I.path\n\n      I.initialSha ?= I.sha\n\n      self = Composition(I)\n\n      self.attrObservable Object.keys(I)...\n\n      self.extend\n\nThe extension is the last part of the filename after the `.`, for example\n`\"coffee\"` for a file named `\"main.coffee\"` or `\"haml\"` for a file named\n`\"filetree.haml\"`.\n\n        extension: ->\n          extension self.path()\n\nTODO: This mode should be moved out of here because it is ambiguous with the\ngithub file mode.\n\nThe `mode` of the file is what editor mode to use for our text editor.\n\n        mode: ->\n          switch extension = self.extension()\n            when \"js\"\n              \"javascript\"\n            when \"md\" # TODO: See about nested markdown code modes for .haml.md, .js.md, and .coffee.md\n              \"markdown\"\n            when \"cson\"\n              \"coffee\"\n            when \"\"\n              \"text\"\n            else\n              extension\n\nWhen our content changes we assume we are modified. In the future we may want to\ntrack the original content and compare with that to get a more accurate modified\nstatus.\n\n      self.content.observe ->\n        self.modified(true)\n\n      self.sha = Observable ->\n        I.sha = gitSHA(self.content())\n\nThe `displayName` is how the file appears in views.\n\nWhen our modified state changes we adjust the `displayName` to provide a visual\nindication.\n\n      self.displayName = Observable ->\n        changed = \"\"\n        if self.modified()\n          changed = \"*\"\n\n        \"#{changed}#{self.path()}\"\n\n      return self\n\nExport\n\n    module.exports = File\n\nHelpers\n-------\n\n    extension = (path) ->\n      if match = path.match(/\\.([^\\.]*)$/, '')\n        match[1]\n      else\n        ''\n\n    gitSHA = (string) ->\n      length = byteCount(string)\n      header = \"blob #{length}\\0\"\n\n      SHA1(\"#{header}#{string}\").toString()\n\n    byteCount = (string) ->\n      utf8.encode(string).length\n\nTODO\n----\n\n- Handle Binary data!\n",
      "type": "blob"
    },
    "filetree.coffee.md": {
      "path": "filetree.coffee.md",
      "mode": "100644",
      "content": "Filetree Model\n==============\n\n    File = require(\"./file\")\n\n    Composition = require \"composition\"\n    {defaults} = require \"util\"\n\n    _ = require \"./lib/underscore\"\n\nThe `Filetree` model represents a tree of files.\n\n    Filetree = (I={}) ->\n      defaults I,\n        files: []\n\n      self = Composition(I)\n\n      self.attrModels \"files\", File\n\nThe `selectedFile` observable keeps people up to date on what file has been\nselected.\n\n      self.attrObservable \"selectedFile\"\n\n      self.extend\n\nLoad files either from an array of file data objects or from an object with\npaths as keys and file data objects as values.\n\nThe files are sorted by name after loading.\n\nTODO: Always maintain the files in a sorted list using some kind of sorted\nobservable.\n\n        load: (fileData) ->\n          if Array.isArray(fileData)\n            files = fileData.sort (a, b) ->\n              if a.path < b.path\n                -1\n              else if b.path < a.path\n                1\n              else\n                0\n            .map File\n\n          else\n            files = Object.keys(fileData).sort().map (path) ->\n              File fileData[path]\n\n          self.files(files)\n\nThe `data` method returns an array of file data objects that is compatible with\nthe github tree api.\n\nThe objects have a `path`, `content`, `type`, and `mode`.\n\n        data: ->\n          self.files.map (file) ->\n            file.I\n\nThe subset of data appropriate to push to github.\n\nTODO: May want to move this out to the github lib.\n\n        githubTree: ->\n          self.data().map (datum) ->\n            if datum.initialSha is datum.sha\n              _.pick datum, \"path\", \"mode\", \"type\", \"sha\" \n            else\n              _.pick datum, \"path\", \"mode\", \"type\", \"content\"\n\nThe filetree `hasUnsavedChanges` if any file in the tree is modified.\n\n        hasUnsavedChanges: ->\n          self.files().select (file) ->\n            file.modified()\n          .length\n\nMarking the filetree as saved resets the modification status of each file.\n\nTODO: There can be race conditions since the save is async.\n\nTODO: Use git trees and content shas to robustly manage changed state.\n\n        markSaved: ->\n          self.files().forEach (file) ->\n            file.modified(false)\n\n      return self\n\nExport\n\n    module.exports = Filetree\n",
      "type": "blob"
    },
    "lib/utf8.js": {
      "path": "lib/utf8.js",
      "mode": "100644",
      "content": "/*! http://mths.be/utf8js v2.0.0 by @mathias */\n;(function(root) {\n\n  // Detect free variables `exports`\n\tvar freeExports = typeof exports == 'object' && exports;\n\n\t// Detect free variable `module`\n\tvar freeModule = typeof module == 'object' && module &&\n\t\tmodule.exports == freeExports && module;\n\n\t// Detect free variable `global`, from Node.js or Browserified code,\n\t// and use it as `root`\n\tvar freeGlobal = typeof global == 'object' && global;\n\tif (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {\n\t\troot = freeGlobal;\n\t}\n\n\t/*--------------------------------------------------------------------------*/\n\n\tvar stringFromCharCode = String.fromCharCode;\n\n\t// Taken from http://mths.be/punycode\n\tfunction ucs2decode(string) {\n\t\tvar output = [];\n\t\tvar counter = 0;\n\t\tvar length = string.length;\n\t\tvar value;\n\t\tvar extra;\n\t\twhile (counter < length) {\n\t\t\tvalue = string.charCodeAt(counter++);\n\t\t\tif (value >= 0xD800 && value <= 0xDBFF && counter < length) {\n\t\t\t\t// high surrogate, and there is a next character\n\t\t\t\textra = string.charCodeAt(counter++);\n\t\t\t\tif ((extra & 0xFC00) == 0xDC00) { // low surrogate\n\t\t\t\t\toutput.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);\n\t\t\t\t} else {\n\t\t\t\t\t// unmatched surrogate; only append this code unit, in case the next\n\t\t\t\t\t// code unit is the high surrogate of a surrogate pair\n\t\t\t\t\toutput.push(value);\n\t\t\t\t\tcounter--;\n\t\t\t\t}\n\t\t\t} else {\n\t\t\t\toutput.push(value);\n\t\t\t}\n\t\t}\n\t\treturn output;\n\t}\n\n\t// Taken from http://mths.be/punycode\n\tfunction ucs2encode(array) {\n\t\tvar length = array.length;\n\t\tvar index = -1;\n\t\tvar value;\n\t\tvar output = '';\n\t\twhile (++index < length) {\n\t\t\tvalue = array[index];\n\t\t\tif (value > 0xFFFF) {\n\t\t\t\tvalue -= 0x10000;\n\t\t\t\toutput += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);\n\t\t\t\tvalue = 0xDC00 | value & 0x3FF;\n\t\t\t}\n\t\t\toutput += stringFromCharCode(value);\n\t\t}\n\t\treturn output;\n\t}\n\n\t/*--------------------------------------------------------------------------*/\n\n\tfunction createByte(codePoint, shift) {\n\t\treturn stringFromCharCode(((codePoint >> shift) & 0x3F) | 0x80);\n\t}\n\n\tfunction encodeCodePoint(codePoint) {\n\t\tif ((codePoint & 0xFFFFFF80) == 0) { // 1-byte sequence\n\t\t\treturn stringFromCharCode(codePoint);\n\t\t}\n\t\tvar symbol = '';\n\t\tif ((codePoint & 0xFFFFF800) == 0) { // 2-byte sequence\n\t\t\tsymbol = stringFromCharCode(((codePoint >> 6) & 0x1F) | 0xC0);\n\t\t}\n\t\telse if ((codePoint & 0xFFFF0000) == 0) { // 3-byte sequence\n\t\t\tsymbol = stringFromCharCode(((codePoint >> 12) & 0x0F) | 0xE0);\n\t\t\tsymbol += createByte(codePoint, 6);\n\t\t}\n\t\telse if ((codePoint & 0xFFE00000) == 0) { // 4-byte sequence\n\t\t\tsymbol = stringFromCharCode(((codePoint >> 18) & 0x07) | 0xF0);\n\t\t\tsymbol += createByte(codePoint, 12);\n\t\t\tsymbol += createByte(codePoint, 6);\n\t\t}\n\t\tsymbol += stringFromCharCode((codePoint & 0x3F) | 0x80);\n\t\treturn symbol;\n\t}\n\n\tfunction utf8encode(string) {\n\t\tvar codePoints = ucs2decode(string);\n\t\tvar length = codePoints.length;\n\t\tvar index = -1;\n\t\tvar codePoint;\n\t\tvar byteString = '';\n\t\twhile (++index < length) {\n\t\t\tcodePoint = codePoints[index];\n\t\t\tbyteString += encodeCodePoint(codePoint);\n\t\t}\n\t\treturn byteString;\n\t}\n\n\t/*--------------------------------------------------------------------------*/\n\n\tfunction readContinuationByte() {\n\t\tif (byteIndex >= byteCount) {\n\t\t\tthrow Error('Invalid byte index');\n\t\t}\n\n\t\tvar continuationByte = byteArray[byteIndex] & 0xFF;\n\t\tbyteIndex++;\n\n\t\tif ((continuationByte & 0xC0) == 0x80) {\n\t\t\treturn continuationByte & 0x3F;\n\t\t}\n\n\t\t// If we end up here, it’s not a continuation byte\n\t\tthrow Error('Invalid continuation byte');\n\t}\n\n\tfunction decodeSymbol() {\n\t\tvar byte1;\n\t\tvar byte2;\n\t\tvar byte3;\n\t\tvar byte4;\n\t\tvar codePoint;\n\n\t\tif (byteIndex > byteCount) {\n\t\t\tthrow Error('Invalid byte index');\n\t\t}\n\n\t\tif (byteIndex == byteCount) {\n\t\t\treturn false;\n\t\t}\n\n\t\t// Read first byte\n\t\tbyte1 = byteArray[byteIndex] & 0xFF;\n\t\tbyteIndex++;\n\n\t\t// 1-byte sequence (no continuation bytes)\n\t\tif ((byte1 & 0x80) == 0) {\n\t\t\treturn byte1;\n\t\t}\n\n\t\t// 2-byte sequence\n\t\tif ((byte1 & 0xE0) == 0xC0) {\n\t\t\tvar byte2 = readContinuationByte();\n\t\t\tcodePoint = ((byte1 & 0x1F) << 6) | byte2;\n\t\t\tif (codePoint >= 0x80) {\n\t\t\t\treturn codePoint;\n\t\t\t} else {\n\t\t\t\tthrow Error('Invalid continuation byte');\n\t\t\t}\n\t\t}\n\n\t\t// 3-byte sequence (may include unpaired surrogates)\n\t\tif ((byte1 & 0xF0) == 0xE0) {\n\t\t\tbyte2 = readContinuationByte();\n\t\t\tbyte3 = readContinuationByte();\n\t\t\tcodePoint = ((byte1 & 0x0F) << 12) | (byte2 << 6) | byte3;\n\t\t\tif (codePoint >= 0x0800) {\n\t\t\t\treturn codePoint;\n\t\t\t} else {\n\t\t\t\tthrow Error('Invalid continuation byte');\n\t\t\t}\n\t\t}\n\n\t\t// 4-byte sequence\n\t\tif ((byte1 & 0xF8) == 0xF0) {\n\t\t\tbyte2 = readContinuationByte();\n\t\t\tbyte3 = readContinuationByte();\n\t\t\tbyte4 = readContinuationByte();\n\t\t\tcodePoint = ((byte1 & 0x0F) << 0x12) | (byte2 << 0x0C) |\n\t\t\t\t(byte3 << 0x06) | byte4;\n\t\t\tif (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {\n\t\t\t\treturn codePoint;\n\t\t\t}\n\t\t}\n\n\t\tthrow Error('Invalid UTF-8 detected');\n\t}\n\n\tvar byteArray;\n\tvar byteCount;\n\tvar byteIndex;\n\tfunction utf8decode(byteString) {\n\t\tbyteArray = ucs2decode(byteString);\n\t\tbyteCount = byteArray.length;\n\t\tbyteIndex = 0;\n\t\tvar codePoints = [];\n\t\tvar tmp;\n\t\twhile ((tmp = decodeSymbol()) !== false) {\n\t\t\tcodePoints.push(tmp);\n\t\t}\n\t\treturn ucs2encode(codePoints);\n\t}\n\n\t/*--------------------------------------------------------------------------*/\n\n\tvar utf8 = {\n\t\t'version': '2.0.0',\n\t\t'encode': utf8encode,\n\t\t'decode': utf8decode\n\t};\n\n\t// Some AMD build optimizers, like r.js, check for specific condition patterns\n\t// like the following:\n\tif (\n\t\ttypeof define == 'function' &&\n\t\ttypeof define.amd == 'object' &&\n\t\tdefine.amd\n\t) {\n\t\tdefine(function() {\n\t\t\treturn utf8;\n\t\t});\n\t}\telse if (freeExports && !freeExports.nodeType) {\n\t\tif (freeModule) { // in Node.js or RingoJS v0.8.0+\n\t\t\tfreeModule.exports = utf8;\n\t\t} else { // in Narwhal or RingoJS v0.7.0-\n\t\t\tvar object = {};\n\t\t\tvar hasOwnProperty = object.hasOwnProperty;\n\t\t\tfor (var key in utf8) {\n\t\t\t\thasOwnProperty.call(utf8, key) && (freeExports[key] = utf8[key]);\n\t\t\t}\n\t\t}\n\t} else { // in Rhino or a web browser\n\t\troot.utf8 = utf8;\n\t}\n\n}(this));\n",
      "type": "blob"
    },
    "main.coffee.md": {
      "path": "main.coffee.md",
      "mode": "100644",
      "content": "Filetree\n========\n\nAn interactive HTML filetree that presents file data in the style of Github API\nrequests.\n\n    module.exports =\n      File: require \"./file\"\n      Filetree: require \"./filetree\"\n      template: require \"./templates/filetree\"\n\n    # Check if package is root package and then run demo\n    if PACKAGE.name is \"ROOT\"\n      global.Observable = require \"observable\" # TODO: Hack for templating\n\n      require \"./demo\"\n",
      "type": "blob"
    },
    "pixie.cson": {
      "path": "pixie.cson",
      "mode": "100644",
      "content": "version: \"0.3.1-pre.5\"\ndependencies:\n  composition: \"distri/compositions:v0.1.1\"\n  observable: \"distri/observable:v0.1.1\"\n  sha1: \"distri/sha1:v0.1.0\"\n  util: \"distri/util:v0.1.0\"\n",
      "type": "blob"
    },
    "sample_data.cson": {
      "path": "sample_data.cson",
      "mode": "100644",
      "content": "[\n  {\n    \"mode\": \"100644\",\n    \"type\": \"blob\",\n    \"sha\": \"c4d980eab4cc2eb1784f4d018017e4a75f6982b5\",\n    \"path\": \"LICENSE\",\n    \"size\": 1081,\n    \"url\": \"https://api.github.com/repos/distri/compositions/git/blobs/c4d980eab4cc2eb1784f4d018017e4a75f6982b5\",\n    \"content\": \"VGhlIE1JVCBMaWNlbnNlIChNSVQpCgpDb3B5cmlnaHQgKGMpIDIwMTQgRGFu\\naWVsIFggTW9vcmUKClBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZy\\nZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkg\\nb2YKdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9u\\nIGZpbGVzICh0aGUgIlNvZnR3YXJlIiksIHRvIGRlYWwgaW4KdGhlIFNvZnR3\\nYXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxp\\nbWl0YXRpb24gdGhlIHJpZ2h0cyB0bwp1c2UsIGNvcHksIG1vZGlmeSwgbWVy\\nZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBz\\nZWxsIGNvcGllcyBvZgp0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVy\\nc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8g\\nc28sCnN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOgoKVGhl\\nIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBu\\nb3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsCmNvcGllcyBvciBzdWJz\\ndGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuCgpUSEUgU09GVFdB\\nUkUgSVMgUFJPVklERUQgIkFTIElTIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBB\\nTlkgS0lORCwgRVhQUkVTUyBPUgpJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5P\\nVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElU\\nWSwgRklUTkVTUwpGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklO\\nRlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IK\\nQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERB\\nTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSCklOIEFOIEFDVElP\\nTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJP\\nTSwgT1VUIE9GIE9SIElOCkNPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUg\\nT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUu\\nCg==\\n\",\n    \"encoding\": \"base64\"\n  },\n  {\n    \"mode\": \"100644\",\n    \"type\": \"blob\",\n    \"sha\": \"ecea0236b8986129905ef534f99fd9b6fa9ac9c7\",\n    \"path\": \"README.coffee.md\",\n    \"size\": 1751,\n    \"url\": \"https://api.github.com/repos/distri/compositions/git/blobs/ecea0236b8986129905ef534f99fd9b6fa9ac9c7\",\n    \"content\": \"Q29tcG9zaXRpb25zCj09PT09PT09PT09PQoKVGhlIGBjb21wb3NpdGlvbnNg\\nIG1vZHVsZSBwcm92aWRlcyBoZWxwZXIgbWV0aG9kcyB0byBjb21wb3NlIG5l\\nc3RlZCBkYXRhIG1vZGVscy4KCkNvbXBvc2l0aW9ucyB1c2VzIFtPYnNlcnZh\\nYmxlXSgvb2JzZXJ2YWJsZS9kb2NzKSB0byBrZWVwIHRoZSBpbnRlcm5hbCBk\\nYXRhIGluIHN5bmMuCgogICAgQ29yZSA9IHJlcXVpcmUgImNvcmUiCiAgICBP\\nYnNlcnZhYmxlID0gcmVxdWlyZSAib2JzZXJ2YWJsZSIKCiAgICBtb2R1bGUu\\nZXhwb3J0cyA9IChJPXt9LCBzZWxmPUNvcmUoSSkpIC0+CgogICAgICBzZWxm\\nLmV4dGVuZAoKT2JzZXJ2ZSBhbnkgbnVtYmVyIG9mIGF0dHJpYnV0ZXMgYXMg\\nc2ltcGxlIG9ic2VydmFibGVzLiBGb3IgZWFjaCBhdHRyaWJ1dGUgbmFtZSBw\\nYXNzZWQgaW4gd2UgZXhwb3NlIGEgcHVibGljIGdldHRlci9zZXR0ZXIgbWV0\\naG9kIGFuZCBsaXN0ZW4gdG8gY2hhbmdlcyB3aGVuIHRoZSB2YWx1ZSBpcyBz\\nZXQuCgogICAgICAgIGF0dHJPYnNlcnZhYmxlOiAobmFtZXMuLi4pIC0+CiAg\\nICAgICAgICBuYW1lcy5mb3JFYWNoIChuYW1lKSAtPgogICAgICAgICAgICBz\\nZWxmW25hbWVdID0gT2JzZXJ2YWJsZShJW25hbWVdKQoKICAgICAgICAgICAg\\nc2VsZltuYW1lXS5vYnNlcnZlIChuZXdWYWx1ZSkgLT4KICAgICAgICAgICAg\\nICBJW25hbWVdID0gbmV3VmFsdWUKCiAgICAgICAgICByZXR1cm4gc2VsZgoK\\nT2JzZXJ2ZSBhbiBhdHRyaWJ1dGUgYXMgYSBtb2RlbC4gVHJlYXRzIHRoZSBh\\ndHRyaWJ1dGUgZ2l2ZW4gYXMgYW4gT2JzZXJ2YWJsZQptb2RlbCBpbnN0YW5j\\nZSBleHBvc3RpbmcgYSBnZXR0ZXIvc2V0dGVyIG1ldGhvZCBvZiB0aGUgc2Ft\\nZSBuYW1lLiBUaGUgTW9kZWwKY29uc3RydWN0b3IgbXVzdCBiZSBwYXNzZWQg\\naW4gZXhwbGljaXRseS4KCiAgICAgICAgYXR0ck1vZGVsOiAobmFtZSwgTW9k\\nZWwpIC0+CiAgICAgICAgICBtb2RlbCA9IE1vZGVsKElbbmFtZV0pCgogICAg\\nICAgICAgc2VsZltuYW1lXSA9IE9ic2VydmFibGUobW9kZWwpCgogICAgICAg\\nICAgc2VsZltuYW1lXS5vYnNlcnZlIChuZXdWYWx1ZSkgLT4KICAgICAgICAg\\nICAgSVtuYW1lXSA9IG5ld1ZhbHVlLkkKCiAgICAgICAgICByZXR1cm4gc2Vs\\nZgoKT2JzZXJ2ZSBhbiBhdHRyaWJ1dGUgYXMgYSBsaXN0IG9mIHN1Yi1tb2Rl\\nbHMuIFRoaXMgaXMgdGhlIHNhbWUgYXMgYGF0dHJNb2RlbGAKZXhjZXB0IHRo\\nZSBhdHRyaWJ1dGUgaXMgZXhwZWN0ZWQgdG8gYmUgYW4gYXJyYXkgb2YgbW9k\\nZWxzIHJhdGhlciB0aGFuIGEgc2luZ2xlIG9uZS4KCiAgICAgICAgYXR0ck1v\\nZGVsczogKG5hbWUsIE1vZGVsKSAtPgogICAgICAgICAgbW9kZWxzID0gKElb\\nbmFtZV0gb3IgW10pLm1hcCAoeCkgLT4KICAgICAgICAgICAgTW9kZWwoeCkK\\nCiAgICAgICAgICBzZWxmW25hbWVdID0gT2JzZXJ2YWJsZShtb2RlbHMpCgog\\nICAgICAgICAgc2VsZltuYW1lXS5vYnNlcnZlIChuZXdWYWx1ZSkgLT4KICAg\\nICAgICAgICAgSVtuYW1lXSA9IG5ld1ZhbHVlLm1hcCAoaW5zdGFuY2UpIC0+\\nCiAgICAgICAgICAgICAgaW5zdGFuY2UuSQoKICAgICAgICAgIHJldHVybiBz\\nZWxmCgpUaGUgSlNPTiByZXByZXNlbnRhdGlvbiBpcyBrZXB0IHVwIHRvIGRh\\ndGUgdmlhIHRoZSBvYnNlcnZhYmxlIHByb3Blcml0ZXMgYW5kIHJlc2lkZXMg\\naW4gYElgLgoKICAgICAgICB0b0pTT046IC0+CiAgICAgICAgICBJCgpSZXR1\\ncm4gb3VyIHB1YmxpYyBvYmplY3QuCgogICAgICByZXR1cm4gc2VsZgo=\\n\",\n    \"encoding\": \"base64\"\n  },\n  {\n    \"mode\": \"100644\",\n    \"type\": \"blob\",\n    \"sha\": \"99da0ba39b6e328efc219c973c770edf3e6bcd01\",\n    \"path\": \"pixie.cson\",\n    \"size\": 122,\n    \"url\": \"https://api.github.com/repos/distri/compositions/git/blobs/99da0ba39b6e328efc219c973c770edf3e6bcd01\",\n    \"content\": \"ZW50cnlQb2ludDogIlJFQURNRSIKdmVyc2lvbjogIjAuMS4xIgpkZXBlbmRl\\nbmNpZXM6CiAgY29yZTogImRpc3RyaS9jb3JlOnYwLjYuMCIKICBvYnNlcnZh\\nYmxlOiAiZGlzdHJpL29ic2VydmFibGU6djAuMS4xIgo=\\n\",\n    \"encoding\": \"base64\"\n  },\n  {\n    \"mode\": \"100644\",\n    \"type\": \"blob\",\n    \"sha\": \"35b884bbceef9534e62e9ce8f8a15416957399bb\",\n    \"path\": \"test/compositions.coffee\",\n    \"size\": 3797,\n    \"url\": \"https://api.github.com/repos/distri/compositions/git/blobs/35b884bbceef9534e62e9ce8f8a15416957399bb\",\n    \"content\": \"Ck1vZGVsID0gcmVxdWlyZSAiLi4vUkVBRE1FIgoKZGVzY3JpYmUgJ01vZGVs\\nJywgLT4KICAjIEFzc29jaWF0aW9uIFRlc3RpbmcgbW9kZWwKICBQZXJzb24g\\nPSAoSSkgLT4KICAgIHBlcnNvbiA9IE1vZGVsKEkpCgogICAgcGVyc29uLmF0\\ndHJBY2Nlc3NvcigKICAgICAgJ2ZpcnN0TmFtZScKICAgICAgJ2xhc3ROYW1l\\nJwogICAgICAnc3VmZml4JwogICAgKQoKICAgIHBlcnNvbi5mdWxsTmFtZSA9\\nIC0+CiAgICAgICIje0BmaXJzdE5hbWUoKX0gI3tAbGFzdE5hbWUoKX0gI3tA\\nc3VmZml4KCl9IgoKICAgIHJldHVybiBwZXJzb24KCiAgZGVzY3JpYmUgIiNh\\ndHRyT2JzZXJ2YWJsZSIsIC0+CiAgICBpdCAnc2hvdWxkIGFsbG93IGZvciBv\\nYnNlcnZpbmcgb2YgYXR0cmlidXRlcycsIC0+CiAgICAgIG1vZGVsID0gTW9k\\nZWwKICAgICAgICBuYW1lOiAiRHVkZXIiCgogICAgICBtb2RlbC5hdHRyT2Jz\\nZXJ2YWJsZSAibmFtZSIKCiAgICAgIG1vZGVsLm5hbWUoIkR1ZGVtYW4iKQoK\\nICAgICAgYXNzZXJ0LmVxdWFsIG1vZGVsLm5hbWUoKSwgIkR1ZGVtYW4iCgog\\nICAgaXQgJ3Nob3VsZCBiaW5kIHByb3BlcnRpZXMgdG8gb2JzZXJ2YWJsZSBh\\ndHRyaWJ1dGVzJywgLT4KICAgICAgbW9kZWwgPSBNb2RlbAogICAgICAgIG5h\\nbWU6ICJEdWRlciIKCiAgICAgIG1vZGVsLmF0dHJPYnNlcnZhYmxlICJuYW1l\\nIgoKICAgICAgbW9kZWwubmFtZSgiRHVkZW1hbiIpCgogICAgICBhc3NlcnQu\\nZXF1YWwgbW9kZWwubmFtZSgpLCAiRHVkZW1hbiIKICAgICAgYXNzZXJ0LmVx\\ndWFsIG1vZGVsLm5hbWUoKSwgbW9kZWwuSS5uYW1lCgogIGRlc2NyaWJlICIj\\nYXR0ck1vZGVsIiwgLT4KICAgIGl0ICJzaG91bGQgYmUgYSBtb2RlbCBpbnN0\\nYW5jZSIsIC0+CiAgICAgIG1vZGVsID0gTW9kZWwKICAgICAgICBwZXJzb246\\nCiAgICAgICAgICBmaXJzdE5hbWU6ICJEdWRlciIKICAgICAgICAgIGxhc3RO\\nYW1lOiAiTWFubmluZ3RvbiIKICAgICAgICAgIHN1ZmZpeDogIkpyLiIKCiAg\\nICAgIG1vZGVsLmF0dHJNb2RlbCgicGVyc29uIiwgUGVyc29uKQoKICAgICAg\\nYXNzZXJ0LmVxdWFsIG1vZGVsLnBlcnNvbigpLmZ1bGxOYW1lKCksICJEdWRl\\nciBNYW5uaW5ndG9uIEpyLiIKCiAgICBpdCAic2hvdWxkIGFsbG93IHNldHRp\\nbmcgdGhlIGFzc29jaWF0ZWQgbW9kZWwiLCAtPgogICAgICBtb2RlbCA9IE1v\\nZGVsCiAgICAgICAgcGVyc29uOgogICAgICAgICAgZmlyc3ROYW1lOiAiRHVk\\nZXIiCiAgICAgICAgICBsYXN0TmFtZTogIk1hbm5pbmd0b24iCiAgICAgICAg\\nICBzdWZmaXg6ICJKci4iCgogICAgICBtb2RlbC5hdHRyTW9kZWwoInBlcnNv\\nbiIsIFBlcnNvbikKCiAgICAgIG90aGVyUGVyc29uID0gUGVyc29uCiAgICAg\\nICAgZmlyc3ROYW1lOiAiTXIuIgogICAgICAgIGxhc3ROYW1lOiAiTWFuIgoK\\nICAgICAgbW9kZWwucGVyc29uKG90aGVyUGVyc29uKQoKICAgICAgYXNzZXJ0\\nLmVxdWFsIG1vZGVsLnBlcnNvbigpLmZpcnN0TmFtZSgpLCAiTXIuIgoKICAg\\nIGl0ICJzaG91bGRuJ3QgdXBkYXRlIHRoZSBpbnN0YW5jZSBwcm9wZXJ0aWVz\\nIGFmdGVyIGl0J3MgYmVlbiByZXBsYWNlZCIsIC0+CiAgICAgIG1vZGVsID0g\\nTW9kZWwKICAgICAgICBwZXJzb246CiAgICAgICAgICBmaXJzdE5hbWU6ICJE\\ndWRlciIKICAgICAgICAgIGxhc3ROYW1lOiAiTWFubmluZ3RvbiIKICAgICAg\\nICAgIHN1ZmZpeDogIkpyLiIKCiAgICAgIG1vZGVsLmF0dHJNb2RlbCgicGVy\\nc29uIiwgUGVyc29uKQoKICAgICAgZHVkZXIgPSBtb2RlbC5wZXJzb24oKQoK\\nICAgICAgb3RoZXJQZXJzb24gPSBQZXJzb24KICAgICAgICBmaXJzdE5hbWU6\\nICJNci4iCiAgICAgICAgbGFzdE5hbWU6ICJNYW4iCgogICAgICBtb2RlbC5w\\nZXJzb24ob3RoZXJQZXJzb24pCgogICAgICBkdWRlci5maXJzdE5hbWUoIkpv\\nZSIpCgogICAgICBhc3NlcnQuZXF1YWwgZHVkZXIuSS5maXJzdE5hbWUsICJK\\nb2UiCiAgICAgIGFzc2VydC5lcXVhbCBtb2RlbC5JLnBlcnNvbi5maXJzdE5h\\nbWUsICJNci4iCgogIGRlc2NyaWJlICIjYXR0ck1vZGVscyIsIC0+CiAgICBp\\ndCAic2hvdWxkIGhhdmUgYW4gYXJyYXkgb2YgbW9kZWwgaW5zdGFuY2VzIiwg\\nLT4KICAgICAgbW9kZWwgPSBNb2RlbAogICAgICAgIHBlb3BsZTogW3sKICAg\\nICAgICAgIGZpcnN0TmFtZTogIkR1ZGVyIgogICAgICAgICAgbGFzdE5hbWU6\\nICJNYW5uaW5ndG9uIgogICAgICAgICAgc3VmZml4OiAiSnIuIgogICAgICAg\\nIH0sIHsKICAgICAgICAgIGZpcnN0TmFtZTogIk1yLiIKICAgICAgICAgIGxh\\nc3ROYW1lOiAiTWFubmluZ3RvbiIKICAgICAgICAgIHN1ZmZpeDogIlNyLiIK\\nICAgICAgICB9XQoKICAgICAgbW9kZWwuYXR0ck1vZGVscygicGVvcGxlIiwg\\nUGVyc29uKQoKICAgICAgYXNzZXJ0LmVxdWFsIG1vZGVsLnBlb3BsZSgpWzBd\\nLmZ1bGxOYW1lKCksICJEdWRlciBNYW5uaW5ndG9uIEpyLiIKCiAgICBpdCAi\\nc2hvdWxkIHRyYWNrIHB1c2hlcyIsIC0+CiAgICAgIG1vZGVsID0gTW9kZWwK\\nICAgICAgICBwZW9wbGU6IFt7CiAgICAgICAgICBmaXJzdE5hbWU6ICJEdWRl\\nciIKICAgICAgICAgIGxhc3ROYW1lOiAiTWFubmluZ3RvbiIKICAgICAgICAg\\nIHN1ZmZpeDogIkpyLiIKICAgICAgICB9LCB7CiAgICAgICAgICBmaXJzdE5h\\nbWU6ICJNci4iCiAgICAgICAgICBsYXN0TmFtZTogIk1hbm5pbmd0b24iCiAg\\nICAgICAgICBzdWZmaXg6ICJTci4iCiAgICAgICAgfV0KCiAgICAgIG1vZGVs\\nLmF0dHJNb2RlbHMoInBlb3BsZSIsIFBlcnNvbikKCiAgICAgIG1vZGVsLnBl\\nb3BsZS5wdXNoIFBlcnNvbgogICAgICAgIGZpcnN0TmFtZTogIkpvSm8iCiAg\\nICAgICAgbGFzdE5hbWU6ICJMb2NvIgoKICAgICAgYXNzZXJ0LmVxdWFsIG1v\\nZGVsLnBlb3BsZSgpLmxlbmd0aCwgMwogICAgICBhc3NlcnQuZXF1YWwgbW9k\\nZWwuSS5wZW9wbGUubGVuZ3RoLCAzCgogICAgaXQgInNob3VsZCB0cmFjayBw\\nb3BzIiwgLT4KICAgICAgbW9kZWwgPSBNb2RlbAogICAgICAgIHBlb3BsZTog\\nW3sKICAgICAgICAgIGZpcnN0TmFtZTogIkR1ZGVyIgogICAgICAgICAgbGFz\\ndE5hbWU6ICJNYW5uaW5ndG9uIgogICAgICAgICAgc3VmZml4OiAiSnIuIgog\\nICAgICAgIH0sIHsKICAgICAgICAgIGZpcnN0TmFtZTogIk1yLiIKICAgICAg\\nICAgIGxhc3ROYW1lOiAiTWFubmluZ3RvbiIKICAgICAgICAgIHN1ZmZpeDog\\nIlNyLiIKICAgICAgICB9XQoKICAgICAgbW9kZWwuYXR0ck1vZGVscygicGVv\\ncGxlIiwgUGVyc29uKQoKICAgICAgbW9kZWwucGVvcGxlLnBvcCgpCgogICAg\\nICBhc3NlcnQuZXF1YWwgbW9kZWwucGVvcGxlKCkubGVuZ3RoLCAxCiAgICAg\\nIGFzc2VydC5lcXVhbCBtb2RlbC5JLnBlb3BsZS5sZW5ndGgsIDEKCiAgZGVz\\nY3JpYmUgIiN0b0pTT04iLCAtPgogICAgaXQgInNob3VsZCByZXR1cm4gYW4g\\nb2JqZWN0IGFwcHJvcHJpYXRlIGZvciBKU09OIHNlcmlhbGl6YXRpb24iLCAt\\nPgogICAgICBtb2RlbCA9IE1vZGVsCiAgICAgICAgdGVzdDogdHJ1ZQoKICAg\\nICAgYXNzZXJ0IG1vZGVsLnRvSlNPTigpLnRlc3QKCiAgZGVzY3JpYmUgIiNv\\nYnNlcnZlQWxsIiwgLT4KICAgIGl0ICJzaG91bGQgb2JzZXJ2ZSBhbGwgYXR0\\ncmlidXRlcyBvZiBhIHNpbXBsZSBtb2RlbCIKICAgIC0+ICAjIFRPRE8KICAg\\nICAgbW9kZWwgPSBNb2RlbAogICAgICAgIHRlc3Q6IHRydWUKICAgICAgICB5\\nb2xvOiAiNGxpZmUiCgogICAgICBtb2RlbC5vYnNlcnZlQWxsKCkKCiAgICAg\\nIGFzc2VydCBtb2RlbC50ZXN0KCkKICAgICAgYXNzZXJ0LmVxdWFsIG1vZGVs\\nLnlvbG8oKSwgIjRsaWZlIgoKICAgIGl0ICJzaG91bGQgY2FtZWwgY2FzZSB1\\nbmRlcnNjb3JlZCBuYW1lcyI=\\n\",\n    \"encoding\": \"base64\"\n  }\n]\n",
      "type": "blob"
    },
    "templates/filetree.haml.md": {
      "path": "templates/filetree.haml.md",
      "mode": "100644",
      "content": "Render a list of files as a filetree.\n\n    %ul.filetree\n      - selectedFile = @selectedFile\n      - files = @files\n      - each files, (file) ->\n        %li= file.displayName\n          - on \"click\", (e) ->\n            - selectedFile(file) if e.target.nodeName is 'LI'\n          .delete\n            - on \"click\", -> files.remove(file) if confirm(\"Delete #{file.path()}?\")\n            X\n",
      "type": "blob"
    },
    "test/data_consistency.coffee": {
      "path": "test/data_consistency.coffee",
      "mode": "100644",
      "content": "sampleData = require \"../sample_data\"\n{SHA1} = require \"sha1\"\n\ndescribe \"data consistency\", ->\n  it \"should decode and verify sha\", ->\n    sampleData.forEach ({path, content, sha, size}) ->\n      header = \"blob #{size}\\0\"\n      decodedContent = atob(content)\n      console.log decodedContent\n      actual = SHA1(\"#{header}#{decodedContent}\").toString()\n      expected = sha\n\n      assert.equal actual, expected, \"Path: #{path}, Actual #{actual}, expected #{expected}\"\n",
      "type": "blob"
    },
    "test/file.coffee": {
      "path": "test/file.coffee",
      "mode": "100644",
      "content": "File = require \"../file\"\nFiletree = require \"../filetree\"\n\ndescribe \"file\", ->\n  describe \"git SHA1s\", ->\n    it \"should keep it's sha up to date\", ->\n      file = File\n        path: \"test\"\n\n      assert.equal file.sha(), \"e69de29bb2d1d6434b8b29ae775ad8c2e48c5391\"\n\n      file.content \"yolo\"\n\n      file.sha.observe (sha) ->\n        assert.equal sha, \"eeabc605bfdfc792a48ea3d65e47a6f9263e2801\"\n\n      assert.equal file.sha(), \"eeabc605bfdfc792a48ea3d65e47a6f9263e2801\"\n\n    it \"should work with utf-8\", ->\n      file = File\n        path: \"test\"\n\n      file.content \"i ♥ u\\n\"\n\n      assert.equal file.sha(), \"e6816bf5d113d19e69e0052e359d11144efcd7f1\"\n\n    it \"should not know it's initial sha if no sha is passed in\", ->\n      file = File\n        path: \"test\"\n\n      assert.equal file.initialSha(), undefined\n\n    it \"should keep it's initial sha if a sha is passed in\", ->\n      file = File\n        path: \"test\"\n        sha: \"e6816bf5d113d19e69e0052e359d11144efcd7f1\"\n\n      file.content \"something else\"\n\n      assert.equal file.initialSha(), \"e6816bf5d113d19e69e0052e359d11144efcd7f1\"\n\n  it \"should know its extension\", ->\n    file = File\n      path: \"hello.coffee.md\"\n\n    assert.equal file.extension(), \"md\", \"Extension is #{file.extension()}\"\n\n  it \"should not have both sha and content in github tree\", ->\n    filetree = Filetree()\n\n    filetree.load [\n      path: \"yolo\"\n      content: \"wat\"\n    ]\n\n    f = filetree.githubTree()[0]\n\n    assert (!f.sha and f.content) or (f.sha and !f.content)\n",
      "type": "blob"
    },
    "test/filetree.coffee": {
      "path": "test/filetree.coffee",
      "mode": "100644",
      "content": "{File, Filetree, template} = require \"../main\"\n\ndescribe \"Filetree\", ->\n  it \"should expose a template\", ->\n    assert template\n\n  it \"should expose a Filetree constructor\", ->\n    assert Filetree\n\n  it \"should expose a File constructor\", ->\n    assert File\n      path: \"duder.txt\"\n\n  it \"should return an array of data\", ->\n    tree = Filetree()\n\n    tree.load\n\n    data = tree.data()\n",
      "type": "blob"
    },
    "lib/underscore.js": {
      "path": "lib/underscore.js",
      "mode": "100644",
      "content": "//     Underscore.js 1.6.0\n//     http://underscorejs.org\n//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors\n//     Underscore may be freely distributed under the MIT license.\n(function(){var n=this,t=n._,r={},e=Array.prototype,u=Object.prototype,i=Function.prototype,a=e.push,o=e.slice,c=e.concat,l=u.toString,f=u.hasOwnProperty,s=e.forEach,p=e.map,h=e.reduce,v=e.reduceRight,g=e.filter,d=e.every,m=e.some,y=e.indexOf,b=e.lastIndexOf,x=Array.isArray,w=Object.keys,_=i.bind,j=function(n){return n instanceof j?n:this instanceof j?void(this._wrapped=n):new j(n)};\"undefined\"!=typeof exports?(\"undefined\"!=typeof module&&module.exports&&(exports=module.exports=j),exports._=j):n._=j,j.VERSION=\"1.6.0\";var A=j.each=j.forEach=function(n,t,e){if(null==n)return n;if(s&&n.forEach===s)n.forEach(t,e);else if(n.length===+n.length){for(var u=0,i=n.length;i>u;u++)if(t.call(e,n[u],u,n)===r)return}else for(var a=j.keys(n),u=0,i=a.length;i>u;u++)if(t.call(e,n[a[u]],a[u],n)===r)return;return n};j.map=j.collect=function(n,t,r){var e=[];return null==n?e:p&&n.map===p?n.map(t,r):(A(n,function(n,u,i){e.push(t.call(r,n,u,i))}),e)};var O=\"Reduce of empty array with no initial value\";j.reduce=j.foldl=j.inject=function(n,t,r,e){var u=arguments.length>2;if(null==n&&(n=[]),h&&n.reduce===h)return e&&(t=j.bind(t,e)),u?n.reduce(t,r):n.reduce(t);if(A(n,function(n,i,a){u?r=t.call(e,r,n,i,a):(r=n,u=!0)}),!u)throw new TypeError(O);return r},j.reduceRight=j.foldr=function(n,t,r,e){var u=arguments.length>2;if(null==n&&(n=[]),v&&n.reduceRight===v)return e&&(t=j.bind(t,e)),u?n.reduceRight(t,r):n.reduceRight(t);var i=n.length;if(i!==+i){var a=j.keys(n);i=a.length}if(A(n,function(o,c,l){c=a?a[--i]:--i,u?r=t.call(e,r,n[c],c,l):(r=n[c],u=!0)}),!u)throw new TypeError(O);return r},j.find=j.detect=function(n,t,r){var e;return k(n,function(n,u,i){return t.call(r,n,u,i)?(e=n,!0):void 0}),e},j.filter=j.select=function(n,t,r){var e=[];return null==n?e:g&&n.filter===g?n.filter(t,r):(A(n,function(n,u,i){t.call(r,n,u,i)&&e.push(n)}),e)},j.reject=function(n,t,r){return j.filter(n,function(n,e,u){return!t.call(r,n,e,u)},r)},j.every=j.all=function(n,t,e){t||(t=j.identity);var u=!0;return null==n?u:d&&n.every===d?n.every(t,e):(A(n,function(n,i,a){return(u=u&&t.call(e,n,i,a))?void 0:r}),!!u)};var k=j.some=j.any=function(n,t,e){t||(t=j.identity);var u=!1;return null==n?u:m&&n.some===m?n.some(t,e):(A(n,function(n,i,a){return u||(u=t.call(e,n,i,a))?r:void 0}),!!u)};j.contains=j.include=function(n,t){return null==n?!1:y&&n.indexOf===y?n.indexOf(t)!=-1:k(n,function(n){return n===t})},j.invoke=function(n,t){var r=o.call(arguments,2),e=j.isFunction(t);return j.map(n,function(n){return(e?t:n[t]).apply(n,r)})},j.pluck=function(n,t){return j.map(n,j.property(t))},j.where=function(n,t){return j.filter(n,j.matches(t))},j.findWhere=function(n,t){return j.find(n,j.matches(t))},j.max=function(n,t,r){if(!t&&j.isArray(n)&&n[0]===+n[0]&&n.length<65535)return Math.max.apply(Math,n);var e=-1/0,u=-1/0;return A(n,function(n,i,a){var o=t?t.call(r,n,i,a):n;o>u&&(e=n,u=o)}),e},j.min=function(n,t,r){if(!t&&j.isArray(n)&&n[0]===+n[0]&&n.length<65535)return Math.min.apply(Math,n);var e=1/0,u=1/0;return A(n,function(n,i,a){var o=t?t.call(r,n,i,a):n;u>o&&(e=n,u=o)}),e},j.shuffle=function(n){var t,r=0,e=[];return A(n,function(n){t=j.random(r++),e[r-1]=e[t],e[t]=n}),e},j.sample=function(n,t,r){return null==t||r?(n.length!==+n.length&&(n=j.values(n)),n[j.random(n.length-1)]):j.shuffle(n).slice(0,Math.max(0,t))};var E=function(n){return null==n?j.identity:j.isFunction(n)?n:j.property(n)};j.sortBy=function(n,t,r){return t=E(t),j.pluck(j.map(n,function(n,e,u){return{value:n,index:e,criteria:t.call(r,n,e,u)}}).sort(function(n,t){var r=n.criteria,e=t.criteria;if(r!==e){if(r>e||r===void 0)return 1;if(e>r||e===void 0)return-1}return n.index-t.index}),\"value\")};var F=function(n){return function(t,r,e){var u={};return r=E(r),A(t,function(i,a){var o=r.call(e,i,a,t);n(u,o,i)}),u}};j.groupBy=F(function(n,t,r){j.has(n,t)?n[t].push(r):n[t]=[r]}),j.indexBy=F(function(n,t,r){n[t]=r}),j.countBy=F(function(n,t){j.has(n,t)?n[t]++:n[t]=1}),j.sortedIndex=function(n,t,r,e){r=E(r);for(var u=r.call(e,t),i=0,a=n.length;a>i;){var o=i+a>>>1;r.call(e,n[o])<u?i=o+1:a=o}return i},j.toArray=function(n){return n?j.isArray(n)?o.call(n):n.length===+n.length?j.map(n,j.identity):j.values(n):[]},j.size=function(n){return null==n?0:n.length===+n.length?n.length:j.keys(n).length},j.first=j.head=j.take=function(n,t,r){return null==n?void 0:null==t||r?n[0]:0>t?[]:o.call(n,0,t)},j.initial=function(n,t,r){return o.call(n,0,n.length-(null==t||r?1:t))},j.last=function(n,t,r){return null==n?void 0:null==t||r?n[n.length-1]:o.call(n,Math.max(n.length-t,0))},j.rest=j.tail=j.drop=function(n,t,r){return o.call(n,null==t||r?1:t)},j.compact=function(n){return j.filter(n,j.identity)};var M=function(n,t,r){return t&&j.every(n,j.isArray)?c.apply(r,n):(A(n,function(n){j.isArray(n)||j.isArguments(n)?t?a.apply(r,n):M(n,t,r):r.push(n)}),r)};j.flatten=function(n,t){return M(n,t,[])},j.without=function(n){return j.difference(n,o.call(arguments,1))},j.partition=function(n,t){var r=[],e=[];return A(n,function(n){(t(n)?r:e).push(n)}),[r,e]},j.uniq=j.unique=function(n,t,r,e){j.isFunction(t)&&(e=r,r=t,t=!1);var u=r?j.map(n,r,e):n,i=[],a=[];return A(u,function(r,e){(t?e&&a[a.length-1]===r:j.contains(a,r))||(a.push(r),i.push(n[e]))}),i},j.union=function(){return j.uniq(j.flatten(arguments,!0))},j.intersection=function(n){var t=o.call(arguments,1);return j.filter(j.uniq(n),function(n){return j.every(t,function(t){return j.contains(t,n)})})},j.difference=function(n){var t=c.apply(e,o.call(arguments,1));return j.filter(n,function(n){return!j.contains(t,n)})},j.zip=function(){for(var n=j.max(j.pluck(arguments,\"length\").concat(0)),t=new Array(n),r=0;n>r;r++)t[r]=j.pluck(arguments,\"\"+r);return t},j.object=function(n,t){if(null==n)return{};for(var r={},e=0,u=n.length;u>e;e++)t?r[n[e]]=t[e]:r[n[e][0]]=n[e][1];return r},j.indexOf=function(n,t,r){if(null==n)return-1;var e=0,u=n.length;if(r){if(\"number\"!=typeof r)return e=j.sortedIndex(n,t),n[e]===t?e:-1;e=0>r?Math.max(0,u+r):r}if(y&&n.indexOf===y)return n.indexOf(t,r);for(;u>e;e++)if(n[e]===t)return e;return-1},j.lastIndexOf=function(n,t,r){if(null==n)return-1;var e=null!=r;if(b&&n.lastIndexOf===b)return e?n.lastIndexOf(t,r):n.lastIndexOf(t);for(var u=e?r:n.length;u--;)if(n[u]===t)return u;return-1},j.range=function(n,t,r){arguments.length<=1&&(t=n||0,n=0),r=arguments[2]||1;for(var e=Math.max(Math.ceil((t-n)/r),0),u=0,i=new Array(e);e>u;)i[u++]=n,n+=r;return i};var R=function(){};j.bind=function(n,t){var r,e;if(_&&n.bind===_)return _.apply(n,o.call(arguments,1));if(!j.isFunction(n))throw new TypeError;return r=o.call(arguments,2),e=function(){if(!(this instanceof e))return n.apply(t,r.concat(o.call(arguments)));R.prototype=n.prototype;var u=new R;R.prototype=null;var i=n.apply(u,r.concat(o.call(arguments)));return Object(i)===i?i:u}},j.partial=function(n){var t=o.call(arguments,1);return function(){for(var r=0,e=t.slice(),u=0,i=e.length;i>u;u++)e[u]===j&&(e[u]=arguments[r++]);for(;r<arguments.length;)e.push(arguments[r++]);return n.apply(this,e)}},j.bindAll=function(n){var t=o.call(arguments,1);if(0===t.length)throw new Error(\"bindAll must be passed function names\");return A(t,function(t){n[t]=j.bind(n[t],n)}),n},j.memoize=function(n,t){var r={};return t||(t=j.identity),function(){var e=t.apply(this,arguments);return j.has(r,e)?r[e]:r[e]=n.apply(this,arguments)}},j.delay=function(n,t){var r=o.call(arguments,2);return setTimeout(function(){return n.apply(null,r)},t)},j.defer=function(n){return j.delay.apply(j,[n,1].concat(o.call(arguments,1)))},j.throttle=function(n,t,r){var e,u,i,a=null,o=0;r||(r={});var c=function(){o=r.leading===!1?0:j.now(),a=null,i=n.apply(e,u),e=u=null};return function(){var l=j.now();o||r.leading!==!1||(o=l);var f=t-(l-o);return e=this,u=arguments,0>=f?(clearTimeout(a),a=null,o=l,i=n.apply(e,u),e=u=null):a||r.trailing===!1||(a=setTimeout(c,f)),i}},j.debounce=function(n,t,r){var e,u,i,a,o,c=function(){var l=j.now()-a;t>l?e=setTimeout(c,t-l):(e=null,r||(o=n.apply(i,u),i=u=null))};return function(){i=this,u=arguments,a=j.now();var l=r&&!e;return e||(e=setTimeout(c,t)),l&&(o=n.apply(i,u),i=u=null),o}},j.once=function(n){var t,r=!1;return function(){return r?t:(r=!0,t=n.apply(this,arguments),n=null,t)}},j.wrap=function(n,t){return j.partial(t,n)},j.compose=function(){var n=arguments;return function(){for(var t=arguments,r=n.length-1;r>=0;r--)t=[n[r].apply(this,t)];return t[0]}},j.after=function(n,t){return function(){return--n<1?t.apply(this,arguments):void 0}},j.keys=function(n){if(!j.isObject(n))return[];if(w)return w(n);var t=[];for(var r in n)j.has(n,r)&&t.push(r);return t},j.values=function(n){for(var t=j.keys(n),r=t.length,e=new Array(r),u=0;r>u;u++)e[u]=n[t[u]];return e},j.pairs=function(n){for(var t=j.keys(n),r=t.length,e=new Array(r),u=0;r>u;u++)e[u]=[t[u],n[t[u]]];return e},j.invert=function(n){for(var t={},r=j.keys(n),e=0,u=r.length;u>e;e++)t[n[r[e]]]=r[e];return t},j.functions=j.methods=function(n){var t=[];for(var r in n)j.isFunction(n[r])&&t.push(r);return t.sort()},j.extend=function(n){return A(o.call(arguments,1),function(t){if(t)for(var r in t)n[r]=t[r]}),n},j.pick=function(n){var t={},r=c.apply(e,o.call(arguments,1));return A(r,function(r){r in n&&(t[r]=n[r])}),t},j.omit=function(n){var t={},r=c.apply(e,o.call(arguments,1));for(var u in n)j.contains(r,u)||(t[u]=n[u]);return t},j.defaults=function(n){return A(o.call(arguments,1),function(t){if(t)for(var r in t)n[r]===void 0&&(n[r]=t[r])}),n},j.clone=function(n){return j.isObject(n)?j.isArray(n)?n.slice():j.extend({},n):n},j.tap=function(n,t){return t(n),n};var S=function(n,t,r,e){if(n===t)return 0!==n||1/n==1/t;if(null==n||null==t)return n===t;n instanceof j&&(n=n._wrapped),t instanceof j&&(t=t._wrapped);var u=l.call(n);if(u!=l.call(t))return!1;switch(u){case\"[object String]\":return n==String(t);case\"[object Number]\":return n!=+n?t!=+t:0==n?1/n==1/t:n==+t;case\"[object Date]\":case\"[object Boolean]\":return+n==+t;case\"[object RegExp]\":return n.source==t.source&&n.global==t.global&&n.multiline==t.multiline&&n.ignoreCase==t.ignoreCase}if(\"object\"!=typeof n||\"object\"!=typeof t)return!1;for(var i=r.length;i--;)if(r[i]==n)return e[i]==t;var a=n.constructor,o=t.constructor;if(a!==o&&!(j.isFunction(a)&&a instanceof a&&j.isFunction(o)&&o instanceof o)&&\"constructor\"in n&&\"constructor\"in t)return!1;r.push(n),e.push(t);var c=0,f=!0;if(\"[object Array]\"==u){if(c=n.length,f=c==t.length)for(;c--&&(f=S(n[c],t[c],r,e)););}else{for(var s in n)if(j.has(n,s)&&(c++,!(f=j.has(t,s)&&S(n[s],t[s],r,e))))break;if(f){for(s in t)if(j.has(t,s)&&!c--)break;f=!c}}return r.pop(),e.pop(),f};j.isEqual=function(n,t){return S(n,t,[],[])},j.isEmpty=function(n){if(null==n)return!0;if(j.isArray(n)||j.isString(n))return 0===n.length;for(var t in n)if(j.has(n,t))return!1;return!0},j.isElement=function(n){return!(!n||1!==n.nodeType)},j.isArray=x||function(n){return\"[object Array]\"==l.call(n)},j.isObject=function(n){return n===Object(n)},A([\"Arguments\",\"Function\",\"String\",\"Number\",\"Date\",\"RegExp\"],function(n){j[\"is\"+n]=function(t){return l.call(t)==\"[object \"+n+\"]\"}}),j.isArguments(arguments)||(j.isArguments=function(n){return!(!n||!j.has(n,\"callee\"))}),\"function\"!=typeof/./&&(j.isFunction=function(n){return\"function\"==typeof n}),j.isFinite=function(n){return isFinite(n)&&!isNaN(parseFloat(n))},j.isNaN=function(n){return j.isNumber(n)&&n!=+n},j.isBoolean=function(n){return n===!0||n===!1||\"[object Boolean]\"==l.call(n)},j.isNull=function(n){return null===n},j.isUndefined=function(n){return n===void 0},j.has=function(n,t){return f.call(n,t)},j.noConflict=function(){return n._=t,this},j.identity=function(n){return n},j.constant=function(n){return function(){return n}},j.property=function(n){return function(t){return t[n]}},j.matches=function(n){return function(t){if(t===n)return!0;for(var r in n)if(n[r]!==t[r])return!1;return!0}},j.times=function(n,t,r){for(var e=Array(Math.max(0,n)),u=0;n>u;u++)e[u]=t.call(r,u);return e},j.random=function(n,t){return null==t&&(t=n,n=0),n+Math.floor(Math.random()*(t-n+1))},j.now=Date.now||function(){return(new Date).getTime()};var T={escape:{\"&\":\"&amp;\",\"<\":\"&lt;\",\">\":\"&gt;\",'\"':\"&quot;\",\"'\":\"&#x27;\"}};T.unescape=j.invert(T.escape);var I={escape:new RegExp(\"[\"+j.keys(T.escape).join(\"\")+\"]\",\"g\"),unescape:new RegExp(\"(\"+j.keys(T.unescape).join(\"|\")+\")\",\"g\")};j.each([\"escape\",\"unescape\"],function(n){j[n]=function(t){return null==t?\"\":(\"\"+t).replace(I[n],function(t){return T[n][t]})}}),j.result=function(n,t){if(null==n)return void 0;var r=n[t];return j.isFunction(r)?r.call(n):r},j.mixin=function(n){A(j.functions(n),function(t){var r=j[t]=n[t];j.prototype[t]=function(){var n=[this._wrapped];return a.apply(n,arguments),z.call(this,r.apply(j,n))}})};var N=0;j.uniqueId=function(n){var t=++N+\"\";return n?n+t:t},j.templateSettings={evaluate:/<%([\\s\\S]+?)%>/g,interpolate:/<%=([\\s\\S]+?)%>/g,escape:/<%-([\\s\\S]+?)%>/g};var q=/(.)^/,B={\"'\":\"'\",\"\\\\\":\"\\\\\",\"\\r\":\"r\",\"\\n\":\"n\",\"  \":\"t\",\"\\u2028\":\"u2028\",\"\\u2029\":\"u2029\"},D=/\\\\|'|\\r|\\n|\\t|\\u2028|\\u2029/g;j.template=function(n,t,r){var e;r=j.defaults({},r,j.templateSettings);var u=new RegExp([(r.escape||q).source,(r.interpolate||q).source,(r.evaluate||q).source].join(\"|\")+\"|$\",\"g\"),i=0,a=\"__p+='\";n.replace(u,function(t,r,e,u,o){return a+=n.slice(i,o).replace(D,function(n){return\"\\\\\"+B[n]}),r&&(a+=\"'+\\n((__t=(\"+r+\"))==null?'':_.escape(__t))+\\n'\"),e&&(a+=\"'+\\n((__t=(\"+e+\"))==null?'':__t)+\\n'\"),u&&(a+=\"';\\n\"+u+\"\\n__p+='\"),i=o+t.length,t}),a+=\"';\\n\",r.variable||(a=\"with(obj||{}){\\n\"+a+\"}\\n\"),a=\"var __t,__p='',__j=Array.prototype.join,\"+\"print=function(){__p+=__j.call(arguments,'');};\\n\"+a+\"return __p;\\n\";try{e=new Function(r.variable||\"obj\",\"_\",a)}catch(o){throw o.source=a,o}if(t)return e(t,j);var c=function(n){return e.call(this,n,j)};return c.source=\"function(\"+(r.variable||\"obj\")+\"){\\n\"+a+\"}\",c},j.chain=function(n){return j(n).chain()};var z=function(n){return this._chain?j(n).chain():n};j.mixin(j),A([\"pop\",\"push\",\"reverse\",\"shift\",\"sort\",\"splice\",\"unshift\"],function(n){var t=e[n];j.prototype[n]=function(){var r=this._wrapped;return t.apply(r,arguments),\"shift\"!=n&&\"splice\"!=n||0!==r.length||delete r[0],z.call(this,r)}}),A([\"concat\",\"join\",\"slice\"],function(n){var t=e[n];j.prototype[n]=function(){return z.call(this,t.apply(this._wrapped,arguments))}}),j.extend(j.prototype,{chain:function(){return this._chain=!0,this},value:function(){return this._wrapped}}),\"function\"==typeof define&&define.amd&&define(\"underscore\",[],function(){return j})}).call(this);\n//# sourceMappingURL=underscore-min.map",
      "type": "blob"
    }
  },
  "distribution": {
    "demo": {
      "path": "demo",
      "content": "(function() {\n  var File, Filetree, demoData, filetree, template, textarea;\n\n  File = require(\"./file\");\n\n  Filetree = require(\"./filetree\");\n\n  template = require(\"./templates/filetree\");\n\n  demoData = [\n    {\n      path: \"hey.yolo\",\n      content: \"wat\",\n      type: \"blob\"\n    }\n  ];\n\n  filetree = Filetree();\n\n  filetree.load(demoData);\n\n  filetree.selectedFile.observe(function(file) {\n    textarea.value = file.content();\n    return textarea.onchange = function() {\n      file.content(textarea.value);\n    };\n  });\n\n  document.body.appendChild(template(filetree));\n\n  textarea = document.createElement(\"textarea\");\n\n  document.body.appendChild(textarea);\n\n}).call(this);\n",
      "type": "blob"
    },
    "file": {
      "path": "file",
      "content": "(function() {\n  var Composition, File, Observable, SHA1, byteCount, defaults, extension, gitSHA, utf8;\n\n  Composition = require(\"composition\");\n\n  Observable = require(\"observable\");\n\n  defaults = require(\"util\").defaults;\n\n  SHA1 = require(\"sha1\").SHA1;\n\n  utf8 = require(\"./lib/utf8\");\n\n  File = function(I) {\n    var self;\n    if (I == null) {\n      I = {};\n    }\n    defaults(I, {\n      content: \"\",\n      modified: false,\n      mode: \"100644\",\n      path: \"\",\n      initialSha: null\n    });\n    if (!I.path) {\n      throw \"File must have a path\";\n    }\n    if (I.initialSha == null) {\n      I.initialSha = I.sha;\n    }\n    self = Composition(I);\n    self.attrObservable.apply(self, Object.keys(I));\n    self.extend({\n      extension: function() {\n        return extension(self.path());\n      },\n      mode: function() {\n        var extension;\n        switch (extension = self.extension()) {\n          case \"js\":\n            return \"javascript\";\n          case \"md\":\n            return \"markdown\";\n          case \"cson\":\n            return \"coffee\";\n          case \"\":\n            return \"text\";\n          default:\n            return extension;\n        }\n      }\n    });\n    self.content.observe(function() {\n      return self.modified(true);\n    });\n    self.sha = Observable(function() {\n      return I.sha = gitSHA(self.content());\n    });\n    self.displayName = Observable(function() {\n      var changed;\n      changed = \"\";\n      if (self.modified()) {\n        changed = \"*\";\n      }\n      return \"\" + changed + (self.path());\n    });\n    return self;\n  };\n\n  module.exports = File;\n\n  extension = function(path) {\n    var match;\n    if (match = path.match(/\\.([^\\.]*)$/, '')) {\n      return match[1];\n    } else {\n      return '';\n    }\n  };\n\n  gitSHA = function(string) {\n    var header, length;\n    length = byteCount(string);\n    header = \"blob \" + length + \"\\0\";\n    return SHA1(\"\" + header + string).toString();\n  };\n\n  byteCount = function(string) {\n    return utf8.encode(string).length;\n  };\n\n}).call(this);\n",
      "type": "blob"
    },
    "filetree": {
      "path": "filetree",
      "content": "(function() {\n  var Composition, File, Filetree, defaults, _;\n\n  File = require(\"./file\");\n\n  Composition = require(\"composition\");\n\n  defaults = require(\"util\").defaults;\n\n  _ = require(\"./lib/underscore\");\n\n  Filetree = function(I) {\n    var self;\n    if (I == null) {\n      I = {};\n    }\n    defaults(I, {\n      files: []\n    });\n    self = Composition(I);\n    self.attrModels(\"files\", File);\n    self.attrObservable(\"selectedFile\");\n    self.extend({\n      load: function(fileData) {\n        var files;\n        if (Array.isArray(fileData)) {\n          files = fileData.sort(function(a, b) {\n            if (a.path < b.path) {\n              return -1;\n            } else if (b.path < a.path) {\n              return 1;\n            } else {\n              return 0;\n            }\n          }).map(File);\n        } else {\n          files = Object.keys(fileData).sort().map(function(path) {\n            return File(fileData[path]);\n          });\n        }\n        return self.files(files);\n      },\n      data: function() {\n        return self.files.map(function(file) {\n          return file.I;\n        });\n      },\n      githubTree: function() {\n        return self.data().map(function(datum) {\n          if (datum.initialSha === datum.sha) {\n            return _.pick(datum, \"path\", \"mode\", \"type\", \"sha\");\n          } else {\n            return _.pick(datum, \"path\", \"mode\", \"type\", \"content\");\n          }\n        });\n      },\n      hasUnsavedChanges: function() {\n        return self.files().select(function(file) {\n          return file.modified();\n        }).length;\n      },\n      markSaved: function() {\n        return self.files().forEach(function(file) {\n          return file.modified(false);\n        });\n      }\n    });\n    return self;\n  };\n\n  module.exports = Filetree;\n\n}).call(this);\n",
      "type": "blob"
    },
    "lib/utf8": {
      "path": "lib/utf8",
      "content": "/*! http://mths.be/utf8js v2.0.0 by @mathias */\n;(function(root) {\n\n  // Detect free variables `exports`\n\tvar freeExports = typeof exports == 'object' && exports;\n\n\t// Detect free variable `module`\n\tvar freeModule = typeof module == 'object' && module &&\n\t\tmodule.exports == freeExports && module;\n\n\t// Detect free variable `global`, from Node.js or Browserified code,\n\t// and use it as `root`\n\tvar freeGlobal = typeof global == 'object' && global;\n\tif (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {\n\t\troot = freeGlobal;\n\t}\n\n\t/*--------------------------------------------------------------------------*/\n\n\tvar stringFromCharCode = String.fromCharCode;\n\n\t// Taken from http://mths.be/punycode\n\tfunction ucs2decode(string) {\n\t\tvar output = [];\n\t\tvar counter = 0;\n\t\tvar length = string.length;\n\t\tvar value;\n\t\tvar extra;\n\t\twhile (counter < length) {\n\t\t\tvalue = string.charCodeAt(counter++);\n\t\t\tif (value >= 0xD800 && value <= 0xDBFF && counter < length) {\n\t\t\t\t// high surrogate, and there is a next character\n\t\t\t\textra = string.charCodeAt(counter++);\n\t\t\t\tif ((extra & 0xFC00) == 0xDC00) { // low surrogate\n\t\t\t\t\toutput.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);\n\t\t\t\t} else {\n\t\t\t\t\t// unmatched surrogate; only append this code unit, in case the next\n\t\t\t\t\t// code unit is the high surrogate of a surrogate pair\n\t\t\t\t\toutput.push(value);\n\t\t\t\t\tcounter--;\n\t\t\t\t}\n\t\t\t} else {\n\t\t\t\toutput.push(value);\n\t\t\t}\n\t\t}\n\t\treturn output;\n\t}\n\n\t// Taken from http://mths.be/punycode\n\tfunction ucs2encode(array) {\n\t\tvar length = array.length;\n\t\tvar index = -1;\n\t\tvar value;\n\t\tvar output = '';\n\t\twhile (++index < length) {\n\t\t\tvalue = array[index];\n\t\t\tif (value > 0xFFFF) {\n\t\t\t\tvalue -= 0x10000;\n\t\t\t\toutput += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);\n\t\t\t\tvalue = 0xDC00 | value & 0x3FF;\n\t\t\t}\n\t\t\toutput += stringFromCharCode(value);\n\t\t}\n\t\treturn output;\n\t}\n\n\t/*--------------------------------------------------------------------------*/\n\n\tfunction createByte(codePoint, shift) {\n\t\treturn stringFromCharCode(((codePoint >> shift) & 0x3F) | 0x80);\n\t}\n\n\tfunction encodeCodePoint(codePoint) {\n\t\tif ((codePoint & 0xFFFFFF80) == 0) { // 1-byte sequence\n\t\t\treturn stringFromCharCode(codePoint);\n\t\t}\n\t\tvar symbol = '';\n\t\tif ((codePoint & 0xFFFFF800) == 0) { // 2-byte sequence\n\t\t\tsymbol = stringFromCharCode(((codePoint >> 6) & 0x1F) | 0xC0);\n\t\t}\n\t\telse if ((codePoint & 0xFFFF0000) == 0) { // 3-byte sequence\n\t\t\tsymbol = stringFromCharCode(((codePoint >> 12) & 0x0F) | 0xE0);\n\t\t\tsymbol += createByte(codePoint, 6);\n\t\t}\n\t\telse if ((codePoint & 0xFFE00000) == 0) { // 4-byte sequence\n\t\t\tsymbol = stringFromCharCode(((codePoint >> 18) & 0x07) | 0xF0);\n\t\t\tsymbol += createByte(codePoint, 12);\n\t\t\tsymbol += createByte(codePoint, 6);\n\t\t}\n\t\tsymbol += stringFromCharCode((codePoint & 0x3F) | 0x80);\n\t\treturn symbol;\n\t}\n\n\tfunction utf8encode(string) {\n\t\tvar codePoints = ucs2decode(string);\n\t\tvar length = codePoints.length;\n\t\tvar index = -1;\n\t\tvar codePoint;\n\t\tvar byteString = '';\n\t\twhile (++index < length) {\n\t\t\tcodePoint = codePoints[index];\n\t\t\tbyteString += encodeCodePoint(codePoint);\n\t\t}\n\t\treturn byteString;\n\t}\n\n\t/*--------------------------------------------------------------------------*/\n\n\tfunction readContinuationByte() {\n\t\tif (byteIndex >= byteCount) {\n\t\t\tthrow Error('Invalid byte index');\n\t\t}\n\n\t\tvar continuationByte = byteArray[byteIndex] & 0xFF;\n\t\tbyteIndex++;\n\n\t\tif ((continuationByte & 0xC0) == 0x80) {\n\t\t\treturn continuationByte & 0x3F;\n\t\t}\n\n\t\t// If we end up here, it’s not a continuation byte\n\t\tthrow Error('Invalid continuation byte');\n\t}\n\n\tfunction decodeSymbol() {\n\t\tvar byte1;\n\t\tvar byte2;\n\t\tvar byte3;\n\t\tvar byte4;\n\t\tvar codePoint;\n\n\t\tif (byteIndex > byteCount) {\n\t\t\tthrow Error('Invalid byte index');\n\t\t}\n\n\t\tif (byteIndex == byteCount) {\n\t\t\treturn false;\n\t\t}\n\n\t\t// Read first byte\n\t\tbyte1 = byteArray[byteIndex] & 0xFF;\n\t\tbyteIndex++;\n\n\t\t// 1-byte sequence (no continuation bytes)\n\t\tif ((byte1 & 0x80) == 0) {\n\t\t\treturn byte1;\n\t\t}\n\n\t\t// 2-byte sequence\n\t\tif ((byte1 & 0xE0) == 0xC0) {\n\t\t\tvar byte2 = readContinuationByte();\n\t\t\tcodePoint = ((byte1 & 0x1F) << 6) | byte2;\n\t\t\tif (codePoint >= 0x80) {\n\t\t\t\treturn codePoint;\n\t\t\t} else {\n\t\t\t\tthrow Error('Invalid continuation byte');\n\t\t\t}\n\t\t}\n\n\t\t// 3-byte sequence (may include unpaired surrogates)\n\t\tif ((byte1 & 0xF0) == 0xE0) {\n\t\t\tbyte2 = readContinuationByte();\n\t\t\tbyte3 = readContinuationByte();\n\t\t\tcodePoint = ((byte1 & 0x0F) << 12) | (byte2 << 6) | byte3;\n\t\t\tif (codePoint >= 0x0800) {\n\t\t\t\treturn codePoint;\n\t\t\t} else {\n\t\t\t\tthrow Error('Invalid continuation byte');\n\t\t\t}\n\t\t}\n\n\t\t// 4-byte sequence\n\t\tif ((byte1 & 0xF8) == 0xF0) {\n\t\t\tbyte2 = readContinuationByte();\n\t\t\tbyte3 = readContinuationByte();\n\t\t\tbyte4 = readContinuationByte();\n\t\t\tcodePoint = ((byte1 & 0x0F) << 0x12) | (byte2 << 0x0C) |\n\t\t\t\t(byte3 << 0x06) | byte4;\n\t\t\tif (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {\n\t\t\t\treturn codePoint;\n\t\t\t}\n\t\t}\n\n\t\tthrow Error('Invalid UTF-8 detected');\n\t}\n\n\tvar byteArray;\n\tvar byteCount;\n\tvar byteIndex;\n\tfunction utf8decode(byteString) {\n\t\tbyteArray = ucs2decode(byteString);\n\t\tbyteCount = byteArray.length;\n\t\tbyteIndex = 0;\n\t\tvar codePoints = [];\n\t\tvar tmp;\n\t\twhile ((tmp = decodeSymbol()) !== false) {\n\t\t\tcodePoints.push(tmp);\n\t\t}\n\t\treturn ucs2encode(codePoints);\n\t}\n\n\t/*--------------------------------------------------------------------------*/\n\n\tvar utf8 = {\n\t\t'version': '2.0.0',\n\t\t'encode': utf8encode,\n\t\t'decode': utf8decode\n\t};\n\n\t// Some AMD build optimizers, like r.js, check for specific condition patterns\n\t// like the following:\n\tif (\n\t\ttypeof define == 'function' &&\n\t\ttypeof define.amd == 'object' &&\n\t\tdefine.amd\n\t) {\n\t\tdefine(function() {\n\t\t\treturn utf8;\n\t\t});\n\t}\telse if (freeExports && !freeExports.nodeType) {\n\t\tif (freeModule) { // in Node.js or RingoJS v0.8.0+\n\t\t\tfreeModule.exports = utf8;\n\t\t} else { // in Narwhal or RingoJS v0.7.0-\n\t\t\tvar object = {};\n\t\t\tvar hasOwnProperty = object.hasOwnProperty;\n\t\t\tfor (var key in utf8) {\n\t\t\t\thasOwnProperty.call(utf8, key) && (freeExports[key] = utf8[key]);\n\t\t\t}\n\t\t}\n\t} else { // in Rhino or a web browser\n\t\troot.utf8 = utf8;\n\t}\n\n}(this));\n",
      "type": "blob"
    },
    "main": {
      "path": "main",
      "content": "(function() {\n  module.exports = {\n    File: require(\"./file\"),\n    Filetree: require(\"./filetree\"),\n    template: require(\"./templates/filetree\")\n  };\n\n  if (PACKAGE.name === \"ROOT\") {\n    global.Observable = require(\"observable\");\n    require(\"./demo\");\n  }\n\n}).call(this);\n",
      "type": "blob"
    },
    "pixie": {
      "path": "pixie",
      "content": "module.exports = {\"version\":\"0.3.1-pre.5\",\"dependencies\":{\"composition\":\"distri/compositions:v0.1.1\",\"observable\":\"distri/observable:v0.1.1\",\"sha1\":\"distri/sha1:v0.1.0\",\"util\":\"distri/util:v0.1.0\"}};",
      "type": "blob"
    },
    "sample_data": {
      "path": "sample_data",
      "content": "module.exports = [{\"mode\":\"100644\",\"type\":\"blob\",\"sha\":\"c4d980eab4cc2eb1784f4d018017e4a75f6982b5\",\"path\":\"LICENSE\",\"size\":1081,\"url\":\"https://api.github.com/repos/distri/compositions/git/blobs/c4d980eab4cc2eb1784f4d018017e4a75f6982b5\",\"content\":\"VGhlIE1JVCBMaWNlbnNlIChNSVQpCgpDb3B5cmlnaHQgKGMpIDIwMTQgRGFu\\naWVsIFggTW9vcmUKClBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZy\\nZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkg\\nb2YKdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9u\\nIGZpbGVzICh0aGUgIlNvZnR3YXJlIiksIHRvIGRlYWwgaW4KdGhlIFNvZnR3\\nYXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxp\\nbWl0YXRpb24gdGhlIHJpZ2h0cyB0bwp1c2UsIGNvcHksIG1vZGlmeSwgbWVy\\nZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBz\\nZWxsIGNvcGllcyBvZgp0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVy\\nc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8g\\nc28sCnN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOgoKVGhl\\nIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBu\\nb3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsCmNvcGllcyBvciBzdWJz\\ndGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuCgpUSEUgU09GVFdB\\nUkUgSVMgUFJPVklERUQgIkFTIElTIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBB\\nTlkgS0lORCwgRVhQUkVTUyBPUgpJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5P\\nVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElU\\nWSwgRklUTkVTUwpGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklO\\nRlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IK\\nQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERB\\nTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSCklOIEFOIEFDVElP\\nTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJP\\nTSwgT1VUIE9GIE9SIElOCkNPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUg\\nT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUu\\nCg==\\n\",\"encoding\":\"base64\"},{\"mode\":\"100644\",\"type\":\"blob\",\"sha\":\"ecea0236b8986129905ef534f99fd9b6fa9ac9c7\",\"path\":\"README.coffee.md\",\"size\":1751,\"url\":\"https://api.github.com/repos/distri/compositions/git/blobs/ecea0236b8986129905ef534f99fd9b6fa9ac9c7\",\"content\":\"Q29tcG9zaXRpb25zCj09PT09PT09PT09PQoKVGhlIGBjb21wb3NpdGlvbnNg\\nIG1vZHVsZSBwcm92aWRlcyBoZWxwZXIgbWV0aG9kcyB0byBjb21wb3NlIG5l\\nc3RlZCBkYXRhIG1vZGVscy4KCkNvbXBvc2l0aW9ucyB1c2VzIFtPYnNlcnZh\\nYmxlXSgvb2JzZXJ2YWJsZS9kb2NzKSB0byBrZWVwIHRoZSBpbnRlcm5hbCBk\\nYXRhIGluIHN5bmMuCgogICAgQ29yZSA9IHJlcXVpcmUgImNvcmUiCiAgICBP\\nYnNlcnZhYmxlID0gcmVxdWlyZSAib2JzZXJ2YWJsZSIKCiAgICBtb2R1bGUu\\nZXhwb3J0cyA9IChJPXt9LCBzZWxmPUNvcmUoSSkpIC0+CgogICAgICBzZWxm\\nLmV4dGVuZAoKT2JzZXJ2ZSBhbnkgbnVtYmVyIG9mIGF0dHJpYnV0ZXMgYXMg\\nc2ltcGxlIG9ic2VydmFibGVzLiBGb3IgZWFjaCBhdHRyaWJ1dGUgbmFtZSBw\\nYXNzZWQgaW4gd2UgZXhwb3NlIGEgcHVibGljIGdldHRlci9zZXR0ZXIgbWV0\\naG9kIGFuZCBsaXN0ZW4gdG8gY2hhbmdlcyB3aGVuIHRoZSB2YWx1ZSBpcyBz\\nZXQuCgogICAgICAgIGF0dHJPYnNlcnZhYmxlOiAobmFtZXMuLi4pIC0+CiAg\\nICAgICAgICBuYW1lcy5mb3JFYWNoIChuYW1lKSAtPgogICAgICAgICAgICBz\\nZWxmW25hbWVdID0gT2JzZXJ2YWJsZShJW25hbWVdKQoKICAgICAgICAgICAg\\nc2VsZltuYW1lXS5vYnNlcnZlIChuZXdWYWx1ZSkgLT4KICAgICAgICAgICAg\\nICBJW25hbWVdID0gbmV3VmFsdWUKCiAgICAgICAgICByZXR1cm4gc2VsZgoK\\nT2JzZXJ2ZSBhbiBhdHRyaWJ1dGUgYXMgYSBtb2RlbC4gVHJlYXRzIHRoZSBh\\ndHRyaWJ1dGUgZ2l2ZW4gYXMgYW4gT2JzZXJ2YWJsZQptb2RlbCBpbnN0YW5j\\nZSBleHBvc3RpbmcgYSBnZXR0ZXIvc2V0dGVyIG1ldGhvZCBvZiB0aGUgc2Ft\\nZSBuYW1lLiBUaGUgTW9kZWwKY29uc3RydWN0b3IgbXVzdCBiZSBwYXNzZWQg\\naW4gZXhwbGljaXRseS4KCiAgICAgICAgYXR0ck1vZGVsOiAobmFtZSwgTW9k\\nZWwpIC0+CiAgICAgICAgICBtb2RlbCA9IE1vZGVsKElbbmFtZV0pCgogICAg\\nICAgICAgc2VsZltuYW1lXSA9IE9ic2VydmFibGUobW9kZWwpCgogICAgICAg\\nICAgc2VsZltuYW1lXS5vYnNlcnZlIChuZXdWYWx1ZSkgLT4KICAgICAgICAg\\nICAgSVtuYW1lXSA9IG5ld1ZhbHVlLkkKCiAgICAgICAgICByZXR1cm4gc2Vs\\nZgoKT2JzZXJ2ZSBhbiBhdHRyaWJ1dGUgYXMgYSBsaXN0IG9mIHN1Yi1tb2Rl\\nbHMuIFRoaXMgaXMgdGhlIHNhbWUgYXMgYGF0dHJNb2RlbGAKZXhjZXB0IHRo\\nZSBhdHRyaWJ1dGUgaXMgZXhwZWN0ZWQgdG8gYmUgYW4gYXJyYXkgb2YgbW9k\\nZWxzIHJhdGhlciB0aGFuIGEgc2luZ2xlIG9uZS4KCiAgICAgICAgYXR0ck1v\\nZGVsczogKG5hbWUsIE1vZGVsKSAtPgogICAgICAgICAgbW9kZWxzID0gKElb\\nbmFtZV0gb3IgW10pLm1hcCAoeCkgLT4KICAgICAgICAgICAgTW9kZWwoeCkK\\nCiAgICAgICAgICBzZWxmW25hbWVdID0gT2JzZXJ2YWJsZShtb2RlbHMpCgog\\nICAgICAgICAgc2VsZltuYW1lXS5vYnNlcnZlIChuZXdWYWx1ZSkgLT4KICAg\\nICAgICAgICAgSVtuYW1lXSA9IG5ld1ZhbHVlLm1hcCAoaW5zdGFuY2UpIC0+\\nCiAgICAgICAgICAgICAgaW5zdGFuY2UuSQoKICAgICAgICAgIHJldHVybiBz\\nZWxmCgpUaGUgSlNPTiByZXByZXNlbnRhdGlvbiBpcyBrZXB0IHVwIHRvIGRh\\ndGUgdmlhIHRoZSBvYnNlcnZhYmxlIHByb3Blcml0ZXMgYW5kIHJlc2lkZXMg\\naW4gYElgLgoKICAgICAgICB0b0pTT046IC0+CiAgICAgICAgICBJCgpSZXR1\\ncm4gb3VyIHB1YmxpYyBvYmplY3QuCgogICAgICByZXR1cm4gc2VsZgo=\\n\",\"encoding\":\"base64\"},{\"mode\":\"100644\",\"type\":\"blob\",\"sha\":\"99da0ba39b6e328efc219c973c770edf3e6bcd01\",\"path\":\"pixie.cson\",\"size\":122,\"url\":\"https://api.github.com/repos/distri/compositions/git/blobs/99da0ba39b6e328efc219c973c770edf3e6bcd01\",\"content\":\"ZW50cnlQb2ludDogIlJFQURNRSIKdmVyc2lvbjogIjAuMS4xIgpkZXBlbmRl\\nbmNpZXM6CiAgY29yZTogImRpc3RyaS9jb3JlOnYwLjYuMCIKICBvYnNlcnZh\\nYmxlOiAiZGlzdHJpL29ic2VydmFibGU6djAuMS4xIgo=\\n\",\"encoding\":\"base64\"},{\"mode\":\"100644\",\"type\":\"blob\",\"sha\":\"35b884bbceef9534e62e9ce8f8a15416957399bb\",\"path\":\"test/compositions.coffee\",\"size\":3797,\"url\":\"https://api.github.com/repos/distri/compositions/git/blobs/35b884bbceef9534e62e9ce8f8a15416957399bb\",\"content\":\"Ck1vZGVsID0gcmVxdWlyZSAiLi4vUkVBRE1FIgoKZGVzY3JpYmUgJ01vZGVs\\nJywgLT4KICAjIEFzc29jaWF0aW9uIFRlc3RpbmcgbW9kZWwKICBQZXJzb24g\\nPSAoSSkgLT4KICAgIHBlcnNvbiA9IE1vZGVsKEkpCgogICAgcGVyc29uLmF0\\ndHJBY2Nlc3NvcigKICAgICAgJ2ZpcnN0TmFtZScKICAgICAgJ2xhc3ROYW1l\\nJwogICAgICAnc3VmZml4JwogICAgKQoKICAgIHBlcnNvbi5mdWxsTmFtZSA9\\nIC0+CiAgICAgICIje0BmaXJzdE5hbWUoKX0gI3tAbGFzdE5hbWUoKX0gI3tA\\nc3VmZml4KCl9IgoKICAgIHJldHVybiBwZXJzb24KCiAgZGVzY3JpYmUgIiNh\\ndHRyT2JzZXJ2YWJsZSIsIC0+CiAgICBpdCAnc2hvdWxkIGFsbG93IGZvciBv\\nYnNlcnZpbmcgb2YgYXR0cmlidXRlcycsIC0+CiAgICAgIG1vZGVsID0gTW9k\\nZWwKICAgICAgICBuYW1lOiAiRHVkZXIiCgogICAgICBtb2RlbC5hdHRyT2Jz\\nZXJ2YWJsZSAibmFtZSIKCiAgICAgIG1vZGVsLm5hbWUoIkR1ZGVtYW4iKQoK\\nICAgICAgYXNzZXJ0LmVxdWFsIG1vZGVsLm5hbWUoKSwgIkR1ZGVtYW4iCgog\\nICAgaXQgJ3Nob3VsZCBiaW5kIHByb3BlcnRpZXMgdG8gb2JzZXJ2YWJsZSBh\\ndHRyaWJ1dGVzJywgLT4KICAgICAgbW9kZWwgPSBNb2RlbAogICAgICAgIG5h\\nbWU6ICJEdWRlciIKCiAgICAgIG1vZGVsLmF0dHJPYnNlcnZhYmxlICJuYW1l\\nIgoKICAgICAgbW9kZWwubmFtZSgiRHVkZW1hbiIpCgogICAgICBhc3NlcnQu\\nZXF1YWwgbW9kZWwubmFtZSgpLCAiRHVkZW1hbiIKICAgICAgYXNzZXJ0LmVx\\ndWFsIG1vZGVsLm5hbWUoKSwgbW9kZWwuSS5uYW1lCgogIGRlc2NyaWJlICIj\\nYXR0ck1vZGVsIiwgLT4KICAgIGl0ICJzaG91bGQgYmUgYSBtb2RlbCBpbnN0\\nYW5jZSIsIC0+CiAgICAgIG1vZGVsID0gTW9kZWwKICAgICAgICBwZXJzb246\\nCiAgICAgICAgICBmaXJzdE5hbWU6ICJEdWRlciIKICAgICAgICAgIGxhc3RO\\nYW1lOiAiTWFubmluZ3RvbiIKICAgICAgICAgIHN1ZmZpeDogIkpyLiIKCiAg\\nICAgIG1vZGVsLmF0dHJNb2RlbCgicGVyc29uIiwgUGVyc29uKQoKICAgICAg\\nYXNzZXJ0LmVxdWFsIG1vZGVsLnBlcnNvbigpLmZ1bGxOYW1lKCksICJEdWRl\\nciBNYW5uaW5ndG9uIEpyLiIKCiAgICBpdCAic2hvdWxkIGFsbG93IHNldHRp\\nbmcgdGhlIGFzc29jaWF0ZWQgbW9kZWwiLCAtPgogICAgICBtb2RlbCA9IE1v\\nZGVsCiAgICAgICAgcGVyc29uOgogICAgICAgICAgZmlyc3ROYW1lOiAiRHVk\\nZXIiCiAgICAgICAgICBsYXN0TmFtZTogIk1hbm5pbmd0b24iCiAgICAgICAg\\nICBzdWZmaXg6ICJKci4iCgogICAgICBtb2RlbC5hdHRyTW9kZWwoInBlcnNv\\nbiIsIFBlcnNvbikKCiAgICAgIG90aGVyUGVyc29uID0gUGVyc29uCiAgICAg\\nICAgZmlyc3ROYW1lOiAiTXIuIgogICAgICAgIGxhc3ROYW1lOiAiTWFuIgoK\\nICAgICAgbW9kZWwucGVyc29uKG90aGVyUGVyc29uKQoKICAgICAgYXNzZXJ0\\nLmVxdWFsIG1vZGVsLnBlcnNvbigpLmZpcnN0TmFtZSgpLCAiTXIuIgoKICAg\\nIGl0ICJzaG91bGRuJ3QgdXBkYXRlIHRoZSBpbnN0YW5jZSBwcm9wZXJ0aWVz\\nIGFmdGVyIGl0J3MgYmVlbiByZXBsYWNlZCIsIC0+CiAgICAgIG1vZGVsID0g\\nTW9kZWwKICAgICAgICBwZXJzb246CiAgICAgICAgICBmaXJzdE5hbWU6ICJE\\ndWRlciIKICAgICAgICAgIGxhc3ROYW1lOiAiTWFubmluZ3RvbiIKICAgICAg\\nICAgIHN1ZmZpeDogIkpyLiIKCiAgICAgIG1vZGVsLmF0dHJNb2RlbCgicGVy\\nc29uIiwgUGVyc29uKQoKICAgICAgZHVkZXIgPSBtb2RlbC5wZXJzb24oKQoK\\nICAgICAgb3RoZXJQZXJzb24gPSBQZXJzb24KICAgICAgICBmaXJzdE5hbWU6\\nICJNci4iCiAgICAgICAgbGFzdE5hbWU6ICJNYW4iCgogICAgICBtb2RlbC5w\\nZXJzb24ob3RoZXJQZXJzb24pCgogICAgICBkdWRlci5maXJzdE5hbWUoIkpv\\nZSIpCgogICAgICBhc3NlcnQuZXF1YWwgZHVkZXIuSS5maXJzdE5hbWUsICJK\\nb2UiCiAgICAgIGFzc2VydC5lcXVhbCBtb2RlbC5JLnBlcnNvbi5maXJzdE5h\\nbWUsICJNci4iCgogIGRlc2NyaWJlICIjYXR0ck1vZGVscyIsIC0+CiAgICBp\\ndCAic2hvdWxkIGhhdmUgYW4gYXJyYXkgb2YgbW9kZWwgaW5zdGFuY2VzIiwg\\nLT4KICAgICAgbW9kZWwgPSBNb2RlbAogICAgICAgIHBlb3BsZTogW3sKICAg\\nICAgICAgIGZpcnN0TmFtZTogIkR1ZGVyIgogICAgICAgICAgbGFzdE5hbWU6\\nICJNYW5uaW5ndG9uIgogICAgICAgICAgc3VmZml4OiAiSnIuIgogICAgICAg\\nIH0sIHsKICAgICAgICAgIGZpcnN0TmFtZTogIk1yLiIKICAgICAgICAgIGxh\\nc3ROYW1lOiAiTWFubmluZ3RvbiIKICAgICAgICAgIHN1ZmZpeDogIlNyLiIK\\nICAgICAgICB9XQoKICAgICAgbW9kZWwuYXR0ck1vZGVscygicGVvcGxlIiwg\\nUGVyc29uKQoKICAgICAgYXNzZXJ0LmVxdWFsIG1vZGVsLnBlb3BsZSgpWzBd\\nLmZ1bGxOYW1lKCksICJEdWRlciBNYW5uaW5ndG9uIEpyLiIKCiAgICBpdCAi\\nc2hvdWxkIHRyYWNrIHB1c2hlcyIsIC0+CiAgICAgIG1vZGVsID0gTW9kZWwK\\nICAgICAgICBwZW9wbGU6IFt7CiAgICAgICAgICBmaXJzdE5hbWU6ICJEdWRl\\nciIKICAgICAgICAgIGxhc3ROYW1lOiAiTWFubmluZ3RvbiIKICAgICAgICAg\\nIHN1ZmZpeDogIkpyLiIKICAgICAgICB9LCB7CiAgICAgICAgICBmaXJzdE5h\\nbWU6ICJNci4iCiAgICAgICAgICBsYXN0TmFtZTogIk1hbm5pbmd0b24iCiAg\\nICAgICAgICBzdWZmaXg6ICJTci4iCiAgICAgICAgfV0KCiAgICAgIG1vZGVs\\nLmF0dHJNb2RlbHMoInBlb3BsZSIsIFBlcnNvbikKCiAgICAgIG1vZGVsLnBl\\nb3BsZS5wdXNoIFBlcnNvbgogICAgICAgIGZpcnN0TmFtZTogIkpvSm8iCiAg\\nICAgICAgbGFzdE5hbWU6ICJMb2NvIgoKICAgICAgYXNzZXJ0LmVxdWFsIG1v\\nZGVsLnBlb3BsZSgpLmxlbmd0aCwgMwogICAgICBhc3NlcnQuZXF1YWwgbW9k\\nZWwuSS5wZW9wbGUubGVuZ3RoLCAzCgogICAgaXQgInNob3VsZCB0cmFjayBw\\nb3BzIiwgLT4KICAgICAgbW9kZWwgPSBNb2RlbAogICAgICAgIHBlb3BsZTog\\nW3sKICAgICAgICAgIGZpcnN0TmFtZTogIkR1ZGVyIgogICAgICAgICAgbGFz\\ndE5hbWU6ICJNYW5uaW5ndG9uIgogICAgICAgICAgc3VmZml4OiAiSnIuIgog\\nICAgICAgIH0sIHsKICAgICAgICAgIGZpcnN0TmFtZTogIk1yLiIKICAgICAg\\nICAgIGxhc3ROYW1lOiAiTWFubmluZ3RvbiIKICAgICAgICAgIHN1ZmZpeDog\\nIlNyLiIKICAgICAgICB9XQoKICAgICAgbW9kZWwuYXR0ck1vZGVscygicGVv\\ncGxlIiwgUGVyc29uKQoKICAgICAgbW9kZWwucGVvcGxlLnBvcCgpCgogICAg\\nICBhc3NlcnQuZXF1YWwgbW9kZWwucGVvcGxlKCkubGVuZ3RoLCAxCiAgICAg\\nIGFzc2VydC5lcXVhbCBtb2RlbC5JLnBlb3BsZS5sZW5ndGgsIDEKCiAgZGVz\\nY3JpYmUgIiN0b0pTT04iLCAtPgogICAgaXQgInNob3VsZCByZXR1cm4gYW4g\\nb2JqZWN0IGFwcHJvcHJpYXRlIGZvciBKU09OIHNlcmlhbGl6YXRpb24iLCAt\\nPgogICAgICBtb2RlbCA9IE1vZGVsCiAgICAgICAgdGVzdDogdHJ1ZQoKICAg\\nICAgYXNzZXJ0IG1vZGVsLnRvSlNPTigpLnRlc3QKCiAgZGVzY3JpYmUgIiNv\\nYnNlcnZlQWxsIiwgLT4KICAgIGl0ICJzaG91bGQgb2JzZXJ2ZSBhbGwgYXR0\\ncmlidXRlcyBvZiBhIHNpbXBsZSBtb2RlbCIKICAgIC0+ICAjIFRPRE8KICAg\\nICAgbW9kZWwgPSBNb2RlbAogICAgICAgIHRlc3Q6IHRydWUKICAgICAgICB5\\nb2xvOiAiNGxpZmUiCgogICAgICBtb2RlbC5vYnNlcnZlQWxsKCkKCiAgICAg\\nIGFzc2VydCBtb2RlbC50ZXN0KCkKICAgICAgYXNzZXJ0LmVxdWFsIG1vZGVs\\nLnlvbG8oKSwgIjRsaWZlIgoKICAgIGl0ICJzaG91bGQgY2FtZWwgY2FzZSB1\\nbmRlcnNjb3JlZCBuYW1lcyI=\\n\",\"encoding\":\"base64\"}];",
      "type": "blob"
    },
    "templates/filetree": {
      "path": "templates/filetree",
      "content": "Runtime = require(\"/_lib/hamljr_runtime\");\n\nmodule.exports = (function(data) {\n  return (function() {\n    var files, selectedFile, __runtime;\n    __runtime = Runtime(this);\n    __runtime.push(document.createDocumentFragment());\n    __runtime.push(document.createElement(\"ul\"));\n    __runtime.classes(\"filetree\");\n    selectedFile = this.selectedFile;\n    files = this.files;\n    __runtime.each(files, function(file) {\n      __runtime.push(document.createElement(\"li\"));\n      __runtime.text(file.displayName);\n      __runtime.on(\"click\", function(e) {\n        if (e.target.nodeName === 'LI') {\n          return selectedFile(file);\n        }\n      });\n      __runtime.push(document.createElement(\"div\"));\n      __runtime.classes(\"delete\");\n      __runtime.on(\"click\", function() {\n        if (confirm(\"Delete \" + (file.path()) + \"?\")) {\n          return files.remove(file);\n        }\n      });\n      __runtime.text(\"X\\n\");\n      __runtime.pop();\n      return __runtime.pop();\n    });\n    __runtime.pop();\n    return __runtime.pop();\n  }).call(data);\n});\n",
      "type": "blob"
    },
    "test/data_consistency": {
      "path": "test/data_consistency",
      "content": "(function() {\n  var SHA1, sampleData;\n\n  sampleData = require(\"../sample_data\");\n\n  SHA1 = require(\"sha1\").SHA1;\n\n  describe(\"data consistency\", function() {\n    return it(\"should decode and verify sha\", function() {\n      return sampleData.forEach(function(_arg) {\n        var actual, content, decodedContent, expected, header, path, sha, size;\n        path = _arg.path, content = _arg.content, sha = _arg.sha, size = _arg.size;\n        header = \"blob \" + size + \"\\0\";\n        decodedContent = atob(content);\n        console.log(decodedContent);\n        actual = SHA1(\"\" + header + decodedContent).toString();\n        expected = sha;\n        return assert.equal(actual, expected, \"Path: \" + path + \", Actual \" + actual + \", expected \" + expected);\n      });\n    });\n  });\n\n}).call(this);\n",
      "type": "blob"
    },
    "test/file": {
      "path": "test/file",
      "content": "(function() {\n  var File, Filetree;\n\n  File = require(\"../file\");\n\n  Filetree = require(\"../filetree\");\n\n  describe(\"file\", function() {\n    describe(\"git SHA1s\", function() {\n      it(\"should keep it's sha up to date\", function() {\n        var file;\n        file = File({\n          path: \"test\"\n        });\n        assert.equal(file.sha(), \"e69de29bb2d1d6434b8b29ae775ad8c2e48c5391\");\n        file.content(\"yolo\");\n        file.sha.observe(function(sha) {\n          return assert.equal(sha, \"eeabc605bfdfc792a48ea3d65e47a6f9263e2801\");\n        });\n        return assert.equal(file.sha(), \"eeabc605bfdfc792a48ea3d65e47a6f9263e2801\");\n      });\n      it(\"should work with utf-8\", function() {\n        var file;\n        file = File({\n          path: \"test\"\n        });\n        file.content(\"i ♥ u\\n\");\n        return assert.equal(file.sha(), \"e6816bf5d113d19e69e0052e359d11144efcd7f1\");\n      });\n      it(\"should not know it's initial sha if no sha is passed in\", function() {\n        var file;\n        file = File({\n          path: \"test\"\n        });\n        return assert.equal(file.initialSha(), void 0);\n      });\n      return it(\"should keep it's initial sha if a sha is passed in\", function() {\n        var file;\n        file = File({\n          path: \"test\",\n          sha: \"e6816bf5d113d19e69e0052e359d11144efcd7f1\"\n        });\n        file.content(\"something else\");\n        return assert.equal(file.initialSha(), \"e6816bf5d113d19e69e0052e359d11144efcd7f1\");\n      });\n    });\n    it(\"should know its extension\", function() {\n      var file;\n      file = File({\n        path: \"hello.coffee.md\"\n      });\n      return assert.equal(file.extension(), \"md\", \"Extension is \" + (file.extension()));\n    });\n    return it(\"should not have both sha and content in github tree\", function() {\n      var f, filetree;\n      filetree = Filetree();\n      filetree.load([\n        {\n          path: \"yolo\",\n          content: \"wat\"\n        }\n      ]);\n      f = filetree.githubTree()[0];\n      return assert((!f.sha && f.content) || (f.sha && !f.content));\n    });\n  });\n\n}).call(this);\n",
      "type": "blob"
    },
    "test/filetree": {
      "path": "test/filetree",
      "content": "(function() {\n  var File, Filetree, template, _ref;\n\n  _ref = require(\"../main\"), File = _ref.File, Filetree = _ref.Filetree, template = _ref.template;\n\n  describe(\"Filetree\", function() {\n    it(\"should expose a template\", function() {\n      return assert(template);\n    });\n    it(\"should expose a Filetree constructor\", function() {\n      return assert(Filetree);\n    });\n    it(\"should expose a File constructor\", function() {\n      return assert(File({\n        path: \"duder.txt\"\n      }));\n    });\n    return it(\"should return an array of data\", function() {\n      var data, tree;\n      tree = Filetree();\n      tree.load;\n      return data = tree.data();\n    });\n  });\n\n}).call(this);\n",
      "type": "blob"
    },
    "lib/underscore": {
      "path": "lib/underscore",
      "content": "//     Underscore.js 1.6.0\n//     http://underscorejs.org\n//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors\n//     Underscore may be freely distributed under the MIT license.\n(function(){var n=this,t=n._,r={},e=Array.prototype,u=Object.prototype,i=Function.prototype,a=e.push,o=e.slice,c=e.concat,l=u.toString,f=u.hasOwnProperty,s=e.forEach,p=e.map,h=e.reduce,v=e.reduceRight,g=e.filter,d=e.every,m=e.some,y=e.indexOf,b=e.lastIndexOf,x=Array.isArray,w=Object.keys,_=i.bind,j=function(n){return n instanceof j?n:this instanceof j?void(this._wrapped=n):new j(n)};\"undefined\"!=typeof exports?(\"undefined\"!=typeof module&&module.exports&&(exports=module.exports=j),exports._=j):n._=j,j.VERSION=\"1.6.0\";var A=j.each=j.forEach=function(n,t,e){if(null==n)return n;if(s&&n.forEach===s)n.forEach(t,e);else if(n.length===+n.length){for(var u=0,i=n.length;i>u;u++)if(t.call(e,n[u],u,n)===r)return}else for(var a=j.keys(n),u=0,i=a.length;i>u;u++)if(t.call(e,n[a[u]],a[u],n)===r)return;return n};j.map=j.collect=function(n,t,r){var e=[];return null==n?e:p&&n.map===p?n.map(t,r):(A(n,function(n,u,i){e.push(t.call(r,n,u,i))}),e)};var O=\"Reduce of empty array with no initial value\";j.reduce=j.foldl=j.inject=function(n,t,r,e){var u=arguments.length>2;if(null==n&&(n=[]),h&&n.reduce===h)return e&&(t=j.bind(t,e)),u?n.reduce(t,r):n.reduce(t);if(A(n,function(n,i,a){u?r=t.call(e,r,n,i,a):(r=n,u=!0)}),!u)throw new TypeError(O);return r},j.reduceRight=j.foldr=function(n,t,r,e){var u=arguments.length>2;if(null==n&&(n=[]),v&&n.reduceRight===v)return e&&(t=j.bind(t,e)),u?n.reduceRight(t,r):n.reduceRight(t);var i=n.length;if(i!==+i){var a=j.keys(n);i=a.length}if(A(n,function(o,c,l){c=a?a[--i]:--i,u?r=t.call(e,r,n[c],c,l):(r=n[c],u=!0)}),!u)throw new TypeError(O);return r},j.find=j.detect=function(n,t,r){var e;return k(n,function(n,u,i){return t.call(r,n,u,i)?(e=n,!0):void 0}),e},j.filter=j.select=function(n,t,r){var e=[];return null==n?e:g&&n.filter===g?n.filter(t,r):(A(n,function(n,u,i){t.call(r,n,u,i)&&e.push(n)}),e)},j.reject=function(n,t,r){return j.filter(n,function(n,e,u){return!t.call(r,n,e,u)},r)},j.every=j.all=function(n,t,e){t||(t=j.identity);var u=!0;return null==n?u:d&&n.every===d?n.every(t,e):(A(n,function(n,i,a){return(u=u&&t.call(e,n,i,a))?void 0:r}),!!u)};var k=j.some=j.any=function(n,t,e){t||(t=j.identity);var u=!1;return null==n?u:m&&n.some===m?n.some(t,e):(A(n,function(n,i,a){return u||(u=t.call(e,n,i,a))?r:void 0}),!!u)};j.contains=j.include=function(n,t){return null==n?!1:y&&n.indexOf===y?n.indexOf(t)!=-1:k(n,function(n){return n===t})},j.invoke=function(n,t){var r=o.call(arguments,2),e=j.isFunction(t);return j.map(n,function(n){return(e?t:n[t]).apply(n,r)})},j.pluck=function(n,t){return j.map(n,j.property(t))},j.where=function(n,t){return j.filter(n,j.matches(t))},j.findWhere=function(n,t){return j.find(n,j.matches(t))},j.max=function(n,t,r){if(!t&&j.isArray(n)&&n[0]===+n[0]&&n.length<65535)return Math.max.apply(Math,n);var e=-1/0,u=-1/0;return A(n,function(n,i,a){var o=t?t.call(r,n,i,a):n;o>u&&(e=n,u=o)}),e},j.min=function(n,t,r){if(!t&&j.isArray(n)&&n[0]===+n[0]&&n.length<65535)return Math.min.apply(Math,n);var e=1/0,u=1/0;return A(n,function(n,i,a){var o=t?t.call(r,n,i,a):n;u>o&&(e=n,u=o)}),e},j.shuffle=function(n){var t,r=0,e=[];return A(n,function(n){t=j.random(r++),e[r-1]=e[t],e[t]=n}),e},j.sample=function(n,t,r){return null==t||r?(n.length!==+n.length&&(n=j.values(n)),n[j.random(n.length-1)]):j.shuffle(n).slice(0,Math.max(0,t))};var E=function(n){return null==n?j.identity:j.isFunction(n)?n:j.property(n)};j.sortBy=function(n,t,r){return t=E(t),j.pluck(j.map(n,function(n,e,u){return{value:n,index:e,criteria:t.call(r,n,e,u)}}).sort(function(n,t){var r=n.criteria,e=t.criteria;if(r!==e){if(r>e||r===void 0)return 1;if(e>r||e===void 0)return-1}return n.index-t.index}),\"value\")};var F=function(n){return function(t,r,e){var u={};return r=E(r),A(t,function(i,a){var o=r.call(e,i,a,t);n(u,o,i)}),u}};j.groupBy=F(function(n,t,r){j.has(n,t)?n[t].push(r):n[t]=[r]}),j.indexBy=F(function(n,t,r){n[t]=r}),j.countBy=F(function(n,t){j.has(n,t)?n[t]++:n[t]=1}),j.sortedIndex=function(n,t,r,e){r=E(r);for(var u=r.call(e,t),i=0,a=n.length;a>i;){var o=i+a>>>1;r.call(e,n[o])<u?i=o+1:a=o}return i},j.toArray=function(n){return n?j.isArray(n)?o.call(n):n.length===+n.length?j.map(n,j.identity):j.values(n):[]},j.size=function(n){return null==n?0:n.length===+n.length?n.length:j.keys(n).length},j.first=j.head=j.take=function(n,t,r){return null==n?void 0:null==t||r?n[0]:0>t?[]:o.call(n,0,t)},j.initial=function(n,t,r){return o.call(n,0,n.length-(null==t||r?1:t))},j.last=function(n,t,r){return null==n?void 0:null==t||r?n[n.length-1]:o.call(n,Math.max(n.length-t,0))},j.rest=j.tail=j.drop=function(n,t,r){return o.call(n,null==t||r?1:t)},j.compact=function(n){return j.filter(n,j.identity)};var M=function(n,t,r){return t&&j.every(n,j.isArray)?c.apply(r,n):(A(n,function(n){j.isArray(n)||j.isArguments(n)?t?a.apply(r,n):M(n,t,r):r.push(n)}),r)};j.flatten=function(n,t){return M(n,t,[])},j.without=function(n){return j.difference(n,o.call(arguments,1))},j.partition=function(n,t){var r=[],e=[];return A(n,function(n){(t(n)?r:e).push(n)}),[r,e]},j.uniq=j.unique=function(n,t,r,e){j.isFunction(t)&&(e=r,r=t,t=!1);var u=r?j.map(n,r,e):n,i=[],a=[];return A(u,function(r,e){(t?e&&a[a.length-1]===r:j.contains(a,r))||(a.push(r),i.push(n[e]))}),i},j.union=function(){return j.uniq(j.flatten(arguments,!0))},j.intersection=function(n){var t=o.call(arguments,1);return j.filter(j.uniq(n),function(n){return j.every(t,function(t){return j.contains(t,n)})})},j.difference=function(n){var t=c.apply(e,o.call(arguments,1));return j.filter(n,function(n){return!j.contains(t,n)})},j.zip=function(){for(var n=j.max(j.pluck(arguments,\"length\").concat(0)),t=new Array(n),r=0;n>r;r++)t[r]=j.pluck(arguments,\"\"+r);return t},j.object=function(n,t){if(null==n)return{};for(var r={},e=0,u=n.length;u>e;e++)t?r[n[e]]=t[e]:r[n[e][0]]=n[e][1];return r},j.indexOf=function(n,t,r){if(null==n)return-1;var e=0,u=n.length;if(r){if(\"number\"!=typeof r)return e=j.sortedIndex(n,t),n[e]===t?e:-1;e=0>r?Math.max(0,u+r):r}if(y&&n.indexOf===y)return n.indexOf(t,r);for(;u>e;e++)if(n[e]===t)return e;return-1},j.lastIndexOf=function(n,t,r){if(null==n)return-1;var e=null!=r;if(b&&n.lastIndexOf===b)return e?n.lastIndexOf(t,r):n.lastIndexOf(t);for(var u=e?r:n.length;u--;)if(n[u]===t)return u;return-1},j.range=function(n,t,r){arguments.length<=1&&(t=n||0,n=0),r=arguments[2]||1;for(var e=Math.max(Math.ceil((t-n)/r),0),u=0,i=new Array(e);e>u;)i[u++]=n,n+=r;return i};var R=function(){};j.bind=function(n,t){var r,e;if(_&&n.bind===_)return _.apply(n,o.call(arguments,1));if(!j.isFunction(n))throw new TypeError;return r=o.call(arguments,2),e=function(){if(!(this instanceof e))return n.apply(t,r.concat(o.call(arguments)));R.prototype=n.prototype;var u=new R;R.prototype=null;var i=n.apply(u,r.concat(o.call(arguments)));return Object(i)===i?i:u}},j.partial=function(n){var t=o.call(arguments,1);return function(){for(var r=0,e=t.slice(),u=0,i=e.length;i>u;u++)e[u]===j&&(e[u]=arguments[r++]);for(;r<arguments.length;)e.push(arguments[r++]);return n.apply(this,e)}},j.bindAll=function(n){var t=o.call(arguments,1);if(0===t.length)throw new Error(\"bindAll must be passed function names\");return A(t,function(t){n[t]=j.bind(n[t],n)}),n},j.memoize=function(n,t){var r={};return t||(t=j.identity),function(){var e=t.apply(this,arguments);return j.has(r,e)?r[e]:r[e]=n.apply(this,arguments)}},j.delay=function(n,t){var r=o.call(arguments,2);return setTimeout(function(){return n.apply(null,r)},t)},j.defer=function(n){return j.delay.apply(j,[n,1].concat(o.call(arguments,1)))},j.throttle=function(n,t,r){var e,u,i,a=null,o=0;r||(r={});var c=function(){o=r.leading===!1?0:j.now(),a=null,i=n.apply(e,u),e=u=null};return function(){var l=j.now();o||r.leading!==!1||(o=l);var f=t-(l-o);return e=this,u=arguments,0>=f?(clearTimeout(a),a=null,o=l,i=n.apply(e,u),e=u=null):a||r.trailing===!1||(a=setTimeout(c,f)),i}},j.debounce=function(n,t,r){var e,u,i,a,o,c=function(){var l=j.now()-a;t>l?e=setTimeout(c,t-l):(e=null,r||(o=n.apply(i,u),i=u=null))};return function(){i=this,u=arguments,a=j.now();var l=r&&!e;return e||(e=setTimeout(c,t)),l&&(o=n.apply(i,u),i=u=null),o}},j.once=function(n){var t,r=!1;return function(){return r?t:(r=!0,t=n.apply(this,arguments),n=null,t)}},j.wrap=function(n,t){return j.partial(t,n)},j.compose=function(){var n=arguments;return function(){for(var t=arguments,r=n.length-1;r>=0;r--)t=[n[r].apply(this,t)];return t[0]}},j.after=function(n,t){return function(){return--n<1?t.apply(this,arguments):void 0}},j.keys=function(n){if(!j.isObject(n))return[];if(w)return w(n);var t=[];for(var r in n)j.has(n,r)&&t.push(r);return t},j.values=function(n){for(var t=j.keys(n),r=t.length,e=new Array(r),u=0;r>u;u++)e[u]=n[t[u]];return e},j.pairs=function(n){for(var t=j.keys(n),r=t.length,e=new Array(r),u=0;r>u;u++)e[u]=[t[u],n[t[u]]];return e},j.invert=function(n){for(var t={},r=j.keys(n),e=0,u=r.length;u>e;e++)t[n[r[e]]]=r[e];return t},j.functions=j.methods=function(n){var t=[];for(var r in n)j.isFunction(n[r])&&t.push(r);return t.sort()},j.extend=function(n){return A(o.call(arguments,1),function(t){if(t)for(var r in t)n[r]=t[r]}),n},j.pick=function(n){var t={},r=c.apply(e,o.call(arguments,1));return A(r,function(r){r in n&&(t[r]=n[r])}),t},j.omit=function(n){var t={},r=c.apply(e,o.call(arguments,1));for(var u in n)j.contains(r,u)||(t[u]=n[u]);return t},j.defaults=function(n){return A(o.call(arguments,1),function(t){if(t)for(var r in t)n[r]===void 0&&(n[r]=t[r])}),n},j.clone=function(n){return j.isObject(n)?j.isArray(n)?n.slice():j.extend({},n):n},j.tap=function(n,t){return t(n),n};var S=function(n,t,r,e){if(n===t)return 0!==n||1/n==1/t;if(null==n||null==t)return n===t;n instanceof j&&(n=n._wrapped),t instanceof j&&(t=t._wrapped);var u=l.call(n);if(u!=l.call(t))return!1;switch(u){case\"[object String]\":return n==String(t);case\"[object Number]\":return n!=+n?t!=+t:0==n?1/n==1/t:n==+t;case\"[object Date]\":case\"[object Boolean]\":return+n==+t;case\"[object RegExp]\":return n.source==t.source&&n.global==t.global&&n.multiline==t.multiline&&n.ignoreCase==t.ignoreCase}if(\"object\"!=typeof n||\"object\"!=typeof t)return!1;for(var i=r.length;i--;)if(r[i]==n)return e[i]==t;var a=n.constructor,o=t.constructor;if(a!==o&&!(j.isFunction(a)&&a instanceof a&&j.isFunction(o)&&o instanceof o)&&\"constructor\"in n&&\"constructor\"in t)return!1;r.push(n),e.push(t);var c=0,f=!0;if(\"[object Array]\"==u){if(c=n.length,f=c==t.length)for(;c--&&(f=S(n[c],t[c],r,e)););}else{for(var s in n)if(j.has(n,s)&&(c++,!(f=j.has(t,s)&&S(n[s],t[s],r,e))))break;if(f){for(s in t)if(j.has(t,s)&&!c--)break;f=!c}}return r.pop(),e.pop(),f};j.isEqual=function(n,t){return S(n,t,[],[])},j.isEmpty=function(n){if(null==n)return!0;if(j.isArray(n)||j.isString(n))return 0===n.length;for(var t in n)if(j.has(n,t))return!1;return!0},j.isElement=function(n){return!(!n||1!==n.nodeType)},j.isArray=x||function(n){return\"[object Array]\"==l.call(n)},j.isObject=function(n){return n===Object(n)},A([\"Arguments\",\"Function\",\"String\",\"Number\",\"Date\",\"RegExp\"],function(n){j[\"is\"+n]=function(t){return l.call(t)==\"[object \"+n+\"]\"}}),j.isArguments(arguments)||(j.isArguments=function(n){return!(!n||!j.has(n,\"callee\"))}),\"function\"!=typeof/./&&(j.isFunction=function(n){return\"function\"==typeof n}),j.isFinite=function(n){return isFinite(n)&&!isNaN(parseFloat(n))},j.isNaN=function(n){return j.isNumber(n)&&n!=+n},j.isBoolean=function(n){return n===!0||n===!1||\"[object Boolean]\"==l.call(n)},j.isNull=function(n){return null===n},j.isUndefined=function(n){return n===void 0},j.has=function(n,t){return f.call(n,t)},j.noConflict=function(){return n._=t,this},j.identity=function(n){return n},j.constant=function(n){return function(){return n}},j.property=function(n){return function(t){return t[n]}},j.matches=function(n){return function(t){if(t===n)return!0;for(var r in n)if(n[r]!==t[r])return!1;return!0}},j.times=function(n,t,r){for(var e=Array(Math.max(0,n)),u=0;n>u;u++)e[u]=t.call(r,u);return e},j.random=function(n,t){return null==t&&(t=n,n=0),n+Math.floor(Math.random()*(t-n+1))},j.now=Date.now||function(){return(new Date).getTime()};var T={escape:{\"&\":\"&amp;\",\"<\":\"&lt;\",\">\":\"&gt;\",'\"':\"&quot;\",\"'\":\"&#x27;\"}};T.unescape=j.invert(T.escape);var I={escape:new RegExp(\"[\"+j.keys(T.escape).join(\"\")+\"]\",\"g\"),unescape:new RegExp(\"(\"+j.keys(T.unescape).join(\"|\")+\")\",\"g\")};j.each([\"escape\",\"unescape\"],function(n){j[n]=function(t){return null==t?\"\":(\"\"+t).replace(I[n],function(t){return T[n][t]})}}),j.result=function(n,t){if(null==n)return void 0;var r=n[t];return j.isFunction(r)?r.call(n):r},j.mixin=function(n){A(j.functions(n),function(t){var r=j[t]=n[t];j.prototype[t]=function(){var n=[this._wrapped];return a.apply(n,arguments),z.call(this,r.apply(j,n))}})};var N=0;j.uniqueId=function(n){var t=++N+\"\";return n?n+t:t},j.templateSettings={evaluate:/<%([\\s\\S]+?)%>/g,interpolate:/<%=([\\s\\S]+?)%>/g,escape:/<%-([\\s\\S]+?)%>/g};var q=/(.)^/,B={\"'\":\"'\",\"\\\\\":\"\\\\\",\"\\r\":\"r\",\"\\n\":\"n\",\"  \":\"t\",\"\\u2028\":\"u2028\",\"\\u2029\":\"u2029\"},D=/\\\\|'|\\r|\\n|\\t|\\u2028|\\u2029/g;j.template=function(n,t,r){var e;r=j.defaults({},r,j.templateSettings);var u=new RegExp([(r.escape||q).source,(r.interpolate||q).source,(r.evaluate||q).source].join(\"|\")+\"|$\",\"g\"),i=0,a=\"__p+='\";n.replace(u,function(t,r,e,u,o){return a+=n.slice(i,o).replace(D,function(n){return\"\\\\\"+B[n]}),r&&(a+=\"'+\\n((__t=(\"+r+\"))==null?'':_.escape(__t))+\\n'\"),e&&(a+=\"'+\\n((__t=(\"+e+\"))==null?'':__t)+\\n'\"),u&&(a+=\"';\\n\"+u+\"\\n__p+='\"),i=o+t.length,t}),a+=\"';\\n\",r.variable||(a=\"with(obj||{}){\\n\"+a+\"}\\n\"),a=\"var __t,__p='',__j=Array.prototype.join,\"+\"print=function(){__p+=__j.call(arguments,'');};\\n\"+a+\"return __p;\\n\";try{e=new Function(r.variable||\"obj\",\"_\",a)}catch(o){throw o.source=a,o}if(t)return e(t,j);var c=function(n){return e.call(this,n,j)};return c.source=\"function(\"+(r.variable||\"obj\")+\"){\\n\"+a+\"}\",c},j.chain=function(n){return j(n).chain()};var z=function(n){return this._chain?j(n).chain():n};j.mixin(j),A([\"pop\",\"push\",\"reverse\",\"shift\",\"sort\",\"splice\",\"unshift\"],function(n){var t=e[n];j.prototype[n]=function(){var r=this._wrapped;return t.apply(r,arguments),\"shift\"!=n&&\"splice\"!=n||0!==r.length||delete r[0],z.call(this,r)}}),A([\"concat\",\"join\",\"slice\"],function(n){var t=e[n];j.prototype[n]=function(){return z.call(this,t.apply(this._wrapped,arguments))}}),j.extend(j.prototype,{chain:function(){return this._chain=!0,this},value:function(){return this._wrapped}}),\"function\"==typeof define&&define.amd&&define(\"underscore\",[],function(){return j})}).call(this);\n//# sourceMappingURL=underscore-min.map",
      "type": "blob"
    },
    "_lib/hamljr_runtime": {
      "path": "_lib/hamljr_runtime",
      "content": "(function() {\n  var Runtime, dataName, document,\n    __slice = [].slice;\n\n  dataName = \"__hamlJR_data\";\n\n  if (typeof window !== \"undefined\" && window !== null) {\n    document = window.document;\n  } else {\n    document = global.document;\n  }\n\n  Runtime = function(context) {\n    var append, bindObservable, classes, id, lastParent, observeAttribute, observeText, pop, push, render, self, stack, top;\n    stack = [];\n    lastParent = function() {\n      var element, i;\n      i = stack.length - 1;\n      while ((element = stack[i]) && element.nodeType === 11) {\n        i -= 1;\n      }\n      return element;\n    };\n    top = function() {\n      return stack[stack.length - 1];\n    };\n    append = function(child) {\n      var _ref;\n      if ((_ref = top()) != null) {\n        _ref.appendChild(child);\n      }\n      return child;\n    };\n    push = function(child) {\n      return stack.push(child);\n    };\n    pop = function() {\n      return append(stack.pop());\n    };\n    render = function(child) {\n      push(child);\n      return pop();\n    };\n    bindObservable = function(element, value, update) {\n      var observable, observe, unobserve;\n      if (typeof Observable === \"undefined\" || Observable === null) {\n        update(value);\n        return;\n      }\n      observable = Observable(value);\n      observe = function() {\n        observable.observe(update);\n        return update(observable());\n      };\n      unobserve = function() {\n        return observable.stopObserving(update);\n      };\n      element.addEventListener(\"DOMNodeInserted\", observe, true);\n      element.addEventListener(\"DOMNodeRemoved\", unobserve, true);\n      return element;\n    };\n    id = function() {\n      var element, sources, update, value;\n      sources = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n      element = top();\n      update = function(newValue) {\n        if (typeof newValue === \"function\") {\n          newValue = newValue();\n        }\n        return element.id = newValue;\n      };\n      value = function() {\n        var possibleValues;\n        possibleValues = sources.map(function(source) {\n          if (typeof source === \"function\") {\n            return source();\n          } else {\n            return source;\n          }\n        }).filter(function(idValue) {\n          return idValue != null;\n        });\n        return possibleValues[possibleValues.length - 1];\n      };\n      return bindObservable(element, value, update);\n    };\n    classes = function() {\n      var element, sources, update, value;\n      sources = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n      element = top();\n      update = function(newValue) {\n        if (typeof newValue === \"function\") {\n          newValue = newValue();\n        }\n        return element.className = newValue;\n      };\n      value = function() {\n        var possibleValues;\n        possibleValues = sources.map(function(source) {\n          if (typeof source === \"function\") {\n            return source();\n          } else {\n            return source;\n          }\n        }).filter(function(sourceValue) {\n          return sourceValue != null;\n        });\n        return possibleValues.join(\" \");\n      };\n      return bindObservable(element, value, update);\n    };\n    observeAttribute = function(name, value) {\n      var element, update;\n      element = top();\n      if ((name === \"value\") && (typeof value === \"function\")) {\n        element.value = value();\n        element.onchange = function() {\n          return value(element.value);\n        };\n        if (value.observe) {\n          value.observe(function(newValue) {\n            return element.value = newValue;\n          });\n        }\n      } else {\n        update = function(newValue) {\n          return element.setAttribute(name, newValue);\n        };\n        bindObservable(element, value, update);\n      }\n      return element;\n    };\n    observeText = function(value) {\n      var element, update;\n      switch (value != null ? value.nodeType : void 0) {\n        case 1:\n        case 3:\n        case 11:\n          render(value);\n          return;\n      }\n      element = document.createTextNode('');\n      update = function(newValue) {\n        return element.nodeValue = newValue;\n      };\n      bindObservable(element, value, update);\n      return render(element);\n    };\n    self = {\n      push: push,\n      pop: pop,\n      id: id,\n      classes: classes,\n      attribute: observeAttribute,\n      text: observeText,\n      filter: function(name, content) {},\n      each: function(items, fn) {\n        var elements, parent, replace;\n        items = Observable(items);\n        elements = [];\n        parent = lastParent();\n        items.observe(function(newItems) {\n          return replace(elements, newItems);\n        });\n        replace = function(oldElements, items) {\n          var firstElement;\n          if (oldElements) {\n            firstElement = oldElements[0];\n            parent = (firstElement != null ? firstElement.parentElement : void 0) || parent;\n            elements = items.map(function(item, index, array) {\n              var element;\n              element = fn.call(item, item, index, array);\n              element[dataName] = item;\n              parent.insertBefore(element, firstElement);\n              return element;\n            });\n            return oldElements.forEach(function(element) {\n              return element.remove();\n            });\n          } else {\n            return elements = items.map(function(item, index, array) {\n              var element;\n              element = fn.call(item, item, index, array);\n              element[dataName] = item;\n              return element;\n            });\n          }\n        };\n        return replace(null, items);\n      },\n      \"with\": function(item, fn) {\n        var element, replace, value;\n        element = null;\n        item = Observable(item);\n        item.observe(function(newValue) {\n          return replace(element, newValue);\n        });\n        value = item();\n        replace = function(oldElement, value) {\n          var parent;\n          element = fn.call(value);\n          element[dataName] = item;\n          if (oldElement) {\n            parent = oldElement.parentElement;\n            parent.insertBefore(element, oldElement);\n            return oldElement.remove();\n          } else {\n\n          }\n        };\n        return replace(element, value);\n      },\n      on: function(eventName, fn) {\n        var element;\n        element = lastParent();\n        if (eventName === \"change\") {\n          switch (element.nodeName) {\n            case \"SELECT\":\n              element[\"on\" + eventName] = function() {\n                var selectedOption;\n                selectedOption = this.options[this.selectedIndex];\n                return fn(selectedOption[dataName]);\n              };\n              if (fn.observe) {\n                return fn.observe(function(newValue) {\n                  return Array.prototype.forEach.call(element.options, function(option, index) {\n                    if (option[dataName] === newValue) {\n                      return element.selectedIndex = index;\n                    }\n                  });\n                });\n              }\n              break;\n            default:\n              element[\"on\" + eventName] = function() {\n                return fn(element.value);\n              };\n              if (fn.observe) {\n                return fn.observe(function(newValue) {\n                  return element.value = newValue;\n                });\n              }\n          }\n        } else {\n          return element[\"on\" + eventName] = function(event) {\n            return fn.call(context, event);\n          };\n        }\n      }\n    };\n    return self;\n  };\n\n  module.exports = Runtime;\n\n}).call(this);\n",
      "type": "blob"
    }
  },
  "progenitor": {
    "url": "http://strd6.github.io/editor/"
  },
  "version": "0.3.1-pre.5",
  "entryPoint": "main",
  "repository": {
    "id": 13128952,
    "name": "filetree",
    "full_name": "STRd6/filetree",
    "owner": {
      "login": "STRd6",
      "id": 18894,
      "avatar_url": "https://avatars.githubusercontent.com/u/18894?",
      "gravatar_id": "33117162fff8a9cf50544a604f60c045",
      "url": "https://api.github.com/users/STRd6",
      "html_url": "https://github.com/STRd6",
      "followers_url": "https://api.github.com/users/STRd6/followers",
      "following_url": "https://api.github.com/users/STRd6/following{/other_user}",
      "gists_url": "https://api.github.com/users/STRd6/gists{/gist_id}",
      "starred_url": "https://api.github.com/users/STRd6/starred{/owner}{/repo}",
      "subscriptions_url": "https://api.github.com/users/STRd6/subscriptions",
      "organizations_url": "https://api.github.com/users/STRd6/orgs",
      "repos_url": "https://api.github.com/users/STRd6/repos",
      "events_url": "https://api.github.com/users/STRd6/events{/privacy}",
      "received_events_url": "https://api.github.com/users/STRd6/received_events",
      "type": "User",
      "site_admin": false
    },
    "private": false,
    "html_url": "https://github.com/STRd6/filetree",
    "description": "A simple filetree",
    "fork": false,
    "url": "https://api.github.com/repos/STRd6/filetree",
    "forks_url": "https://api.github.com/repos/STRd6/filetree/forks",
    "keys_url": "https://api.github.com/repos/STRd6/filetree/keys{/key_id}",
    "collaborators_url": "https://api.github.com/repos/STRd6/filetree/collaborators{/collaborator}",
    "teams_url": "https://api.github.com/repos/STRd6/filetree/teams",
    "hooks_url": "https://api.github.com/repos/STRd6/filetree/hooks",
    "issue_events_url": "https://api.github.com/repos/STRd6/filetree/issues/events{/number}",
    "events_url": "https://api.github.com/repos/STRd6/filetree/events",
    "assignees_url": "https://api.github.com/repos/STRd6/filetree/assignees{/user}",
    "branches_url": "https://api.github.com/repos/STRd6/filetree/branches{/branch}",
    "tags_url": "https://api.github.com/repos/STRd6/filetree/tags",
    "blobs_url": "https://api.github.com/repos/STRd6/filetree/git/blobs{/sha}",
    "git_tags_url": "https://api.github.com/repos/STRd6/filetree/git/tags{/sha}",
    "git_refs_url": "https://api.github.com/repos/STRd6/filetree/git/refs{/sha}",
    "trees_url": "https://api.github.com/repos/STRd6/filetree/git/trees{/sha}",
    "statuses_url": "https://api.github.com/repos/STRd6/filetree/statuses/{sha}",
    "languages_url": "https://api.github.com/repos/STRd6/filetree/languages",
    "stargazers_url": "https://api.github.com/repos/STRd6/filetree/stargazers",
    "contributors_url": "https://api.github.com/repos/STRd6/filetree/contributors",
    "subscribers_url": "https://api.github.com/repos/STRd6/filetree/subscribers",
    "subscription_url": "https://api.github.com/repos/STRd6/filetree/subscription",
    "commits_url": "https://api.github.com/repos/STRd6/filetree/commits{/sha}",
    "git_commits_url": "https://api.github.com/repos/STRd6/filetree/git/commits{/sha}",
    "comments_url": "https://api.github.com/repos/STRd6/filetree/comments{/number}",
    "issue_comment_url": "https://api.github.com/repos/STRd6/filetree/issues/comments/{number}",
    "contents_url": "https://api.github.com/repos/STRd6/filetree/contents/{+path}",
    "compare_url": "https://api.github.com/repos/STRd6/filetree/compare/{base}...{head}",
    "merges_url": "https://api.github.com/repos/STRd6/filetree/merges",
    "archive_url": "https://api.github.com/repos/STRd6/filetree/{archive_format}{/ref}",
    "downloads_url": "https://api.github.com/repos/STRd6/filetree/downloads",
    "issues_url": "https://api.github.com/repos/STRd6/filetree/issues{/number}",
    "pulls_url": "https://api.github.com/repos/STRd6/filetree/pulls{/number}",
    "milestones_url": "https://api.github.com/repos/STRd6/filetree/milestones{/number}",
    "notifications_url": "https://api.github.com/repos/STRd6/filetree/notifications{?since,all,participating}",
    "labels_url": "https://api.github.com/repos/STRd6/filetree/labels{/name}",
    "releases_url": "https://api.github.com/repos/STRd6/filetree/releases{/id}",
    "created_at": "2013-09-26T17:13:32Z",
    "updated_at": "2014-04-09T02:07:28Z",
    "pushed_at": "2014-04-09T02:07:28Z",
    "git_url": "git://github.com/STRd6/filetree.git",
    "ssh_url": "git@github.com:STRd6/filetree.git",
    "clone_url": "https://github.com/STRd6/filetree.git",
    "svn_url": "https://github.com/STRd6/filetree",
    "homepage": null,
    "size": 220,
    "stargazers_count": 0,
    "watchers_count": 0,
    "language": "CoffeeScript",
    "has_issues": true,
    "has_downloads": true,
    "has_wiki": true,
    "forks_count": 0,
    "mirror_url": null,
    "open_issues_count": 1,
    "forks": 0,
    "open_issues": 1,
    "watchers": 0,
    "default_branch": "master",
    "master_branch": "master",
    "permissions": {
      "admin": true,
      "push": true,
      "pull": true
    },
    "network_count": 0,
    "subscribers_count": 1,
    "branch": "v0.3.1-pre.4",
    "publishBranch": "gh-pages"
  },
  "dependencies": {
    "composition": {
      "source": {
        "LICENSE": {
          "path": "LICENSE",
          "mode": "100644",
          "content": "The MIT License (MIT)\n\nCopyright (c) 2014 Daniel X Moore\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of\nthis software and associated documentation files (the \"Software\"), to deal in\nthe Software without restriction, including without limitation the rights to\nuse, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of\nthe Software, and to permit persons to whom the Software is furnished to do so,\nsubject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS\nFOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR\nCOPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER\nIN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN\nCONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n",
          "type": "blob"
        },
        "README.coffee.md": {
          "path": "README.coffee.md",
          "mode": "100644",
          "content": "Compositions\n============\n\nThe `compositions` module provides helper methods to compose nested data models.\n\nCompositions uses [Observable](/observable/docs) to keep the internal data in sync.\n\n    Core = require \"core\"\n    Observable = require \"observable\"\n\n    module.exports = (I={}, self=Core(I)) ->\n\n      self.extend\n\nObserve any number of attributes as simple observables. For each attribute name passed in we expose a public getter/setter method and listen to changes when the value is set.\n\n        attrObservable: (names...) ->\n          names.forEach (name) ->\n            self[name] = Observable(I[name])\n\n            self[name].observe (newValue) ->\n              I[name] = newValue\n\n          return self\n\nObserve an attribute as a model. Treats the attribute given as an Observable\nmodel instance exposting a getter/setter method of the same name. The Model\nconstructor must be passed in explicitly.\n\n        attrModel: (name, Model) ->\n          model = Model(I[name])\n\n          self[name] = Observable(model)\n\n          self[name].observe (newValue) ->\n            I[name] = newValue.I\n\n          return self\n\nObserve an attribute as a list of sub-models. This is the same as `attrModel`\nexcept the attribute is expected to be an array of models rather than a single one.\n\n        attrModels: (name, Model) ->\n          models = (I[name] or []).map (x) ->\n            Model(x)\n\n          self[name] = Observable(models)\n\n          self[name].observe (newValue) ->\n            I[name] = newValue.map (instance) ->\n              instance.I\n\n          return self\n\nThe JSON representation is kept up to date via the observable properites and resides in `I`.\n\n        toJSON: ->\n          I\n\nReturn our public object.\n\n      return self\n",
          "type": "blob"
        },
        "pixie.cson": {
          "path": "pixie.cson",
          "mode": "100644",
          "content": "entryPoint: \"README\"\nversion: \"0.1.1\"\ndependencies:\n  core: \"distri/core:v0.6.0\"\n  observable: \"distri/observable:v0.1.1\"\n",
          "type": "blob"
        },
        "test/compositions.coffee": {
          "path": "test/compositions.coffee",
          "mode": "100644",
          "content": "\nModel = require \"../README\"\n\ndescribe 'Model', ->\n  # Association Testing model\n  Person = (I) ->\n    person = Model(I)\n\n    person.attrAccessor(\n      'firstName'\n      'lastName'\n      'suffix'\n    )\n\n    person.fullName = ->\n      \"#{@firstName()} #{@lastName()} #{@suffix()}\"\n\n    return person\n\n  describe \"#attrObservable\", ->\n    it 'should allow for observing of attributes', ->\n      model = Model\n        name: \"Duder\"\n\n      model.attrObservable \"name\"\n\n      model.name(\"Dudeman\")\n\n      assert.equal model.name(), \"Dudeman\"\n\n    it 'should bind properties to observable attributes', ->\n      model = Model\n        name: \"Duder\"\n\n      model.attrObservable \"name\"\n\n      model.name(\"Dudeman\")\n\n      assert.equal model.name(), \"Dudeman\"\n      assert.equal model.name(), model.I.name\n\n  describe \"#attrModel\", ->\n    it \"should be a model instance\", ->\n      model = Model\n        person:\n          firstName: \"Duder\"\n          lastName: \"Mannington\"\n          suffix: \"Jr.\"\n\n      model.attrModel(\"person\", Person)\n\n      assert.equal model.person().fullName(), \"Duder Mannington Jr.\"\n\n    it \"should allow setting the associated model\", ->\n      model = Model\n        person:\n          firstName: \"Duder\"\n          lastName: \"Mannington\"\n          suffix: \"Jr.\"\n\n      model.attrModel(\"person\", Person)\n\n      otherPerson = Person\n        firstName: \"Mr.\"\n        lastName: \"Man\"\n\n      model.person(otherPerson)\n\n      assert.equal model.person().firstName(), \"Mr.\"\n\n    it \"shouldn't update the instance properties after it's been replaced\", ->\n      model = Model\n        person:\n          firstName: \"Duder\"\n          lastName: \"Mannington\"\n          suffix: \"Jr.\"\n\n      model.attrModel(\"person\", Person)\n\n      duder = model.person()\n\n      otherPerson = Person\n        firstName: \"Mr.\"\n        lastName: \"Man\"\n\n      model.person(otherPerson)\n\n      duder.firstName(\"Joe\")\n\n      assert.equal duder.I.firstName, \"Joe\"\n      assert.equal model.I.person.firstName, \"Mr.\"\n\n  describe \"#attrModels\", ->\n    it \"should have an array of model instances\", ->\n      model = Model\n        people: [{\n          firstName: \"Duder\"\n          lastName: \"Mannington\"\n          suffix: \"Jr.\"\n        }, {\n          firstName: \"Mr.\"\n          lastName: \"Mannington\"\n          suffix: \"Sr.\"\n        }]\n\n      model.attrModels(\"people\", Person)\n\n      assert.equal model.people()[0].fullName(), \"Duder Mannington Jr.\"\n\n    it \"should track pushes\", ->\n      model = Model\n        people: [{\n          firstName: \"Duder\"\n          lastName: \"Mannington\"\n          suffix: \"Jr.\"\n        }, {\n          firstName: \"Mr.\"\n          lastName: \"Mannington\"\n          suffix: \"Sr.\"\n        }]\n\n      model.attrModels(\"people\", Person)\n\n      model.people.push Person\n        firstName: \"JoJo\"\n        lastName: \"Loco\"\n\n      assert.equal model.people().length, 3\n      assert.equal model.I.people.length, 3\n\n    it \"should track pops\", ->\n      model = Model\n        people: [{\n          firstName: \"Duder\"\n          lastName: \"Mannington\"\n          suffix: \"Jr.\"\n        }, {\n          firstName: \"Mr.\"\n          lastName: \"Mannington\"\n          suffix: \"Sr.\"\n        }]\n\n      model.attrModels(\"people\", Person)\n\n      model.people.pop()\n\n      assert.equal model.people().length, 1\n      assert.equal model.I.people.length, 1\n\n  describe \"#toJSON\", ->\n    it \"should return an object appropriate for JSON serialization\", ->\n      model = Model\n        test: true\n\n      assert model.toJSON().test\n\n  describe \"#observeAll\", ->\n    it \"should observe all attributes of a simple model\"\n    ->  # TODO\n      model = Model\n        test: true\n        yolo: \"4life\"\n\n      model.observeAll()\n\n      assert model.test()\n      assert.equal model.yolo(), \"4life\"\n\n    it \"should camel case underscored names\"",
          "type": "blob"
        }
      },
      "distribution": {
        "README": {
          "path": "README",
          "content": "(function() {\n  var Core, Observable,\n    __slice = [].slice;\n\n  Core = require(\"core\");\n\n  Observable = require(\"observable\");\n\n  module.exports = function(I, self) {\n    if (I == null) {\n      I = {};\n    }\n    if (self == null) {\n      self = Core(I);\n    }\n    self.extend({\n      attrObservable: function() {\n        var names;\n        names = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n        names.forEach(function(name) {\n          self[name] = Observable(I[name]);\n          return self[name].observe(function(newValue) {\n            return I[name] = newValue;\n          });\n        });\n        return self;\n      },\n      attrModel: function(name, Model) {\n        var model;\n        model = Model(I[name]);\n        self[name] = Observable(model);\n        self[name].observe(function(newValue) {\n          return I[name] = newValue.I;\n        });\n        return self;\n      },\n      attrModels: function(name, Model) {\n        var models;\n        models = (I[name] || []).map(function(x) {\n          return Model(x);\n        });\n        self[name] = Observable(models);\n        self[name].observe(function(newValue) {\n          return I[name] = newValue.map(function(instance) {\n            return instance.I;\n          });\n        });\n        return self;\n      },\n      toJSON: function() {\n        return I;\n      }\n    });\n    return self;\n  };\n\n}).call(this);\n",
          "type": "blob"
        },
        "pixie": {
          "path": "pixie",
          "content": "module.exports = {\"entryPoint\":\"README\",\"version\":\"0.1.1\",\"dependencies\":{\"core\":\"distri/core:v0.6.0\",\"observable\":\"distri/observable:v0.1.1\"}};",
          "type": "blob"
        },
        "test/compositions": {
          "path": "test/compositions",
          "content": "(function() {\n  var Model;\n\n  Model = require(\"../README\");\n\n  describe('Model', function() {\n    var Person;\n    Person = function(I) {\n      var person;\n      person = Model(I);\n      person.attrAccessor('firstName', 'lastName', 'suffix');\n      person.fullName = function() {\n        return \"\" + (this.firstName()) + \" \" + (this.lastName()) + \" \" + (this.suffix());\n      };\n      return person;\n    };\n    describe(\"#attrObservable\", function() {\n      it('should allow for observing of attributes', function() {\n        var model;\n        model = Model({\n          name: \"Duder\"\n        });\n        model.attrObservable(\"name\");\n        model.name(\"Dudeman\");\n        return assert.equal(model.name(), \"Dudeman\");\n      });\n      return it('should bind properties to observable attributes', function() {\n        var model;\n        model = Model({\n          name: \"Duder\"\n        });\n        model.attrObservable(\"name\");\n        model.name(\"Dudeman\");\n        assert.equal(model.name(), \"Dudeman\");\n        return assert.equal(model.name(), model.I.name);\n      });\n    });\n    describe(\"#attrModel\", function() {\n      it(\"should be a model instance\", function() {\n        var model;\n        model = Model({\n          person: {\n            firstName: \"Duder\",\n            lastName: \"Mannington\",\n            suffix: \"Jr.\"\n          }\n        });\n        model.attrModel(\"person\", Person);\n        return assert.equal(model.person().fullName(), \"Duder Mannington Jr.\");\n      });\n      it(\"should allow setting the associated model\", function() {\n        var model, otherPerson;\n        model = Model({\n          person: {\n            firstName: \"Duder\",\n            lastName: \"Mannington\",\n            suffix: \"Jr.\"\n          }\n        });\n        model.attrModel(\"person\", Person);\n        otherPerson = Person({\n          firstName: \"Mr.\",\n          lastName: \"Man\"\n        });\n        model.person(otherPerson);\n        return assert.equal(model.person().firstName(), \"Mr.\");\n      });\n      return it(\"shouldn't update the instance properties after it's been replaced\", function() {\n        var duder, model, otherPerson;\n        model = Model({\n          person: {\n            firstName: \"Duder\",\n            lastName: \"Mannington\",\n            suffix: \"Jr.\"\n          }\n        });\n        model.attrModel(\"person\", Person);\n        duder = model.person();\n        otherPerson = Person({\n          firstName: \"Mr.\",\n          lastName: \"Man\"\n        });\n        model.person(otherPerson);\n        duder.firstName(\"Joe\");\n        assert.equal(duder.I.firstName, \"Joe\");\n        return assert.equal(model.I.person.firstName, \"Mr.\");\n      });\n    });\n    describe(\"#attrModels\", function() {\n      it(\"should have an array of model instances\", function() {\n        var model;\n        model = Model({\n          people: [\n            {\n              firstName: \"Duder\",\n              lastName: \"Mannington\",\n              suffix: \"Jr.\"\n            }, {\n              firstName: \"Mr.\",\n              lastName: \"Mannington\",\n              suffix: \"Sr.\"\n            }\n          ]\n        });\n        model.attrModels(\"people\", Person);\n        return assert.equal(model.people()[0].fullName(), \"Duder Mannington Jr.\");\n      });\n      it(\"should track pushes\", function() {\n        var model;\n        model = Model({\n          people: [\n            {\n              firstName: \"Duder\",\n              lastName: \"Mannington\",\n              suffix: \"Jr.\"\n            }, {\n              firstName: \"Mr.\",\n              lastName: \"Mannington\",\n              suffix: \"Sr.\"\n            }\n          ]\n        });\n        model.attrModels(\"people\", Person);\n        model.people.push(Person({\n          firstName: \"JoJo\",\n          lastName: \"Loco\"\n        }));\n        assert.equal(model.people().length, 3);\n        return assert.equal(model.I.people.length, 3);\n      });\n      return it(\"should track pops\", function() {\n        var model;\n        model = Model({\n          people: [\n            {\n              firstName: \"Duder\",\n              lastName: \"Mannington\",\n              suffix: \"Jr.\"\n            }, {\n              firstName: \"Mr.\",\n              lastName: \"Mannington\",\n              suffix: \"Sr.\"\n            }\n          ]\n        });\n        model.attrModels(\"people\", Person);\n        model.people.pop();\n        assert.equal(model.people().length, 1);\n        return assert.equal(model.I.people.length, 1);\n      });\n    });\n    describe(\"#toJSON\", function() {\n      return it(\"should return an object appropriate for JSON serialization\", function() {\n        var model;\n        model = Model({\n          test: true\n        });\n        return assert(model.toJSON().test);\n      });\n    });\n    return describe(\"#observeAll\", function() {\n      it(\"should observe all attributes of a simple model\");\n      (function() {\n        var model;\n        model = Model({\n          test: true,\n          yolo: \"4life\"\n        });\n        model.observeAll();\n        assert(model.test());\n        return assert.equal(model.yolo(), \"4life\");\n      });\n      return it(\"should camel case underscored names\");\n    });\n  });\n\n}).call(this);\n",
          "type": "blob"
        }
      },
      "progenitor": {
        "url": "http://strd6.github.io/editor/"
      },
      "version": "0.1.1",
      "entryPoint": "README",
      "repository": {
        "id": 17256636,
        "name": "compositions",
        "full_name": "distri/compositions",
        "owner": {
          "login": "distri",
          "id": 6005125,
          "avatar_url": "https://avatars.githubusercontent.com/u/6005125?",
          "gravatar_id": "192f3f168409e79c42107f081139d9f3",
          "url": "https://api.github.com/users/distri",
          "html_url": "https://github.com/distri",
          "followers_url": "https://api.github.com/users/distri/followers",
          "following_url": "https://api.github.com/users/distri/following{/other_user}",
          "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
          "organizations_url": "https://api.github.com/users/distri/orgs",
          "repos_url": "https://api.github.com/users/distri/repos",
          "events_url": "https://api.github.com/users/distri/events{/privacy}",
          "received_events_url": "https://api.github.com/users/distri/received_events",
          "type": "Organization",
          "site_admin": false
        },
        "private": false,
        "html_url": "https://github.com/distri/compositions",
        "description": "",
        "fork": false,
        "url": "https://api.github.com/repos/distri/compositions",
        "forks_url": "https://api.github.com/repos/distri/compositions/forks",
        "keys_url": "https://api.github.com/repos/distri/compositions/keys{/key_id}",
        "collaborators_url": "https://api.github.com/repos/distri/compositions/collaborators{/collaborator}",
        "teams_url": "https://api.github.com/repos/distri/compositions/teams",
        "hooks_url": "https://api.github.com/repos/distri/compositions/hooks",
        "issue_events_url": "https://api.github.com/repos/distri/compositions/issues/events{/number}",
        "events_url": "https://api.github.com/repos/distri/compositions/events",
        "assignees_url": "https://api.github.com/repos/distri/compositions/assignees{/user}",
        "branches_url": "https://api.github.com/repos/distri/compositions/branches{/branch}",
        "tags_url": "https://api.github.com/repos/distri/compositions/tags",
        "blobs_url": "https://api.github.com/repos/distri/compositions/git/blobs{/sha}",
        "git_tags_url": "https://api.github.com/repos/distri/compositions/git/tags{/sha}",
        "git_refs_url": "https://api.github.com/repos/distri/compositions/git/refs{/sha}",
        "trees_url": "https://api.github.com/repos/distri/compositions/git/trees{/sha}",
        "statuses_url": "https://api.github.com/repos/distri/compositions/statuses/{sha}",
        "languages_url": "https://api.github.com/repos/distri/compositions/languages",
        "stargazers_url": "https://api.github.com/repos/distri/compositions/stargazers",
        "contributors_url": "https://api.github.com/repos/distri/compositions/contributors",
        "subscribers_url": "https://api.github.com/repos/distri/compositions/subscribers",
        "subscription_url": "https://api.github.com/repos/distri/compositions/subscription",
        "commits_url": "https://api.github.com/repos/distri/compositions/commits{/sha}",
        "git_commits_url": "https://api.github.com/repos/distri/compositions/git/commits{/sha}",
        "comments_url": "https://api.github.com/repos/distri/compositions/comments{/number}",
        "issue_comment_url": "https://api.github.com/repos/distri/compositions/issues/comments/{number}",
        "contents_url": "https://api.github.com/repos/distri/compositions/contents/{+path}",
        "compare_url": "https://api.github.com/repos/distri/compositions/compare/{base}...{head}",
        "merges_url": "https://api.github.com/repos/distri/compositions/merges",
        "archive_url": "https://api.github.com/repos/distri/compositions/{archive_format}{/ref}",
        "downloads_url": "https://api.github.com/repos/distri/compositions/downloads",
        "issues_url": "https://api.github.com/repos/distri/compositions/issues{/number}",
        "pulls_url": "https://api.github.com/repos/distri/compositions/pulls{/number}",
        "milestones_url": "https://api.github.com/repos/distri/compositions/milestones{/number}",
        "notifications_url": "https://api.github.com/repos/distri/compositions/notifications{?since,all,participating}",
        "labels_url": "https://api.github.com/repos/distri/compositions/labels{/name}",
        "releases_url": "https://api.github.com/repos/distri/compositions/releases{/id}",
        "created_at": "2014-02-27T17:00:47Z",
        "updated_at": "2014-02-27T17:16:50Z",
        "pushed_at": "2014-02-27T17:16:49Z",
        "git_url": "git://github.com/distri/compositions.git",
        "ssh_url": "git@github.com:distri/compositions.git",
        "clone_url": "https://github.com/distri/compositions.git",
        "svn_url": "https://github.com/distri/compositions",
        "homepage": null,
        "size": 140,
        "stargazers_count": 0,
        "watchers_count": 0,
        "language": "CoffeeScript",
        "has_issues": true,
        "has_downloads": true,
        "has_wiki": true,
        "forks_count": 0,
        "mirror_url": null,
        "open_issues_count": 0,
        "forks": 0,
        "open_issues": 0,
        "watchers": 0,
        "default_branch": "master",
        "master_branch": "master",
        "permissions": {
          "admin": true,
          "push": true,
          "pull": true
        },
        "organization": {
          "login": "distri",
          "id": 6005125,
          "avatar_url": "https://avatars.githubusercontent.com/u/6005125?",
          "gravatar_id": "192f3f168409e79c42107f081139d9f3",
          "url": "https://api.github.com/users/distri",
          "html_url": "https://github.com/distri",
          "followers_url": "https://api.github.com/users/distri/followers",
          "following_url": "https://api.github.com/users/distri/following{/other_user}",
          "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
          "organizations_url": "https://api.github.com/users/distri/orgs",
          "repos_url": "https://api.github.com/users/distri/repos",
          "events_url": "https://api.github.com/users/distri/events{/privacy}",
          "received_events_url": "https://api.github.com/users/distri/received_events",
          "type": "Organization",
          "site_admin": false
        },
        "network_count": 0,
        "subscribers_count": 1,
        "branch": "v0.1.1",
        "publishBranch": "gh-pages"
      },
      "dependencies": {
        "core": {
          "source": {
            "LICENSE": {
              "path": "LICENSE",
              "mode": "100644",
              "content": "The MIT License (MIT)\n\nCopyright (c) 2013 Daniel X Moore\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of\nthis software and associated documentation files (the \"Software\"), to deal in\nthe Software without restriction, including without limitation the rights to\nuse, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of\nthe Software, and to permit persons to whom the Software is furnished to do so,\nsubject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS\nFOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR\nCOPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER\nIN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN\nCONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n",
              "type": "blob"
            },
            "README.md": {
              "path": "README.md",
              "mode": "100644",
              "content": "core\n====\n\nAn object extension system.\n",
              "type": "blob"
            },
            "core.coffee.md": {
              "path": "core.coffee.md",
              "mode": "100644",
              "content": "Core\n====\n\nThe Core module is used to add extended functionality to objects without\nextending `Object.prototype` directly.\n\n    Core = (I={}, self={}) ->\n      extend self,\n\nExternal access to instance variables. Use of this property should be avoided\nin general, but can come in handy from time to time.\n\n>     #! example\n>     I =\n>       r: 255\n>       g: 0\n>       b: 100\n>\n>     myObject = Core(I)\n>\n>     [myObject.I.r, myObject.I.g, myObject.I.b]\n\n        I: I\n\nGenerates a public jQuery style getter / setter method for each `String` argument.\n\n>     #! example\n>     myObject = Core\n>       r: 255\n>       g: 0\n>       b: 100\n>\n>     myObject.attrAccessor \"r\", \"g\", \"b\"\n>\n>     myObject.r(254)\n\n        attrAccessor: (attrNames...) ->\n          attrNames.forEach (attrName) ->\n            self[attrName] = (newValue) ->\n              if arguments.length > 0\n                I[attrName] = newValue\n\n                return self\n              else\n                I[attrName]\n\n          return self\n\nGenerates a public jQuery style getter method for each String argument.\n\n>     #! example\n>     myObject = Core\n>       r: 255\n>       g: 0\n>       b: 100\n>\n>     myObject.attrReader \"r\", \"g\", \"b\"\n>\n>     [myObject.r(), myObject.g(), myObject.b()]\n\n        attrReader: (attrNames...) ->\n          attrNames.forEach (attrName) ->\n            self[attrName] = ->\n              I[attrName]\n\n          return self\n\nExtends this object with methods from the passed in object. A shortcut for Object.extend(self, methods)\n\n>     I =\n>       x: 30\n>       y: 40\n>       maxSpeed: 5\n>\n>     # we are using extend to give player\n>     # additional methods that Core doesn't have\n>     player = Core(I).extend\n>       increaseSpeed: ->\n>         I.maxSpeed += 1\n>\n>     player.increaseSpeed()\n\n        extend: (objects...) ->\n          extend self, objects...\n\nIncludes a module in this object. A module is a constructor that takes two parameters, `I` and `self`\n\n>     myObject = Core()\n>     myObject.include(Bindable)\n\n>     # now you can bind handlers to functions\n>     myObject.bind \"someEvent\", ->\n>       alert(\"wow. that was easy.\")\n\n        include: (modules...) ->\n          for Module in modules\n            Module(I, self)\n\n          return self\n\n      return self\n\nHelpers\n-------\n\nExtend an object with the properties of other objects.\n\n    extend = (target, sources...) ->\n      for source in sources\n        for name of source\n          target[name] = source[name]\n\n      return target\n\nExport\n\n    module.exports = Core\n",
              "type": "blob"
            },
            "pixie.cson": {
              "path": "pixie.cson",
              "mode": "100644",
              "content": "entryPoint: \"core\"\nversion: \"0.6.0\"\n",
              "type": "blob"
            },
            "test/core.coffee": {
              "path": "test/core.coffee",
              "mode": "100644",
              "content": "Core = require \"../core\"\n\nok = assert\nequals = assert.equal\ntest = it\n\ndescribe \"Core\", ->\n\n  test \"#extend\", ->\n    o = Core()\n  \n    o.extend\n      test: \"jawsome\"\n  \n    equals o.test, \"jawsome\"\n  \n  test \"#attrAccessor\", ->\n    o = Core\n      test: \"my_val\"\n  \n    o.attrAccessor(\"test\")\n  \n    equals o.test(), \"my_val\"\n    equals o.test(\"new_val\"), o\n    equals o.test(), \"new_val\"\n  \n  test \"#attrReader\", ->\n    o = Core\n      test: \"my_val\"\n  \n    o.attrReader(\"test\")\n  \n    equals o.test(), \"my_val\"\n    equals o.test(\"new_val\"), \"my_val\"\n    equals o.test(), \"my_val\"\n  \n  test \"#include\", ->\n    o = Core\n      test: \"my_val\"\n  \n    M = (I, self) ->\n      self.attrReader \"test\"\n  \n      self.extend\n        test2: \"cool\"\n  \n    ret = o.include M\n  \n    equals ret, o, \"Should return self\"\n  \n    equals o.test(), \"my_val\"\n    equals o.test2, \"cool\"\n  \n  test \"#include multiple\", ->\n    o = Core\n      test: \"my_val\"\n  \n    M = (I, self) ->\n      self.attrReader \"test\"\n  \n      self.extend\n        test2: \"cool\"\n  \n    M2 = (I, self) ->\n      self.extend\n        test2: \"coolio\"\n  \n    o.include M, M2\n  \n    equals o.test2, \"coolio\"\n",
              "type": "blob"
            }
          },
          "distribution": {
            "core": {
              "path": "core",
              "content": "(function() {\n  var Core, extend,\n    __slice = [].slice;\n\n  Core = function(I, self) {\n    if (I == null) {\n      I = {};\n    }\n    if (self == null) {\n      self = {};\n    }\n    extend(self, {\n      I: I,\n      attrAccessor: function() {\n        var attrNames;\n        attrNames = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n        attrNames.forEach(function(attrName) {\n          return self[attrName] = function(newValue) {\n            if (arguments.length > 0) {\n              I[attrName] = newValue;\n              return self;\n            } else {\n              return I[attrName];\n            }\n          };\n        });\n        return self;\n      },\n      attrReader: function() {\n        var attrNames;\n        attrNames = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n        attrNames.forEach(function(attrName) {\n          return self[attrName] = function() {\n            return I[attrName];\n          };\n        });\n        return self;\n      },\n      extend: function() {\n        var objects;\n        objects = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n        return extend.apply(null, [self].concat(__slice.call(objects)));\n      },\n      include: function() {\n        var Module, modules, _i, _len;\n        modules = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n        for (_i = 0, _len = modules.length; _i < _len; _i++) {\n          Module = modules[_i];\n          Module(I, self);\n        }\n        return self;\n      }\n    });\n    return self;\n  };\n\n  extend = function() {\n    var name, source, sources, target, _i, _len;\n    target = arguments[0], sources = 2 <= arguments.length ? __slice.call(arguments, 1) : [];\n    for (_i = 0, _len = sources.length; _i < _len; _i++) {\n      source = sources[_i];\n      for (name in source) {\n        target[name] = source[name];\n      }\n    }\n    return target;\n  };\n\n  module.exports = Core;\n\n}).call(this);\n\n//# sourceURL=core.coffee",
              "type": "blob"
            },
            "pixie": {
              "path": "pixie",
              "content": "module.exports = {\"entryPoint\":\"core\",\"version\":\"0.6.0\"};",
              "type": "blob"
            },
            "test/core": {
              "path": "test/core",
              "content": "(function() {\n  var Core, equals, ok, test;\n\n  Core = require(\"../core\");\n\n  ok = assert;\n\n  equals = assert.equal;\n\n  test = it;\n\n  describe(\"Core\", function() {\n    test(\"#extend\", function() {\n      var o;\n      o = Core();\n      o.extend({\n        test: \"jawsome\"\n      });\n      return equals(o.test, \"jawsome\");\n    });\n    test(\"#attrAccessor\", function() {\n      var o;\n      o = Core({\n        test: \"my_val\"\n      });\n      o.attrAccessor(\"test\");\n      equals(o.test(), \"my_val\");\n      equals(o.test(\"new_val\"), o);\n      return equals(o.test(), \"new_val\");\n    });\n    test(\"#attrReader\", function() {\n      var o;\n      o = Core({\n        test: \"my_val\"\n      });\n      o.attrReader(\"test\");\n      equals(o.test(), \"my_val\");\n      equals(o.test(\"new_val\"), \"my_val\");\n      return equals(o.test(), \"my_val\");\n    });\n    test(\"#include\", function() {\n      var M, o, ret;\n      o = Core({\n        test: \"my_val\"\n      });\n      M = function(I, self) {\n        self.attrReader(\"test\");\n        return self.extend({\n          test2: \"cool\"\n        });\n      };\n      ret = o.include(M);\n      equals(ret, o, \"Should return self\");\n      equals(o.test(), \"my_val\");\n      return equals(o.test2, \"cool\");\n    });\n    return test(\"#include multiple\", function() {\n      var M, M2, o;\n      o = Core({\n        test: \"my_val\"\n      });\n      M = function(I, self) {\n        self.attrReader(\"test\");\n        return self.extend({\n          test2: \"cool\"\n        });\n      };\n      M2 = function(I, self) {\n        return self.extend({\n          test2: \"coolio\"\n        });\n      };\n      o.include(M, M2);\n      return equals(o.test2, \"coolio\");\n    });\n  });\n\n}).call(this);\n\n//# sourceURL=test/core.coffee",
              "type": "blob"
            }
          },
          "progenitor": {
            "url": "http://strd6.github.io/editor/"
          },
          "version": "0.6.0",
          "entryPoint": "core",
          "repository": {
            "id": 13567517,
            "name": "core",
            "full_name": "distri/core",
            "owner": {
              "login": "distri",
              "id": 6005125,
              "avatar_url": "https://identicons.github.com/f90c81ffc1498e260c820082f2e7ca5f.png",
              "gravatar_id": null,
              "url": "https://api.github.com/users/distri",
              "html_url": "https://github.com/distri",
              "followers_url": "https://api.github.com/users/distri/followers",
              "following_url": "https://api.github.com/users/distri/following{/other_user}",
              "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
              "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
              "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
              "organizations_url": "https://api.github.com/users/distri/orgs",
              "repos_url": "https://api.github.com/users/distri/repos",
              "events_url": "https://api.github.com/users/distri/events{/privacy}",
              "received_events_url": "https://api.github.com/users/distri/received_events",
              "type": "Organization",
              "site_admin": false
            },
            "private": false,
            "html_url": "https://github.com/distri/core",
            "description": "An object extension system.",
            "fork": false,
            "url": "https://api.github.com/repos/distri/core",
            "forks_url": "https://api.github.com/repos/distri/core/forks",
            "keys_url": "https://api.github.com/repos/distri/core/keys{/key_id}",
            "collaborators_url": "https://api.github.com/repos/distri/core/collaborators{/collaborator}",
            "teams_url": "https://api.github.com/repos/distri/core/teams",
            "hooks_url": "https://api.github.com/repos/distri/core/hooks",
            "issue_events_url": "https://api.github.com/repos/distri/core/issues/events{/number}",
            "events_url": "https://api.github.com/repos/distri/core/events",
            "assignees_url": "https://api.github.com/repos/distri/core/assignees{/user}",
            "branches_url": "https://api.github.com/repos/distri/core/branches{/branch}",
            "tags_url": "https://api.github.com/repos/distri/core/tags",
            "blobs_url": "https://api.github.com/repos/distri/core/git/blobs{/sha}",
            "git_tags_url": "https://api.github.com/repos/distri/core/git/tags{/sha}",
            "git_refs_url": "https://api.github.com/repos/distri/core/git/refs{/sha}",
            "trees_url": "https://api.github.com/repos/distri/core/git/trees{/sha}",
            "statuses_url": "https://api.github.com/repos/distri/core/statuses/{sha}",
            "languages_url": "https://api.github.com/repos/distri/core/languages",
            "stargazers_url": "https://api.github.com/repos/distri/core/stargazers",
            "contributors_url": "https://api.github.com/repos/distri/core/contributors",
            "subscribers_url": "https://api.github.com/repos/distri/core/subscribers",
            "subscription_url": "https://api.github.com/repos/distri/core/subscription",
            "commits_url": "https://api.github.com/repos/distri/core/commits{/sha}",
            "git_commits_url": "https://api.github.com/repos/distri/core/git/commits{/sha}",
            "comments_url": "https://api.github.com/repos/distri/core/comments{/number}",
            "issue_comment_url": "https://api.github.com/repos/distri/core/issues/comments/{number}",
            "contents_url": "https://api.github.com/repos/distri/core/contents/{+path}",
            "compare_url": "https://api.github.com/repos/distri/core/compare/{base}...{head}",
            "merges_url": "https://api.github.com/repos/distri/core/merges",
            "archive_url": "https://api.github.com/repos/distri/core/{archive_format}{/ref}",
            "downloads_url": "https://api.github.com/repos/distri/core/downloads",
            "issues_url": "https://api.github.com/repos/distri/core/issues{/number}",
            "pulls_url": "https://api.github.com/repos/distri/core/pulls{/number}",
            "milestones_url": "https://api.github.com/repos/distri/core/milestones{/number}",
            "notifications_url": "https://api.github.com/repos/distri/core/notifications{?since,all,participating}",
            "labels_url": "https://api.github.com/repos/distri/core/labels{/name}",
            "releases_url": "https://api.github.com/repos/distri/core/releases{/id}",
            "created_at": "2013-10-14T17:04:33Z",
            "updated_at": "2013-12-24T00:49:21Z",
            "pushed_at": "2013-10-14T23:49:11Z",
            "git_url": "git://github.com/distri/core.git",
            "ssh_url": "git@github.com:distri/core.git",
            "clone_url": "https://github.com/distri/core.git",
            "svn_url": "https://github.com/distri/core",
            "homepage": null,
            "size": 592,
            "stargazers_count": 0,
            "watchers_count": 0,
            "language": "CoffeeScript",
            "has_issues": true,
            "has_downloads": true,
            "has_wiki": true,
            "forks_count": 0,
            "mirror_url": null,
            "open_issues_count": 0,
            "forks": 0,
            "open_issues": 0,
            "watchers": 0,
            "default_branch": "master",
            "master_branch": "master",
            "permissions": {
              "admin": true,
              "push": true,
              "pull": true
            },
            "organization": {
              "login": "distri",
              "id": 6005125,
              "avatar_url": "https://identicons.github.com/f90c81ffc1498e260c820082f2e7ca5f.png",
              "gravatar_id": null,
              "url": "https://api.github.com/users/distri",
              "html_url": "https://github.com/distri",
              "followers_url": "https://api.github.com/users/distri/followers",
              "following_url": "https://api.github.com/users/distri/following{/other_user}",
              "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
              "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
              "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
              "organizations_url": "https://api.github.com/users/distri/orgs",
              "repos_url": "https://api.github.com/users/distri/repos",
              "events_url": "https://api.github.com/users/distri/events{/privacy}",
              "received_events_url": "https://api.github.com/users/distri/received_events",
              "type": "Organization",
              "site_admin": false
            },
            "network_count": 0,
            "subscribers_count": 1,
            "branch": "v0.6.0",
            "defaultBranch": "master"
          },
          "dependencies": {}
        },
        "observable": {
          "source": {
            "LICENSE": {
              "path": "LICENSE",
              "mode": "100644",
              "content": "The MIT License (MIT)\n\nCopyright (c) 2014 distri\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of\nthis software and associated documentation files (the \"Software\"), to deal in\nthe Software without restriction, including without limitation the rights to\nuse, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of\nthe Software, and to permit persons to whom the Software is furnished to do so,\nsubject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS\nFOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR\nCOPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER\nIN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN\nCONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n",
              "type": "blob"
            },
            "README.md": {
              "path": "README.md",
              "mode": "100644",
              "content": "observable\n==========\n",
              "type": "blob"
            },
            "main.coffee.md": {
              "path": "main.coffee.md",
              "mode": "100644",
              "content": "Observable\n==========\n\n`Observable` allows for observing arrays, functions, and objects.\n\nFunction dependencies are automagically observed.\n\nStandard array methods are proxied through to the underlying array.\n\n    Observable = (value) ->\n\nReturn the object if it is already an observable object.\n\n      return value if typeof value?.observe is \"function\"\n\nMaintain a set of listeners to observe changes and provide a helper to notify each observer.\n\n      listeners = []\n\n      notify = (newValue) ->\n        listeners.forEach (listener) ->\n          listener(newValue)\n\nOur observable function is stored as a reference to `self`.\n\nIf `value` is a function compute dependencies and listen to observables that it depends on.\n\n      if typeof value is 'function'\n        fn = value\n        self = ->\n          # Automagic dependency observation\n          magicDependency(self)\n\n          return value\n\n        self.observe = (listener) ->\n          listeners.push listener\n\n        changed = ->\n          value = fn()\n          notify(value)\n\n        value = computeDependencies(fn, changed)\n\n      else\n\nWhen called with zero arguments it is treated as a getter. When called with one argument it is treated as a setter.\n\nChanges to the value will trigger notifications.\n\nThe value is always returned.\n\n        self = (newValue) ->\n          if arguments.length > 0\n            if value != newValue\n              value = newValue\n\n              notify(newValue)\n          else\n            # Automagic dependency observation\n            magicDependency(self)\n\n          return value\n\nAdd a listener for when this object changes.\n\n        self.observe = (listener) ->\n          listeners.push listener\n\nThis `each` iterator is similar to [the Maybe monad](http://en.wikipedia.org/wiki/Monad_&#40;functional_programming&#41;#The_Maybe_monad) in that our observable may contain a single value or nothing at all.\n\n      self.each = (args...) ->\n        if value?\n          [value].forEach(args...)\n\nIf the value is an array then proxy array methods and add notifications to mutation events.\n\n      if Array.isArray(value)\n        [\n          \"concat\"\n          \"every\"\n          \"filter\"\n          \"forEach\"\n          \"indexOf\"\n          \"join\"\n          \"lastIndexOf\"\n          \"map\"\n          \"reduce\"\n          \"reduceRight\"\n          \"slice\"\n          \"some\"\n        ].forEach (method) ->\n          self[method] = (args...) ->\n            value[method](args...)\n\n        [\n          \"pop\"\n          \"push\"\n          \"reverse\"\n          \"shift\"\n          \"splice\"\n          \"sort\"\n          \"unshift\"\n        ].forEach (method) ->\n          self[method] = (args...) ->\n            notifyReturning value[method](args...)\n\n        notifyReturning = (returnValue) ->\n          notify(value)\n\n          return returnValue\n\nAdd some extra helpful methods to array observables.\n\n        extend self,\n          each: (args...) ->\n            self.forEach(args...)\n\n            return self\n\nRemove an element from the array and notify observers of changes.\n\n          remove: (object) ->\n            index = value.indexOf(object)\n\n            if index >= 0\n              notifyReturning value.splice(index, 1)[0]\n\n          get: (index) ->\n            value[index]\n\n          first: ->\n            value[0]\n\n          last: ->\n            value[value.length-1]\n\n      self.stopObserving = (fn) ->\n        remove listeners, fn\n\n      return self\n\nExport `Observable`\n\n    module.exports = Observable\n\nAppendix\n--------\n\nThe extend method adds one objects properties to another.\n\n    extend = (target, sources...) ->\n      for source in sources\n        for name of source\n          target[name] = source[name]\n\n      return target\n\nSuper hax for computing dependencies. This needs to be a shared global so that\ndifferent bundled versions of observable libraries can interoperate.\n\n    global.OBSERVABLE_ROOT_HACK = undefined\n\n    magicDependency = (self) ->\n      if base = global.OBSERVABLE_ROOT_HACK\n        self.observe base\n\n    withBase = (root, fn) ->\n      global.OBSERVABLE_ROOT_HACK = root\n      value = fn()\n      global.OBSERVABLE_ROOT_HACK = undefined\n\n      return value\n\n    base = ->\n      global.OBSERVABLE_ROOT_HACK\n\nAutomagically compute dependencies.\n\n    computeDependencies = (fn, root) ->\n      withBase root, ->\n        fn()\n\nRemove a value from an array.\n\n    remove = (array, value) ->\n      index = array.indexOf(value)\n\n      if index >= 0\n        array.splice(index, 1)[0]\n",
              "type": "blob"
            },
            "pixie.cson": {
              "path": "pixie.cson",
              "mode": "100644",
              "content": "version: \"0.1.1\"\n",
              "type": "blob"
            },
            "test/observable.coffee": {
              "path": "test/observable.coffee",
              "mode": "100644",
              "content": "Observable = require \"../main\"\n\ndescribe 'Observable', ->\n  it 'should create an observable for an object', ->\n    n = 5\n\n    observable = Observable(n)\n\n    assert.equal(observable(), n)\n\n  it 'should fire events when setting', ->\n    string = \"yolo\"\n\n    observable = Observable(string)\n    observable.observe (newValue) ->\n      assert.equal newValue, \"4life\"\n\n    observable(\"4life\")\n\n  it 'should be idempotent', ->\n    o = Observable(5)\n\n    assert.equal o, Observable(o)\n\n  describe \"#each\", ->\n    it \"should be invoked once if there is an observable\", ->\n      o = Observable(5)\n      called = 0\n\n      o.each (value) ->\n        called += 1\n        assert.equal value, 5\n\n      assert.equal called, 1\n\n    it \"should not be invoked if observable is null\", ->\n      o = Observable(null)\n      called = 0\n\n      o.each (value) ->\n        called += 1\n\n      assert.equal called, 0\n\n  it \"should allow for stopping observation\", ->\n    observable = Observable(\"string\")\n\n    called = 0\n    fn = (newValue) ->\n      called += 1\n      assert.equal newValue, \"4life\"\n\n    observable.observe fn\n\n    observable(\"4life\")\n\n    observable.stopObserving fn\n\n    observable(\"wat\")\n\n    assert.equal called, 1\n\ndescribe \"Observable Array\", ->\n  it \"should proxy array methods\", ->\n    o = Observable [5]\n\n    o.map (n) ->\n      assert.equal n, 5\n\n  it \"should notify on mutation methods\", (done) ->\n    o = Observable []\n\n    o.observe (newValue) ->\n      assert.equal newValue[0], 1\n\n    o.push 1\n\n    done()\n\n  it \"should have an each method\", ->\n    o = Observable []\n\n    assert o.each\n\n  it \"#get\", ->\n    o = Observable [0, 1, 2, 3]\n\n    assert.equal o.get(2), 2\n\n  it \"#first\", ->\n    o = Observable [0, 1, 2, 3]\n\n    assert.equal o.first(), 0\n\n  it \"#last\", ->\n    o = Observable [0, 1, 2, 3]\n\n    assert.equal o.last(), 3\n\n  it \"#remove\", (done) ->\n    o = Observable [0, 1, 2, 3]\n\n    o.observe (newValue) ->\n      assert.equal newValue.length, 3\n      setTimeout ->\n        done()\n      , 0\n\n    assert.equal o.remove(2), 2\n\n  # TODO: This looks like it might be impossible\n  it \"should proxy the length property\"\n\ndescribe \"Observable functions\", ->\n  it \"should compute dependencies\", (done) ->\n    firstName = Observable \"Duder\"\n    lastName = Observable \"Man\"\n\n    o = Observable ->\n      \"#{firstName()} #{lastName()}\"\n\n    o.observe (newValue) ->\n      assert.equal newValue, \"Duder Bro\"\n\n      done()\n\n    lastName \"Bro\"\n\n  it \"should allow double nesting\", (done) ->\n    bottom = Observable \"rad\"\n    middle = Observable ->\n      bottom()\n    top = Observable ->\n      middle()\n\n    top.observe (newValue) ->\n      assert.equal newValue, \"wat\"\n      assert.equal top(), newValue\n      assert.equal middle(), newValue\n\n      done()\n\n    bottom(\"wat\")\n\n  it \"should have an each method\", ->\n    o = Observable ->\n\n    assert o.each\n\n  it \"should not invoke when returning undefined\", ->\n    o = Observable ->\n\n    o.each ->\n      assert false\n\n  it \"should invoke when returning any defined value\", (done) ->\n    o = Observable -> 5\n\n    o.each (n) ->\n      assert.equal n, 5\n      done()\n\n  it \"should work on an array dependency\", ->\n    oA = Observable [1, 2, 3]\n\n    o = Observable ->\n      oA()[0]\n\n    last = Observable ->\n      oA()[oA().length-1]\n\n    assert.equal o(), 1\n\n    oA.unshift 0\n\n    assert.equal o(), 0\n\n    oA.push 4\n\n    assert.equal last(), 4, \"Last should be 4\"\n",
              "type": "blob"
            }
          },
          "distribution": {
            "main": {
              "path": "main",
              "content": "(function() {\n  var Observable, base, computeDependencies, extend, magicDependency, remove, withBase,\n    __slice = [].slice;\n\n  Observable = function(value) {\n    var changed, fn, listeners, notify, notifyReturning, self;\n    if (typeof (value != null ? value.observe : void 0) === \"function\") {\n      return value;\n    }\n    listeners = [];\n    notify = function(newValue) {\n      return listeners.forEach(function(listener) {\n        return listener(newValue);\n      });\n    };\n    if (typeof value === 'function') {\n      fn = value;\n      self = function() {\n        magicDependency(self);\n        return value;\n      };\n      self.observe = function(listener) {\n        return listeners.push(listener);\n      };\n      changed = function() {\n        value = fn();\n        return notify(value);\n      };\n      value = computeDependencies(fn, changed);\n    } else {\n      self = function(newValue) {\n        if (arguments.length > 0) {\n          if (value !== newValue) {\n            value = newValue;\n            notify(newValue);\n          }\n        } else {\n          magicDependency(self);\n        }\n        return value;\n      };\n      self.observe = function(listener) {\n        return listeners.push(listener);\n      };\n    }\n    self.each = function() {\n      var args, _ref;\n      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n      if (value != null) {\n        return (_ref = [value]).forEach.apply(_ref, args);\n      }\n    };\n    if (Array.isArray(value)) {\n      [\"concat\", \"every\", \"filter\", \"forEach\", \"indexOf\", \"join\", \"lastIndexOf\", \"map\", \"reduce\", \"reduceRight\", \"slice\", \"some\"].forEach(function(method) {\n        return self[method] = function() {\n          var args;\n          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n          return value[method].apply(value, args);\n        };\n      });\n      [\"pop\", \"push\", \"reverse\", \"shift\", \"splice\", \"sort\", \"unshift\"].forEach(function(method) {\n        return self[method] = function() {\n          var args;\n          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n          return notifyReturning(value[method].apply(value, args));\n        };\n      });\n      notifyReturning = function(returnValue) {\n        notify(value);\n        return returnValue;\n      };\n      extend(self, {\n        each: function() {\n          var args;\n          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n          self.forEach.apply(self, args);\n          return self;\n        },\n        remove: function(object) {\n          var index;\n          index = value.indexOf(object);\n          if (index >= 0) {\n            return notifyReturning(value.splice(index, 1)[0]);\n          }\n        },\n        get: function(index) {\n          return value[index];\n        },\n        first: function() {\n          return value[0];\n        },\n        last: function() {\n          return value[value.length - 1];\n        }\n      });\n    }\n    self.stopObserving = function(fn) {\n      return remove(listeners, fn);\n    };\n    return self;\n  };\n\n  module.exports = Observable;\n\n  extend = function() {\n    var name, source, sources, target, _i, _len;\n    target = arguments[0], sources = 2 <= arguments.length ? __slice.call(arguments, 1) : [];\n    for (_i = 0, _len = sources.length; _i < _len; _i++) {\n      source = sources[_i];\n      for (name in source) {\n        target[name] = source[name];\n      }\n    }\n    return target;\n  };\n\n  global.OBSERVABLE_ROOT_HACK = void 0;\n\n  magicDependency = function(self) {\n    var base;\n    if (base = global.OBSERVABLE_ROOT_HACK) {\n      return self.observe(base);\n    }\n  };\n\n  withBase = function(root, fn) {\n    var value;\n    global.OBSERVABLE_ROOT_HACK = root;\n    value = fn();\n    global.OBSERVABLE_ROOT_HACK = void 0;\n    return value;\n  };\n\n  base = function() {\n    return global.OBSERVABLE_ROOT_HACK;\n  };\n\n  computeDependencies = function(fn, root) {\n    return withBase(root, function() {\n      return fn();\n    });\n  };\n\n  remove = function(array, value) {\n    var index;\n    index = array.indexOf(value);\n    if (index >= 0) {\n      return array.splice(index, 1)[0];\n    }\n  };\n\n}).call(this);\n",
              "type": "blob"
            },
            "pixie": {
              "path": "pixie",
              "content": "module.exports = {\"version\":\"0.1.1\"};",
              "type": "blob"
            },
            "test/observable": {
              "path": "test/observable",
              "content": "(function() {\n  var Observable;\n\n  Observable = require(\"../main\");\n\n  describe('Observable', function() {\n    it('should create an observable for an object', function() {\n      var n, observable;\n      n = 5;\n      observable = Observable(n);\n      return assert.equal(observable(), n);\n    });\n    it('should fire events when setting', function() {\n      var observable, string;\n      string = \"yolo\";\n      observable = Observable(string);\n      observable.observe(function(newValue) {\n        return assert.equal(newValue, \"4life\");\n      });\n      return observable(\"4life\");\n    });\n    it('should be idempotent', function() {\n      var o;\n      o = Observable(5);\n      return assert.equal(o, Observable(o));\n    });\n    describe(\"#each\", function() {\n      it(\"should be invoked once if there is an observable\", function() {\n        var called, o;\n        o = Observable(5);\n        called = 0;\n        o.each(function(value) {\n          called += 1;\n          return assert.equal(value, 5);\n        });\n        return assert.equal(called, 1);\n      });\n      return it(\"should not be invoked if observable is null\", function() {\n        var called, o;\n        o = Observable(null);\n        called = 0;\n        o.each(function(value) {\n          return called += 1;\n        });\n        return assert.equal(called, 0);\n      });\n    });\n    return it(\"should allow for stopping observation\", function() {\n      var called, fn, observable;\n      observable = Observable(\"string\");\n      called = 0;\n      fn = function(newValue) {\n        called += 1;\n        return assert.equal(newValue, \"4life\");\n      };\n      observable.observe(fn);\n      observable(\"4life\");\n      observable.stopObserving(fn);\n      observable(\"wat\");\n      return assert.equal(called, 1);\n    });\n  });\n\n  describe(\"Observable Array\", function() {\n    it(\"should proxy array methods\", function() {\n      var o;\n      o = Observable([5]);\n      return o.map(function(n) {\n        return assert.equal(n, 5);\n      });\n    });\n    it(\"should notify on mutation methods\", function(done) {\n      var o;\n      o = Observable([]);\n      o.observe(function(newValue) {\n        return assert.equal(newValue[0], 1);\n      });\n      o.push(1);\n      return done();\n    });\n    it(\"should have an each method\", function() {\n      var o;\n      o = Observable([]);\n      return assert(o.each);\n    });\n    it(\"#get\", function() {\n      var o;\n      o = Observable([0, 1, 2, 3]);\n      return assert.equal(o.get(2), 2);\n    });\n    it(\"#first\", function() {\n      var o;\n      o = Observable([0, 1, 2, 3]);\n      return assert.equal(o.first(), 0);\n    });\n    it(\"#last\", function() {\n      var o;\n      o = Observable([0, 1, 2, 3]);\n      return assert.equal(o.last(), 3);\n    });\n    it(\"#remove\", function(done) {\n      var o;\n      o = Observable([0, 1, 2, 3]);\n      o.observe(function(newValue) {\n        assert.equal(newValue.length, 3);\n        return setTimeout(function() {\n          return done();\n        }, 0);\n      });\n      return assert.equal(o.remove(2), 2);\n    });\n    return it(\"should proxy the length property\");\n  });\n\n  describe(\"Observable functions\", function() {\n    it(\"should compute dependencies\", function(done) {\n      var firstName, lastName, o;\n      firstName = Observable(\"Duder\");\n      lastName = Observable(\"Man\");\n      o = Observable(function() {\n        return \"\" + (firstName()) + \" \" + (lastName());\n      });\n      o.observe(function(newValue) {\n        assert.equal(newValue, \"Duder Bro\");\n        return done();\n      });\n      return lastName(\"Bro\");\n    });\n    it(\"should allow double nesting\", function(done) {\n      var bottom, middle, top;\n      bottom = Observable(\"rad\");\n      middle = Observable(function() {\n        return bottom();\n      });\n      top = Observable(function() {\n        return middle();\n      });\n      top.observe(function(newValue) {\n        assert.equal(newValue, \"wat\");\n        assert.equal(top(), newValue);\n        assert.equal(middle(), newValue);\n        return done();\n      });\n      return bottom(\"wat\");\n    });\n    it(\"should have an each method\", function() {\n      var o;\n      o = Observable(function() {});\n      return assert(o.each);\n    });\n    it(\"should not invoke when returning undefined\", function() {\n      var o;\n      o = Observable(function() {});\n      return o.each(function() {\n        return assert(false);\n      });\n    });\n    it(\"should invoke when returning any defined value\", function(done) {\n      var o;\n      o = Observable(function() {\n        return 5;\n      });\n      return o.each(function(n) {\n        assert.equal(n, 5);\n        return done();\n      });\n    });\n    return it(\"should work on an array dependency\", function() {\n      var last, o, oA;\n      oA = Observable([1, 2, 3]);\n      o = Observable(function() {\n        return oA()[0];\n      });\n      last = Observable(function() {\n        return oA()[oA().length - 1];\n      });\n      assert.equal(o(), 1);\n      oA.unshift(0);\n      assert.equal(o(), 0);\n      oA.push(4);\n      return assert.equal(last(), 4, \"Last should be 4\");\n    });\n  });\n\n}).call(this);\n",
              "type": "blob"
            }
          },
          "progenitor": {
            "url": "http://strd6.github.io/editor/"
          },
          "version": "0.1.1",
          "entryPoint": "main",
          "repository": {
            "id": 17119562,
            "name": "observable",
            "full_name": "distri/observable",
            "owner": {
              "login": "distri",
              "id": 6005125,
              "avatar_url": "https://avatars.githubusercontent.com/u/6005125?",
              "gravatar_id": "192f3f168409e79c42107f081139d9f3",
              "url": "https://api.github.com/users/distri",
              "html_url": "https://github.com/distri",
              "followers_url": "https://api.github.com/users/distri/followers",
              "following_url": "https://api.github.com/users/distri/following{/other_user}",
              "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
              "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
              "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
              "organizations_url": "https://api.github.com/users/distri/orgs",
              "repos_url": "https://api.github.com/users/distri/repos",
              "events_url": "https://api.github.com/users/distri/events{/privacy}",
              "received_events_url": "https://api.github.com/users/distri/received_events",
              "type": "Organization",
              "site_admin": false
            },
            "private": false,
            "html_url": "https://github.com/distri/observable",
            "description": "",
            "fork": false,
            "url": "https://api.github.com/repos/distri/observable",
            "forks_url": "https://api.github.com/repos/distri/observable/forks",
            "keys_url": "https://api.github.com/repos/distri/observable/keys{/key_id}",
            "collaborators_url": "https://api.github.com/repos/distri/observable/collaborators{/collaborator}",
            "teams_url": "https://api.github.com/repos/distri/observable/teams",
            "hooks_url": "https://api.github.com/repos/distri/observable/hooks",
            "issue_events_url": "https://api.github.com/repos/distri/observable/issues/events{/number}",
            "events_url": "https://api.github.com/repos/distri/observable/events",
            "assignees_url": "https://api.github.com/repos/distri/observable/assignees{/user}",
            "branches_url": "https://api.github.com/repos/distri/observable/branches{/branch}",
            "tags_url": "https://api.github.com/repos/distri/observable/tags",
            "blobs_url": "https://api.github.com/repos/distri/observable/git/blobs{/sha}",
            "git_tags_url": "https://api.github.com/repos/distri/observable/git/tags{/sha}",
            "git_refs_url": "https://api.github.com/repos/distri/observable/git/refs{/sha}",
            "trees_url": "https://api.github.com/repos/distri/observable/git/trees{/sha}",
            "statuses_url": "https://api.github.com/repos/distri/observable/statuses/{sha}",
            "languages_url": "https://api.github.com/repos/distri/observable/languages",
            "stargazers_url": "https://api.github.com/repos/distri/observable/stargazers",
            "contributors_url": "https://api.github.com/repos/distri/observable/contributors",
            "subscribers_url": "https://api.github.com/repos/distri/observable/subscribers",
            "subscription_url": "https://api.github.com/repos/distri/observable/subscription",
            "commits_url": "https://api.github.com/repos/distri/observable/commits{/sha}",
            "git_commits_url": "https://api.github.com/repos/distri/observable/git/commits{/sha}",
            "comments_url": "https://api.github.com/repos/distri/observable/comments{/number}",
            "issue_comment_url": "https://api.github.com/repos/distri/observable/issues/comments/{number}",
            "contents_url": "https://api.github.com/repos/distri/observable/contents/{+path}",
            "compare_url": "https://api.github.com/repos/distri/observable/compare/{base}...{head}",
            "merges_url": "https://api.github.com/repos/distri/observable/merges",
            "archive_url": "https://api.github.com/repos/distri/observable/{archive_format}{/ref}",
            "downloads_url": "https://api.github.com/repos/distri/observable/downloads",
            "issues_url": "https://api.github.com/repos/distri/observable/issues{/number}",
            "pulls_url": "https://api.github.com/repos/distri/observable/pulls{/number}",
            "milestones_url": "https://api.github.com/repos/distri/observable/milestones{/number}",
            "notifications_url": "https://api.github.com/repos/distri/observable/notifications{?since,all,participating}",
            "labels_url": "https://api.github.com/repos/distri/observable/labels{/name}",
            "releases_url": "https://api.github.com/repos/distri/observable/releases{/id}",
            "created_at": "2014-02-23T23:17:52Z",
            "updated_at": "2014-04-02T00:41:29Z",
            "pushed_at": "2014-04-02T00:41:31Z",
            "git_url": "git://github.com/distri/observable.git",
            "ssh_url": "git@github.com:distri/observable.git",
            "clone_url": "https://github.com/distri/observable.git",
            "svn_url": "https://github.com/distri/observable",
            "homepage": null,
            "size": 164,
            "stargazers_count": 0,
            "watchers_count": 0,
            "language": "CoffeeScript",
            "has_issues": true,
            "has_downloads": true,
            "has_wiki": true,
            "forks_count": 0,
            "mirror_url": null,
            "open_issues_count": 0,
            "forks": 0,
            "open_issues": 0,
            "watchers": 0,
            "default_branch": "master",
            "master_branch": "master",
            "permissions": {
              "admin": true,
              "push": true,
              "pull": true
            },
            "organization": {
              "login": "distri",
              "id": 6005125,
              "avatar_url": "https://avatars.githubusercontent.com/u/6005125?",
              "gravatar_id": "192f3f168409e79c42107f081139d9f3",
              "url": "https://api.github.com/users/distri",
              "html_url": "https://github.com/distri",
              "followers_url": "https://api.github.com/users/distri/followers",
              "following_url": "https://api.github.com/users/distri/following{/other_user}",
              "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
              "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
              "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
              "organizations_url": "https://api.github.com/users/distri/orgs",
              "repos_url": "https://api.github.com/users/distri/repos",
              "events_url": "https://api.github.com/users/distri/events{/privacy}",
              "received_events_url": "https://api.github.com/users/distri/received_events",
              "type": "Organization",
              "site_admin": false
            },
            "network_count": 0,
            "subscribers_count": 2,
            "branch": "v0.1.1",
            "publishBranch": "gh-pages"
          },
          "dependencies": {}
        }
      }
    },
    "observable": {
      "source": {
        "LICENSE": {
          "path": "LICENSE",
          "mode": "100644",
          "content": "The MIT License (MIT)\n\nCopyright (c) 2014 distri\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of\nthis software and associated documentation files (the \"Software\"), to deal in\nthe Software without restriction, including without limitation the rights to\nuse, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of\nthe Software, and to permit persons to whom the Software is furnished to do so,\nsubject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS\nFOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR\nCOPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER\nIN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN\nCONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n",
          "type": "blob"
        },
        "README.md": {
          "path": "README.md",
          "mode": "100644",
          "content": "observable\n==========\n",
          "type": "blob"
        },
        "main.coffee.md": {
          "path": "main.coffee.md",
          "mode": "100644",
          "content": "Observable\n==========\n\n`Observable` allows for observing arrays, functions, and objects.\n\nFunction dependencies are automagically observed.\n\nStandard array methods are proxied through to the underlying array.\n\n    Observable = (value) ->\n\nReturn the object if it is already an observable object.\n\n      return value if typeof value?.observe is \"function\"\n\nMaintain a set of listeners to observe changes and provide a helper to notify each observer.\n\n      listeners = []\n\n      notify = (newValue) ->\n        listeners.forEach (listener) ->\n          listener(newValue)\n\nOur observable function is stored as a reference to `self`.\n\nIf `value` is a function compute dependencies and listen to observables that it depends on.\n\n      if typeof value is 'function'\n        fn = value\n        self = ->\n          # Automagic dependency observation\n          magicDependency(self)\n\n          return value\n\n        self.observe = (listener) ->\n          listeners.push listener\n\n        changed = ->\n          value = fn()\n          notify(value)\n\n        value = computeDependencies(fn, changed)\n\n      else\n\nWhen called with zero arguments it is treated as a getter. When called with one argument it is treated as a setter.\n\nChanges to the value will trigger notifications.\n\nThe value is always returned.\n\n        self = (newValue) ->\n          if arguments.length > 0\n            if value != newValue\n              value = newValue\n\n              notify(newValue)\n          else\n            # Automagic dependency observation\n            magicDependency(self)\n\n          return value\n\nAdd a listener for when this object changes.\n\n        self.observe = (listener) ->\n          listeners.push listener\n\nThis `each` iterator is similar to [the Maybe monad](http://en.wikipedia.org/wiki/Monad_&#40;functional_programming&#41;#The_Maybe_monad) in that our observable may contain a single value or nothing at all.\n\n      self.each = (args...) ->\n        if value?\n          [value].forEach(args...)\n\nIf the value is an array then proxy array methods and add notifications to mutation events.\n\n      if Array.isArray(value)\n        [\n          \"concat\"\n          \"every\"\n          \"filter\"\n          \"forEach\"\n          \"indexOf\"\n          \"join\"\n          \"lastIndexOf\"\n          \"map\"\n          \"reduce\"\n          \"reduceRight\"\n          \"slice\"\n          \"some\"\n        ].forEach (method) ->\n          self[method] = (args...) ->\n            value[method](args...)\n\n        [\n          \"pop\"\n          \"push\"\n          \"reverse\"\n          \"shift\"\n          \"splice\"\n          \"sort\"\n          \"unshift\"\n        ].forEach (method) ->\n          self[method] = (args...) ->\n            notifyReturning value[method](args...)\n\n        notifyReturning = (returnValue) ->\n          notify(value)\n\n          return returnValue\n\nAdd some extra helpful methods to array observables.\n\n        extend self,\n          each: (args...) ->\n            self.forEach(args...)\n\n            return self\n\nRemove an element from the array and notify observers of changes.\n\n          remove: (object) ->\n            index = value.indexOf(object)\n\n            if index >= 0\n              notifyReturning value.splice(index, 1)[0]\n\n          get: (index) ->\n            value[index]\n\n          first: ->\n            value[0]\n\n          last: ->\n            value[value.length-1]\n\n      self.stopObserving = (fn) ->\n        remove listeners, fn\n\n      return self\n\nExport `Observable`\n\n    module.exports = Observable\n\nAppendix\n--------\n\nThe extend method adds one objects properties to another.\n\n    extend = (target, sources...) ->\n      for source in sources\n        for name of source\n          target[name] = source[name]\n\n      return target\n\nSuper hax for computing dependencies. This needs to be a shared global so that\ndifferent bundled versions of observable libraries can interoperate.\n\n    global.OBSERVABLE_ROOT_HACK = undefined\n\n    magicDependency = (self) ->\n      if base = global.OBSERVABLE_ROOT_HACK\n        self.observe base\n\n    withBase = (root, fn) ->\n      global.OBSERVABLE_ROOT_HACK = root\n      value = fn()\n      global.OBSERVABLE_ROOT_HACK = undefined\n\n      return value\n\n    base = ->\n      global.OBSERVABLE_ROOT_HACK\n\nAutomagically compute dependencies.\n\n    computeDependencies = (fn, root) ->\n      withBase root, ->\n        fn()\n\nRemove a value from an array.\n\n    remove = (array, value) ->\n      index = array.indexOf(value)\n\n      if index >= 0\n        array.splice(index, 1)[0]\n",
          "type": "blob"
        },
        "pixie.cson": {
          "path": "pixie.cson",
          "mode": "100644",
          "content": "version: \"0.1.1\"\n",
          "type": "blob"
        },
        "test/observable.coffee": {
          "path": "test/observable.coffee",
          "mode": "100644",
          "content": "Observable = require \"../main\"\n\ndescribe 'Observable', ->\n  it 'should create an observable for an object', ->\n    n = 5\n\n    observable = Observable(n)\n\n    assert.equal(observable(), n)\n\n  it 'should fire events when setting', ->\n    string = \"yolo\"\n\n    observable = Observable(string)\n    observable.observe (newValue) ->\n      assert.equal newValue, \"4life\"\n\n    observable(\"4life\")\n\n  it 'should be idempotent', ->\n    o = Observable(5)\n\n    assert.equal o, Observable(o)\n\n  describe \"#each\", ->\n    it \"should be invoked once if there is an observable\", ->\n      o = Observable(5)\n      called = 0\n\n      o.each (value) ->\n        called += 1\n        assert.equal value, 5\n\n      assert.equal called, 1\n\n    it \"should not be invoked if observable is null\", ->\n      o = Observable(null)\n      called = 0\n\n      o.each (value) ->\n        called += 1\n\n      assert.equal called, 0\n\n  it \"should allow for stopping observation\", ->\n    observable = Observable(\"string\")\n\n    called = 0\n    fn = (newValue) ->\n      called += 1\n      assert.equal newValue, \"4life\"\n\n    observable.observe fn\n\n    observable(\"4life\")\n\n    observable.stopObserving fn\n\n    observable(\"wat\")\n\n    assert.equal called, 1\n\ndescribe \"Observable Array\", ->\n  it \"should proxy array methods\", ->\n    o = Observable [5]\n\n    o.map (n) ->\n      assert.equal n, 5\n\n  it \"should notify on mutation methods\", (done) ->\n    o = Observable []\n\n    o.observe (newValue) ->\n      assert.equal newValue[0], 1\n\n    o.push 1\n\n    done()\n\n  it \"should have an each method\", ->\n    o = Observable []\n\n    assert o.each\n\n  it \"#get\", ->\n    o = Observable [0, 1, 2, 3]\n\n    assert.equal o.get(2), 2\n\n  it \"#first\", ->\n    o = Observable [0, 1, 2, 3]\n\n    assert.equal o.first(), 0\n\n  it \"#last\", ->\n    o = Observable [0, 1, 2, 3]\n\n    assert.equal o.last(), 3\n\n  it \"#remove\", (done) ->\n    o = Observable [0, 1, 2, 3]\n\n    o.observe (newValue) ->\n      assert.equal newValue.length, 3\n      setTimeout ->\n        done()\n      , 0\n\n    assert.equal o.remove(2), 2\n\n  # TODO: This looks like it might be impossible\n  it \"should proxy the length property\"\n\ndescribe \"Observable functions\", ->\n  it \"should compute dependencies\", (done) ->\n    firstName = Observable \"Duder\"\n    lastName = Observable \"Man\"\n\n    o = Observable ->\n      \"#{firstName()} #{lastName()}\"\n\n    o.observe (newValue) ->\n      assert.equal newValue, \"Duder Bro\"\n\n      done()\n\n    lastName \"Bro\"\n\n  it \"should allow double nesting\", (done) ->\n    bottom = Observable \"rad\"\n    middle = Observable ->\n      bottom()\n    top = Observable ->\n      middle()\n\n    top.observe (newValue) ->\n      assert.equal newValue, \"wat\"\n      assert.equal top(), newValue\n      assert.equal middle(), newValue\n\n      done()\n\n    bottom(\"wat\")\n\n  it \"should have an each method\", ->\n    o = Observable ->\n\n    assert o.each\n\n  it \"should not invoke when returning undefined\", ->\n    o = Observable ->\n\n    o.each ->\n      assert false\n\n  it \"should invoke when returning any defined value\", (done) ->\n    o = Observable -> 5\n\n    o.each (n) ->\n      assert.equal n, 5\n      done()\n\n  it \"should work on an array dependency\", ->\n    oA = Observable [1, 2, 3]\n\n    o = Observable ->\n      oA()[0]\n\n    last = Observable ->\n      oA()[oA().length-1]\n\n    assert.equal o(), 1\n\n    oA.unshift 0\n\n    assert.equal o(), 0\n\n    oA.push 4\n\n    assert.equal last(), 4, \"Last should be 4\"\n",
          "type": "blob"
        }
      },
      "distribution": {
        "main": {
          "path": "main",
          "content": "(function() {\n  var Observable, base, computeDependencies, extend, magicDependency, remove, withBase,\n    __slice = [].slice;\n\n  Observable = function(value) {\n    var changed, fn, listeners, notify, notifyReturning, self;\n    if (typeof (value != null ? value.observe : void 0) === \"function\") {\n      return value;\n    }\n    listeners = [];\n    notify = function(newValue) {\n      return listeners.forEach(function(listener) {\n        return listener(newValue);\n      });\n    };\n    if (typeof value === 'function') {\n      fn = value;\n      self = function() {\n        magicDependency(self);\n        return value;\n      };\n      self.observe = function(listener) {\n        return listeners.push(listener);\n      };\n      changed = function() {\n        value = fn();\n        return notify(value);\n      };\n      value = computeDependencies(fn, changed);\n    } else {\n      self = function(newValue) {\n        if (arguments.length > 0) {\n          if (value !== newValue) {\n            value = newValue;\n            notify(newValue);\n          }\n        } else {\n          magicDependency(self);\n        }\n        return value;\n      };\n      self.observe = function(listener) {\n        return listeners.push(listener);\n      };\n    }\n    self.each = function() {\n      var args, _ref;\n      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n      if (value != null) {\n        return (_ref = [value]).forEach.apply(_ref, args);\n      }\n    };\n    if (Array.isArray(value)) {\n      [\"concat\", \"every\", \"filter\", \"forEach\", \"indexOf\", \"join\", \"lastIndexOf\", \"map\", \"reduce\", \"reduceRight\", \"slice\", \"some\"].forEach(function(method) {\n        return self[method] = function() {\n          var args;\n          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n          return value[method].apply(value, args);\n        };\n      });\n      [\"pop\", \"push\", \"reverse\", \"shift\", \"splice\", \"sort\", \"unshift\"].forEach(function(method) {\n        return self[method] = function() {\n          var args;\n          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n          return notifyReturning(value[method].apply(value, args));\n        };\n      });\n      notifyReturning = function(returnValue) {\n        notify(value);\n        return returnValue;\n      };\n      extend(self, {\n        each: function() {\n          var args;\n          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n          self.forEach.apply(self, args);\n          return self;\n        },\n        remove: function(object) {\n          var index;\n          index = value.indexOf(object);\n          if (index >= 0) {\n            return notifyReturning(value.splice(index, 1)[0]);\n          }\n        },\n        get: function(index) {\n          return value[index];\n        },\n        first: function() {\n          return value[0];\n        },\n        last: function() {\n          return value[value.length - 1];\n        }\n      });\n    }\n    self.stopObserving = function(fn) {\n      return remove(listeners, fn);\n    };\n    return self;\n  };\n\n  module.exports = Observable;\n\n  extend = function() {\n    var name, source, sources, target, _i, _len;\n    target = arguments[0], sources = 2 <= arguments.length ? __slice.call(arguments, 1) : [];\n    for (_i = 0, _len = sources.length; _i < _len; _i++) {\n      source = sources[_i];\n      for (name in source) {\n        target[name] = source[name];\n      }\n    }\n    return target;\n  };\n\n  global.OBSERVABLE_ROOT_HACK = void 0;\n\n  magicDependency = function(self) {\n    var base;\n    if (base = global.OBSERVABLE_ROOT_HACK) {\n      return self.observe(base);\n    }\n  };\n\n  withBase = function(root, fn) {\n    var value;\n    global.OBSERVABLE_ROOT_HACK = root;\n    value = fn();\n    global.OBSERVABLE_ROOT_HACK = void 0;\n    return value;\n  };\n\n  base = function() {\n    return global.OBSERVABLE_ROOT_HACK;\n  };\n\n  computeDependencies = function(fn, root) {\n    return withBase(root, function() {\n      return fn();\n    });\n  };\n\n  remove = function(array, value) {\n    var index;\n    index = array.indexOf(value);\n    if (index >= 0) {\n      return array.splice(index, 1)[0];\n    }\n  };\n\n}).call(this);\n",
          "type": "blob"
        },
        "pixie": {
          "path": "pixie",
          "content": "module.exports = {\"version\":\"0.1.1\"};",
          "type": "blob"
        },
        "test/observable": {
          "path": "test/observable",
          "content": "(function() {\n  var Observable;\n\n  Observable = require(\"../main\");\n\n  describe('Observable', function() {\n    it('should create an observable for an object', function() {\n      var n, observable;\n      n = 5;\n      observable = Observable(n);\n      return assert.equal(observable(), n);\n    });\n    it('should fire events when setting', function() {\n      var observable, string;\n      string = \"yolo\";\n      observable = Observable(string);\n      observable.observe(function(newValue) {\n        return assert.equal(newValue, \"4life\");\n      });\n      return observable(\"4life\");\n    });\n    it('should be idempotent', function() {\n      var o;\n      o = Observable(5);\n      return assert.equal(o, Observable(o));\n    });\n    describe(\"#each\", function() {\n      it(\"should be invoked once if there is an observable\", function() {\n        var called, o;\n        o = Observable(5);\n        called = 0;\n        o.each(function(value) {\n          called += 1;\n          return assert.equal(value, 5);\n        });\n        return assert.equal(called, 1);\n      });\n      return it(\"should not be invoked if observable is null\", function() {\n        var called, o;\n        o = Observable(null);\n        called = 0;\n        o.each(function(value) {\n          return called += 1;\n        });\n        return assert.equal(called, 0);\n      });\n    });\n    return it(\"should allow for stopping observation\", function() {\n      var called, fn, observable;\n      observable = Observable(\"string\");\n      called = 0;\n      fn = function(newValue) {\n        called += 1;\n        return assert.equal(newValue, \"4life\");\n      };\n      observable.observe(fn);\n      observable(\"4life\");\n      observable.stopObserving(fn);\n      observable(\"wat\");\n      return assert.equal(called, 1);\n    });\n  });\n\n  describe(\"Observable Array\", function() {\n    it(\"should proxy array methods\", function() {\n      var o;\n      o = Observable([5]);\n      return o.map(function(n) {\n        return assert.equal(n, 5);\n      });\n    });\n    it(\"should notify on mutation methods\", function(done) {\n      var o;\n      o = Observable([]);\n      o.observe(function(newValue) {\n        return assert.equal(newValue[0], 1);\n      });\n      o.push(1);\n      return done();\n    });\n    it(\"should have an each method\", function() {\n      var o;\n      o = Observable([]);\n      return assert(o.each);\n    });\n    it(\"#get\", function() {\n      var o;\n      o = Observable([0, 1, 2, 3]);\n      return assert.equal(o.get(2), 2);\n    });\n    it(\"#first\", function() {\n      var o;\n      o = Observable([0, 1, 2, 3]);\n      return assert.equal(o.first(), 0);\n    });\n    it(\"#last\", function() {\n      var o;\n      o = Observable([0, 1, 2, 3]);\n      return assert.equal(o.last(), 3);\n    });\n    it(\"#remove\", function(done) {\n      var o;\n      o = Observable([0, 1, 2, 3]);\n      o.observe(function(newValue) {\n        assert.equal(newValue.length, 3);\n        return setTimeout(function() {\n          return done();\n        }, 0);\n      });\n      return assert.equal(o.remove(2), 2);\n    });\n    return it(\"should proxy the length property\");\n  });\n\n  describe(\"Observable functions\", function() {\n    it(\"should compute dependencies\", function(done) {\n      var firstName, lastName, o;\n      firstName = Observable(\"Duder\");\n      lastName = Observable(\"Man\");\n      o = Observable(function() {\n        return \"\" + (firstName()) + \" \" + (lastName());\n      });\n      o.observe(function(newValue) {\n        assert.equal(newValue, \"Duder Bro\");\n        return done();\n      });\n      return lastName(\"Bro\");\n    });\n    it(\"should allow double nesting\", function(done) {\n      var bottom, middle, top;\n      bottom = Observable(\"rad\");\n      middle = Observable(function() {\n        return bottom();\n      });\n      top = Observable(function() {\n        return middle();\n      });\n      top.observe(function(newValue) {\n        assert.equal(newValue, \"wat\");\n        assert.equal(top(), newValue);\n        assert.equal(middle(), newValue);\n        return done();\n      });\n      return bottom(\"wat\");\n    });\n    it(\"should have an each method\", function() {\n      var o;\n      o = Observable(function() {});\n      return assert(o.each);\n    });\n    it(\"should not invoke when returning undefined\", function() {\n      var o;\n      o = Observable(function() {});\n      return o.each(function() {\n        return assert(false);\n      });\n    });\n    it(\"should invoke when returning any defined value\", function(done) {\n      var o;\n      o = Observable(function() {\n        return 5;\n      });\n      return o.each(function(n) {\n        assert.equal(n, 5);\n        return done();\n      });\n    });\n    return it(\"should work on an array dependency\", function() {\n      var last, o, oA;\n      oA = Observable([1, 2, 3]);\n      o = Observable(function() {\n        return oA()[0];\n      });\n      last = Observable(function() {\n        return oA()[oA().length - 1];\n      });\n      assert.equal(o(), 1);\n      oA.unshift(0);\n      assert.equal(o(), 0);\n      oA.push(4);\n      return assert.equal(last(), 4, \"Last should be 4\");\n    });\n  });\n\n}).call(this);\n",
          "type": "blob"
        }
      },
      "progenitor": {
        "url": "http://strd6.github.io/editor/"
      },
      "version": "0.1.1",
      "entryPoint": "main",
      "repository": {
        "id": 17119562,
        "name": "observable",
        "full_name": "distri/observable",
        "owner": {
          "login": "distri",
          "id": 6005125,
          "avatar_url": "https://avatars.githubusercontent.com/u/6005125?",
          "gravatar_id": "192f3f168409e79c42107f081139d9f3",
          "url": "https://api.github.com/users/distri",
          "html_url": "https://github.com/distri",
          "followers_url": "https://api.github.com/users/distri/followers",
          "following_url": "https://api.github.com/users/distri/following{/other_user}",
          "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
          "organizations_url": "https://api.github.com/users/distri/orgs",
          "repos_url": "https://api.github.com/users/distri/repos",
          "events_url": "https://api.github.com/users/distri/events{/privacy}",
          "received_events_url": "https://api.github.com/users/distri/received_events",
          "type": "Organization",
          "site_admin": false
        },
        "private": false,
        "html_url": "https://github.com/distri/observable",
        "description": "",
        "fork": false,
        "url": "https://api.github.com/repos/distri/observable",
        "forks_url": "https://api.github.com/repos/distri/observable/forks",
        "keys_url": "https://api.github.com/repos/distri/observable/keys{/key_id}",
        "collaborators_url": "https://api.github.com/repos/distri/observable/collaborators{/collaborator}",
        "teams_url": "https://api.github.com/repos/distri/observable/teams",
        "hooks_url": "https://api.github.com/repos/distri/observable/hooks",
        "issue_events_url": "https://api.github.com/repos/distri/observable/issues/events{/number}",
        "events_url": "https://api.github.com/repos/distri/observable/events",
        "assignees_url": "https://api.github.com/repos/distri/observable/assignees{/user}",
        "branches_url": "https://api.github.com/repos/distri/observable/branches{/branch}",
        "tags_url": "https://api.github.com/repos/distri/observable/tags",
        "blobs_url": "https://api.github.com/repos/distri/observable/git/blobs{/sha}",
        "git_tags_url": "https://api.github.com/repos/distri/observable/git/tags{/sha}",
        "git_refs_url": "https://api.github.com/repos/distri/observable/git/refs{/sha}",
        "trees_url": "https://api.github.com/repos/distri/observable/git/trees{/sha}",
        "statuses_url": "https://api.github.com/repos/distri/observable/statuses/{sha}",
        "languages_url": "https://api.github.com/repos/distri/observable/languages",
        "stargazers_url": "https://api.github.com/repos/distri/observable/stargazers",
        "contributors_url": "https://api.github.com/repos/distri/observable/contributors",
        "subscribers_url": "https://api.github.com/repos/distri/observable/subscribers",
        "subscription_url": "https://api.github.com/repos/distri/observable/subscription",
        "commits_url": "https://api.github.com/repos/distri/observable/commits{/sha}",
        "git_commits_url": "https://api.github.com/repos/distri/observable/git/commits{/sha}",
        "comments_url": "https://api.github.com/repos/distri/observable/comments{/number}",
        "issue_comment_url": "https://api.github.com/repos/distri/observable/issues/comments/{number}",
        "contents_url": "https://api.github.com/repos/distri/observable/contents/{+path}",
        "compare_url": "https://api.github.com/repos/distri/observable/compare/{base}...{head}",
        "merges_url": "https://api.github.com/repos/distri/observable/merges",
        "archive_url": "https://api.github.com/repos/distri/observable/{archive_format}{/ref}",
        "downloads_url": "https://api.github.com/repos/distri/observable/downloads",
        "issues_url": "https://api.github.com/repos/distri/observable/issues{/number}",
        "pulls_url": "https://api.github.com/repos/distri/observable/pulls{/number}",
        "milestones_url": "https://api.github.com/repos/distri/observable/milestones{/number}",
        "notifications_url": "https://api.github.com/repos/distri/observable/notifications{?since,all,participating}",
        "labels_url": "https://api.github.com/repos/distri/observable/labels{/name}",
        "releases_url": "https://api.github.com/repos/distri/observable/releases{/id}",
        "created_at": "2014-02-23T23:17:52Z",
        "updated_at": "2014-04-02T00:41:29Z",
        "pushed_at": "2014-04-02T00:41:31Z",
        "git_url": "git://github.com/distri/observable.git",
        "ssh_url": "git@github.com:distri/observable.git",
        "clone_url": "https://github.com/distri/observable.git",
        "svn_url": "https://github.com/distri/observable",
        "homepage": null,
        "size": 164,
        "stargazers_count": 0,
        "watchers_count": 0,
        "language": "CoffeeScript",
        "has_issues": true,
        "has_downloads": true,
        "has_wiki": true,
        "forks_count": 0,
        "mirror_url": null,
        "open_issues_count": 0,
        "forks": 0,
        "open_issues": 0,
        "watchers": 0,
        "default_branch": "master",
        "master_branch": "master",
        "permissions": {
          "admin": true,
          "push": true,
          "pull": true
        },
        "organization": {
          "login": "distri",
          "id": 6005125,
          "avatar_url": "https://avatars.githubusercontent.com/u/6005125?",
          "gravatar_id": "192f3f168409e79c42107f081139d9f3",
          "url": "https://api.github.com/users/distri",
          "html_url": "https://github.com/distri",
          "followers_url": "https://api.github.com/users/distri/followers",
          "following_url": "https://api.github.com/users/distri/following{/other_user}",
          "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
          "organizations_url": "https://api.github.com/users/distri/orgs",
          "repos_url": "https://api.github.com/users/distri/repos",
          "events_url": "https://api.github.com/users/distri/events{/privacy}",
          "received_events_url": "https://api.github.com/users/distri/received_events",
          "type": "Organization",
          "site_admin": false
        },
        "network_count": 0,
        "subscribers_count": 2,
        "branch": "v0.1.1",
        "publishBranch": "gh-pages"
      },
      "dependencies": {}
    },
    "sha1": {
      "source": {
        "LICENSE": {
          "path": "LICENSE",
          "mode": "100644",
          "content": "The MIT License (MIT)\n\nCopyright (c) 2014 \n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the \"Software\"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.",
          "type": "blob"
        },
        "README.md": {
          "path": "README.md",
          "mode": "100644",
          "content": "sha1\n====\n\nSHA1 JS implementation\n",
          "type": "blob"
        },
        "lib/crypto.js": {
          "path": "lib/crypto.js",
          "mode": "100644",
          "content": "/*\nCryptoJS v3.1.2\ncode.google.com/p/crypto-js\n(c) 2009-2013 by Jeff Mott. All rights reserved.\ncode.google.com/p/crypto-js/wiki/License\n*/\nvar CryptoJS=CryptoJS||function(e,m){var p={},j=p.lib={},l=function(){},f=j.Base={extend:function(a){l.prototype=this;var c=new l;a&&c.mixIn(a);c.hasOwnProperty(\"init\")||(c.init=function(){c.$super.init.apply(this,arguments)});c.init.prototype=c;c.$super=this;return c},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var c in a)a.hasOwnProperty(c)&&(this[c]=a[c]);a.hasOwnProperty(\"toString\")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}},\nn=j.WordArray=f.extend({init:function(a,c){a=this.words=a||[];this.sigBytes=c!=m?c:4*a.length},toString:function(a){return(a||h).stringify(this)},concat:function(a){var c=this.words,q=a.words,d=this.sigBytes;a=a.sigBytes;this.clamp();if(d%4)for(var b=0;b<a;b++)c[d+b>>>2]|=(q[b>>>2]>>>24-8*(b%4)&255)<<24-8*((d+b)%4);else if(65535<q.length)for(b=0;b<a;b+=4)c[d+b>>>2]=q[b>>>2];else c.push.apply(c,q);this.sigBytes+=a;return this},clamp:function(){var a=this.words,c=this.sigBytes;a[c>>>2]&=4294967295<<\n32-8*(c%4);a.length=e.ceil(c/4)},clone:function(){var a=f.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){for(var c=[],b=0;b<a;b+=4)c.push(4294967296*e.random()|0);return new n.init(c,a)}}),b=p.enc={},h=b.Hex={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],d=0;d<a;d++){var f=c[d>>>2]>>>24-8*(d%4)&255;b.push((f>>>4).toString(16));b.push((f&15).toString(16))}return b.join(\"\")},parse:function(a){for(var c=a.length,b=[],d=0;d<c;d+=2)b[d>>>3]|=parseInt(a.substr(d,\n2),16)<<24-4*(d%8);return new n.init(b,c/2)}},g=b.Latin1={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],d=0;d<a;d++)b.push(String.fromCharCode(c[d>>>2]>>>24-8*(d%4)&255));return b.join(\"\")},parse:function(a){for(var c=a.length,b=[],d=0;d<c;d++)b[d>>>2]|=(a.charCodeAt(d)&255)<<24-8*(d%4);return new n.init(b,c)}},r=b.Utf8={stringify:function(a){try{return decodeURIComponent(escape(g.stringify(a)))}catch(c){throw Error(\"Malformed UTF-8 data\");}},parse:function(a){return g.parse(unescape(encodeURIComponent(a)))}},\nk=j.BufferedBlockAlgorithm=f.extend({reset:function(){this._data=new n.init;this._nDataBytes=0},_append:function(a){\"string\"==typeof a&&(a=r.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var c=this._data,b=c.words,d=c.sigBytes,f=this.blockSize,h=d/(4*f),h=a?e.ceil(h):e.max((h|0)-this._minBufferSize,0);a=h*f;d=e.min(4*a,d);if(a){for(var g=0;g<a;g+=f)this._doProcessBlock(b,g);g=b.splice(0,a);c.sigBytes-=d}return new n.init(g,d)},clone:function(){var a=f.clone.call(this);\na._data=this._data.clone();return a},_minBufferSize:0});j.Hasher=k.extend({cfg:f.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset()},reset:function(){k.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(c,b){return(new a.init(b)).finalize(c)}},_createHmacHelper:function(a){return function(b,f){return(new s.HMAC.init(a,\nf)).finalize(b)}}});var s=p.algo={};return p}(Math);\n(function(){var e=CryptoJS,m=e.lib,p=m.WordArray,j=m.Hasher,l=[],m=e.algo.SHA1=j.extend({_doReset:function(){this._hash=new p.init([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(f,n){for(var b=this._hash.words,h=b[0],g=b[1],e=b[2],k=b[3],j=b[4],a=0;80>a;a++){if(16>a)l[a]=f[n+a]|0;else{var c=l[a-3]^l[a-8]^l[a-14]^l[a-16];l[a]=c<<1|c>>>31}c=(h<<5|h>>>27)+j+l[a];c=20>a?c+((g&e|~g&k)+1518500249):40>a?c+((g^e^k)+1859775393):60>a?c+((g&e|g&k|e&k)-1894007588):c+((g^e^\nk)-899497514);j=k;k=e;e=g<<30|g>>>2;g=h;h=c}b[0]=b[0]+h|0;b[1]=b[1]+g|0;b[2]=b[2]+e|0;b[3]=b[3]+k|0;b[4]=b[4]+j|0},_doFinalize:function(){var f=this._data,e=f.words,b=8*this._nDataBytes,h=8*f.sigBytes;e[h>>>5]|=128<<24-h%32;e[(h+64>>>9<<4)+14]=Math.floor(b/4294967296);e[(h+64>>>9<<4)+15]=b;f.sigBytes=4*e.length;this._process();return this._hash},clone:function(){var e=j.clone.call(this);e._hash=this._hash.clone();return e}});e.SHA1=j._createHelper(m);e.HmacSHA1=j._createHmacHelper(m)})();\n\n/*\nCryptoJS v3.1.2\ncode.google.com/p/crypto-js\n(c) 2009-2013 by Jeff Mott. All rights reserved.\ncode.google.com/p/crypto-js/wiki/License\n*/\n(function(){if(\"function\"==typeof ArrayBuffer){var b=CryptoJS.lib.WordArray,e=b.init;(b.init=function(a){a instanceof ArrayBuffer&&(a=new Uint8Array(a));if(a instanceof Int8Array||a instanceof Uint8ClampedArray||a instanceof Int16Array||a instanceof Uint16Array||a instanceof Int32Array||a instanceof Uint32Array||a instanceof Float32Array||a instanceof Float64Array)a=new Uint8Array(a.buffer,a.byteOffset,a.byteLength);if(a instanceof Uint8Array){for(var b=a.byteLength,d=[],c=0;c<b;c++)d[c>>>2]|=a[c]<<\n24-8*(c%4);e.call(this,d,b)}else e.apply(this,arguments)}).prototype=b}})();\n\nmodule.exports = CryptoJS;\n",
          "type": "blob"
        },
        "main.coffee.md": {
          "path": "main.coffee.md",
          "mode": "100644",
          "content": "SHA1\n====\n\nCurrently just exposing Crypto.js implementation.\n\n    module.exports = require(\"./lib/crypto\")\n",
          "type": "blob"
        },
        "test/sha1.coffee": {
          "path": "test/sha1.coffee",
          "mode": "100644",
          "content": "CryptoJS = require \"../main\"\nSHA1 = CryptoJS.SHA1\n\ndescribe \"SHA1\", ->\n  it \"should hash stuff\", ->\n    sha = SHA1(\"\").toString()\n\n    assert sha\n\n  it \"should hash array buffers\", ->\n    arrayBuffer = new ArrayBuffer(0)\n\n    sha = SHA1(CryptoJS.lib.WordArray.create(arrayBuffer)).toString()\n\n    assert sha\n",
          "type": "blob"
        },
        "pixie.cson": {
          "path": "pixie.cson",
          "mode": "100644",
          "content": "version: \"0.1.0\"\n",
          "type": "blob"
        }
      },
      "distribution": {
        "lib/crypto": {
          "path": "lib/crypto",
          "content": "/*\nCryptoJS v3.1.2\ncode.google.com/p/crypto-js\n(c) 2009-2013 by Jeff Mott. All rights reserved.\ncode.google.com/p/crypto-js/wiki/License\n*/\nvar CryptoJS=CryptoJS||function(e,m){var p={},j=p.lib={},l=function(){},f=j.Base={extend:function(a){l.prototype=this;var c=new l;a&&c.mixIn(a);c.hasOwnProperty(\"init\")||(c.init=function(){c.$super.init.apply(this,arguments)});c.init.prototype=c;c.$super=this;return c},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var c in a)a.hasOwnProperty(c)&&(this[c]=a[c]);a.hasOwnProperty(\"toString\")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}},\nn=j.WordArray=f.extend({init:function(a,c){a=this.words=a||[];this.sigBytes=c!=m?c:4*a.length},toString:function(a){return(a||h).stringify(this)},concat:function(a){var c=this.words,q=a.words,d=this.sigBytes;a=a.sigBytes;this.clamp();if(d%4)for(var b=0;b<a;b++)c[d+b>>>2]|=(q[b>>>2]>>>24-8*(b%4)&255)<<24-8*((d+b)%4);else if(65535<q.length)for(b=0;b<a;b+=4)c[d+b>>>2]=q[b>>>2];else c.push.apply(c,q);this.sigBytes+=a;return this},clamp:function(){var a=this.words,c=this.sigBytes;a[c>>>2]&=4294967295<<\n32-8*(c%4);a.length=e.ceil(c/4)},clone:function(){var a=f.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){for(var c=[],b=0;b<a;b+=4)c.push(4294967296*e.random()|0);return new n.init(c,a)}}),b=p.enc={},h=b.Hex={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],d=0;d<a;d++){var f=c[d>>>2]>>>24-8*(d%4)&255;b.push((f>>>4).toString(16));b.push((f&15).toString(16))}return b.join(\"\")},parse:function(a){for(var c=a.length,b=[],d=0;d<c;d+=2)b[d>>>3]|=parseInt(a.substr(d,\n2),16)<<24-4*(d%8);return new n.init(b,c/2)}},g=b.Latin1={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],d=0;d<a;d++)b.push(String.fromCharCode(c[d>>>2]>>>24-8*(d%4)&255));return b.join(\"\")},parse:function(a){for(var c=a.length,b=[],d=0;d<c;d++)b[d>>>2]|=(a.charCodeAt(d)&255)<<24-8*(d%4);return new n.init(b,c)}},r=b.Utf8={stringify:function(a){try{return decodeURIComponent(escape(g.stringify(a)))}catch(c){throw Error(\"Malformed UTF-8 data\");}},parse:function(a){return g.parse(unescape(encodeURIComponent(a)))}},\nk=j.BufferedBlockAlgorithm=f.extend({reset:function(){this._data=new n.init;this._nDataBytes=0},_append:function(a){\"string\"==typeof a&&(a=r.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var c=this._data,b=c.words,d=c.sigBytes,f=this.blockSize,h=d/(4*f),h=a?e.ceil(h):e.max((h|0)-this._minBufferSize,0);a=h*f;d=e.min(4*a,d);if(a){for(var g=0;g<a;g+=f)this._doProcessBlock(b,g);g=b.splice(0,a);c.sigBytes-=d}return new n.init(g,d)},clone:function(){var a=f.clone.call(this);\na._data=this._data.clone();return a},_minBufferSize:0});j.Hasher=k.extend({cfg:f.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset()},reset:function(){k.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(c,b){return(new a.init(b)).finalize(c)}},_createHmacHelper:function(a){return function(b,f){return(new s.HMAC.init(a,\nf)).finalize(b)}}});var s=p.algo={};return p}(Math);\n(function(){var e=CryptoJS,m=e.lib,p=m.WordArray,j=m.Hasher,l=[],m=e.algo.SHA1=j.extend({_doReset:function(){this._hash=new p.init([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(f,n){for(var b=this._hash.words,h=b[0],g=b[1],e=b[2],k=b[3],j=b[4],a=0;80>a;a++){if(16>a)l[a]=f[n+a]|0;else{var c=l[a-3]^l[a-8]^l[a-14]^l[a-16];l[a]=c<<1|c>>>31}c=(h<<5|h>>>27)+j+l[a];c=20>a?c+((g&e|~g&k)+1518500249):40>a?c+((g^e^k)+1859775393):60>a?c+((g&e|g&k|e&k)-1894007588):c+((g^e^\nk)-899497514);j=k;k=e;e=g<<30|g>>>2;g=h;h=c}b[0]=b[0]+h|0;b[1]=b[1]+g|0;b[2]=b[2]+e|0;b[3]=b[3]+k|0;b[4]=b[4]+j|0},_doFinalize:function(){var f=this._data,e=f.words,b=8*this._nDataBytes,h=8*f.sigBytes;e[h>>>5]|=128<<24-h%32;e[(h+64>>>9<<4)+14]=Math.floor(b/4294967296);e[(h+64>>>9<<4)+15]=b;f.sigBytes=4*e.length;this._process();return this._hash},clone:function(){var e=j.clone.call(this);e._hash=this._hash.clone();return e}});e.SHA1=j._createHelper(m);e.HmacSHA1=j._createHmacHelper(m)})();\n\n/*\nCryptoJS v3.1.2\ncode.google.com/p/crypto-js\n(c) 2009-2013 by Jeff Mott. All rights reserved.\ncode.google.com/p/crypto-js/wiki/License\n*/\n(function(){if(\"function\"==typeof ArrayBuffer){var b=CryptoJS.lib.WordArray,e=b.init;(b.init=function(a){a instanceof ArrayBuffer&&(a=new Uint8Array(a));if(a instanceof Int8Array||a instanceof Uint8ClampedArray||a instanceof Int16Array||a instanceof Uint16Array||a instanceof Int32Array||a instanceof Uint32Array||a instanceof Float32Array||a instanceof Float64Array)a=new Uint8Array(a.buffer,a.byteOffset,a.byteLength);if(a instanceof Uint8Array){for(var b=a.byteLength,d=[],c=0;c<b;c++)d[c>>>2]|=a[c]<<\n24-8*(c%4);e.call(this,d,b)}else e.apply(this,arguments)}).prototype=b}})();\n\nmodule.exports = CryptoJS;\n",
          "type": "blob"
        },
        "main": {
          "path": "main",
          "content": "(function() {\n  module.exports = require(\"./lib/crypto\");\n\n}).call(this);\n",
          "type": "blob"
        },
        "test/sha1": {
          "path": "test/sha1",
          "content": "(function() {\n  var CryptoJS, SHA1;\n\n  CryptoJS = require(\"../main\");\n\n  SHA1 = CryptoJS.SHA1;\n\n  describe(\"SHA1\", function() {\n    it(\"should hash stuff\", function() {\n      var sha;\n      sha = SHA1(\"\").toString();\n      return assert(sha);\n    });\n    return it(\"should hash array buffers\", function() {\n      var arrayBuffer, sha;\n      arrayBuffer = new ArrayBuffer(0);\n      sha = SHA1(CryptoJS.lib.WordArray.create(arrayBuffer)).toString();\n      return assert(sha);\n    });\n  });\n\n}).call(this);\n",
          "type": "blob"
        },
        "pixie": {
          "path": "pixie",
          "content": "module.exports = {\"version\":\"0.1.0\"};",
          "type": "blob"
        }
      },
      "progenitor": {
        "url": "http://strd6.github.io/editor/"
      },
      "version": "0.1.0",
      "entryPoint": "main",
      "repository": {
        "id": 18529997,
        "name": "sha1",
        "full_name": "distri/sha1",
        "owner": {
          "login": "distri",
          "id": 6005125,
          "avatar_url": "https://avatars.githubusercontent.com/u/6005125?",
          "gravatar_id": "192f3f168409e79c42107f081139d9f3",
          "url": "https://api.github.com/users/distri",
          "html_url": "https://github.com/distri",
          "followers_url": "https://api.github.com/users/distri/followers",
          "following_url": "https://api.github.com/users/distri/following{/other_user}",
          "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
          "organizations_url": "https://api.github.com/users/distri/orgs",
          "repos_url": "https://api.github.com/users/distri/repos",
          "events_url": "https://api.github.com/users/distri/events{/privacy}",
          "received_events_url": "https://api.github.com/users/distri/received_events",
          "type": "Organization",
          "site_admin": false
        },
        "private": false,
        "html_url": "https://github.com/distri/sha1",
        "description": "SHA1 JS implementation",
        "fork": false,
        "url": "https://api.github.com/repos/distri/sha1",
        "forks_url": "https://api.github.com/repos/distri/sha1/forks",
        "keys_url": "https://api.github.com/repos/distri/sha1/keys{/key_id}",
        "collaborators_url": "https://api.github.com/repos/distri/sha1/collaborators{/collaborator}",
        "teams_url": "https://api.github.com/repos/distri/sha1/teams",
        "hooks_url": "https://api.github.com/repos/distri/sha1/hooks",
        "issue_events_url": "https://api.github.com/repos/distri/sha1/issues/events{/number}",
        "events_url": "https://api.github.com/repos/distri/sha1/events",
        "assignees_url": "https://api.github.com/repos/distri/sha1/assignees{/user}",
        "branches_url": "https://api.github.com/repos/distri/sha1/branches{/branch}",
        "tags_url": "https://api.github.com/repos/distri/sha1/tags",
        "blobs_url": "https://api.github.com/repos/distri/sha1/git/blobs{/sha}",
        "git_tags_url": "https://api.github.com/repos/distri/sha1/git/tags{/sha}",
        "git_refs_url": "https://api.github.com/repos/distri/sha1/git/refs{/sha}",
        "trees_url": "https://api.github.com/repos/distri/sha1/git/trees{/sha}",
        "statuses_url": "https://api.github.com/repos/distri/sha1/statuses/{sha}",
        "languages_url": "https://api.github.com/repos/distri/sha1/languages",
        "stargazers_url": "https://api.github.com/repos/distri/sha1/stargazers",
        "contributors_url": "https://api.github.com/repos/distri/sha1/contributors",
        "subscribers_url": "https://api.github.com/repos/distri/sha1/subscribers",
        "subscription_url": "https://api.github.com/repos/distri/sha1/subscription",
        "commits_url": "https://api.github.com/repos/distri/sha1/commits{/sha}",
        "git_commits_url": "https://api.github.com/repos/distri/sha1/git/commits{/sha}",
        "comments_url": "https://api.github.com/repos/distri/sha1/comments{/number}",
        "issue_comment_url": "https://api.github.com/repos/distri/sha1/issues/comments/{number}",
        "contents_url": "https://api.github.com/repos/distri/sha1/contents/{+path}",
        "compare_url": "https://api.github.com/repos/distri/sha1/compare/{base}...{head}",
        "merges_url": "https://api.github.com/repos/distri/sha1/merges",
        "archive_url": "https://api.github.com/repos/distri/sha1/{archive_format}{/ref}",
        "downloads_url": "https://api.github.com/repos/distri/sha1/downloads",
        "issues_url": "https://api.github.com/repos/distri/sha1/issues{/number}",
        "pulls_url": "https://api.github.com/repos/distri/sha1/pulls{/number}",
        "milestones_url": "https://api.github.com/repos/distri/sha1/milestones{/number}",
        "notifications_url": "https://api.github.com/repos/distri/sha1/notifications{?since,all,participating}",
        "labels_url": "https://api.github.com/repos/distri/sha1/labels{/name}",
        "releases_url": "https://api.github.com/repos/distri/sha1/releases{/id}",
        "created_at": "2014-04-07T19:20:33Z",
        "updated_at": "2014-04-07T19:20:33Z",
        "pushed_at": "2014-04-07T19:20:33Z",
        "git_url": "git://github.com/distri/sha1.git",
        "ssh_url": "git@github.com:distri/sha1.git",
        "clone_url": "https://github.com/distri/sha1.git",
        "svn_url": "https://github.com/distri/sha1",
        "homepage": null,
        "size": 0,
        "stargazers_count": 0,
        "watchers_count": 0,
        "language": null,
        "has_issues": true,
        "has_downloads": true,
        "has_wiki": true,
        "forks_count": 0,
        "mirror_url": null,
        "open_issues_count": 0,
        "forks": 0,
        "open_issues": 0,
        "watchers": 0,
        "default_branch": "master",
        "master_branch": "master",
        "permissions": {
          "admin": true,
          "push": true,
          "pull": true
        },
        "organization": {
          "login": "distri",
          "id": 6005125,
          "avatar_url": "https://avatars.githubusercontent.com/u/6005125?",
          "gravatar_id": "192f3f168409e79c42107f081139d9f3",
          "url": "https://api.github.com/users/distri",
          "html_url": "https://github.com/distri",
          "followers_url": "https://api.github.com/users/distri/followers",
          "following_url": "https://api.github.com/users/distri/following{/other_user}",
          "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
          "organizations_url": "https://api.github.com/users/distri/orgs",
          "repos_url": "https://api.github.com/users/distri/repos",
          "events_url": "https://api.github.com/users/distri/events{/privacy}",
          "received_events_url": "https://api.github.com/users/distri/received_events",
          "type": "Organization",
          "site_admin": false
        },
        "network_count": 0,
        "subscribers_count": 2,
        "branch": "v0.1.0",
        "publishBranch": "gh-pages"
      },
      "dependencies": {}
    },
    "util": {
      "source": {
        "LICENSE": {
          "path": "LICENSE",
          "mode": "100644",
          "content": "The MIT License (MIT)\n\nCopyright (c) 2014 \n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the \"Software\"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.",
          "type": "blob"
        },
        "README.md": {
          "path": "README.md",
          "mode": "100644",
          "content": "util\n====\n\nSmall utility methods for JS\n",
          "type": "blob"
        },
        "main.coffee.md": {
          "path": "main.coffee.md",
          "mode": "100644",
          "content": "Util\n====\n\n    module.exports =\n      approach: (current, target, amount) ->\n        (target - current).clamp(-amount, amount) + current\n\nApply a stylesheet idempotently.\n\n      applyStylesheet: (style, id=\"primary\") ->\n        styleNode = document.createElement(\"style\")\n        styleNode.innerHTML = style\n        styleNode.id = id\n\n        if previousStyleNode = document.head.querySelector(\"style##{id}\")\n          previousStyleNode.parentNode.removeChild(prevousStyleNode)\n\n        document.head.appendChild(styleNode)\n\n      defaults: (target, objects...) ->\n        for object in objects\n          for name of object\n            unless target.hasOwnProperty(name)\n              target[name] = object[name]\n\n        return target\n\n      extend: (target, sources...) ->\n        for source in sources\n          for name of source\n            target[name] = source[name]\n\n        return target\n",
          "type": "blob"
        },
        "pixie.cson": {
          "path": "pixie.cson",
          "mode": "100644",
          "content": "version: \"0.1.0\"\n",
          "type": "blob"
        }
      },
      "distribution": {
        "main": {
          "path": "main",
          "content": "(function() {\n  var __slice = [].slice;\n\n  module.exports = {\n    approach: function(current, target, amount) {\n      return (target - current).clamp(-amount, amount) + current;\n    },\n    applyStylesheet: function(style, id) {\n      var previousStyleNode, styleNode;\n      if (id == null) {\n        id = \"primary\";\n      }\n      styleNode = document.createElement(\"style\");\n      styleNode.innerHTML = style;\n      styleNode.id = id;\n      if (previousStyleNode = document.head.querySelector(\"style#\" + id)) {\n        previousStyleNode.parentNode.removeChild(prevousStyleNode);\n      }\n      return document.head.appendChild(styleNode);\n    },\n    defaults: function() {\n      var name, object, objects, target, _i, _len;\n      target = arguments[0], objects = 2 <= arguments.length ? __slice.call(arguments, 1) : [];\n      for (_i = 0, _len = objects.length; _i < _len; _i++) {\n        object = objects[_i];\n        for (name in object) {\n          if (!target.hasOwnProperty(name)) {\n            target[name] = object[name];\n          }\n        }\n      }\n      return target;\n    },\n    extend: function() {\n      var name, source, sources, target, _i, _len;\n      target = arguments[0], sources = 2 <= arguments.length ? __slice.call(arguments, 1) : [];\n      for (_i = 0, _len = sources.length; _i < _len; _i++) {\n        source = sources[_i];\n        for (name in source) {\n          target[name] = source[name];\n        }\n      }\n      return target;\n    }\n  };\n\n}).call(this);\n",
          "type": "blob"
        },
        "pixie": {
          "path": "pixie",
          "content": "module.exports = {\"version\":\"0.1.0\"};",
          "type": "blob"
        }
      },
      "progenitor": {
        "url": "http://strd6.github.io/editor/"
      },
      "version": "0.1.0",
      "entryPoint": "main",
      "repository": {
        "id": 18501018,
        "name": "util",
        "full_name": "distri/util",
        "owner": {
          "login": "distri",
          "id": 6005125,
          "avatar_url": "https://avatars.githubusercontent.com/u/6005125?",
          "gravatar_id": "192f3f168409e79c42107f081139d9f3",
          "url": "https://api.github.com/users/distri",
          "html_url": "https://github.com/distri",
          "followers_url": "https://api.github.com/users/distri/followers",
          "following_url": "https://api.github.com/users/distri/following{/other_user}",
          "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
          "organizations_url": "https://api.github.com/users/distri/orgs",
          "repos_url": "https://api.github.com/users/distri/repos",
          "events_url": "https://api.github.com/users/distri/events{/privacy}",
          "received_events_url": "https://api.github.com/users/distri/received_events",
          "type": "Organization",
          "site_admin": false
        },
        "private": false,
        "html_url": "https://github.com/distri/util",
        "description": "Small utility methods for JS",
        "fork": false,
        "url": "https://api.github.com/repos/distri/util",
        "forks_url": "https://api.github.com/repos/distri/util/forks",
        "keys_url": "https://api.github.com/repos/distri/util/keys{/key_id}",
        "collaborators_url": "https://api.github.com/repos/distri/util/collaborators{/collaborator}",
        "teams_url": "https://api.github.com/repos/distri/util/teams",
        "hooks_url": "https://api.github.com/repos/distri/util/hooks",
        "issue_events_url": "https://api.github.com/repos/distri/util/issues/events{/number}",
        "events_url": "https://api.github.com/repos/distri/util/events",
        "assignees_url": "https://api.github.com/repos/distri/util/assignees{/user}",
        "branches_url": "https://api.github.com/repos/distri/util/branches{/branch}",
        "tags_url": "https://api.github.com/repos/distri/util/tags",
        "blobs_url": "https://api.github.com/repos/distri/util/git/blobs{/sha}",
        "git_tags_url": "https://api.github.com/repos/distri/util/git/tags{/sha}",
        "git_refs_url": "https://api.github.com/repos/distri/util/git/refs{/sha}",
        "trees_url": "https://api.github.com/repos/distri/util/git/trees{/sha}",
        "statuses_url": "https://api.github.com/repos/distri/util/statuses/{sha}",
        "languages_url": "https://api.github.com/repos/distri/util/languages",
        "stargazers_url": "https://api.github.com/repos/distri/util/stargazers",
        "contributors_url": "https://api.github.com/repos/distri/util/contributors",
        "subscribers_url": "https://api.github.com/repos/distri/util/subscribers",
        "subscription_url": "https://api.github.com/repos/distri/util/subscription",
        "commits_url": "https://api.github.com/repos/distri/util/commits{/sha}",
        "git_commits_url": "https://api.github.com/repos/distri/util/git/commits{/sha}",
        "comments_url": "https://api.github.com/repos/distri/util/comments{/number}",
        "issue_comment_url": "https://api.github.com/repos/distri/util/issues/comments/{number}",
        "contents_url": "https://api.github.com/repos/distri/util/contents/{+path}",
        "compare_url": "https://api.github.com/repos/distri/util/compare/{base}...{head}",
        "merges_url": "https://api.github.com/repos/distri/util/merges",
        "archive_url": "https://api.github.com/repos/distri/util/{archive_format}{/ref}",
        "downloads_url": "https://api.github.com/repos/distri/util/downloads",
        "issues_url": "https://api.github.com/repos/distri/util/issues{/number}",
        "pulls_url": "https://api.github.com/repos/distri/util/pulls{/number}",
        "milestones_url": "https://api.github.com/repos/distri/util/milestones{/number}",
        "notifications_url": "https://api.github.com/repos/distri/util/notifications{?since,all,participating}",
        "labels_url": "https://api.github.com/repos/distri/util/labels{/name}",
        "releases_url": "https://api.github.com/repos/distri/util/releases{/id}",
        "created_at": "2014-04-06T22:42:56Z",
        "updated_at": "2014-04-06T22:42:56Z",
        "pushed_at": "2014-04-06T22:42:56Z",
        "git_url": "git://github.com/distri/util.git",
        "ssh_url": "git@github.com:distri/util.git",
        "clone_url": "https://github.com/distri/util.git",
        "svn_url": "https://github.com/distri/util",
        "homepage": null,
        "size": 0,
        "stargazers_count": 0,
        "watchers_count": 0,
        "language": null,
        "has_issues": true,
        "has_downloads": true,
        "has_wiki": true,
        "forks_count": 0,
        "mirror_url": null,
        "open_issues_count": 0,
        "forks": 0,
        "open_issues": 0,
        "watchers": 0,
        "default_branch": "master",
        "master_branch": "master",
        "permissions": {
          "admin": true,
          "push": true,
          "pull": true
        },
        "organization": {
          "login": "distri",
          "id": 6005125,
          "avatar_url": "https://avatars.githubusercontent.com/u/6005125?",
          "gravatar_id": "192f3f168409e79c42107f081139d9f3",
          "url": "https://api.github.com/users/distri",
          "html_url": "https://github.com/distri",
          "followers_url": "https://api.github.com/users/distri/followers",
          "following_url": "https://api.github.com/users/distri/following{/other_user}",
          "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
          "organizations_url": "https://api.github.com/users/distri/orgs",
          "repos_url": "https://api.github.com/users/distri/repos",
          "events_url": "https://api.github.com/users/distri/events{/privacy}",
          "received_events_url": "https://api.github.com/users/distri/received_events",
          "type": "Organization",
          "site_admin": false
        },
        "network_count": 0,
        "subscribers_count": 2,
        "branch": "v0.1.0",
        "publishBranch": "gh-pages"
      },
      "dependencies": {}
    }
  }
});