import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Container, Row, Col } from 'react-bootstrap';

import Card from './components/Card';

import Title from './components/Title';
import Waiting from './components/Waiting';
import PlayerName from './components/PlayerName';
import JoinGame from './components/JoinGame';

const socket = io.connect("http://localhost:3001");

function App() {
  const [name, setName] = useState('');
  const [game, setGame] = useState();
  const [openGames, setOpenGames] = useState([]);
  const [status, setStatus] = useState([]);
  const [layout, setLayout] = useState([]);
  const [message, setMessage] = useState('');

  const assignLayout = () => {
    //find current player position in players array
    let position = 0;
    for(let i = 0; i < game.players.length; i++){
      if(game.players[i].id === socket.id){
        //player position found
        position = i;
        break;
      }
    }

    //rotate array so player position is always 2 (south)
    let copy = [...game.players];
    if(position !== 2){
      while(game.players[position] !== copy[2]){
        let rem = copy.pop();
        copy.unshift(rem);
      }
    }

    setLayout(copy);
  }

  useEffect(() => {
    socket.on("open_games", (data) => {
      setOpenGames(data);
    });
  
    socket.on("update_game", (data) => {
      console.log('RECIEVED DATA: ', data)
      setGame(data);
    });

    socket.on("status", (data) => {
      setStatus(data);
    });

    socket.on("message", (data) => {
      setMessage(data);
    })
  });

  useEffect(() => {
    if(game){

      if(game.players.length === 4){
        assignLayout();
      }
      
      if(game.status === 'assign dealer' && game.host === socket.id){
        socket.emit('assign_dealer', game);
      }

      if(game.status === 'deal' && game.host === socket.id){
        socket.emit('deal', game);
      }

      if(game.status === 'set trump'){
        console.log('set trump');
      }
      
    }
  }, [game]);


  const handleName = (e) => {
    e.preventDefault();
    setName(e.target.value)
  }

  const joinGame = (game) => {
    //validate player name
    let temp = '';
    if(name === ''){
      temp = socket.id.substring(0, 10);
    }else if(name.length > 10){
      temp = name.substring(0, 10);
    }else{
      temp = name;
    }

    //join game
    socket.emit("join_game", {id: socket.id, name: temp, game: game});
  }

  const createGame = () => {
    //validate player name
    let temp = '';
    if(name === ''){
      temp = socket.id.substring(0, 10);
    }else if(name.length > 10){
      temp = name.substring(0, 10);
    }else{
      temp = name;
    }

    //create new game
    const newGame = {
      id: socket.id,
      name: temp,
    }

    //commit to server
    socket.emit("create_game", newGame);
  }

  return (
    
    <Container>
      <Title />
     
    {game ? 
      <div id='InGame'>
       <Waiting game={game} />

      {layout.length ?
        <div id='Layout'>
          <p style={{color: 'whitesmoke'}}>{message}</p>
          <Row>
            <Col>
              <center>
                  {game.dealer.id === layout[0].id ? 
                    <p style={{color: 'gold', display: 'inline'}}>♔</p> 
                    : <></>}
                    
                    <p style={{color: game.turn.id === layout[0].id  ? 'white' : '#666666'}}>{layout[0].name}</p>
                    
                {layout[0].hand.map(card => {
                  return <td><Card val={card} side={game.status === 'assign dealer' ? 'front' : 'back'} size={'small'} /></td>
                })}
              </center>
            </Col>
          </Row>
          <Row>
          <Col>
            <center>
              <div style={{transform: 'rotate(90deg)', verticalAlign: 'top'}}>
              {layout[3].hand.map(card => {
                  return <td><Card val={card} side={game.status === 'assign dealer' ? 'front' : 'back'} size={'small'} /></td>
                })}
                </div>
                <br /><br /><br /><br />
                {game.dealer.id === layout[3].id ? 
                    <p style={{color: 'gold', display: 'inline'}}>♔</p> 
                    : <></>}
                    
                    <p style={{color: game.turn.id === layout[3].id  ? 'white' : '#666666'}}>{layout[3].name}</p>
              </center>
            </Col>
            <Col>
                <div>

                </div>
            </Col>
            <Col>
              <center>
                <div style={{transform: 'rotate(-90deg)', verticalAlign: 'top'}}>
                {layout[1].hand.map(card => {
                  return (
                    <td>
                      <Card 
                        val={card} 
                        side={game.status === 'assign dealer' ? 'front' : 'back'} 
                        size={'small'} />
                      </td>
                  )
                })}
                </div>
                <br /><br /><br />
                {game.dealer.id === layout[1].id ? 
                    <p style={{color: 'gold', display: 'inline'}}>♔</p> 
                    : <></>}
                    
                    <p style={{color: game.turn.id === layout[1].id  ? 'white' : '#666666'}}>{layout[1].name}</p>
                </center>
            </Col>
          </Row>
          <Row>
          <Col>
          
            <center>
            {game.dealer.id === layout[2].id ? 
                    <p style={{color: 'gold', display: 'inline'}}>♔</p> 
                    : <></>}
                    
                    <p style={{color: game.turn.id === layout[2].id ? 'white' : '#666666'}}>{layout[2].name}</p>
              
              {layout[2].hand.map((card, index) => {
                  return <td><Card val={card} side={game.status === 'dealing' ? 'back': 'front'} size={''} index={index} /></td>
                })}
                <br />

                {game.turn.id === socket.id ? <>
                <button>Pass</button>&nbsp;&nbsp;&nbsp;
                <button>Order Up</button>&nbsp;&nbsp;&nbsp;
                <button>Go Alone</button>&nbsp;&nbsp;&nbsp;
                </> : <></>}
                
              </center>
              
            </Col>
          </Row>
        </div> : <></>}
      </div>
      : 
      <div id='Splash'>
        <PlayerName name={name} handleName={handleName} socket={socket} />
        <button onClick={createGame}>Create Game</button><br />
        <br /><br />
        <JoinGame openGames={openGames} joinGame={joinGame} />
      </div>
      }
      
    </Container>
  );
}

export default App;
