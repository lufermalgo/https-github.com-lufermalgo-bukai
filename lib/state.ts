
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { create } from 'zustand';
import { Agent, Charlotte, Paul, Shane, Penny, HRAgent } from './presets/agents';
import { db } from './firebase';
import { doc, onSnapshot, setDoc, updateDoc, collection, query, getDocs, writeBatch } from 'firebase/firestore';

/**
 * Authentication & Roles
 */
export type UserRole = 'admin' | 'user' | null;

export type GoogleProfile = {
  name: string;
  email: string;
  picture: string;
  hd?: string; // Hosted Domain
}

interface AuthState {
  role: UserRole;
  isAuthenticated: boolean;
  userProfile: GoogleProfile | null;
  loginWithGoogle: (profile: GoogleProfile) => void;
  loginAsAdmin: (password: string) => boolean;
  logout: () => void;
}

// Hardcoded list of admin emails for demonstration
const ADMIN_EMAILS = ['admin@buk.cl', 'hr@buk.cl'];

export const useAuth = create<AuthState>(set => ({
  role: null,
  isAuthenticated: false,
  userProfile: null,
  loginWithGoogle: (profile: GoogleProfile) => {
    // Sync with User Store for the AI context
    useUser.getState().setName(profile.name);
    
    // Determine role based on email
    const role = ADMIN_EMAILS.includes(profile.email) ? 'admin' : 'user';
    
    set({ 
      role, 
      isAuthenticated: true, 
      userProfile: profile 
    });
  },
  loginAsAdmin: (password: string) => {
    // Fallback manual admin login
    if (password === 'admin123') {
      set({ role: 'admin', isAuthenticated: true, userProfile: { name: 'Administrator', email: 'admin@system', picture: '' } });
      useUser.getState().setName('Administrator');
      return true;
    }
    return false;
  },
  logout: () => {
    set({ role: null, isAuthenticated: false, userProfile: null });
    useUser.getState().setName('');
  },
}));

/**
 * User Data (The person chatting)
 */
export type User = {
  name?: string;
  info?: string;
};

export const useUser = create<
  {
    setName: (name: string) => void;
    setInfo: (info: string) => void;
  } & User
>(set => ({
  name: '',
  info: '',
  setName: name => set({ name }),
  setInfo: info => set({ info }),
}));

/**
 * Agents
 */
function getAgentById(id: string) {
  const { availablePersonal, availablePresets } = useAgent.getState();
  return (
    availablePersonal.find(agent => agent.id === id) ||
    availablePresets.find(agent => agent.id === id)
  );
}

interface AgentState {
  current: Agent;
  availablePresets: Agent[];
  availablePersonal: Agent[];
  setCurrent: (agent: Agent | string) => void;
  addAgent: (agent: Agent) => void;
  update: (agentId: string, adjustments: Partial<Agent>) => void;
  syncWithFirestore: () => () => void; // Returns unsubscribe function
}

export const useAgent = create<AgentState>((set, get) => ({
  current: HRAgent, // Default to HR Agent
  availablePresets: [HRAgent, Paul, Charlotte, Shane, Penny],
  availablePersonal: [],

  addAgent: async (agent: Agent) => {
    // Optimistic update
    set(state => ({
      availablePersonal: [...state.availablePersonal, agent],
      current: agent,
    }));
    
    // Firestore update
    try {
      await setDoc(doc(db, 'agents', agent.id), agent);
      // Also set as current globally
      await setDoc(doc(db, 'config', 'global'), { currentAgentId: agent.id }, { merge: true });
    } catch (e) {
      console.error("Error adding agent to DB:", e);
    }
  },

  setCurrent: async (agent: Agent | string) => {
    const agentObj = typeof agent === 'string' ? getAgentById(agent) : agent;
    if (!agentObj) return;

    set({ current: agentObj });

    // Firestore update global config
    try {
      await setDoc(doc(db, 'config', 'global'), { currentAgentId: agentObj.id }, { merge: true });
    } catch (e) {
      console.error("Error setting current agent in DB:", e);
    }
  },

  update: async (agentId: string, adjustments: Partial<Agent>) => {
    let agent = getAgentById(agentId);
    if (!agent) return;
    const updatedAgent = { ...agent, ...adjustments };

    // Optimistic update
    set(state => ({
      availablePresets: state.availablePresets.map(a =>
        a.id === agentId ? updatedAgent : a
      ),
      availablePersonal: state.availablePersonal.map(a =>
        a.id === agentId ? updatedAgent : a
      ),
      current: state.current.id === agentId ? updatedAgent : state.current,
    }));

    // Firestore update
    try {
      await setDoc(doc(db, 'agents', agentId), updatedAgent, { merge: true });
    } catch (e) {
      console.error("Error updating agent in DB:", e);
    }
  },

  syncWithFirestore: () => {
    // 1. Listen for Config changes (which agent is active)
    const unsubConfig = onSnapshot(doc(db, 'config', 'global'), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        if (data.currentAgentId) {
          const agent = getAgentById(data.currentAgentId);
          if (agent) {
             // Only update if different to prevent loops, though zustand handles shallow comp
             if (get().current.id !== agent.id) {
               set({ current: agent });
             }
          }
        }
      }
    });

    // 2. Listen for Agents collection changes
    const unsubAgents = onSnapshot(collection(db, 'agents'), (querySnapshot) => {
      const personalAgents: Agent[] = [];
      const presetsMap = new Map(get().availablePresets.map(a => [a.id, a]));
      
      let presetsUpdated = false;
      const newPresets = [...get().availablePresets];

      querySnapshot.forEach((doc) => {
        const agentData = doc.data() as Agent;
        
        // Check if it overrides a preset
        if (presetsMap.has(agentData.id)) {
          const index = newPresets.findIndex(p => p.id === agentData.id);
          if (JSON.stringify(newPresets[index]) !== JSON.stringify(agentData)) {
             newPresets[index] = agentData;
             presetsUpdated = true;
          }
        } else {
          personalAgents.push(agentData);
        }
      });

      // Update state
      set(state => ({
        availablePersonal: personalAgents,
        availablePresets: presetsUpdated ? newPresets : state.availablePresets,
        // If the current agent was updated in the background, update the reference
        current: state.current.id ? (newPresets.find(p => p.id === state.current.id) || personalAgents.find(p => p.id === state.current.id) || state.current) : state.current
      }));
      
      // Initial seed: If DB is empty, write the presets to it so they can be edited
      if (querySnapshot.empty) {
        const batch = writeBatch(db);
        get().availablePresets.forEach(preset => {
          const ref = doc(db, 'agents', preset.id);
          batch.set(ref, preset);
        });
        batch.commit().catch(e => console.error("Error seeding agents", e));
      }
    });

    return () => {
      unsubConfig();
      unsubAgents();
    };
  }
}));

/**
 * UI
 */
export const useUI = create<{
  showUserConfig: boolean;
  setShowUserConfig: (show: boolean) => void;
  showAgentEdit: boolean;
  setShowAgentEdit: (show: boolean) => void;
}>(set => ({
  showUserConfig: true,
  setShowUserConfig: (show: boolean) => set({ showUserConfig: show }),
  showAgentEdit: false,
  setShowAgentEdit: (show: boolean) => set({ showAgentEdit: show }),
}));
