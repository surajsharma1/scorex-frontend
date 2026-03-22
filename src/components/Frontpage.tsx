
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Carousel from './Carousel';
import { 
  BarChart3, ShieldCheck, Play, ArrowRight, 
  Activity, Video, Trophy, Users, Zap, 
  Globe, Sparkles, ChevronDown, Star,
  Twitter, Instagram, Youtube, Github
} from 'lucide-react';

export default function Frontpage() {
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#030305] text-white flex flex-col font-sans selection:bg-green-500/30 overflow-x-hidden">
      
      {/* Navigation - Contains Carousel inside */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrollY > 50 ? 'bg-black/95 backdrop-blur-xl border-b border-white/5' : 'bg-black/80 backdrop-blur-sm'
      }`}>
        {/* Top Bar with Logo + Nav Links + Carousel + Auth Buttons */}
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo Section */}
            <div className="flex items-center gap-3 group cursor-pointer shrink-0">
                <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-tr from-green-600 to-emerald-400 rounded-xl flex items-center justify-center font-orbitron font-bold text-black text-lg shadow-lg shadow-green-500/20 group-hover:shadow-green-500/40 transition-all duration-300">
                        S
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div className="hidden sm:flex flex-col">
                    <span className="font-orbitron font-black text-xl tracking-tight leading-none">
                        SCOREX
                    </span>
                    <span className="text-[8px] text-green-400/60 font-medium tracking-[0.3em] uppercase">
                        Live Scoring
                    </span>
                </div>
            </div>
            
            {/* Nav Links - Hidden on small screens, visible on md+ */}
            <div className="hidden md:flex items-center gap-6 mx-4">
                <NavLink href="#features">Features</NavLink>
                <NavLink href="#overlays">Overlays</NavLink>
                <NavLink href="#testimonials">Reviews</NavLink>
                <NavLink href="#pricing">Pricing</NavLink>
            </div>

            {/* Carousel - Integrated in center, scrolls with page */}
            <div className="flex-1 mx-4 hidden lg:block max-w-xl">
              <div className="h-8 flex items-center">
                <Carousel />
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3 shrink-0">
<Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white transition block">
                    Sign In
                </Link>
                <Link to="/register" className="px-4 py-2 bg-white text-black text-sm font-bold rounded-full hover:bg-gray-100 transition shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] transform hover:scale-105">
                    Get Started
                </Link>
            </div>
          </div>
        </div>
        
        {/* Mobile Carousel - Below nav on smaller screens */}
        <div className="lg:hidden border-t border-white/5">
          <Carousel />
        </div>
      </nav>

      {/* Hero Section - Enhanced */}
      <div className="relative pt-24 pb-40 px-6 flex-1 flex flex-col justify-center overflow-hidden min-h-screen">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBMNDAgME0wIDBMNDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
        
        {/* Gradient Orbs */}
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-green-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[80px] pointer-events-none"></div>

        {/* Floating Elements */}
        <div className="absolute top-40 left-[10%] w-20 h-20 border border-green-500/20 rounded-2xl rotate-12 animate-float hidden lg:block"></div>
        <div className="absolute bottom-40 right-[15%] w-16 h-16 border border-cyan-500/20 rounded-full animate-float-delayed hidden lg:block"></div>
        <div className="absolute top-60 right-[20%] w-12 h-12 bg-gradient-to-r from-green-500/10 to-cyan-500/10 rounded-lg rotate-45 animate-float-slow hidden lg:block"></div>

        <div className="container mx-auto text-center relative z-10 max-w-5xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-green-400 text-xs font-bold uppercase tracking-widest mb-8 hover:bg-white/10 transition cursor-pointer group">
            <Zap className="w-3 h-3 group-hover:text-yellow-400 transition" /> 
            <span>The Future of Sports Tech</span>
            <Sparkles className="w-3 h-3 opacity-50" />
          </div>
          
          {/* Main Title */}
          <h1 className="text-7xl md:text-9xl lg:text-[10rem] font-black mb-6 leading-[0.9] font-orbitron tracking-tight relative">
            <span className="relative z-10">NEXT</span>
            <br />
            <span className="relative z-10">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 glow-text-green">
                GEN
              </span>
            </span>
            <br />
            <span className="relative z-10 text-5xl md:text-7xl lg:text-8xl">CRICKET</span>
          </h1>
          
          {/* Tagline */}
          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            Professional live scoring, 
            <span className="text-white font-medium"> TV-grade broadcast overlays</span>, and 
            <span className="text-white font-medium"> deep tournament analytics</span>. 
            All in one powerful platform.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-5 mb-20">
            <Link 
              to="/register" 
              className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 bg-green-600 hover:bg-green-500 text-black font-bold rounded-2xl transition-all shadow-[0_0_40px_rgba(34,197,94,0.4)] hover:shadow-[0_0_60px_rgba(34,197,94,0.6)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative flex items-center gap-2">
                Start Tournament <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link 
              to="/matches/live" 
              className="group inline-flex items-center justify-center gap-3 px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold transition-all backdrop-blur-sm hover:border-white/20"
            >
              <Play className="w-5 h-5 fill-current text-green-400" /> 
              <span>Watch Live</span>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            <StatCard number="50K+" label="Tournaments" />
            <StatCard number="1M+" label="Matches" />
            <StatCard number="10K+" label="Teams" />
            <StatCard number="99.9%" label="Uptime" />
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs text-gray-500 uppercase tracking-widest">Scroll</span>
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* 4. Features Section */}
      <section id="features" className="relative py-32 px-6 bg-gradient-to-b from-transparent via-black/50 to-black">
        <div className="container mx-auto">
          <SectionHeader 
            title="Powerful Features" 
            subtitle="Everything you need to run professional cricket tournaments"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
            <FeatureCard 
              icon={<Video className="w-7 h-7 text-cyan-400" />}
              title="Broadcast Overlays"
              desc="OBS-ready animated overlays for your live streams. Multiple styles from basic to premium."
              gradient="from-cyan-500/20 to-blue-500/20"
            />
            <FeatureCard 
              icon={<BarChart3 className="w-7 h-7 text-purple-400" />}
              title="Pro Analytics"
              desc="Wagon wheels, pitch maps, run rate graphs, and detailed player statistics."
              gradient="from-purple-500/20 to-pink-500/20"
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-7 h-7 text-yellow-400" />}
              title="Secure Platform"
              desc="Role-based access for scorers, organizers, and administrators."
              gradient="from-yellow-500/20 to-orange-500/20"
            />
            <FeatureCard 
              icon={<Trophy className="w-7 h-7 text-green-400" />}
              title="Tournament Management"
              desc="Create and manage tournaments with automatic bracket generation."
              gradient="from-green-500/20 to-emerald-500/20"
            />
            <FeatureCard 
              icon={<Users className="w-7 h-7 text-blue-400" />}
              title="Team Management"
              desc="Manage teams, players, and stats all in one place."
              gradient="from-blue-500/20 to-cyan-500/20"
            />
            <FeatureCard 
              icon={<Globe className="w-7 h-7 text-red-400" />}
              title="Global Community"
              desc="Join clubs, make friends, and compete with players worldwide."
              gradient="from-red-500/20 to-pink-500/20"
            />
          </div>
        </div>
      </section>

      {/* 5. Overlay Preview Section */}
      <section id="overlays" className="relative py-32 px-6 bg-black">
        <div className="container mx-auto">
          <SectionHeader 
            title="Stunning Overlay Designs" 
            subtitle="Professional broadcast overlays that make your stream stand out"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            <OverlayPreview 
              name="Neon Pulse"
              category="Premium"
              color="from-green-500 to-emerald-600"
              image="lvl2-neon-pulse"
            />
            <OverlayPreview 
              name="Cyber Glitch"
              category="Premium"
              color="from-purple-500 to-pink-600"
              image="lvl2-cyber-glitch"
            />
            <OverlayPreview 
              name="Gold Rush"
              category="Premium"
              color="from-yellow-500 to-orange-600"
              image="lvl2-gold-rush"
            />
            <OverlayPreview 
              name="Broadcast Pro"
              category="Basic"
              color="from-blue-500 to-cyan-600"
              image="lvl2-broadcast-pro"
            />
          </div>

          <div className="text-center mt-12">
            <Link to="/register" className="inline-flex items-center gap-2 text-green-400 font-medium hover:gap-3 transition-all">
              View All Overlays <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Testimonials */}
      <section id="testimonials" className="relative py-32 px-6 bg-gradient-to-b from-black via-black/80 to-black">
        <div className="container mx-auto max-w-5xl">
          <SectionHeader 
            title="Loved by Organizers" 
            subtitle="See what tournament organizers say about ScoreX"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
            <TestimonialCard 
              name="Rahul Sharma"
              role="Cricket Club Owner"
              avatar="RS"
              content="ScoreX has transformed how we manage our club tournaments. The live scoring feature is incredible!"
              rating={5}
            />
            <TestimonialCard 
              name="Michael Chen"
              role="Tournament Director"
              avatar="MC"
              content="The broadcast overlays are professional grade. Our stream quality has improved significantly."
              rating={5}
            />
            <TestimonialCard 
              name="Sarah Williams"
              role="Sports Academy"
              avatar="SW"
              content="Best platform for amateur cricket tournaments. Easy to use and the analytics are comprehensive."
              rating={5}
            />
            <TestimonialCard 
              name="David Patel"
              role="League Organizer"
              avatar="DP"
              content="Our players love the live match updates. The platform handles everything perfectly."
              rating={5}
            />
          </div>
        </div>
      </section>

      {/* 7. Pricing Section */}
      <section id="pricing" className="relative py-32 px-6 bg-black">
        <div className="container mx-auto max-w-4xl">
          <SectionHeader 
            title="Simple Pricing" 
            subtitle="Choose the plan that works for you"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
            <PricingCard 
              name="Free"
              price="$0"
              period="/month"
              features={[
                "Basic tournament creation",
                "5 team members",
                "Standard overlays",
                "Basic analytics",
                "Community support"
              ]}
              highlight={false}
            />
            <PricingCard 
              name="Premium"
              price="$19"
              period="/month"
              features={[
                "Unlimited tournaments",
                "Unlimited team members",
                "All premium overlays",
                "Advanced analytics",
                "Priority support",
                "Custom branding",
                "API access"
              ]}
              highlight={true}
            />
          </div>
        </div>
      </section>

      {/* 8. CTA Section */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/20 via-black to-cyan-900/20"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-green-600/10 rounded-full blur-[150px]"></div>
        
        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-black mb-6 font-orbitron">
            Ready to <span className="text-green-400">Level Up?</span>
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Join thousands of tournament organizers who trust ScoreX for their cricket events.
          </p>
          <Link 
            to="/register" 
            className="inline-flex items-center gap-3 px-10 py-5 bg-white text-black font-bold rounded-full hover:bg-gray-100 transition shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)]"
          >
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="border-t border-white/5 bg-black/80 py-16 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-tr from-green-600 to-emerald-500 rounded-lg flex items-center justify-center font-orbitron font-bold text-black">S</div>
                <span className="font-orbitron font-bold text-xl">SCOREX</span>
              </div>
              <p className="text-gray-400 text-sm">
                Professional cricket scoring and tournament management platform.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-white">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-green-400 transition">Features</a></li>
                <li><a href="#" className="hover:text-green-400 transition">Pricing</a></li>
                <li><a href="#" className="hover:text-green-400 transition">Overlays</a></li>
                <li><a href="#" className="hover:text-green-400 transition">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-white">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-green-400 transition">About</a></li>
                <li><a href="#" className="hover:text-green-400 transition">Blog</a></li>
                <li><a href="#" className="hover:text-green-400 transition">Careers</a></li>
                <li><a href="#" className="hover:text-green-400 transition">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-white">Connect</h4>
              <div className="flex gap-4">
                <SocialLink icon={<Twitter className="w-5 h-5" />} />
                <SocialLink icon={<Instagram className="w-5 h-5" />} />
                <SocialLink icon={<Youtube className="w-5 h-5" />} />
                <SocialLink icon={<Github className="w-5 h-5" />} />
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © 2024 ScoreX. All rights reserved.
            </p>
            <div className="flex gap-6 text-gray-500 text-sm">
              <a href="#" className="hover:text-white transition">Privacy</a>
              <a href="#" className="hover:text-white transition">Terms</a>
              <a href="#" className="hover:text-white transition">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Components
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="text-sm font-medium text-gray-300 hover:text-white transition relative group">
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 group-hover:w-full transition-all duration-300"></span>
    </a>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center p-4">
      <div className="text-3xl md:text-4xl font-black text-white mb-1 font-orbitron">{number}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <h2 className="text-4xl md:text-5xl font-black mb-4 font-orbitron">{title}</h2>
      <p className="text-xl text-gray-400 max-w-2xl mx-auto">{subtitle}</p>
    </div>
  );
}

function FeatureCard({ icon, title, desc, gradient }: { icon: React.ReactNode; title: string; desc: string; gradient: string }) {
  return (
    <div className={`p-8 rounded-3xl bg-gradient-to-br ${gradient} border border-white/5 hover:border-white/10 transition group cursor-pointer`}>
      <div className="mb-5 bg-black/30 w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3 font-orbitron">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function OverlayPreview({ name, category, color, image }: { name: string; category: string; color: string; image: string }) {
  return (
    <div className="group relative rounded-2xl overflow-hidden aspect-video bg-gray-900 border border-white/5 hover:border-white/20 transition cursor-pointer">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-20 group-hover:opacity-30 transition`}></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center group-hover:scale-110 transition">
          <Play className="w-6 h-6 text-white fill-white" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-white">{name}</h4>
            <span className="text-xs text-gray-400">{category}</span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs bg-gradient-to-r ${color} text-black font-medium`}>
            Preview
          </span>
        </div>
      </div>
    </div>
  );
}

function TestimonialCard({ name, role, avatar, content, rating }: { name: string; role: string; avatar: string; content: string; rating: number }) {
  return (
    <div className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 transition">
      <div className="flex gap-1 mb-4">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-gray-300 mb-6 leading-relaxed">"{content}"</p>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-green-500 to-emerald-500 flex items-center justify-center font-bold text-black">
          {avatar}
        </div>
        <div>
          <div className="font-bold text-white">{name}</div>
          <div className="text-sm text-gray-500">{role}</div>
        </div>
      </div>
    </div>
  );
}

function PricingCard({ name, price, period, features, highlight }: { name: string; price: string; period: string; features: string[]; highlight: boolean }) {
  return (
    <div className={`relative p-8 rounded-3xl transition ${
      highlight 
        ? 'bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-2 border-green-500/50' 
        : 'bg-white/5 border border-white/10'
    }`}>
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-green-500 text-black text-xs font-bold rounded-full">
          POPULAR
        </div>
      )}
      <h3 className="text-2xl font-bold mb-2">{name}</h3>
      <div className="flex items-baseline gap-1 mb-6">
        <span className="text-5xl font-black">{price}</span>
        <span className="text-gray-400">{period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3 text-gray-300">
            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            {feature}
          </li>
        ))}
      </ul>
      <Link 
        to="/register" 
        className={`block w-full py-4 rounded-xl font-bold text-center transition ${
          highlight 
            ? 'bg-green-600 hover:bg-green-500 text-black' 
            : 'bg-white/10 hover:bg-white/20 text-white'
        }`}
      >
        Get Started
      </Link>
    </div>
  );
}

function SocialLink({ icon }: { icon: React.ReactNode }) {
  return (
    <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition">
      {icon}
    </a>
  );
}

