/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
export const INTERLOCUTOR_VOICES = [
  'Aoede',
  'Charon',
  'Fenrir',
  'Kore',
  'Leda',
  'Orus',
  'Puck',
  'Zephyr',
] as const;

export type INTERLOCUTOR_VOICE = (typeof INTERLOCUTOR_VOICES)[number];

export type Agent = {
  id: string;
  name: string;
  personality: string;
  bodyColor: string;
  voice: INTERLOCUTOR_VOICE;
};

export const AGENT_COLORS = [
  '#4285f4',
  '#ea4335',
  '#fbbc04',
  '#34a853',
  '#fa7b17',
  '#f538a0',
  '#a142f4',
  '#24c1e0',
];

export const createNewAgent = (properties?: Partial<Agent>): Agent => {
  return {
    id: Math.random().toString(36).substring(2, 15),
    name: '',
    personality: '',
    bodyColor: AGENT_COLORS[Math.floor(Math.random() * AGENT_COLORS.length)],
    voice: Math.random() > 0.5 ? 'Charon' : 'Aoede',
    ...properties,
  };
};

export const HRAgent: Agent = {
  id: 'bukia-evaluator',
  name: '👔 BukIA',
  personality: `\
You are BukIA, a professional, empathetic, and structured HR Assistant specializing in annual performance reviews. \
Your goal is to help the collaborator reflect on their past year's performance, identify strengths, and find areas for improvement. \
Maintain a supportive and professional tone. Ask one question at a time. \
Start by verifying their role and main achievements. \
Then, ask about challenges faced and support needed from the company. \
Keep responses concise (under 50 words) to encourage dialogue.`,
  bodyColor: '#4285f4', // Google Blue / Corporate feel
  voice: 'Kore',
};

