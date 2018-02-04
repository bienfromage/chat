const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

//not using this variable yet, need to have send to client when changed
//var users = 0;
var chatRooms=[];

app.use(express.static(__dirname + '/public',{extensions:['html']}));

function onConnection(socket){
    //users++;
    var userName;
    var room = "LOBBY";
    var admin = false;
    socket.join(room);
    
    socket.on('addUser',(username)=>{
      userName = username;
      io.to(room).emit('newMessage',username+" entered the chat.","");
        
      if(io.sockets.adapter.rooms[room].length<2){
        chatRooms.push({name:room,hasAdmin:true,isPublic:true});
        admin = true;
        socket.emit('setAdmin');
      }else{
        io.to(room).emit('requestAdminMessages');
      }
    });
    
    socket.on('message',(message, username)=>{
        io.to(room).emit('newMessage',message, username);
    });
    
    socket.on('setRoom',(newRoom)=>{
        if(room !== newRoom){
            socket.leave(room);
            room = newRoom;
            admin = false;
            socket.join(room);
            
            io.to(room).emit('newMessage',userName+" entered the chat.","");
            if(io.sockets.adapter.rooms[room].length<2){
              chatRooms.push({name:room,hasAdmin:true,isPublic:true});
              admin = true;
              socket.emit('setAdmin');
            }else{
              io.to(room).emit('requestAdminMessages');
            }
        }
    });
    
    socket.on('adminMessages',(messages)=>{
      io.to(room).emit('adminMessages',messages);
    });
    
    socket.on('claimAdmin',()=>{
      for(i = 0; i < chatRooms.length; i++){
        if(chatRooms[i].name === room && chatRooms[i].hasAdmin === false){
          chatRooms[i].hasAdmin = true;
          admin = true;
          socket.emit('setAdmin');
        }
      }
    });
    
    socket.on('disconnect',()=>{
      //users--;
      if(admin){
        if(!io.sockets.adapter.rooms[room]){
          for(i = 0; i < chatRooms.length; i++){
            if(chatRooms[i].name === room)
              chatRooms.splice(i,1);
          }
        }else{
          io.to(room).emit('newMessage',userName+" left the chat.","");
          for(i = 0; i < chatRooms.length; i++){
            if(chatRooms[i].name === room)
              chatRooms[i].hasAdmin = false;
          }
          io.to(room).emit('requestNewAdmin');
        }
      }
    });
}

io.on('connection', onConnection);

http.listen(port, () => console.log('listening on port ' + port));