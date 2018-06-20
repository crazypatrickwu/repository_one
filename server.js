//引入模块
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

//在线人数统计
var onlineCount = 0;
app.use(express.static(__dirname));

//获取url路径
app.get('/login.html', function(req, res){
	res.sendFile('login.html');
})

//用户连接进来
/*io.on('connection', function(socket){
	console.log('a user connected');

	//发送客户端在线人数
	io.emit('connected', ++onlineCount);

	//当有用户断开
	socket.on('disconnect', function(){
		console.log('user disconnected');

		//发送给客户端在线人数
		io.emit('disconnected', --onlineCount);
		console.log(onlineCount);
	});

	//收到了客户端发来的消息
	socket.on('message', function(message){
		//给客户端发送消息
		io.emit('message', message);
	})
})*/

var users = {},
	usocket = {},
	usersId = {};
//单对单私聊
io.on('connection', function(socket){
	/**
	 * 只要用户连接之后就会进入该事件
	 * 如果是公聊，就直接触发消息事件
	 * io.emit('message', {});
	 */
	// console.log('a user connected');
	//上线之后首先接受发送方的用户信息
	//然后发送总人数以及所有用户信息给发送方
	socket.on('connected', function(data){
		var username      = data.user; 
		//判断是否已经在登录用户中
		if(!users.hasOwnProperty(username)){
			users[username]   = username;
			usocket[username] = socket;
			++onlineCount;
		}
		io.emit('connected', {users : users, onlineCount : onlineCount});
	})
	
	/*socket.on('to' + user, function(data){
		formatMsg(data);
	})*/

	/**
	 * 是否输入
	 */
	socket.on('typing', function(data){
		if(data.flag == true){
			// console.log('i am typing');
			//说明是在打字
			io.emit('typing', {user : data.user, flag : data.flag});
		}else if(data.flag == false){
			//说明不在打字
			// console.log('i am not typing');
			io.emit('typing', {user : data.user, flag : data.flag});
		}
	})

	//发送消息
	socket.on('message', function(data){
		if(typeof(usersId['data.name']) == 'object'){
			usersId[data.name].push(data.id);
		}else{
			usersId[data.name] = new Array();
			usersId[data.name].push(data.id);
		}
		// console.log(usersId[data.name]);
		if(data.type == 2 && data.to != undefined){
			sendUserMsg(data);
		}else{
			io.emit('message', data);
		}
	})

	//修改消息状态
	socket.on('changeStatus', function(data){
		console.log(data);
		io.emit('changeStatus', data);
	})

	/**
	 * [手动断开连接]
	 */
	socket.on('close', function(data){
		console.log('a user disconnected');
		if(users.hasOwnProperty(data.user)){
			--onlineCount;
			delete users[data.user];
			delete usocket[data.user];
		}
		io.emit('disconnected',  onlineCount);
	})

	/**
	 * 自动检测断开连接
	 */
	socket.on('disconnect', function(){
		/*console.log(now_user);
		if(users[now_user]){
			onlineCount--;
			delete users[now_user];
			delete usocket[now_user];
		}*/
	})
})

var server = http.listen(3300, function(){
	console.log('Server is running');
})

function sendUserMsg(data)
{
	if(data.to in usocket){
		console.log('=====');
		console.log(data.to);
		usocket[data.to].emit('to' + data.to, data);
		usocket[data.name].emit('to' + data.name, data);
	}
}


