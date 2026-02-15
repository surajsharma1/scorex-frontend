import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';

const Frontpage = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-text dark:text-text-dark">

      {/* Header */}
      <header className="flex justify-between items-center p-6 bg-white/80 dark:bg-dark-bg-alt/80 backdrop-blur-sm shadow-lg border-b border-light-secondary/20 dark:border-dark-primary/20">
        <h1 className="text-3xl font-bold text-light-primary dark:text-dark-light">ScoreX</h1>
        <div className="flex items-center gap-4">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-light-secondary/20 dark:bg-dark-primary/20 text-light-primary dark:text-dark-light"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-light-primary dark:bg-dark-primary text-white rounded-lg font-medium"
          >
            Login
          </button>
        </div>
      </header>


      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-light-primary via-light-secondary to-light-accent dark:from-dark-bg dark:via-dark-primary dark:to-dark-secondary py-20 px-6 flex items-center justify-center">
        <div className="text-center max-w-4xl">
          <h2 className="text-6xl font-bold mb-6 leading-tight text-white drop-shadow-lg">ScoreX</h2>
          <p className="text-xl mb-8 leading-relaxed text-white/90">
            The ultimate platform for cricket tournament management and live streaming.
            Create tournaments, manage teams, generate brackets, and produce professional
            overlays for YouTube and streaming platforms. Perfect for organizers, streamers,
            and cricket enthusiasts worldwide.
          </p>
          <p className="text-lg mb-8 text-white/80">
            Join thousands of users who trust ScoreX for seamless cricket management and
            stunning live overlays.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 bg-white text-light-primary rounded-lg font-medium"
          >
            Get Started
          </button>

        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-6 bg-light-bg-alt dark:bg-dark-bg-alt">
        <h3 className="text-4xl font-bold text-center mb-12 text-light-dark dark:text-dark-light">Our Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-dark-bg p-8 rounded-lg shadow-lg text-center border border-light-secondary/30 dark:border-dark-primary/30">
            <h4 className="text-2xl font-semibold mb-4 text-light-primary dark:text-dark-light">Tournament Management</h4>

            <p className="text-light-dark/80 dark:text-dark-accent leading-relaxed">
              Easily create and manage cricket tournaments. Schedule matches, track scores,
              and organize brackets for leagues, cups, and local events.
            </p>
          </div>
          <div className="bg-white dark:bg-dark-bg p-8 rounded-lg shadow-lg text-center border border-light-secondary/30 dark:border-dark-primary/30">
            <h4 className="text-2xl font-semibold mb-4 text-light-primary dark:text-dark-light">Team & Player Organization</h4>

            <p className="text-light-dark/80 dark:text-dark-accent leading-relaxed">
              Build teams, add players, and manage rosters. Keep track of player stats,
              performance, and team standings with our intuitive tools.
            </p>
          </div>
          <div className="bg-white dark:bg-dark-bg p-8 rounded-lg shadow-lg text-center border border-light-secondary/30 dark:border-dark-primary/30">
            <h4 className="text-2xl font-semibold mb-4 text-light-primary dark:text-dark-light">Live Streaming Overlays</h4>

            <p className="text-light-dark/80 dark:text-dark-accent leading-relaxed">
              Generate professional overlays for your live streams. Customize designs,
              display scores, brackets, and team info in real-time.
            </p>
          </div>
          <div className="bg-white dark:bg-dark-bg p-8 rounded-lg shadow-lg text-center border border-light-secondary/30 dark:border-dark-primary/30">
            <h4 className="text-2xl font-semibold mb-4 text-light-primary dark:text-dark-light">Real-Time Score Updates</h4>

            <p className="text-light-dark/80 dark:text-dark-accent leading-relaxed">
              Update match scores live during games. View real-time statistics,
              wickets, overs, and more for an immersive experience.
            </p>
          </div>
          <div className="bg-white dark:bg-dark-bg p-8 rounded-lg shadow-lg text-center border border-light-secondary/30 dark:border-dark-primary/30">
            <h4 className="text-2xl font-semibold mb-4 text-light-primary dark:text-dark-light">Bracket Generation</h4>

            <p className="text-light-dark/80 dark:text-dark-accent leading-relaxed">
              Automatically generate tournament brackets for single-elimination,
              round-robin, and custom formats. Visualize progress and winners.
            </p>
          </div>
          <div className="bg-white dark:bg-dark-bg p-8 rounded-lg shadow-lg text-center border border-light-secondary/30 dark:border-dark-primary/30">
            <h4 className="text-2xl font-semibold mb-4 text-light-primary dark:text-dark-light">Community Features</h4>

            <p className="text-light-dark/80 dark:text-dark-accent leading-relaxed">
              Connect with other organizers and streamers. Share tournaments,
              view public events, and collaborate on cricket projects.
            </p>
          </div>
          <div className="bg-white dark:bg-dark-bg p-8 rounded-lg shadow-lg text-center border border-light-secondary/30 dark:border-dark-primary/30">
            <h4 className="text-2xl font-semibold mb-4 text-light-primary dark:text-dark-light">Social Networking</h4>

            <p className="text-light-dark/80 dark:text-dark-accent leading-relaxed">
              Add friends, join clubs, and build your cricket network. Share achievements,
              follow favorite teams, and engage with the community.
            </p>
          </div>
          <div className="bg-white dark:bg-dark-bg p-8 rounded-lg shadow-lg text-center border border-light-secondary/30 dark:border-dark-primary/30">
            <h4 className="text-2xl font-semibold mb-4 text-light-primary dark:text-dark-light">Payment & Membership</h4>

            <p className="text-light-dark/80 dark:text-dark-accent leading-relaxed">
              Access premium features with flexible subscription plans. Unlock advanced
              overlays, priority support, and exclusive tournament templates.
            </p>
          </div>
          <div className="bg-white dark:bg-dark-bg p-8 rounded-lg shadow-lg text-center border border-light-secondary/30 dark:border-dark-primary/30">
            <h4 className="text-2xl font-semibold mb-4 text-light-primary dark:text-dark-light">Data Export & Analytics</h4>

            <p className="text-light-dark/80 dark:text-dark-accent leading-relaxed">
              Export tournament data, generate reports, and analyze performance metrics.
              Get insights into player stats, team performance, and match outcomes.
            </p>
          </div>
          <div className="bg-white dark:bg-dark-bg p-8 rounded-lg shadow-lg text-center border border-light-secondary/30 dark:border-dark-primary/30">
            <h4 className="text-2xl font-semibold mb-4 text-light-primary dark:text-dark-light">Notification System</h4>

            <p className="text-light-dark/80 dark:text-dark-accent leading-relaxed">
              Stay updated with real-time notifications for match updates, tournament
              changes, and community activities. Never miss important events.
            </p>
          </div>
          <div className="bg-white dark:bg-dark-bg p-8 rounded-lg shadow-lg text-center border border-light-secondary/30 dark:border-dark-primary/30">
            <h4 className="text-2xl font-semibold mb-4 text-light-primary dark:text-dark-light">Multi-Language Support</h4>

            <p className="text-light-dark/80 dark:text-dark-accent leading-relaxed">
              Experience ScoreX in your preferred language. Support for multiple
              languages to make cricket management accessible worldwide.
            </p>
          </div>
          <div className="bg-white dark:bg-dark-bg p-8 rounded-lg shadow-lg text-center border border-light-secondary/30 dark:border-dark-primary/30">
            <h4 className="text-2xl font-semibold mb-4 text-light-primary dark:text-dark-light">Theme Customization</h4>

            <p className="text-light-dark/80 dark:text-dark-accent leading-relaxed">
              Personalize your experience with light and dark themes. Customize
              colors and layouts to match your brand or personal preference.
            </p>
          </div>
        </div>
      </section>

      {/* Overlay Previews Section */}
      <section className="py-20 px-6 bg-light-bg dark:bg-dark-bg">
        <h3 className="text-4xl font-bold text-center mb-12 text-light-dark dark:text-dark-light">Overlay Previews</h3>
        <p className="text-center text-lg mb-12 text-light-dark/70 dark:text-dark-accent">
          See examples of our professional overlay designs. Unlock premium templates
          and customizations with our membership plans.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-dark-bg-alt p-6 rounded-lg shadow-lg text-center border border-light-secondary/30 dark:border-dark-primary/30">
            <div className="bg-light-bg-alt dark:bg-dark-primary/30 h-48 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-light-primary dark:text-dark-light">Overlay Preview 1</span>
            </div>
            <h4 className="text-xl font-semibold mb-2 text-light-primary dark:text-dark-light">Score Overlay</h4>
            <p className="text-light-dark/70 dark:text-dark-accent">Display live scores, wickets, and overs.</p>
          </div>
          <div className="bg-white dark:bg-dark-bg-alt p-6 rounded-lg shadow-lg text-center border border-light-secondary/30 dark:border-dark-primary/30">
            <div className="bg-light-bg-alt dark:bg-dark-primary/30 h-48 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-light-primary dark:text-dark-light">Overlay Preview 2</span>
            </div>
            <h4 className="text-xl font-semibold mb-2 text-light-primary dark:text-dark-light">Bracket Overlay</h4>
            <p className="text-light-dark/70 dark:text-dark-accent">Show tournament brackets and matchups.</p>
          </div>
          <div className="bg-white dark:bg-dark-bg-alt p-6 rounded-lg shadow-lg text-center border border-light-secondary/30 dark:border-dark-primary/30">
            <div className="bg-light-bg-alt dark:bg-dark-primary/30 h-48 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-light-primary dark:text-dark-light">Overlay Preview 3</span>
            </div>
            <h4 className="text-xl font-semibold mb-2 text-light-primary dark:text-dark-light">Team Stats Overlay</h4>
            <p className="text-light-dark/70 dark:text-dark-accent">Highlight player and team statistics.</p>
          </div>
        </div>
        <div className="text-center mt-12">
          <p className="text-lg text-light-dark/70 dark:text-dark-accent mb-4">
            These premium overlays are available with our membership subscription.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 bg-light-primary dark:bg-dark-primary text-white rounded-lg font-medium"
          >
            Join Now
          </button>

        </div>
      </section>

      {/* Membership Section */}
      <section className="py-20 px-6 bg-light-bg-alt dark:bg-dark-bg-alt">
        <h3 className="text-4xl font-bold text-center mb-12 text-light-dark dark:text-dark-light">Membership & Subscription</h3>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xl mb-8 text-light-dark/70 dark:text-dark-accent leading-relaxed">
            Unlock the full potential of ScoreX with our premium membership. Access
            exclusive overlay designs, advanced customization tools, and priority
            support. Our subscription plans are designed for organizers and streamers
            who want professional-grade cricket management and streaming tools.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-dark-bg p-8 rounded-lg shadow-lg border border-light-secondary/30 dark:border-dark-primary/30">
              <h4 className="text-2xl font-semibold mb-4 text-light-primary dark:text-dark-light">Basic Plan</h4>
              <p className="text-light-dark/70 dark:text-dark-accent mb-4">Free - Core tournament management features.</p>
              <ul className="text-left text-light-dark/70 dark:text-dark-accent space-y-2">
                <li>✓ Create tournaments</li>
                <li>✓ Manage teams</li>
                <li>✓ Basic brackets</li>
              </ul>
            </div>
            <div className="bg-white dark:bg-dark-bg p-8 rounded-lg shadow-lg border-2 border-light-primary dark:border-dark-primary">
              <h4 className="text-2xl font-semibold mb-4 text-light-primary dark:text-dark-light">Pro Plan</h4>
              <p className="text-light-dark/70 dark:text-dark-accent mb-4">$9.99/month - Advanced features.</p>
              <ul className="text-left text-light-dark/70 dark:text-dark-accent space-y-2">
                <li>✓ All Basic features</li>
                <li>✓ Premium overlays</li>
                <li>✓ Real-time updates</li>
                <li>✓ Custom designs</li>
              </ul>
            </div>
            <div className="bg-white dark:bg-dark-bg p-8 rounded-lg shadow-lg border border-light-secondary/30 dark:border-dark-primary/30">
              <h4 className="text-2xl font-semibold mb-4 text-light-primary dark:text-dark-light">Enterprise Plan</h4>
              <p className="text-light-dark/70 dark:text-dark-accent mb-4">$29.99/month - For large events.</p>
              <ul className="text-left text-light-dark/70 dark:text-dark-accent space-y-2">
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
              className="px-8 py-3 bg-light-primary dark:bg-dark-primary text-white rounded-lg font-medium"
            >
              Start Free Trial
            </button>

          </div>
        </div>
      </section>

      {/* Live Scores Section */}
      <section className="py-20 px-6 bg-light-bg dark:bg-dark-bg">
        <h3 className="text-4xl font-bold text-center mb-12 text-light-dark dark:text-dark-light">Live Scores</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-dark-bg-alt p-6 rounded-lg text-center shadow-lg border border-light-secondary/30 dark:border-dark-primary/30">
            <h4 className="text-xl font-semibold mb-2 text-light-primary dark:text-dark-light">Match 1</h4>
            <p className="text-lg text-light-dark dark:text-dark-light">Team A vs Team B: 150/5 (20 overs)</p>
            <p className="text-sm text-light-accent dark:text-dark-accent mt-2">Live</p>
          </div>
          <div className="bg-white dark:bg-dark-bg-alt p-6 rounded-lg text-center shadow-lg border border-light-secondary/30 dark:border-dark-primary/30">
            <h4 className="text-xl font-semibold mb-2 text-light-primary dark:text-dark-light">Match 2</h4>
            <p className="text-lg text-light-dark dark:text-dark-light">Team C vs Team D: 120/3 (18 overs)</p>
            <p className="text-sm text-light-accent dark:text-dark-accent mt-2">Completed</p>
          </div>
          <div className="bg-white dark:bg-dark-bg-alt p-6 rounded-lg text-center shadow-lg border border-light-secondary/30 dark:border-dark-primary/30">
            <h4 className="text-xl font-semibold mb-2 text-light-primary dark:text-dark-light">Match 3</h4>
            <p className="text-lg text-light-dark dark:text-dark-light">Team E vs Team F: 180/7 (20 overs)</p>
            <p className="text-sm text-light-accent dark:text-dark-accent mt-2">Upcoming</p>
          </div>
        </div>
      </section>

      {/* Featured Tournaments Section */}
      <section className="py-20 px-6 bg-light-bg dark:bg-dark-bg">
        <h3 className="text-4xl font-bold text-center mb-12 text-light-dark dark:text-dark-light">Featured Tournaments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-light-primary dark:bg-dark-primary p-8 rounded-lg shadow-lg text-center">
            <h4 className="text-2xl font-semibold mb-4 text-white">T20 World Cup</h4>
            <p className="text-white/80 mb-6">
              Global cricket tournament with live updates and overlays.
            </p>
            <Link
              to="/tournaments"
              className="px-6 py-2 bg-white text-light-primary rounded-lg font-medium inline-block"
            >
              View All Tournaments
            </Link>
          </div>
          <div className="bg-light-secondary dark:bg-dark-secondary p-8 rounded-lg shadow-lg text-center">
            <h4 className="text-2xl font-semibold mb-4 text-white">Local League</h4>
            <p className="text-white/80 mb-6">
              Community cricket matches and brackets for local teams.
            </p>
            <Link
              to="/tournaments"
              className="px-6 py-2 bg-white text-light-primary rounded-lg font-medium inline-block"
            >
              View All Tournaments
            </Link>
          </div>
        </div>
      </section>

      {/* Team Stats Section */}
      <section className="py-20 px-6 bg-light-bg-alt dark:bg-dark-bg-alt">
        <h3 className="text-4xl font-bold text-center mb-12 text-light-dark dark:text-dark-light">Team Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          <div>
            <h4 className="text-5xl font-bold text-light-primary dark:text-dark-accent mb-2">150</h4>
            <p className="text-lg text-light-dark dark:text-dark-light">Total Runs</p>
          </div>
          <div>
            <h4 className="text-5xl font-bold text-light-secondary dark:text-dark-secondary mb-2">10</h4>
            <p className="text-lg text-light-dark dark:text-dark-light">Wickets Taken</p>
          </div>
          <div>
            <h4 className="text-5xl font-bold text-light-accent dark:text-dark-primary mb-2">5</h4>
            <p className="text-lg text-light-dark dark:text-dark-light">Matches Won</p>
          </div>
          <div>
            <h4 className="text-5xl font-bold text-light-dark dark:text-dark-light mb-2">95%</h4>
            <p className="text-lg text-light-dark dark:text-dark-light">Win Rate</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-light-dark dark:bg-dark-bg text-center text-white">
        <p>&copy; 2023 ScoreX. All rights reserved. Built for cricket enthusiasts.</p>
      </footer>
    </div>
  );
};

export default Frontpage;
