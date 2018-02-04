var username;
var admin = false;
var room="LOBBY";

function getKey(event){
    event.preventDefault();
    if (event.keyCode === 13) {
            setUsername();
    }
}

//key listener to set user on enter key
document.getElementById("myInput").addEventListener("keyup", getKey);

//set username
function setUsername(){
    username = document.getElementById('myInput').value;
    
    if(!username || username.trim().length===0)
        username = "Goat";
    
    //send the username to the server
    socket.emit('addUser',username);
    
    //remove the previous event listener
    document.getElementById("myInput").removeEventListener("keyup", getKey);
    document.getElementById("myInput")
        .addEventListener("keyup", function(event) {
        event.preventDefault();
        if (event.keyCode === 13) {
                sendMessage();
        }
    });
    
    //clear chat
    document.getElementById('myInput').value = "";
    
    //set user interface
    var dataBox = document.getElementById('myInput');
    dataBox.value = "";
    dataBox.placeholder = "message";
    document.getElementById("button").onclick = ()=>{
        var message = document.getElementById('myInput').value;
        if(message && message.trim().length!==0){
            message = username+": "+message;
            socket.emit('message',message, username);
            document.getElementById('myInput').value = "";
        }
    };
    document.getElementById("stream").innerHTML = "";
    socket.emit('setRoom', room);
    cancelChatStream();
    document.getElementById("title").innerHTML=room;
    document.getElementById("new-stream").addEventListener("keyup", function(event) {
        event.preventDefault();
        if (event.keyCode === 13) {
          setChatStream();
        }
    });
}
    
//connect to the server
var socket = io();

//describes what the client does when the server sends it a 'newMessage' event with parameter 'message'
socket.on('newMessage',(message, name)=>{
    if(username){
        if(name === username)
            document.getElementById('stream').innerHTML+="<p class = 'me'>"+message+"</p>";
        else if(name === "")
            document.getElementById('stream').innerHTML+="<p class = 'server'>"+message+"</p>";
        else
            document.getElementById('stream').innerHTML+="<p class = 'other'>"+message+"</p>";
    }
});

//request old messages from user if user is admin
socket.on('requestAdminMessages',()=>{
  if(admin){
    socket.emit('adminMessages', document.getElementById("stream").innerHTML);
  }
});

//set the admin to me
socket.on('setAdmin',()=>{
  admin = true;
});

//display messages from admin
socket.on('adminMessages', (messages)=>{
	if(!admin){
	  document.getElementById("stream").innerHTML = messages;
	  var list = document.getElementsByTagName("P");
	  for(i=0; i<list.length; i++){
		if(list[i].className === "me")
		  list[i].className = "other";
	   }
	}
});

socket.on('requestNewAdmin',()=>{
  socket.emit('claimAdmin');
});

//sends the server a 'message' event with the parameter 'message'
function sendMessage(){
    var message = document.getElementById('myInput').value;
    if(message && message.trim().length!==0){
        message = username+": "+message;
        message = message.replace(/</g, "&lt;");
        message = message.replace(/>/g, "&gt;");
        socket.emit('message',message, username);
        document.getElementById('myInput').value = "";
    }
}

//open menu
function menu() {
   document.getElementById("contain").classList.toggle("change");
}

//join/create chat window
function newChatStream(){
    if(username)
        document.getElementById("name-stream").style.display= "block";
    else{
        alert("You must enter a username before creating or joining a chat.");
        cancelChatStream();
    }
}

//close chat window
function cancelChatStream(){
    document.getElementById("name-stream").style.display= "none";
}

//join/create chat
function setChatStream(){
    room = document.getElementById("new-stream").value.toUpperCase();
    if(room.trim().length!==0){
    admin = false;
    document.getElementById("stream").innerHTML = "";
    socket.emit('setRoom', room);
    cancelChatStream();
    document.getElementById("title").innerHTML=room;
    }
}