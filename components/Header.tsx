
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useLiveAPIContext } from '../contexts/LiveAPIContext';
import { Agent, createNewAgent } from '../lib/presets/agents';
import { useAgent, useUI, useUser, useAuth } from '../lib/state';
import c from 'classnames';
import { useEffect, useState } from 'react';
import SummanLogo from './SummanLogo';

export default function Header() {
  const { showUserConfig, setShowUserConfig, setShowAgentEdit } = useUI();
  const { name } = useUser();
  const { current, setCurrent, availablePresets, availablePersonal, addAgent } =
    useAgent();
  const { disconnect } = useLiveAPIContext();
  const { role, logout } = useAuth();
  const isAdmin = role === 'admin';

  let [showRoomList, setShowRoomList] = useState(false);

  useEffect(() => {
    addEventListener('click', () => setShowRoomList(false));
    return () => removeEventListener('click', () => setShowRoomList(false));
  }, []);

  function changeAgent(agent: Agent | string) {
    disconnect();
    setCurrent(agent);
  }

  function addNewChatterBot() {
    disconnect();
    addAgent(createNewAgent());
    setShowAgentEdit(true);
  }

  return (
    <header>
      <div className="roomInfo">
        <div className="logo-pill">
           <SummanLogo 
            className="app-logo" 
            style={{ maxHeight: '100%', width: 'auto', display: 'block', objectFit: 'contain' }}
           />
        </div>
        
        <div className="roomName">
          {isAdmin ? (
            <button
              onClick={e => {
                e.stopPropagation();
                setShowRoomList(!showRoomList);
              }}
            >
              <h1 className={c({ active: showRoomList })}>
                {current.name}
                <span className="icon">arrow_drop_down</span>
              </h1>
            </button>
          ) : (
            <h1>{current.name}</h1>
          )}

          {isAdmin && (
            <button
              onClick={() => setShowAgentEdit(true)}
              className="button createButton"
            >
              <span className="icon">edit</span> Edit
            </button>
          )}
        </div>

        {isAdmin && (
          <div className={c('roomList', { active: showRoomList })}>
            <div>
              <h3>Presets</h3>
              <ul>
                {availablePresets
                  .filter(agent => agent.id !== current.id)
                  .map(agent => (
                    <li
                      key={agent.name}
                      className={c({ active: agent.id === current.id })}
                    >
                      <button onClick={() => changeAgent(agent)}>
                        {agent.name}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>

            <div>
              <h3>Custom Agents</h3>
              {
                <ul>
                  {availablePersonal.length ? (
                    availablePersonal.map(({ id, name }) => (
                      <li key={name} className={c({ active: id === current.id })}>
                        <button onClick={() => changeAgent(id)}>{name}</button>
                      </li>
                    ))
                  ) : (
                    <p>None yet.</p>
                  )}
                </ul>
              }
              <button
                className="newRoomButton"
                onClick={() => {
                  addNewChatterBot();
                }}
              >
                <span className="icon">add</span>New Agent
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          className="userSettingsButton"
          onClick={() => setShowUserConfig(!showUserConfig)}
        >
          <p className='user-name'>{name || (isAdmin ? 'Administrator' : 'Collaborator')}</p>
          <span className="icon">tune</span>
        </button>
        
        <button 
          className="button" 
          style={{backgroundColor: 'rgba(255,0,0,0.2)', fontSize: '14px', padding: '8px 12px'}}
          onClick={() => {
             disconnect();
             logout();
          }}
        >
          <span className="icon">logout</span>
        </button>
      </div>
    </header>
  );
}
