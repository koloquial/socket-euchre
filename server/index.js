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

        //emit to user
        socket.emit("update_game", newGame);
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

    socket.on("join_game", (data) => {
        //find current game on server
        for(let i = 0; i < games.length; i++){
            if(games[i].host === data.game.host){
                //game found
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

                    //if game is full, set status to active
                    if(games[i].players.length === 4){
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

    socket.on("assign_dealer", (data) => {
        //find dealer
        let found = false;

        //regulates which card in deck revealed
        let revealCounter = 0;

        //iterates around each player e.g. 0-3
        let playerCounter = 0;

        //change status 
        data.status = 'assign dealer';
        socket.to(data.host).emit("status", `First blackjack wins deal.`);
        
        //reveal cards one by one until a black jack is revealed
        async function reveal(){
            //sleep before every iteration
            await sleep(500);

            //draw card and push into target player hand
            let card = data.deck[revealCounter];
            data.players[playerCounter].hand.push(card);

            //check if card is a black jack
            if(card[0] === 'J' && (card[1] === '♠' || card[1] === '♣')){
                //black jack found
                //set dealer
                data.dealer = data.players[playerCounter].name;
    
                //set turn to right of dealer
                if(playerCounter === 3){
                    data.turn = data.players[0].name;
                }else{
                    data.turn = data.players[playerCounter + 1].name;
                }

                //update server game file
                for(let i = 0; i < games.length; i++){
                    if(games[i].host === data.host){
                        games[i] = data;
                    }
                }

                //send game update to room
                socket.to(data.host).emit("update_game", data)
                socket.to(data.host).emit("status", `${data.dealer} won the deal.`);
                await sleep(4000);
                socket.to(data.host).emit("status", `${data.turn}'s call.`);

                //change status to set trump
                data.status = 'set trump';

                //update game
                socket.to(data.host).emit("update_game", data);

                socket.emit("update_game", data);
                found = true;
                
            }else{
                //current draw is not a black jack
                if(playerCounter === 3){
                    playerCounter = 0;
                }else{
                    playerCounter = playerCounter + 1;
                }
                revealCounter = revealCounter + 1;
                socket.to(data.host).emit("update_game", data);
                socket.emit("update_game", data);
                reveal();
            }
        }

        reveal();
    });

    socket.on("deal", (data) => {
        let temp = [];
        temp.push(data.deck[0]);
        temp.push(data.deck[1]);
        temp.push(data.deck[2]);
        temp.push(data.deck[3]);
        temp.push(data.deck[4]);
        data.game.players[0].hand = temp;

        temp = [];
        temp.push(data.deck[5]);
        temp.push(data.deck[6]);
        temp.push(data.deck[7]);
        temp.push(data.deck[8]);
        temp.push(data.deck[9]);
        data.game.players[1].hand = temp;

        temp = [];
        temp.push(data.deck[10]);
        temp.push(data.deck[11]);
        temp.push(data.deck[12]);
        temp.push(data.deck[13]);
        temp.push(data.deck[14]);
        data.game.players[2].hand = temp;

        temp = [];
        temp.push(data.deck[15]);
        temp.push(data.deck[16]);
        temp.push(data.deck[17]);
        temp.push(data.deck[18]);
        temp.push(data.deck[19]);
        data.game.players[3].hand = temp;

        data.game.flop = data.deck[20];
        data.game.status = 'flop';

        let index;
        for(let i = 0; i < games.length; i++){
            if(games[i].host === data.game.host){
                games[i] = data.game;
                index = i;
                break;
            }
        }
        socket.to(data.game.host).emit("update_game", data.game);
        socket.emit("update_game", data.game);
       
    });

    socket.on("disconect", () => {
        console.log('disconnected:', socket.id);
    });
});

server.listen(3001, () => {
    console.log('SERVER RUNNING')
});