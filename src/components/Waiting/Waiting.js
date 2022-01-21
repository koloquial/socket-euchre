import React from 'react';

const Waiting = ({ game }) => {
    return (
        <>
            {game.status === 'waiting' ?
                <>
                    <p>Waiting for players.</p>
                    <br /><br />
                    {game.players.map((player, index) => {
                        return (
                            <p>{index + 1}. {player.name}<br /></p>
                        )
            })}</> : <></>}
        </>
    )
}

export default Waiting;