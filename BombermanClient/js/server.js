"use strict"

var System = require("sys");
var HTTP = require("http");
var WebSocketServer = require("websocket").server;
var _ = require('underscore');
var Game = require("game");

var Frame = 0;
var FramesPerGameStateTransmission = 3;
var MaxConnections = 10;
var Connections = {};
var Rooms = {};

var HTTPServer = HTTP.createServer(
			function(Request, Response)
			{
				Response.writeHead(200, { "Content-Type": "text/plain" });
				Response.end();
			}
			);

HTTPServer.listen(9001, function() { System.log("Listening for connections on port 9001"); });

var Server = new WebSocketServer(
			{
				httpServer: HTTPServer,
				closeTimeout: 2000
			}
			);
			
// on connect
Server.on("request",
			function(Request)
			{
				if (_.size(Connections) >= MaxConnections)
				{
					Request.reject();
					return;
				}
				
				var Connection = Request.accept(null, Request.origin);
				Connection.IP = Request.remoteAddress;
				
				var query = Request.resourceURL.query;

				if (!query.room)
				{
					var room = _.size(Rooms) + 1;
					Rooms[room] = {
						count: 1,
						starter: Connection
					}
					Connection.room = room;
					Connection.heroIndex = 0;
					Connection.sendUTF(JSON.stringify({ type: 'newRoom', room: room }))
				}
				else if (Rooms[query.room])
				{
					if(Rooms[query.room].count >= 2)
					{
						Connection.sendUTF(JSON.stringify({ error: true, message: 'The room is buisy!' }));
						return;
					}
					else
					{
						Rooms[query.room].count = 2;
						Rooms[query.room].starter.peer = Connection;
						Connection.room = query.room;
						Connection.heroIndex = 1;
						Connection.peer = Rooms[query.room].starter;
						
						Rooms[query.room].BM = Game.getNewGameSpace();
						
						Game.setupCurrentLevel(Rooms[query.room].BM);
						var hero = Game.addNewHero(Rooms[query.room].BM);
						
						Connection.sendUTF(JSON.stringify({ type: 'newHero', hero: Rooms[query.room].BM.heros[0] }))
						Connection.peer.sendUTF(JSON.stringify({ type: 'newHero', hero: hero }))
						
						//start game loop
						setInterval(function()
							{
												
								Game.RunGameFrame(Rooms[query.room].BM);
								SendGameState();

							},
							Rooms[query.room].BM.GameFrameTime
						);
						
						
					}
				}
				
				// Assign a random ID that hasn't already been taken.
				do { Connection.ID = Math.floor(Math.random() * 100000) } while (Connection.ID in Connections);
				Connections[Connection.ID] = Connection;
				
				Connection.on("message",
					function(Message)
					{
						if (Message.type == "utf8")
							HandleClientMessage(Connection.ID, Message.utf8Data);
					}
					);
					
				Connection.on("close",
					function()
					{
						HandleClientClosure(Connection.ID);
					}
					);
				
				System.log("Logged in " + Connection.IP + "; currently " + _.size(Connections) + " users.");
			}
			);

function HandleClientClosure(ID)
{
	if (ID in Connections)
	{
		System.log("Disconnect from " + Connections[ID].IP);
		delete Connections[ID];
		
		//TODO - handle room state
	}
}

function HandleClientMessage(ID, Message)
{

	if (!(ID in Connections)) return;
	
	try { Message = JSON.parse(Message); }
	catch (Err) { return; }
	
	if (!("Type" in Message && "Data" in Message)) return;
	
	var C = Connections[ID];
	
	if (!Rooms[C.room]) return;
	
	var BM = Rooms[C.room].BM;
	
	if (!BM) return;
	
	switch (Message.Type)
	{
		// Handshake.
		case "HI":
			
		break;
			
		// Key down.
		case "D":
			if (!C.peer) return;
			BM.heros[C.heroIndex] = Message.Data
		break;
		
		//bomb
		case "B":
			if (!C.peer) return;
			C.peer.sendUTF(JSON.stringify({ type: 'newB', b: Message.Data }))
		break;
		
		case "RESET":
			BM = Game.resetGame(BM);
			
			if (C.peer)
			{
				C.peer.sendUTF(JSON.stringify({ type: 'reset' }))
				var hero = Game.addNewHero(BM);

				C.sendUTF(JSON.stringify({ type: 'newHero', hero: BM.heros[C.peer.heroIndex] }))
				C.peer.sendUTF(JSON.stringify({ type: 'newHero', hero: BM.heros[C.heroIndex] }))
				
				setInterval(function()
					{
						Game.RunGameFrame(BM);
						SendGameState();
					},
					BM.GameFrameTime
				);
			}
			
		break;
	}
}

function SendGameState()
{

	for (var ID in Connections)
		if (Connections[ID].peer)
		{
			var room = Rooms[Connections[ID].room];
			Connections[ID].peer.sendUTF(JSON.stringify({ data: room.BM.heros[Connections[ID].heroIndex] }));
		}
}
