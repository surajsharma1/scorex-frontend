  import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Frontpage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <header className="flex justify-between items-center p-6 bg-white dark:bg-gray-800 shadow-lg">
        <h1 className="text-3xl font-bold">ScoreX</h1>
        <button
          onClick={() => navigate('/login')}
          className="btn-2"
        >
          Login
        </button>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-900 to-purple-900 py-20 px-6 flex items-center justify-center">
        <div className="text-center max-w-4xl">
          <h2 className="text-6xl font-bold mb-6 leading-tight">ScoreX</h2>
          <p className="text-xl mb-8 leading-relaxed">
            The ultimate platform for cricket tournament management and live streaming.
            Create tournaments, manage teams, generate brackets, and produce professional
            overlays for YouTube and streaming platforms. Perfect for organizers, streamers,
            and cricket enthusiasts worldwide.
          </p>
          <p className="text-lg mb-8">
            Join thousands of users who trust ScoreX for seamless cricket management and
            stunning live overlays.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary"
          >
            Get Started
          </button>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-6 bg-white dark:bg-gray-900">
        <h3 className="text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">Our Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center border border-gray-200 dark:border-gray-700">
            <h4 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Tournament Management</h4>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Easily create and manage cricket tournaments. Schedule matches, track scores,
              and organize brackets for leagues, cups, and local events.
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center border border-gray-200 dark:border-gray-700">
            <h4 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Team & Player Organization</h4>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Build teams, add players, and manage rosters. Keep track of player stats,
              performance, and team standings with our intuitive tools.
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center border border-gray-200 dark:border-gray-700">
            <h4 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Live Streaming Overlays</h4>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Generate professional overlays for your live streams. Customize designs,
              display scores, brackets, and team info in real-time.
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center border border-gray-200 dark:border-gray-700">
            <h4 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Real-Time Score Updates</h4>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Update match scores live during games. View real-time statistics,
              wickets, overs, and more for an immersive experience.
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center border border-gray-200 dark:border-gray-700">
            <h4 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Bracket Generation</h4>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Automatically generate tournament brackets for single-elimination,
              round-robin, and custom formats. Visualize progress and winners.
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center border border-gray-200 dark:border-gray-700">
            <h4 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Community Features</h4>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Connect with other organizers and streamers. Share tournaments,
              view public events, and collaborate on cricket projects.
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center border border-gray-200 dark:border-gray-700">
            <h4 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Social Networking</h4>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Add friends, join clubs, and build your cricket network. Share achievements,
              follow favorite teams, and engage with the community.
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center border border-gray-200 dark:border-gray-700">
            <h4 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Payment & Membership</h4>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Access premium features with flexible subscription plans. Unlock advanced
              overlays, priority support, and exclusive tournament templates.
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center border border-gray-200 dark:border-gray-700">
            <h4 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Data Export & Analytics</h4>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Export tournament data, generate reports, and analyze performance metrics.
              Get insights into player stats, team performance, and match outcomes.
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center border border-gray-200 dark:border-gray-700">
            <h4 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Notification System</h4>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Stay updated with real-time notifications for match updates, tournament
              changes, and community activities. Never miss important events.
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center border border-gray-200 dark:border-gray-700">
            <h4 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Multi-Language Support</h4>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Experience ScoreX in your preferred language. Support for multiple
              languages to make cricket management accessible worldwide.
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center border border-gray-200 dark:border-gray-700">
            <h4 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Theme Customization</h4>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Personalize your experience with light and dark themes. Customize
              colors and layouts to match your brand or personal preference.
            </p>
          </div>
        </div>
      </section>

      {/* Overlay Previews Section */}
      <section className="py-20 px-6 bg-gray-100 dark:bg-gray-800">
        <h3 className="text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">Overlay Previews</h3>
        <p className="text-center text-lg mb-12 text-gray-600 dark:text-gray-300">
          See examples of our professional overlay designs. Unlock premium templates
          and customizations with our membership plans.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg text-center border border-gray-200 dark:border-gray-600">
            <div className="bg-gray-200 dark:bg-gray-600 h-48 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-gray-500 dark:text-gray-400">Overlay Preview 1</span>
            </div>
            <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Score Overlay</h4>
            <p className="text-gray-600 dark:text-gray-300">Display live scores, wickets, and overs.</p>
          </div>
          <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg text-center border border-gray-200 dark:border-gray-600">
            <div className="bg-gray-200 dark:bg-gray-600 h-48 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-gray-500 dark:text-gray-400">Overlay Preview 2</span>
            </div>
            <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Bracket Overlay</h4>
            <p className="text-gray-600 dark:text-gray-300">Show tournament brackets and matchups.</p>
          </div>
          <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg text-center border border-gray-200 dark:border-gray-600">
            <div className="bg-gray-200 dark:bg-gray-600 h-48 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-gray-500 dark:text-gray-400">Overlay Preview 3</span>
            </div>
            <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Team Stats Overlay</h4>
            <p className="text-gray-600 dark:text-gray-300">Highlight player and team statistics.</p>
          </div>
        </div>
        <div className="text-center mt-12">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
            These premium overlays are available with our membership subscription.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary"
          >
            Join Now
          </button>
        </div>
      </section>

      {/* Membership Section */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-900">
        <h3 className="text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">Membership & Subscription</h3>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xl mb-8 text-gray-600 dark:text-gray-300 leading-relaxed">
            Unlock the full potential of ScoreX with our premium membership. Access
            exclusive overlay designs, advanced customization tools, and priority
            support. Our subscription plans are designed for organizers and streamers
            who want professional-grade cricket management and streaming tools.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Basic Plan</h4>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Free - Core tournament management features.</p>
              <ul className="text-left text-gray-600 dark:text-gray-300 space-y-2">
                <li>✓ Create tournaments</li>
                <li>✓ Manage teams</li>
                <li>✓ Basic brackets</li>
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border-2 border-blue-500">
              <h4 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Pro Plan</h4>
              <p className="text-gray-600 dark:text-gray-300 mb-4">$9.99/month - Advanced features.</p>
              <ul className="text-left text-gray-600 dark:text-gray-300 space-y-2">
                <li>✓ All Basic features</li>
                <li>✓ Premium overlays</li>
                <li>✓ Real-time updates</li>
                <li>✓ Custom designs</li>
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Enterprise Plan</h4>
              <p className="text-gray-600 dark:text-gray-300 mb-4">$29.99/month - For large events.</p>
              <ul className="text-left text-gray-600 dark:text-gray-300 space-y-2">
                <li>✓ All Pro features</li>
                <li>✓ Multi-tournament support</li>
                <li>✓ API access</li>
                <li>✓ Priority support</li>
              </ul>
            </div>
          </div>
          <div className="mt-12">
          <button
            onClick={() => navigate('/login')}
            className="btn-primary"
          >
            Start Free Trial
          </button>
          </div>
        </div>
      </section>

      {/* Live Scores Section */}
      <section className="py-20 px-6 bg-gray-100 dark:bg-gray-800">
        <h3 className="text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">Live Scores</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-700 p-6 rounded-lg text-center shadow-lg border border-gray-200 dark:border-gray-600">
            <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Match 1</h4>
            <p className="text-lg text-gray-900 dark:text-white">Team A vs Team B: 150/5 (20 overs)</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Live</p>
          </div>
          <div className="bg-white dark:bg-gray-700 p-6 rounded-lg text-center shadow-lg border border-gray-200 dark:border-gray-600">
            <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Match 2</h4>
            <p className="text-lg text-gray-900 dark:text-white">Team C vs Team D: 120/3 (18 overs)</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Completed</p>
          </div>
          <div className="bg-white dark:bg-gray-700 p-6 rounded-lg text-center shadow-lg border border-gray-200 dark:border-gray-600">
            <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Match 3</h4>
            <p className="text-lg text-gray-900 dark:text-white">Team E vs Team F: 180/7 (20 overs)</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Upcoming</p>
          </div>
        </div>
      </section>

      {/* Featured Tournaments Section */}
      <section className="py-20 px-6">
        <h3 className="text-4xl font-bold text-center mb-12">Featured Tournaments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
            <h4 className="text-2xl font-semibold mb-4">T20 World Cup</h4>
            <p className="text-gray-300 mb-6">
              Global cricket tournament with live updates and overlays.
            </p>
            <Link
              to="/tournaments"
              className="btn-primary inline-block"
            >
              View All Tournaments
            </Link>
          </div>
          <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
            <h4 className="text-2xl font-semibold mb-4">Local League</h4>
            <p className="text-gray-300 mb-6">
              Community cricket matches and brackets for local teams.
            </p>
            <Link
              to="/tournaments"
              className="btn-primary inline-block"
            >
              View All Tournaments
            </Link>
          </div>
        </div>
      </section>

      {/* Team Stats Section */}
      <section className="py-20 px-6 bg-gray-100 dark:bg-gray-800">
        <h3 className="text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">Team Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          <div>
            <h4 className="text-5xl font-bold text-blue-400 mb-2">150</h4>
            <p className="text-lg text-gray-900 dark:text-white">Total Runs</p>
          </div>
          <div>
            <h4 className="text-5xl font-bold text-green-400 mb-2">10</h4>
            <p className="text-lg text-gray-900 dark:text-white">Wickets Taken</p>
          </div>
          <div>
            <h4 className="text-5xl font-bold text-yellow-400 mb-2">5</h4>
            <p className="text-lg text-gray-900 dark:text-white">Matches Won</p>
          </div>
          <div>
            <h4 className="text-5xl font-bold text-red-400 mb-2">95%</h4>
            <p className="text-lg text-gray-900 dark:text-white">Win Rate</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-center">
        <p>&copy; 2023 ScoreX. All rights reserved. Built for cricket enthusiasts.</p>
      </footer>
    </div>
  );
};

export default Frontpage;