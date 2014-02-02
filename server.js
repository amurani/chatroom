var http = require('http').createServer(handler);
var io = require('./socket.io').listen(http);
var fs = require('fs');
var url = require('url');

var colors = [];
var members = [];
var messages = [];
var notifications = [];

function serve(response, fileName, mimeType) {
	fs.readFile(fileName, function(error, content) {

		if (error) console.log(error);
		console.log(mimeType);
		response.writeHead(200, { 'Content-Length' : content.length, 'Content-Type' : mimeType });
		response.write(content);
		response.end();
	});
}

function handler (req, res) {

	var request = url.parse(req.url, true);
  	var action = request.pathname;

  	if (action.indexOf('/client.css') == 0)
  		serve(res, 'client.css', 'text/css');
  	else if (action.indexOf('/jquery-1.10.2.min.js') == 0)
  		serve(res, 'jquery-1.10.2.min.js', 'text/javascript');
  	else if (action.indexOf('/socket.io/node_modules/socket.io-client/dist/socket.io.js') == 0)
  		serve(res, 'socket.io/node_modules/socket.io-client/dist/socket.io.js', 'text/javascript');
  	else if(action.indexOf('/_socket.io.js') == 0)
  		serve(res, '_socket.io.js', 'text/javascript');
  	else if (action.indexOf('/ping.mp3') == 0)
  		serve(res, 'ping.mp3', 'audio/mpeg');
	else
		serve(res, 'client.html', 'text/html');
}
http.listen(8080);

function get_member_color(username) {
	return colors[members.indexOf(username)];
}

function get_color() {
	return '#' + Math.ceil(Math.random() * 10) + '' +Math.ceil(Math.random() * 10) + '' + Math.ceil(Math.random() * 10)
}


io.sockets.on('connection', function (socket) {

	socket.on('handshake', function (data) {
		members.push(data.username);
		colors.push(get_color());
		
		socket.emit('handshake', { members : members, msgs : messages, notifications : notifications });
		
		socket.broadcast.emit('members', { members : members });

		var notification = { msg : data.username + ' has joined the chat room.' };
		notifications.push(notification);
		socket.broadcast.emit('notify', notification);
	});

	socket.on('message', function (data) {
		var message = { username : data.username, color : get_member_color(data.username), msg : data.msg };
		messages.push(message);
		socket.broadcast.emit('message', message);
	});

	socket.on('bye', function(data) {
		members.splice(members.indexOf(data.username), 1);
		colors.splice(members.indexOf(data.username), 1);

		var notification = { msg : data.username + ' has left the chat room.' };
		notifications.push(notification);
		socket.broadcast.emit('notify', notification);
	});

});