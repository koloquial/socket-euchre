const http = require('http');
const express = require('express');
const socketio = require('socket.io')

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }}
);

const games = [];

io.on("connection", (socket) => {
    console.log("connected:", socket.id);
    //emit open games to connecting client
    socket.emit('open_games', games);

    socket.on("create_game", (data) => {
        //check if user created other games
        //check if user active in other games

        //join room
        socket.join(data.id);

        //push to games
        const newGame = {
            host: data.id,
            hostName: data.name,
            status: 'waiting',
            players: [
                {
                    id: data.id, 
                    name: data.name,
                    hand: []
                }
            ],
            turn: '',
            score: [0, 0]
        };
        games.push(newGame);

        //emit games to all clients
        io.emit('open_games', games);
    });

    socket.on("get_game", (data) => {
        for(let i = 0; i < games.length; i++){
            if(games[i].host === data){
                socket.emit("update_game", games[i]);
                break;
            }
        }
    })

    socket.on("join_game", (data) => {
        for(let i = 0; i < games.length; i++){
            if(games[i].host === data.game.host){

                //check player length
                if(games[i].players.length < 4){
                    //join room
                    socket.join(data.game.host);

                    //add player to game
                    const newPlayer = {
                        id: data.id, 
                        name: data.name,
                        hand: []
                    }



                    games[i].players.push(newPlayer);

                    console.log('players:', games[i].players.length)
                    if(games[i].players.length === 4){
                        console.log('set status')
                        games[i].status = 'active';
                    }

                    //send game to client
                    socket.emit("update_game", games[i]);

                    //send game to all players
                    socket.to(data.game.host).emit("update_game", games[i])

                    //send update to all clients
                    io.emit('open_games', games);
                    
                    break;
                }
            }
        }
    });

    socket.on("disconect", () => {
        console.log('disconnected:', socket.id);
    });
});

server.listen(3001, () => {
    console.log('SERVER RUNNING')
});