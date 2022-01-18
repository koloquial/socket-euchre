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

  useEffect(() => {
    socket.on("open_games", (data) => {
      setOpenGames(data);
    });
  
    socket.on("update_game", (data) => {
      console.log('Game Update:', data)
      setGame(data);
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
                  {game.players[0].hand.map(card => {
                    return (
                      <td>
                        {game.status === 'flop' || game.status === 'set trump' ? 
                          <Card side={'back'} val={card} size='small' /> 
                          : <Card side={'front'} val={card} size='small' />}
                      </td>)})}
                </div>
              </center>
            </Col>
          </Row>
          <br /><br />
          <Row>
            <Col>{game.players[3].hand.map(card => {
                                return (
                  <td>
                    {game.status === 'flop' || game.status === 'set trump' ? 
                      <Card side={'back'} val={card} size='small' /> 
                      : <Card side={'front'} val={card} size='small' />}
                  </td>)
              })}</Col>
            <Col>
              <td>{game.status === 'flop' ? <Card side='front' val={game.flop} size='small' /> : <></>}</td>
            </Col>
            <Col>{game.players[1].hand.map(card => {
                                return (
                  <td>
                    {game.status === 'flop' || game.status === 'set trump' ? 
                      <Card side={'back'} val={card} size='small' /> 
                      : <Card side={'front'} val={card} size='small' />}
                  </td>)
              })}</Col>
          </Row>
          <br /><br />
          <Row>
            <Col>
              <center>
                <div style={{marginLeft: '-28%'}}>
                  {game.players[2].hand.map(card => {
                    return (
                      <td><Card side={'front'} val={card} size='small' /></td>)
                    })}
                </div>
              </center>
            </Col>
          </Row>
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
