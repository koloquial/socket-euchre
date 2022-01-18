import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Container, Row, Col } from 'react-bootstrap';

import Card from './components/Card';
import { shuffle } from './functions/shuffle';

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
  const [layout, setLayout] = useState({
    north: { hand: []},
    east: { hand: []},
    south: { hand: []},
    west: { hand: []},
  });

  useEffect(() => {
    socket.on("open_games", (data) => {
      setOpenGames(data);
    });
  
    socket.on("update_game", (data) => {
      setGame(data);
      getLayout(data);
    });

    socket.on("status", (data) => {
      setStatus(data);
    });
  });

  useEffect(() => {
    if(game){

      if(game.status === 'active' && game.dealer === ''){
        //next status 'assign dealer'
        socket.emit("assign_dealer", game);
      }

      if(game.status === 'set trump'){
        const deck = shuffle();
        socket.emit('deal', {game, deck});
      }

      if(game.status === 'assign dealer'){
        //wait for dealer to be assigned
        //next step 'set trump'
      }

    }
  }, [game]);

  const getLayout = (data) => {
    if(game){
      //find current player position
      let position;
      for(let i = 0; i < game.players.length; i++){
        if(data.players[i].id === socket.id){
          position = i;
          break;
        }
      }

      layout.south = data.players[position];

      switch(position){
        case 0:
          layout.west = data.players[1];
          layout.north = data.players[2];
          layout.east = data.players[3];
          break;
        case 1:
          layout.west = data.players[2];
          layout.north = data.players[3];
          layout.east = data.players[0];
          break;
        case 2:
          layout.west = data.players[3];
          layout.north = data.players[0];
          layout.east = data.players[1];
          break;
        case 3:
          layout.west = data.players[0];
          layout.north = data.players[1];
          layout.east = data.players[2];
          break;
        default:
          break;
      }
    }
  }



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
    
    //create new deck
    const deck = shuffle();

    //create new game
    const newGame = {
      id: socket.id,
      name: temp,
      deck: deck
    }

    //commit to server
    socket.emit("create_game", newGame);
  }


  return (
    <Container>
      <Title />
     
    {game ? 
    <>
       <Waiting game={game} />


       {game.status === 'assign dealer' || game.status === 'flop' || game.status === 'set trump' ? <>
          {status}
          <br /><br />
          <Row>
            <Col>
            <center>
                <div style={{marginLeft: '-33%'}}>
                  {layout.north.hand.map(card => {
                    return (
                      <td>
                        {game.status === 'flop' || game.status === 'set trump' ? 
                          <Card side={'back'} val={card} size='small' /> 
                          : <Card side={'front'} val={card} size='small' />}
                      </td>)})}
                </div>
                {layout.north.name} {layout.north.name === game.dealer ? <>D</> : <></>}
              </center>
            </Col>
          </Row>
          <br /><br />
          <Row>
            <Col>
            
            {layout.west.hand.map(card => {
                                return (
                  <td>
                    {game.status === 'flop' || game.status === 'set trump' ? 
                      <Card side={'back'} val={card} size='small' /> 
                      : <Card side={'front'} val={card} size='small' />}
                  </td>)
              })}
              {layout.west.name} {layout.west.name === game.dealer ? <>D</> : <></>}
              </Col>
            <Col>
              <td>{game.status === 'flop' ? <Card side='front' val={game.flop} size='small' /> : <></>}</td>
            </Col>
            <Col>{layout.east.hand.map(card => {
                                return (
                  <td>
                    {game.status === 'flop' || game.status === 'set trump' ? 
                      <Card side={'back'} val={card} size='small' /> 
                      : <Card side={'front'} val={card} size='small' />}
                  </td>)
              })}
              {layout.east.name} {layout.east.name === game.dealer ? <>D</> : <></>}
              </Col>
          </Row>
          <br /><br />
          <Row>
            <Col>
              <center>
                <div style={{marginLeft: '-28%'}}>
                  {layout.south.hand.map(card => {
                    return (
                      <td><Card side={'front'} val={card} size='small' /></td>)
                    })}
                </div>
                {layout.south.name} {layout.south.name === game.dealer ? <>D</> : <></>}
              </center>
            </Col>
          </Row>
          {game.turn === layout.south.name ? <>
          <Row>
            <Col><button>Pass</button></Col>
            <Col><button>Order Up</button></Col>
            <Col><button>Go Alone</button></Col>
          </Row>
          </> : <></>}
      </> : <></>}

      </> : 
      <>
        <PlayerName name={name} handleName={handleName} socket={socket} />
        <button onClick={createGame}>Create Game</button><br />
        <br /><br />
        <JoinGame openGames={openGames} joinGame={joinGame} />
    </>}
      
    </Container>
  );
}

export default App;
