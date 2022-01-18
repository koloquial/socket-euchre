
const deck = [
    '9❤', '10❤', 'J❤', 'Q❤', 'K❤', 'A❤',
    '9◆', '10◆', 'J◆', 'Q◆', 'K◆', 'A◆',
    '9♠', '10♠', 'J♠', 'Q♠', 'K♠', 'A♠',
    '9♣', '10♣', 'J♣', 'Q♣', 'K♣', 'A♣',
]

export const shuffle = () => {

    const shuffled = [];
    const copy = [...deck];

    while(copy.length > 0){
        let random = Math.floor(Math.random() * copy.length);
        shuffled.push(copy[random]);
        copy.splice(random, 1);
    }

    return shuffled;
}