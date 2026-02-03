import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './components/App';
import Dashboard from './components/Dashboard';
import TournamentView from './components/TournamentView';
import TeamManagement from './components/TeamManagement';
import BracketView from './components/BracketView';
import OverlayList from './components/OverlayList';
import OverlayForm from './components/OverlayForm';
import OverlayEditor from './components/OverlayEditor';
import Profile from './components/Profile';
import Membership from './components/Membership';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
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
      { path: 'overlays', element: <OverlayList /> },
      { path: 'overlays/new', element: <OverlayForm /> },
      { path: 'overlays/:id/edit', element: <OverlayEditor /> },
      { path: 'profile', element: <Profile /> },
      { path: 'membership', element: <Membership /> },
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);