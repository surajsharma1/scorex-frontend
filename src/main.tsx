import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider'; // Add this
import App from './components/App';
import Dashboard from './components/Dashboard';
import TournamentView from './components/TournamentView';
import TeamManagement from './components/TeamManagement';
import BracketView from './components/BracketView';
import OverlayEditor from './components/OverlayEditor';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'tournaments', element: <TournamentView /> },
      { path: 'teams', element: <TeamManagement /> },
      { path: 'brackets', element: <BracketView /> },
      { path: 'overlay', element: <OverlayEditor /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider> {/* Wrap here */}
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
);