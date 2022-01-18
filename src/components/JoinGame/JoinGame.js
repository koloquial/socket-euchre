import React from 'react';
import { Row, Col } from 'react-bootstrap';

const JoinGame = ({openGames, joinGame}) => {
    return (
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
    )
}

export default JoinGame;