import React from 'react';

const Card = ({ val, side, size }) => {


    if(side === 'front'){
        let type = val[val.length - 1];
        let value = val.split(type)[0];
        let color = 'black';
    
        switch(type){
            case '♥':
            case '◆': color = 'red'; break;
            default: color = 'black'; break;
        }
    
        return (
            <div className='card'>
                <div style={{display: 'inline-block', position: 'absolute', width: '40px', height: '40px', left: '0px', top: '0px'}}>
                    <center><p style={{fontSize: '20px', color: color}}>{value}<br />{type}</p></center>
                </div>

                <div style={{display: 'inline-block', position: 'absolute', width: '40px', height: '40px', right: '0px', bottom: '0px', transform: 'rotate(180deg)'}}>
                    <center><p style={{fontSize: '20px', color: color}}>{value}<br />{type}</p></center>
                </div>

                <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: '0'}}>
                    <center><p style={{fontSize: '100px', opacity: '.3', color: color}}>{type}</p></center>
                </div>
            </div>
        )
    }else{
        return (
            <div className='card-back' style={size === 'small' ? {height: '80%', width: '80%', marginRight: '-10px'} : {}} >
                &nbsp;
            </div>
        )
    }
}

export default Card;