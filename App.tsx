
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import AgentEdit from './components/AgentEdit';
import ControlTray from './components/console/control-tray/ControlTray';
import ErrorScreen from './components/demo/ErrorSreen';
import KeynoteCompanion from './components/demo/keynote-companion/KeynoteCompanion';
import Header from './components/Header';
import UserSettings from './components/UserSettings';
import LoginScreen from './components/LoginScreen';
import { LiveAPIProvider } from './contexts/LiveAPIContext';
import { useUI, useAuth, useUser, useAgent } from './lib/state';
import { useEffect } from 'react';

const API_KEY = process.env.API_KEY as string;

/**
 * Main application component that provides a streaming interface for Live API.
 * Manages video streaming state and provides controls for webcam/screen capture.
 */
function App() {
  const { showUserConfig, showAgentEdit, setShowUserConfig } = useUI();
  const { isAuthenticated } = useAuth();
  const { name } = useUser();
  const { syncWithFirestore } = useAgent();

  // Start Firestore synchronization when the app loads
  useEffect(() => {
    const unsubscribe = syncWithFirestore();
    return () => unsubscribe();
  }, [syncWithFirestore]);

  // If user has a name (from Google Auth), we don't need to show the config immediately
  useEffect(() => {
    if(isAuthenticated && name) {
      setShowUserConfig(false);
    }
  }, [isAuthenticated, name, setShowUserConfig]);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (!API_KEY) {
    return (
      <div className="error-screen" style={{position: 'fixed', zIndex: 9999}}>
        <div className="error-message-container">
          <h2 style={{color: '#ff4600'}}>Missing API Key</h2>
          <p>
            The <code>process.env.API_KEY</code> is not defined.
            <br />
            Please check your environment configuration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <LiveAPIProvider apiKey={API_KEY}>
        <ErrorScreen />
        <Header />

        {showUserConfig && <UserSettings />}
        {showAgentEdit && <AgentEdit />}
        <div className="streaming-console">
          <main>
            <div className="main-app-area">
              <KeynoteCompanion />
            </div>

            <ControlTray></ControlTray>
          </main>
        </div>
      </LiveAPIProvider>
    </div>
  );
}

export default App;
