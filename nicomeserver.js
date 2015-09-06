// Dependencies
var request= require('request');
var cheerio= require('cheerio');
var net= require('net');


var WebSocketServer = require('ws').Server
  , http = require('http')
  , express = require('express')
  , app = express()
  , port = process.env.PORT || 5000;

app.use(express.static(__dirname + '/'));

var server = http.createServer(app);
server.listen(port);

console.log('http server listening on %d', port);

var hostPC;

var wss = new WebSocketServer({server: server});
console.log('websocket server created');


// Demonstration
process.nextTick(function(){
  // Environment
  var id= 'メールアドレス';
  var pw= 'パスワード';
  var live_id= 'coxxxxx';

  // Boot
  nicolive.login(id,pw,function(error,session){
    if(error!=null) throw error;

    nicolive.fetchThread(live_id,session,function(error,thread){
      if(error!=null) throw error;

      nicolive.view(thread,function(error,viewer){
        if(error!=null) throw error;

      wss.on('connection', function(ws) {
     ws.send('something');

    //定期的にデータ送っとかないと接続が切れてしまう環境があるらしいのでたぶんそのための処理
/*    var id = setInterval(function() {
        ws.send(JSON.stringify({'msg':'none', 'date':new Date()}), function() {  });
    }, 1000);
*/

    console.log('websocket connection open');
    viewer.on('data',function(data){
      var comment = data.match(/<chat.+">(.+)<\/chat>/);
      //ws.send(data);
	ws.send(comment[1]);
    });

    ws.on('close', function() {
        clearInterval(id);
    });
});


        viewer.on('data',function(data){
	  var comment = data.match(/<chat.+">(.+)<\/chat>/);
          console.log(comment[1]);
        });

      });
    });
  });
});

// Methods
nicolive= {
  login: function(id,pw,callback){
    request.post({
      url: 'https://secure.nicovideo.jp/secure/login',
      form: {
        mail_tel: id,
        password: pw,
      },
    },function(error,response){
      if(error!=null) return callback(error);

      var session= null;
      var cookies= response.headers['set-cookie'] || [];
      for(var i=0; i<cookies.length; i++){
        var cookie= cookies[i];
        if(cookie.match(/^user_session=user_session/)){
          session= cookie.slice(0,cookie.indexOf(';')+1);
        }
      }
      if(session==null) return callback(new Error('Invalid user'));

      callback(null,session);
    });
  },
  fetchThread: function(live_id,session,callback){
    request({
      url: 'http://live.nicovideo.jp/api/getplayerstatus/'+live_id,
      headers: {
        Cookie: session,
      },
    },function(error,response){
      if(error!=null) return callback(error);

      var $= cheerio.load(response.body);
      callback(null,{
        port: $('getplayerstatus ms port').text(),
        addr: $('getplayerstatus ms addr').text(),
        thread: $('getplayerstatus ms thread').text(),
      });
    });
  },
  view: function(thread,callback){
    var viewer= net.connect(thread.port,thread.addr);
    viewer.on('connect', function(){
      viewer.setEncoding('utf-8');
      viewer.write('<thread thread="'+thread.thread+'" res_from="-5" version="20061206" />\0');

      callback(null,viewer);
    });
  },
}

module.exports= nicolive;
