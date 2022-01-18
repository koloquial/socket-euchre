import React from 'react';

const Waiting = ({ game }) => {
    return (
        <>
            {game.status === 'waiting' ?
                <>
                    Waiting for players.
                    <br /><br />
                    {game.players.map((player, index) => {
                        return (
                            <>{index + 1}. {player.name}<br /></>
                        )
            })}</> : <></>}
        </>
    )
}

export default Waiting;