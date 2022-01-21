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

  const deck = [
    '9♥', '10♥', 'J♥', 'Q♥', 'K♥', 'A♥',
    '9◆', '10◆', 'J◆', 'Q◆', 'K◆', 'A◆',
    '9♠', '10♠', 'J♠', 'Q♠', 'K♠', 'A♠',
    '9♣', '10♣', 'J♣', 'Q♣', 'K♣', 'A♣',
]

const shuffle = () => {

    const shuffled = [];
    const copy = [...deck];

    while(copy.length > 0){
        let random = Math.floor(Math.random() * copy.length);
        shuffled.push(copy[random]);
        copy.splice(random, 1);
    }

    return shuffled;
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
            trump: '',
            deck: shuffle(),
            playerCounter: 0,
            message: '',
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

        console.log(data);
//loop through deck to find first black jack
for(let i = 0; i < data.deck.length; i++){

    console.log('deck', data.deck);
    //flip card
    let card = data.deck.shift();
    try{
        if(data.players[data.playerCounter].hand !== undefined){
            data.players[data.playerCounter].hand.push(card);
        }
        
    }catch(e){}

    //check black jack
    if(card[0] === 'J'){
        console.log('blackjack found')
        //black jack found
        data.dealer = data.players[data.playerCounter].id; 
        // data.deck = shuffle();
        data.status = 'set trump'
        //update server file
        for(let i = 0; i < games.length; i++){
            if(games[i].host === data.host){
                games[i] = data;
                break;
            }
        }
        console.log('BEFORE EMIT', data);
         //send message
        socket.to(data.host).emit("message", `${data.players[data.playerCounter].name} won deal.`)
    }else{
        //black jack not found
        if(data.playerCounter === 3){
            data.playerCounter = 0;
        }else{
            data.playerCounter++;
        }
    }
    //update game
    socket.to(data.host).emit("update_game", data);

    if(data.dealer !== ''){
        break;
    }
    }
        console.log('here', data);
    socket.to(data.host).emit("update_game", data);
   
    });

    

    socket.on("disconect", () => {
        console.log('disconnected:', socket.id);
    });
});

server.listen(3001, () => {
    console.log('SERVER RUNNING')
});