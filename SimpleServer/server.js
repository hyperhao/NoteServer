var http = require("http");
var url = require("url");
var fs = require("fs");
var querystring = require("querystring");
var util = require("util");

http
  .createServer(function(req, res) {
    var q = url.parse(req.url, true);
    var cmd = q.pathname;
    var params = q.query;

    var filename = "./notes.json";
    var data = getFileContent(filename);
    if (data.length == 0) {
      data = "[]";
    }
    var notes = JSON.parse(data);

    if (cmd == "/list") {
      // 拉取列表
      res.writeHead(200, { "Content-Type": "text/json; charset=utf-8" });
      res.write(JSON.stringify(notes));
    } else if (cmd == "/create") {
      // 增
      var post = "";
      req.on("data", function(chunk) {
        post += chunk;
      });
      req.on("end", function() {
        post = querystring.parse(post);
        var newNote = {
          id: Date.now(),
          title: post.note_title,
          content: post.note_content,
          timestamp: new Date().Format("yyyy-MM-dd hh:mm:ss")
        };
        notes.push(newNote);
        dataProccessed = JSON.stringify(notes);
        // console.log(dataProccessed);
        fs.writeFileSync(filename, dataProccessed, function(err) {
          if (err) {
            console.error(err);
          }
        });
      });
    } else if (cmd == "/read") {
      // 查
      if (params["id"] != null) {
        var note = getNoteWithID(notes, params["id"]);
        res.writeHead(200, { "Content-Type": "text/json; charset=utf-8" });
        res.write(JSON.stringify(note));
      }
    } else if (cmd == "/update") {
      // 改
      var post = "";
      req.on("data", function(chunk) {
        post += chunk;
      });
      req.on("end", function() {
        post = querystring.parse(post);
        if (post.note_id != null) {
          var updatedNote = {
            id: Number(post.note_id),
            title: post.note_title,
            content: post.note_content,
            timestamp: new Date().Format("yyyy-MM-dd hh:mm:ss")
          };
          var u = updateNoteWithID(notes, post.note_id, updatedNote);
          dataProccessed = JSON.stringify(u);
          fs.writeFileSync(filename, dataProccessed, function(err) {
            if (err) {
              console.error(err);
            }
          });
        }
      });
    } else if (cmd == "/delete") {
      // 删
      if (params["id"] != null) {
        var u = removeNoteWithID(notes, params["id"]);
        dataProccessed = JSON.stringify(u);
        fs.writeFileSync(filename, dataProccessed, function(err) {
          if (err) {
            console.error(err);
          }
        });
      }
    } else {
      // error
    }

    return res.end();
  })
  .listen(8080);

function getFileContent(filepath) {
  return fs.readFileSync(filepath, "utf-8");
}

function getNoteWithID(notes, id) {
  var note = null;
  for (let index = 0; index < notes.length; index++) {
    const element = notes[index];
    if (element["id"] == id) {
      note = element;
      break;
    }
  }
  return note;
}

function updateNoteWithID(notes, id, updatedNote) {
  for (let index = 0; index < notes.length; index++) {
    const element = notes[index];
    if (element["id"] == id) {
      notes[index] = updatedNote;
      break;
    }
  }
  return notes;
}

function removeNoteWithID(notes, id) {
  var i = -1;
  for (let index = 0; index < notes.length; index++) {
    const element = notes[index];
    if (element["id"] == id) {
      i = index;
      break;
    }
  }
  if (i >= 0) {
    notes.splice(i, 1);
  }
  return notes;
}

Date.prototype.Format = function(fmt) {
  var o = {
    "M+": this.getMonth() + 1, //月份
    "d+": this.getDate(), //日
    "h+": this.getHours(), //小时
    "m+": this.getMinutes(), //分
    "s+": this.getSeconds(), //秒
    S: this.getMilliseconds() //毫秒
  };
  if (/(y+)/.test(fmt))
    fmt = fmt.replace(
      RegExp.$1,
      (this.getFullYear() + "").substr(4 - RegExp.$1.length)
    );
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt))
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length)
      );
  return fmt;
};
