/**Server Variaveis**/
const express = require('express');
const SocketServer = require('ws').Server;
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
  .use(express.static(path.join(__dirname, 'public')))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));
const wss = new SocketServer({ server });
 
 
/*Aplication Variaveis**/ 
var Cartas = daCartas();
var CartasUsadas=[];
var CartasEmMaos=[];
var Gamers=[];
 
wss.on('connection', (ws) => {
	console.log('Client connected');
  
	ws.cartas = emabaralhar(Gamers.length);
	
	ws.on('message', function(message) {
		
		var response = JSON.parse(message);
        switch(response.subject){
			case 'gaming' :
			
				var index = Cartas.indexOf(response.object.value);
				
				CartasUsadas.push(index);
				
				if((CartasEmMaos[index]+1)<4){
					send(null,"token",Gamers[CartasEmMaos[index]+1]);
				}else{
					send(null,"token",Gamers[0]);
				}
				
				sendToAll(response.object,"Moviment",Gamers[CartasEmMaos[index]]);

				CartasEmMaos[index]=null;
			break;
			case 'pass' :
				var index = Gamers.indexOf(ws);
				index++;
				if(index>=4){index=0;}
				
				send(null,"token",Gamers[index]);
			break;
			
		}
    });
	
  
	ws.on('close', (e) => { 
		var index = Gamers.indexOf(ws); 
		if (index > -1) {
			Gamers.splice(index, 1);
		} 
		console.log('Client disconnected');  
	});
  
	send(ws.cartas,"myHand",ws);
	Gamers.push(ws)
});

function sendToAll(object,subject,socket){
	Gamers.forEach((client) => {
		if(socket!=client){
			send(object,subject,client);
		}
	});	
}

function broadcast(object,subject){
	Gamers.forEach((client) => {
		send(object,subject,client);
	});
}

function send(object,subject,socket){
	var response  = {'subject':subject,"object":object};
	
	socket.send(JSON.stringify(response));
}

function daCartas(){
	var cartas=Array();
	var index=0;
	for(i=0;i<7;i++){
		for(p=0;p<7;p++){
			if(p>=i) cartas[index++]=i+"|"+p;
		}
	}
	return cartas;
}

function emabaralhar(C){
	var MinhaMao = Array();
	for(index=0;index<7;index++){
		do{
			var randNumber = Math.floor((Math.random() * 28) + 0);
		
		}while(CartasEmMaos[randNumber] != null);
		
		CartasEmMaos[randNumber]=C;
		MinhaMao[index] = Cartas[randNumber];
	}
	return MinhaMao;
}

setInterval(() => {
	
	var Statistica = {Tab:CartasUsadas.length,Gamers:Gamers.length};
	broadcast(Statistica,'Statistica');
	
	
	
	
	if(Gamers.length==4){
		//broadcast(null,'Ready');
		
		///Init the Game
		if( (CartasEmMaos[27]!=null) && (CartasUsadas[27]==null) ){
			send(null,"token",Gamers[CartasEmMaos[27]]);
		}
				
		
	}
	
}, 1000);
