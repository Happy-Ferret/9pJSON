var unit = require("./unit"),
	ixp = require("./ixp");

console.log("ixp:");
var root = ixp.mkroot();
root.mkdir("/a").mkdir("b");
root.mkdir("/a/a").mkdir("b");
root.mkdir("/a/nother");

//lookup should return a directory
unit.testcase(ixp.isDir(root.lookup("/a/a/b", false)));
//child nodes should be able to lookup
exports.lookup_nother = function(test){
  var fixture = root.lookup('/a').lookup('nother');
  test.equals(fixture.name, "nother", "lookup failure");
  test.done();
};
//should throw an error if path is not found
unit.testcase(unit.should_throw("/a/c not found", function(){
    root.lookup("/a/c");
}));

//files
exports.mkfile = function(test){
  var k = {open: null, read: null, write: null, close: null};
  var parent = root.lookup('/a/b', false);
  var fixture = parent.mkfile("file0", k.open, k.read, k.write, k.close);
  test.ok(ixp.isFile(fixture));
  test.equals(fixture.name, "file0");
  test.done();
};

console.log("protocol 9p:");
console.log("should answer Tnonesuch with an error");
ixp.Service.answer({type:99, tag: 1998});

console.log("should answer Tversion with ???");
ixp.Service.answer({type:100, tag: 1999, version: "tablespoon"});

console.log("should answer Tauth with an error");
ixp.Service.answer({type:ixp.Tauth, tag: 2000});

ixp.Service.tree = root;
console.log("should allow first Tattach");
ixp.Service.answer({type:ixp.Tattach, tag: 2000, fid: 1812});

console.log("should fail second Tattach with same fid");
ixp.Service.answer({type:ixp.Tattach, tag: 2000, fid: 1812});

ixp.Service.send9p = function(p){return JSON.stringify(p);};
exports.Tread = function(test) {
  test.equals(
      ixp.Service.answer({type:ixp.Tread, tag: 2001, fid:1812, offset: 0}),
      //this shold be a dirent reply, need to decode it
      '{"type":"117","tag":2001,"data":"You may find yourself in another part of the world."}',
      "Tread fail"); 
  test.done();
};

var fmt_dirent = [
"i2:size", "i2:type", "i4:dev", "b13:qid", "i4:mode", "i4:atime", "i4:mtime", "i8:length", "S2:name", "S2:uid", "S2:gid", "S2:muid"
];
var util = require('./ixputil');
exports.dirent = function(test) {
  var fixture = util.unpack(ixp.dirent(root), fmt_dirent);
  test.equals(fixture.type, "0", "dirent type fail");
  test.equals(fixture.name, "/", "dirent name fail");
  test.done();
};

exports.dirent_a = function(test){
  var fixture = util.unpack(ixp.dirent(root.lookup("a")), fmt_dirent);
  test.equals(fixture.type, "0");
  test.equals(fixture.name, "a");
  test.done();
};

//add a test to walk to a file and read it
// attach, walk, open, read, close