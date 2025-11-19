
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useEffect, useRef, useState, useMemo } from 'react';
import {
  Agent,
  AGENT_COLORS,
  INTERLOCUTOR_VOICE,
  INTERLOCUTOR_VOICES,
} from '../lib/presets/agents';
import Modal from './Modal';
import c from 'classnames';
import { useAgent, useUI } from '../lib/state';
import { debounce } from 'lodash';

export default function EditAgent() {
  const agent = useAgent(state => state.current);
  const updateAgent = useAgent(state => state.update);
  const { setShowAgentEdit } = useUI();

  // Local state to handle inputs immediately without waiting for DB/Store roundtrip
  // and to prevent jitter while typing
  const [localDraft, setLocalDraft] = useState<Agent>(agent);

  // Update local draft when the selected agent changes externally
  useEffect(() => {
    setLocalDraft(agent);
  }, [agent.id]);

  function onClose() {
    setShowAgentEdit(false);
  }

  // Debounced function to save to Firestore/Global Store
  // This prevents writing to the DB on every single keystroke
  const debouncedSave = useMemo(
    () =>
      debounce((id: string, data: Partial<Agent>) => {
        updateAgent(id, data);
      }, 800),
    [updateAgent]
  );

  function handleUpdate(field: keyof Agent, value: any) {
    // 1. Update UI immediately
    setLocalDraft(prev => ({ ...prev, [field]: value }));
    
    // 2. Schedule save to DB
    debouncedSave(agent.id, { [field]: value });
  }

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  return (
    <Modal onClose={() => onClose()}>
      <div className="editAgent">
        <div>
          <form onSubmit={(e) => e.preventDefault()}>
            <div>
              <input
                className="largeInput"
                type="text"
                placeholder="Name"
                value={localDraft.name}
                onChange={e => handleUpdate('name', e.target.value)}
              />
            </div>

            <div>
              <label>
                Personality
                <textarea
                  value={localDraft.personality}
                  onChange={e => handleUpdate('personality', e.target.value)}
                  rows={7}
                  placeholder="How should I act? Whatʼs my purpose? How would you describe my personality?"
                />
              </label>
            </div>
          </form>
        </div>

        <div>
          <div>
            <ul className="colorPicker">
              {AGENT_COLORS.map((color, i) => (
                <li
                  key={i}
                  className={c({ active: color === localDraft.bodyColor })}
                >
                  <button
                    style={{ backgroundColor: color }}
                    onClick={() => handleUpdate('bodyColor', color)}
                  />
                </li>
              ))}
            </ul>
          </div>
          <div className="voicePicker">
            Voice
            <select
              value={localDraft.voice}
              onChange={e => {
                handleUpdate('voice', e.target.value as INTERLOCUTOR_VOICE);
              }}
            >
              {INTERLOCUTOR_VOICES.map(voice => (
                <option key={voice} value={voice}>
                  {voice}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button onClick={() => onClose()} className="button primary">
          Done (Auto-saved)
        </button>
      </div>
    </Modal>
  );
}