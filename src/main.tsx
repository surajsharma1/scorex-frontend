import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './components/App';
import Dashboard from './components/Dashboard';
import TournamentView from './components/TournamentView';
import TournamentDetail from './components/TournamentDetail';
import TeamManagement from './components/TeamManagement';
import OverlayForm from './components/OverlayForm';
import OverlayEditor from './components/OverlayEditor';
import Profile from './components/Profile';
import Membership from './components/Membership';
import Payment from './components/Payment';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Frontpage from './components/Frontpage';
import { ThemeProvider } from './components/ThemeProvider';
import './index.css';
import './i18n';
import ClubManagement from './components/ClubManagement';
import FriendList from './components/FriendList';

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

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ThemeProvider>
        <App />
      </ThemeProvider>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "tournaments", element: <TournamentView /> },
      { path: "tournaments/:id", element: <TournamentDetail /> },
      { path: "teams", element: <TeamManagement /> },
      { path: "friends", element: <FriendList /> },
      { path: "clubs", element: <ClubManagement /> },
      { path: "overlays", element: <OverlayEditor /> },
      { path: "overlays/new", element: <OverlayForm /> },
      { path: "overlays/:id/edit", element: <OverlayEditor /> },
      { path: "profile", element: <Profile /> },
      { path: "membership", element: <Membership /> },
      { path: "payment", element: <Payment onClose={() => {}} onSuccess={() => {}} /> },
    ],
  },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
