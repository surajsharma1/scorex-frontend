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
import './i18n';

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
=======
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
import './i18n';

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
