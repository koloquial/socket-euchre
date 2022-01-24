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
            revealCounter: 0,
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
               io.to(data.host).emit("update_game", games[i])
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
                        games[i].status = 'assign dealer';
                    }

                    //send game to all players
                    io.to(data.game.host).emit("update_game", games[i])

                    //send update to all clients
                    io.emit('open_games', games);
                    
                    break;
                }
            }
        }
    });

    socket.on("assign_dealer", (data) => {
        let valid;

        const drawCard = async () => {
            let draw = data.deck.shift();
            data.players[data.playerCounter].hand.push(draw);

            console.log('draw', draw);
            console.log('hand', data.players[data.playerCounter].hand);

            if(draw[0] === 'J' && ( draw[1] === '♣' || draw[1] === '♠') ){
                //black jack found
                data.dealer = data.players[data.playerCounter];
                data.status = 'deal';
                return true;
            }else{
                //black jack not found
                switch(data.playerCounter){
                    case 0: data.playerCounter = 1; break;
                    case 1: data.playerCounter = 2; break;
                    case 2: data.playerCounter = 3; break;
                    case 3: data.playerCounter = 0; break;
                    default: break;
                }
                data.revealCounter = data.revealCounter + 1;
                return false;
            }
        }

        const reveal = async() => {    
           
            await sleep(500);

            //send game to all players
            io.to(data.host).emit("update_game", data);

        }

        while(!valid){
            valid = drawCard();
            reveal();
        }

    });

    socket.on("deal", (data) => {

        console.log('DEALING');

        data.status = 'dealing';

        for(let i = 0; i < data.players.length; i++){
            data.players[i].hand.splice(0, data.players[i].hand.length);
        }

        data.deck = shuffle();
        
        //find dealer and set player counter to next on right
        for(let i = 0; i < data.players.length; i++){
            if(data.players[i].id === data.dealer.id){
                switch(i){
                    case 0: data.playerCounter = 1; break;
                    case 1: data.playerCounter = 2; break;
                    case 2: data.playerCounter = 3; break;
                    case 3: data.playerCounter = 0; break;
                    default: break;
                }
            }
        }

        io.to(data.host).emit("update_game", data);

        const drawCard = async () => {
            //deal hand 1
            let draw = data.deck.shift();
            data.players[data.playerCounter].hand.push(draw);
            await sleep(100);
            io.to(data.host).emit("update_game", data);

            draw = data.deck.shift();
            data.players[data.playerCounter].hand.push(draw);
            await sleep(100);
            io.to(data.host).emit("update_game", data);

            draw = data.deck.shift();
            data.players[data.playerCounter].hand.push(draw);
            await sleep(100);
            io.to(data.host).emit("update_game", data);

            switch(data.playerCounter){
                case 0: data.playerCounter = 1; break;
                case 1: data.playerCounter = 2; break;
                case 2: data.playerCounter = 3; break;
                case 3: data.playerCounter = 0; break;
                default: break;
            }

            await sleep(300);
        
            //deal hand 2
            draw = data.deck.shift();
            data.players[data.playerCounter].hand.push(draw);
            await sleep(100);
            io.to(data.host).emit("update_game", data);

            draw = data.deck.shift();
            data.players[data.playerCounter].hand.push(draw);
            await sleep(100);
            io.to(data.host).emit("update_game", data);

            switch(data.playerCounter){
                case 0: data.playerCounter = 1; break;
                case 1: data.playerCounter = 2; break;
                case 2: data.playerCounter = 3; break;
                case 3: data.playerCounter = 0; break;
                default: break;
            }

            await sleep(300);

            //deal hand 3
            draw = data.deck.shift();
            data.players[data.playerCounter].hand.push(draw);
            await sleep(100);
            io.to(data.host).emit("update_game", data);
            
            draw = data.deck.shift();
            data.players[data.playerCounter].hand.push(draw);
            await sleep(100);
            io.to(data.host).emit("update_game", data);

            draw = data.deck.shift();
            data.players[data.playerCounter].hand.push(draw);
            await sleep(100);
            io.to(data.host).emit("update_game", data);

            switch(data.playerCounter){
                case 0: data.playerCounter = 1; break;
                case 1: data.playerCounter = 2; break;
                case 2: data.playerCounter = 3; break;
                case 3: data.playerCounter = 0; break;
                default: break;
            }

            await sleep(300);

            //deal hand 4
            draw = data.deck.shift();
            data.players[data.playerCounter].hand.push(draw);
            await sleep(100);
            io.to(data.host).emit("update_game", data);

            draw = data.deck.shift();
            data.players[data.playerCounter].hand.push(draw);
            await sleep(100);
            io.to(data.host).emit("update_game", data);

            switch(data.playerCounter){
                case 0: data.playerCounter = 1; break;
                case 1: data.playerCounter = 2; break;
                case 2: data.playerCounter = 3; break;
                case 3: data.playerCounter = 0; break;
                default: break;
            }

            await sleep(300);

            //deal hand rest 1
            draw = data.deck.shift();
            data.players[data.playerCounter].hand.push(draw);
            await sleep(100);
            io.to(data.host).emit("update_game", data);

            draw = data.deck.shift();
            data.players[data.playerCounter].hand.push(draw);
            await sleep(100);
            io.to(data.host).emit("update_game", data);

            switch(data.playerCounter){
                case 0: data.playerCounter = 1; break;
                case 1: data.playerCounter = 2; break;
                case 2: data.playerCounter = 3; break;
                case 3: data.playerCounter = 0; break;
                default: break;
            }

            await sleep(300);

            //deal hand rest 2
            draw = data.deck.shift();
            data.players[data.playerCounter].hand.push(draw);
            await sleep(100);
            io.to(data.host).emit("update_game", data);
            
            draw = data.deck.shift();
            data.players[data.playerCounter].hand.push(draw);
            await sleep(100);
            io.to(data.host).emit("update_game", data);

            draw = data.deck.shift();
            data.players[data.playerCounter].hand.push(draw);
            await sleep(100);
            io.to(data.host).emit("update_game", data);

            switch(data.playerCounter){
                case 0: data.playerCounter = 1; break;
                case 1: data.playerCounter = 2; break;
                case 2: data.playerCounter = 3; break;
                case 3: data.playerCounter = 0; break;
                default: break;
            }

            await sleep(300);

            //deal hand rest 3
            draw = data.deck.shift();
            data.players[data.playerCounter].hand.push(draw);
            await sleep(100);
            io.to(data.host).emit("update_game", data);

            draw = data.deck.shift();
            data.players[data.playerCounter].hand.push(draw);
            await sleep(100);
            io.to(data.host).emit("update_game", data);

            switch(data.playerCounter){
                case 0: data.playerCounter = 1; break;
                case 1: data.playerCounter = 2; break;
                case 2: data.playerCounter = 3; break;
                case 3: data.playerCounter = 0; break;
                default: break;
            }
            
            await sleep(300);

            //deal hand rest 4
            draw = data.deck.shift();
            data.players[data.playerCounter].hand.push(draw);
            await sleep(100);
            io.to(data.host).emit("update_game", data);

            draw = data.deck.shift();
            data.players[data.playerCounter].hand.push(draw);
            await sleep(100);
            io.to(data.host).emit("update_game", data);

            draw = data.deck.shift();
            data.players[data.playerCounter].hand.push(draw);
            await sleep(100);
            io.to(data.host).emit("update_game", data);

            data.status = 'set trump';
        }

        drawCard();
    });

    

    socket.on("disconect", () => {
        console.log('disconnected:', socket.id);
    });
});

server.listen(3001, () => {
    console.log('SERVER RUNNING')
});