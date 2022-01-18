import React from 'react';

const Card = ({ val, side }) => {

    if(side === 'front'){
        return (
            <div className='card'>
                {val}
            </div>
        )

    }else{
        return (
            <div className='card-back'>
                &nbsp;
            </div>
        )
    }
}

export default Card;