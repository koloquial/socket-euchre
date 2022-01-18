import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Container, Row, Col } from 'react-bootstrap';

import Card from './components/Card';
import { shuffle } from './functions/shuffle';

const socket = io.connect("http://localhost:3001");

function App() {
  const [name, setName] = useState('');
  const [game, setGame] = useState();
  const [openGames, setOpenGames] = useState([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    socket.on("open_games", (data) => {
      setOpenGames(data);
    });
  
    socket.on("update_game", (data) => {
      console.log(data);
      setGame(data);
    })

    socket.on("status", (data) => {
      setStatus(data);
    })
  });

  useEffect(() => {
    if(game){

      if(game.status === 'active' && game.dealer === ''){
          socket.emit("assign_dealer", game);
      }

      if(game.status === 'set trump'){
        const deck = shuffle();
        socket.emit('shuffle_deck', {game, deck});

      }

      if(game.status === 'assign dealer'){
        console.log('iteration')
      }


    }
  }, [game]);



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

    const deck = shuffle();

    const newGame = {
      id: socket.id,
      name: temp,
      deck: deck
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
    {game ? 
    <>

      {game.status === 'waiting' ?
        <>
          Waiting for players.<br /><br />
          {game.players.map((player, index) => {
            return (
              <>{index + 1}. {player.name}<br /></>
            )
          })}
        </> : <></>
      }

      {game.status === 'assign dealer' ? <>
          {status}
          <br /><br />
          <center>
          <Row>
            <Col>
            <table>
              <tr>
              {game.players[0].hand.map(card => {
                return <td><Card side={'front'} val={card} /></td>
              })}
              </tr>
            </table>     
            </Col>
          </Row>
          <Row>
          <Col>
          <table>
              <tr>
              {game.players[3].hand.map(card => {
                return <td style={{verticalAlign: 'top'}}><Card side={'front'} val={card} /></td>
              })}
              </tr>
            </table>  
            </Col>
            <Col>
            <table>
              <tr>
              {game.players[1].hand.map(card => {
                return <td><Card side={'front'} val={card} /></td>
              })}
              </tr>
            </table>  
            </Col>
          </Row>
          <Row>
            <Col>
            <table>
              <tr>
              {game.players[2].hand.map(card => {
                return <td><Card side={'front'} val={card} /></td>
              })}
              </tr>
            </table>  
            </Col>
          </Row>
          </center>


      </> : <></>}

      {game.status === 'set trump' ? <>
          {status}
          <br /><br />
          <center>
          <Row>
            <Col>
            <table>
              <tr>
              {game.players[0].hand.map(card => {
                return <td><Card side={'back'} val={card} size='small' /></td>
              })}
              </tr>
            </table>     
            </Col>
          </Row>
          <Row>
          <Col>
          <div style={{transform: 'rotate(90deg)'}}>
            <table>
              <tr>
              {game.players[3].hand.map(card => {
                return <td><Card side={'back'} val={card} size='small' /></td>
              })}
              </tr>
            </table>  
            </div> 
            </Col>
            <Col>
            <div style={{transform: 'rotate(90deg)'}}>
            <table>
              <tr>
              {game.players[1].hand.map(card => {
                return <td><Card side={'back'} val={card} size='small' /></td>
              })}
              </tr>
            </table>  
            </div>
            </Col>
          </Row>
          <Row>
            <Col>
            <table>
              <tr>
              {game.players[2].hand.map(card => {
                return <td><Card side={'front'} val={card} size='small' /></td>
              })}
              </tr>
            </table>  
            </Col>
          </Row>
          </center>


      </> : <></>}

      </> : 
      <>
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
