import React, { useState, useEffect, useReducer, useCallback } from 'react';
import signalsData from './signals';

function subReducer(state, action) {
    if (action.type === 'add') {
        const newState = state;
        newState.push({
            channel: action.channel,
            func: action.func,
        });
        return newState;
    } else if (action.type === 'remove') {
        const newState = state;
        const index = newState.indexOf(action.channel);
        if (index > -1) {
            newState.splice(index, 1);
        }
        return newState;
    } else {
        throw new Error();
    }
}

function WS() {
    const [subscribes, setSubscribe] = useReducer(subReducer, []);
    const [ws, setWs] = useState(null);
    const subscribeFunc = useCallback((channel, subscribe, func) => {
        if (ws == null) return;
        ws.send(subscribe);
        setSubscribe({type:'add', channel: channel, func: func});
    }, [ws, setSubscribe]);

    const unsubscribeFunc = useCallback((channel, unsubscribe) => {
        if (ws == null) return;
        ws.send(unsubscribe);
        setSubscribe({type:'remove', channel: channel});
    }, [ws, setSubscribe]);

    const wsCallback = useCallback(() => {
        console.log('s');
        const newWs = new WebSocket('wss://api-ws.sofinx.otso-dev.com');
        newWs.onopen = () => {
            console.log('open connection');
            newWs.send('test#Auth@MfPagzMNbunziBC60eoJwR1lGccXdIV6Ky9F458zLDgbrJVRaiuXhufgUwpktTzz');
            newWs.send('test#Subscribe@Signals');
        };
        newWs.onclose = () => {
            console.log('close connection')
        };
        setWs(newWs);
        return () => newWs.close();
    }, []);

    useEffect(() => {
        console.log('g');
        const wsClose = wsCallback();
        return () => wsClose();
    }, []);

    useEffect(() => {
        console.log('n');
        if (ws == null) return;
        ws.onmessage = (receive) => {
            const data = JSON.parse(receive.data);
            console.log(data);
            subscribes.forEach((subscribe) => {
                if (subscribe.channel === data.event.channel) {
                    subscribe.func(data.event);
                    return;
                }
            });
        };
    }, [subscribes, ws]);
    console.log('p');
    console.log(subscribeFunc);
    return (
        <SignalsList subscribeFunc={subscribeFunc} unsubscribeFunc={unsubscribeFunc}/>
    );
}

function SignalsList({subscribeFunc, unsubscribeFunc}) {
    console.log('l');
    console.log('lp');
    console.log(subscribeFunc);
    const signals = signalsData.signals;

    const listItems = signals.map((signal) =>
        <SignalItem key={signal.id} signal={signal} />
    );

    useEffect(() => {
        subscribeFunc('Signals', 'test#Subscribe@Signals', (e) => {
            console.log('event: ', e);
        });
        return () => unsubscribeFunc('Signals', 'test#Subscribe@Signals');
    }, [subscribeFunc, unsubscribeFunc]);

    return (
        <ul>
            {listItems}
        </ul>
    );
}

function SignalItem(props) {
    const signal = props.signal;
    return (
        <li>{signal.name}</li>
    );
}

export default WS