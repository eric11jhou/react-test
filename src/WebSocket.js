import React, { useState, useEffect, useReducer, useCallback } from 'react';
import signalsData from './signals';

function WS() {
    function chReducer(state, action) {
        if (action.type === 'add') {
            const newState = state;
            newState[action.channel] = action.func;
            return newState;
        } else if (action.type === 'remove') {
            const newState = state;
            delete newState[action.channel];
            return newState;
        } else {
            throw new Error();
        }
    }

    const [chState, setChannel] = useReducer(chReducer, {})
    const signals = signalsData.signals;
    const wsState = { ws: null };
    const [wsOK, setWsOK] = useState(false);
    useEffect(() => {
        wsState.ws = new WebSocket('wss://api-ws.sofinx.otso-dev.com');
        wsState.ws.onopen = () => {
            console.log('open connection');
            wsState.ws.send('test#Auth@Gyzu4v8t6BqkXnz1IpsgtvOfujEvyusT6z9O9kgUMTZ0KVowCv4aGYdBbrb4bl9m');
            setWsOK(true);
        };
        wsState.ws.onclose = () => {
            console.log('close connection')
        };
        return () => wsState.ws.close();
    }, []);

    useEffect(() => {
        wsState.ws.onmessage = (receive) => {
            const data = JSON.parse(receive.data);
            const channelFunc = chState[data.channel];
            if (channelFunc != null) channelFunc(data.event);
        };
        return () => { };
    }, [chState]);
    return (
        <SignalsList wsState={wsState} wsOK={wsOK} signals={signals} setChannel={setChannel} />
    );
}

function SignalsList(props) {
    const signals = props.signals;
    const setChannel = props.setChannel;
    const { ws } = props.wsState;
    const wsOK = props.wsOK;
    const listItems = signals.map((signal) =>
        <SignalItem key={signal.id} signal={signal} />
    );
    const func = useCallback((e) => {
        console.log(e);
    }, []);

    useEffect(() => {
        console.log('1', ws, wsOK);
        if (ws != null && wsOK) {
            ws.send('test#Subscribe@Signals');
            setChannel({ type: 'add', channel: 'Signals', func: func })
            return () => ws.send('test#Unsubscribe@Signals');
        } else {
            return () => { };
        }
    }, [ws, wsOK]);

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