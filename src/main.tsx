import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import TournamentView from './components/TournamentView';
import TeamManagement from './components/TeamManagement';
import BracketView from './components/BracketView';
import OverlayEditor from './components/OverlayEditor';
import './index.css';

// Define routes with authentication check
const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: <Login />,
    },
    {
      path: '/register',
      element: <Register />,
    },
    {
      path: '/',
      element: <App />,  // Protected routes inside App
      children: [
        { index: true, element: <Dashboard /> },
        { path: 'tournaments', element: <TournamentView /> },
        { path: 'teams', element: <TeamManagement /> },
        { path: 'brackets', element: <BracketView /> },
        { path: 'overlay', element: <OverlayEditor /> },
      ],
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,  // Enable future flag to fix warning
    },
  }
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);