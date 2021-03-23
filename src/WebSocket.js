import React, { useState, useEffect, useReducer, useCallback } from 'react';
import signalsData from './signals';

function subReducer(state, action) {
    if (action.type === 'add') {
        const newState = state;
        const index = newState.indexOf(action.channel);
        if (index > -1) {
            newState[index] = {
                channel: action.channel,
                func: action.func,
            }
        } else {
            newState.push({
                channel: action.channel,
                func: action.func,
            });
        }
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

function wsReducer(state, action) {
    if (action.type === 'open') {
        return 'open';
    } else if (action.type === 'success') {
        return 'success';
    } else if (action.type === 'close') {
        return 'close';
    } else {
        throw new Error();
    }
}

function WS() {
    const [subscribes, setSubscribe] = useReducer(subReducer, []);
    const [ws, setWs] = useState(null);
    const [wsState, setWsState] = useReducer(wsReducer, 'close');
    const subscribeFunc = useCallback((channel, subscribe, func) => {
        if (ws == null) return;
        if (wsState != 'success') return;
        ws.send(subscribe);
        setSubscribe({type:'add', channel: channel, func: func});
    }, [ws, wsState, setSubscribe]);

    const unsubscribeFunc = useCallback((channel, unsubscribe) => {
        if (ws == null) return;
        if (wsState != 'success') return;
        ws.send(unsubscribe);
        setSubscribe({type:'remove', channel: channel});
    }, [ws, wsState, setSubscribe]);

    const wsCallback = useCallback(() => {
        const newWs = new WebSocket('wss://api-ws.sofinx.otso-dev.com');
        setWsState({type: 'open'});
        newWs.onopen = () => {
            setWsState({type: 'success'});
            console.log('open connection');
            newWs.send('test#Auth@MfPagzMNbunziBC60eoJwR1lGccXdIV6Ky9F458zLDgbrJVRaiuXhufgUwpktTzz');
            newWs.send('test#Subscribe@Signals');
        };
        newWs.onclose = () => {
            setWsState({type: 'close'});
            console.log('close connection')
        };
        setWs(newWs);
        return () => newWs.close();
    }, []);

    useEffect(() => {
        const wsClose = wsCallback();
        return () => wsClose();
    }, []);

    useEffect(() => {
        if (ws == null) return;
        ws.onmessage = (receive) => {
            const data = JSON.parse(receive.data);
            subscribes.forEach((subscribe) => {
                if (subscribe.channel === data.channel) {
                    subscribe.func(data.event);
                    return;
                }
            });
        };
    }, [subscribes, ws]);
    return (
        <SignalsList subscribeFunc={subscribeFunc} unsubscribeFunc={unsubscribeFunc}/>
    );
}

function SignalsList({subscribeFunc, unsubscribeFunc}) {
    const signals = signalsData.signals;
    const [signalsState, setSignalsState] = useState({});
    const listItems = signals.map((signal) =>
        <SignalItem key={signal.id} signal={signal} status={signalsState[signal.id]} />
    );

    useEffect(() => {
        subscribeFunc('Signals', 'test#Subscribe@Signals', (e) => {
            const state = Object.assign({}, signalsState);
            state[e.id] = e.time;
            setSignalsState(state);
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
    const status = props.status;
    return (
    <li>{signal.name} {status}</li>
    );
}

export default WS