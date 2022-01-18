import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Container, Row, Col } from 'react-bootstrap';

const socket = io.connect("http://localhost:3001");

function App() {
  const [name, setName] = useState('');
  const [game, setGame] = useState();
  const [openGames, setOpenGames] = useState([]);

  socket.on("open_games", (data) => {
    setOpenGames(data);
  });

  socket.on("update_game", (data) => {
    console.log(data);
    setGame(data);
  })

  useEffect(() => {
    
  });

  const handleName = (e) => {
    e.preventDefault();
    setName(e.target.value)
  }

  const joinGame = (game) => {
    let temp = '';

    if(name === ''){
      temp = socket.id.substring(0, 10);
    }else if(name.length > 10){
      temp = name.substring(0, 10);
    }else{
      temp = name;
    }

    socket.emit("join_game", {id: socket.id, name: temp, game: game});
  }

  const createGame = () => {
    let temp = '';

    if(name === ''){
      temp = socket.id.substring(0, 10);
    }else if(name.length > 10){
      temp = name.substring(0, 10);
    }else{
      temp = name;
    }

    const newGame = {
      id: socket.id,
      name: temp
    }

    socket.emit("create_game", newGame);
    socket.emit("get_game", socket.id);
  }

  return (
    <Container>
      <Row>
        <Col>
          <h1>Euchre</h1>
        </Col>
      </Row>
    {game ? <>
    Waiting for players...<br /><br />
    {game.players.map((player, index) => {
      return (
        <>{index + 1}. {player.name}<br /></>
      )
    })}
    {console.log('game:', game)}
    </> : <>
    
      <Row>
        <Col>
        <br />
          <input type='text' placeholder='Enter Player Name' value={name} onChange={handleName} />
          <p style={{fontSize: 'small'}}>ID: {socket.id}</p>
          <button onClick={createGame}>Create Game</button><br />
        </Col>
        </Row>

        <br /><br />

        <Row>
        <Col>
          <h3>Join Game</h3>
          {[...openGames].reverse().map(game => {
            return (
              <>
                {game.status === 'waiting' ? 
                  <div className='open-games' onClick={() => joinGame(game)}>
                    <Row>
                      <Col><b>Host:</b> {game.hostName}</Col>
                      <Col><b>Players:</b> {game.players.length}/4</Col>
                    </Row>
                  </div> : <></>}
              </>
              
            )
          })}
        </Col>
      </Row>
    </>}
      
    </Container>
  );
}

export default App;
