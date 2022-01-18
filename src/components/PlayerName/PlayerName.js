import React from 'react';
import { Row, Col } from 'react-bootstrap';

const PlayerName = ({ name, handleName, socket}) => {
    return (
        <Row>
            <Col>
                <br />
                <input type='text' placeholder='Enter Player Name' value={name} onChange={handleName} />
                <p style={{fontSize: 'small'}}>ID: {socket.id}</p>
            </Col>
        </Row>
    )
}

export default PlayerName;