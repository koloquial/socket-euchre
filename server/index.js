const http = require('http');
const express = require('express');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }}
);

const games = [];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

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
            dealer: '',
            score: [0, 0],
            deck: data.deck,
            playerCounter: 0,
            revealCounter: 0
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
    });

    socket.on("update_game", (data) => {
        for(let i = 0; i < games.length; i++){
            if(games[i].host === data.host){
               games[i] = data;
               socket.to(data.host).emit("update_game", games[i])
                break;
            }
        }
    });

    socket.on("shuffle_deck", (data) => {
        //remove hands 
        for(let i = 0; i < data.game.players.length; i++){
            data.game.players[i].hand = [];
        }
        socket.to(data.host).emit("update_game", data)


        //deal

        //find player that is dealer (position in array)
        let dealer;
        for(let i = 0; i < data.game.players.length; i++){
            if(data.game.players[i].name === data.game.dealer){
                dealer = i;
                break;
            }
        }

        for(let i = 0; i < 2; i++){

            for(let j = 1; j < 4; j++){
                if(dealer + j >= 4){
                    if(i === 0){
                        data.game.players[0].hand.push(data.deck.splice(1, 0))
                        data.game.players[0].hand.push(data.deck.splice(1, 0))
                        data.game.players[0].hand.push(data.deck.splice(1, 0))
                        socket.to(data.host).emit("update_game", data)
                        
                    }else{
                        data.game.players[0].hand.push(data.deck.splice(1, 0))
                        data.game.players[0].hand.push(data.deck.splice(1, 0))
                        socket.to(data.host).emit("update_game", data)
                        
                    }
                    
                }else{
                    if(i === 0){
                        data.game.players[dealer + j].hand.push(data.deck.splice(1, 0));
                        data.game.players[dealer + j].hand.push(data.deck.splice(1, 0));
                        data.game.players[dealer + j].hand.push(data.deck.splice(1, 0));
                        socket.to(data.host).emit("update_game", data)
                        
                    }else{
                        data.game.players[dealer + j].hand.push(data.deck.splice(1, 0));
                        data.game.players[dealer + j].hand.push(data.deck.splice(1, 0));
                        socket.to(data.host).emit("update_game", data)
                    }
                    
                }
            }
        }

       
    });

    socket.on("assign_dealer", (data) => {
        let found = false;
        let revealCounter = 0;
        let playerCounter = 0;
        data.status = 'assign dealer';
        socket.to(data.host).emit("status", `First blackjack wins deal.`);
        

        async function reveal(){
            await sleep(1000);
            let card = data.deck[revealCounter];
            data.players[playerCounter].hand.push(card);

            if(card[0] === 'J' && (card[1] === '♠' || card[1] === '♣')){
                data.dealer = data.players[playerCounter].name;
    
                if(playerCounter === 3){
                    data.turn = data.players[0].name;
                }else{
                    data.turn = data.players[playerCounter + 1].name;
                }
    
                

                for(let i = 0; i < games.length; i++){
                    if(games[i].host === data.host){
                        games[i] = data;
                    }
                }

                socket.to(data.host).emit("update_game", data)
                socket.to(data.host).emit("status", `${data.dealer} won the deal.`);
                socket.to(data.host).emit("status", `${data.turn}'s call.`);
                await sleep(3000);
                data.status = 'set trump';
                socket.to(data.host).emit("update_game", data)
                found = true;
                
            }else{
                if(playerCounter === 3){
                    playerCounter = 0;
                }else{
                    playerCounter = playerCounter + 1;
                }
                revealCounter = revealCounter + 1;
                socket.to(data.host).emit("update_game", data)
                reveal();
            }
        }

        reveal();
    });
    

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