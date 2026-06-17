// pages/index.js
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import fs from 'fs';
import path from 'path';
import { ShieldCheck, Zap, PenTool, TrendingUp, MapPin, Headphones, BarChart } from 'lucide-react';

export default function Home({ siteContent }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', service: 'Graphic Design', message: '' });
  const [formStatus, setFormStatus] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [contactData, setContactData] = useState({ name: '', business_name: '', email: '', phone: '', service: '', message: '' });
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [submittingContact, setSubmittingContact] = useState(false);
  const [submittingNewsletter, setSubmittingNewsletter] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);

  const canvasRef = useRef(null);

  // Helper to show custom toast message
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 3000);
  };

  // Clipboard copy and toast logic for email floating button
  const handleEmailFloatClick = (e) => {
    e.preventDefault();
    const email = siteContent.contactEmail || 'GDProductionmarketing@gmail.com';
    navigator.clipboard.writeText(email).then(() => {
      triggerToast(`📋 ${email} copied to clipboard!`);
      // Open email client
      window.location.href = `mailto:${email}`;
    }).catch(err => {
      console.error('Failed to copy:', err);
      window.location.href = `mailto:${email}`;
    });
  };

  // 3D Particles effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;
    let isMobile = window.innerWidth < 768;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      isMobile = window.innerWidth < 768;
    };
    window.addEventListener('resize', resize);
    resize();

    class Particle {
      constructor() { this.reset(); this.z = Math.random() * 2000; }
      reset() {
        this.x = (Math.random() - 0.5) * canvas.width * 2;
        this.y = (Math.random() - 0.5) * canvas.height * 2;
        this.z = 2000;
        this.size = Math.random() * 1.5 + 0.5;
      }
      update() {
        this.z -= 2;
        if (this.z <= 0) this.reset();
      }
      draw() {
        const proj = 500 / this.z;
        const px = this.x * proj + canvas.width / 2;
        const py = this.y * proj + canvas.height / 2;
        const s = this.size * proj;
        if (px > 0 && px < canvas.width && py > 0 && py < canvas.height) {
          ctx.beginPath();
          ctx.arc(px, py, s, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 240, 255, ${1 - this.z / 2000})`; // Cyan particles
          ctx.fill();
        }
      }
    }

    for (let i = 0; i < 50; i++) particles.push(new Particle());

    const animate = () => {
      if (!isMobile && !prefersReducedMotion) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
      }
      animationId = requestAnimationFrame(animate);
    };
    
    if (!isMobile && !prefersReducedMotion) animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Form handlers
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setSubmittingContact(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      });
      const result = await response.json();
      if (response.ok) {
        alert(result.message || 'Message sent successfully!');
        setContactData({ name: '', business_name: '', email: '', phone: '', service: '', message: '' });
      } else {
        alert(result.error || result.message || 'Failed to send message.');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while sending the message.');
    } finally {
      setSubmittingContact(false);
    }
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    setSubmittingNewsletter(true);
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail })
      });
      const result = await response.json();
      if (response.ok) {
        triggerToast(`🎉 ${result.message || 'Thank you for subscribing!'}`);
        setNewsletterEmail('');
      } else {
        triggerToast(`❌ ${result.error || 'Failed to subscribe'}`);
      }
    } catch (error) {
      console.error(error);
      triggerToast('❌ Error connecting to server.');
    } finally {
      setSubmittingNewsletter(false);
    }
  };

  // Portfolio categories
  const categories = ['All', 'Restaurants', 'Butcher Shops', 'Salons', 'Healthcare', 'Dental Clinics', 'Pharmacies', 'Medical Centers', 'Event Businesses', 'Websites'];
  
  const filteredPortfolio = activeCategory === 'All' 
    ? siteContent.portfolio 
    : siteContent.portfolio.filter(item => item.category === activeCategory);

  return (
    <>
      <Head>
        <title>{siteContent.settings.seo.title}</title>
        <meta name="description" content={siteContent.settings.seo.description} />
        <meta name="keywords" content={siteContent.settings.seo.keywords} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={siteContent.settings.seo.title} />
        <meta property="og:description" content={siteContent.settings.seo.description} />
        <meta property="og:url" content="https://gd-production.vercel.app/" />
        <meta property="og:site_name" content={siteContent.companyName} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteContent.settings.seo.title} />
        <meta name="twitter:description" content={siteContent.settings.seo.description} />
      </Head>

      {/* NAVBAR */}
      <nav className="navbar scrolled">
        <div className="container navbar-inner">
          <a href="#" className="logo-link">
            <img src="/assets/logo.jpg" alt="GD Production Logo" className="logo-img" style={{ height: '55px', borderRadius: '50%', boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)' }} />
          </a>
          <button className={`menu-toggle ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <span></span><span></span><span></span>
          </button>
          <div className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`}>
            <a href="#" onClick={() => setIsMobileMenuOpen(false)}>Home</a>
            <a href="#about" onClick={() => setIsMobileMenuOpen(false)}>About</a>
            <a href="#services" onClick={() => setIsMobileMenuOpen(false)}>Services</a>
            <a href="#portfolio" onClick={() => setIsMobileMenuOpen(false)}>Portfolio</a>
            <a href="#healthcare" onClick={() => setIsMobileMenuOpen(false)}>Healthcare</a>
            <a href="#whyChooseMe" onClick={() => setIsMobileMenuOpen(false)}>Why Us</a>
            <a href="mailto:GDProductionmarketing@gmail.com" className="btn-nav-email" onClick={() => setIsMobileMenuOpen(false)}>Email Us</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <canvas ref={canvasRef} className="hero-canvas"></canvas>
        <div className="hero-glow hero-glow-1"></div>
        <div className="hero-glow hero-glow-2"></div>
        <div className="container hero-grid">
          <div className="hero-content">
            <div className="badge">
              <span className="badge-dot"></span>
              <span>{siteContent.hero.badge}</span>
            </div>
            <h1>
              Professional <span className="text-gradient-cyan">Graphic Design</span>, Websites &amp; <span className="text-gradient-gold">Marketing</span> for Local Businesses
            </h1>
            <p className="hero-sub">{siteContent.hero.subtitle}</p>
            <div className="hero-buttons">
              <a href="#contact" className="btn-primary">{siteContent.hero.primaryCta} <span className="arrow">→</span></a>
              <a href="#portfolio" className="btn-outline">{siteContent.hero.secondaryCta}</a>
            </div>
            <div className="hero-stars">
              <div className="star-row">
                <span className="star-circle">★</span>
                <span className="star-circle">★</span>
                <span className="star-circle">★</span>
                <span className="star-circle">★</span>
                <span className="star-circle">★</span>
              </div>
              <p className="star-text">Trusted by <strong>100+</strong> Local USA Businesses</p>
            </div>
          </div>
          <div className="hero-visual">
            <div className="mockup-wrapper">
              <div className="mockup-card mockup-website float-anim-1">
                <div className="browser-dots"><span className="dot red"></span><span className="dot yellow"></span><span className="dot green"></span></div>
                <div className="mockup-body"><div className="icon-monitor">🖥</div><p className="fw-600">Premium Website</p><p className="text-sm text-muted">High Converting</p></div>
              </div>
              <div className="mockup-card mockup-maps float-anim-2">
                <div className="maps-header"><div className="maps-icon">📍</div><div><div className="skeleton-bar"></div><div className="stars-text">★★★★★ <span className="text-muted text-xs">(148)</span></div></div></div>
                <div className="skeleton-lines"><div className="skeleton-bar full"></div><div className="skeleton-bar w80"></div></div>
              </div>
              <div className="mockup-card mockup-social float-anim-3">
                <div className="social-header"><div className="social-avatar"></div><div className="skeleton-bar w60"></div></div>
                <div className="social-img">📱</div>
                <div className="skeleton-lines sm"><div className="skeleton-bar full"></div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST / METRICS */}
      <section className="section trust-section">
        <div className="container">
          <div className="section-header">
            <h2>Proven Results for USA Businesses</h2>
            <p>We deliver measurable growth with clean, professional branding and modern web design.</p>
          </div>
          <div className="trust-grid">
            {siteContent.trust.map((item, idx) => (
              <div key={idx} className="glass-card glass-card-hover trust-card">
                <span className="trust-text">{item}</span>
              </div>
            ))}
          </div>
        </div>
    </section>

      {/* SPECIAL OFFERS */}
      {siteContent.discountOffers && siteContent.discountOffers.some(o => o.isActive && new Date(o.endDate) >= new Date(new Date().setHours(0,0,0,0))) && (
        <section className="section section-alt" id="special-offers">
          <div className="container">
            <div className="section-header">
              <h2><span className="text-gradient-gold">Special Offers</span></h2>
              <p>Exclusive deals on our premium digital services for a limited time.</p>
            </div>
            <div className="offers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              {siteContent.discountOffers.filter(o => o.isActive && new Date(o.endDate) >= new Date(new Date().setHours(0,0,0,0))).map((offer, idx) => (
                <div key={idx} className="glass-morphism p-8 rounded-2xl border border-gold-20 relative overflow-hidden group transition-transform duration-300 hover:-translate-y-2" style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }}>
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-xs uppercase tracking-wider py-1 px-4 rounded-bl-xl" style={{ background: 'linear-gradient(135deg, var(--gold), #FF8C00)', boxShadow: '-2px 2px 10px rgba(0,0,0,0.2)' }}>
                    {offer.badgeText || 'Special Offer'}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 pr-12">{offer.title}</h3>
                  
                  <div className="price-container my-4" style={{ display: 'flex', alignItems: 'baseline', gap: '0.8rem' }}>
                    <span className="text-gray-400 line-through text-lg">${offer.originalPrice}</span>
                    <span className="text-4xl font-bold text-gradient-gold">${offer.finalPrice}</span>
                    {offer.discountType === 'percentage' && (
                      <span className="text-sm font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded" style={{ color: '#2ecc71', background: 'rgba(46, 204, 113, 0.1)' }}>-{offer.discountValue}%</span>
                    )}
                    {offer.discountType === 'fixed' && (
                      <span className="text-sm font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded" style={{ color: '#2ecc71', background: 'rgba(46, 204, 113, 0.1)' }}>-${offer.discountValue} OFF</span>
                    )}
                  </div>
                  
                  <p className="text-gray-300 mb-6 leading-relaxed">{offer.description}</p>
                  
                  <div className="flex justify-between items-center text-sm text-muted mb-6 pb-4 border-b border-white-10">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>⏱️</span> Ends: {new Date(offer.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <a href={offer.ctaLink || "#contact"} className="btn-primary w-full text-center block" style={{ padding: '0.8rem', background: 'linear-gradient(135deg, var(--gold), #b8952a)', color: 'var(--navy)' }}>
                    {offer.ctaText || 'Claim Offer'}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ABOUT */}
      <section className="section" id="about">
        <div className="container">
          <div className="space-y-32">
            {siteContent.employees?.filter(emp => emp.isVisible).map((emp, idx) => (
              <div key={emp.id || idx} className="about-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
                
                {/* TEXT COLUMN */}
                <div className={`order-2 ${idx % 2 !== 0 ? 'md:order-2' : 'md:order-1'}`}>
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">{emp.name}</h2>
                  <div className="text-lg text-cyan font-bold tracking-wider uppercase mb-8">{emp.position}</div>
                  
                  <div className="about-text space-y-6 text-gray-400 leading-relaxed text-lg mb-8" style={{ whiteSpace: 'pre-line' }}>
                    {emp.bio}
                  </div>

                  {/* SKILLS */}
                  {emp.skills && emp.skills.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-sm">Core Skills</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {emp.skills.map((skill, sIdx) => (
                          <span key={sIdx} style={{ background: 'rgba(0, 240, 255, 0.1)', color: 'var(--cyan)', border: '1px solid rgba(0, 240, 255, 0.2)', padding: '0.4rem 1rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 'bold' }}>{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* EXPERIENCE & CONTACT */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', marginBottom: '2rem' }}>
                    {emp.experience && (
                      <div>
                        <h4 className="text-white font-bold mb-2 uppercase tracking-wider text-sm">Experience</h4>
                        <div className="text-2xl font-bold text-gradient-gold">{emp.experience}</div>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="text-white font-bold mb-2 uppercase tracking-wider text-sm">Contact & Social</h4>
                      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', height: '32px' }}>
                        {emp.socialLinks?.linkedin && <a href={emp.socialLinks.linkedin} target="_blank" rel="noreferrer" style={{ color: '#fff', fontSize: '1.2rem', transition: 'color 0.3s', fontWeight: 'bold' }}>in</a>}
                        {emp.socialLinks?.twitter && <a href={emp.socialLinks.twitter} target="_blank" rel="noreferrer" style={{ color: '#fff', fontSize: '1.2rem', transition: 'color 0.3s', fontWeight: 'bold' }}>𝕏</a>}
                        {emp.socialLinks?.instagram && <a href={emp.socialLinks.instagram} target="_blank" rel="noreferrer" style={{ color: '#fff', fontSize: '1.2rem', transition: 'color 0.3s', fontWeight: 'bold' }}>IG</a>}
                        {emp.email && <a href={`mailto:${emp.email}`} style={{ color: 'var(--gold)', fontWeight: 'bold', textDecoration: 'none', borderBottom: '1px solid var(--gold)' }}>Email</a>}
                        {emp.phone && <a href={`tel:${emp.phone}`} style={{ color: 'var(--cyan)', fontWeight: 'bold', textDecoration: 'none', borderBottom: '1px solid var(--cyan)' }}>Call</a>}
                      </div>
                    </div>
                  </div>

                  {/* METRIC CARDS */}
                  {emp.cards && emp.cards.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginTop: '3rem' }}>
                      {emp.cards.map((card, cIdx) => (
                        <div key={cIdx} className="glass-morphism p-5 rounded-2xl border border-white-10 text-center transition-transform duration-300 hover:-translate-y-1 flex flex-col justify-center" style={{ background: 'rgba(20,20,30,0.8)' }}>
                          <div className={`text-white font-bold mb-1 ${card.title.length <= 4 ? 'text-3xl' : 'text-sm'}`} style={{ whiteSpace: 'pre-wrap' }}>{card.title}</div>
                          <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold" style={{ whiteSpace: 'pre-wrap' }}>{card.text}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* IMAGE COLUMN */}
                <div className={`about-image-wrapper relative order-1 ${idx % 2 !== 0 ? 'md:order-1' : 'md:order-2'}`}>
                  <div className="about-frame" style={{ borderRadius: '2rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', position: 'relative' }}>
                    <img src={emp.image || "/assets/jawad.png"} alt={emp.name} style={{ width: '100%', height: 'auto', display: 'block' }} />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 40%)' }}></div>
                    <div className="absolute bottom-6 left-6 right-6">
                       <div className="glass-morphism p-4 rounded-xl border border-white-10 flex items-center gap-4" style={{ background: 'rgba(20,20,30,0.7)', backdropFilter: 'blur(10px)' }}>
                         <div className="w-12 h-12 rounded-full flex items-center justify-center text-cyan text-xl border" style={{ background: 'rgba(0, 240, 255, 0.1)', borderColor: 'rgba(0, 240, 255, 0.3)' }}>★</div>
                         <div>
                           <div className="text-white font-bold text-lg">{emp.name}</div>
                           <div className="text-gold text-xs tracking-widest uppercase font-semibold">{emp.position}</div>
                         </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="section section-alt" id="services">
        <div className="container">
          <div className="section-header">
            <h2>Premium Digital <span className="text-gradient-cyan">Services</span></h2>
            <p>Everything you need to build a strong brand, attract local customers, and grow your business online.</p>
          </div>
          <div className="services-grid">
            {siteContent.services.map((srv, idx) => (
              <div key={idx} className={`glass-morphism glass-card-hover p-8 rounded-2xl border-t-4 ${srv.borderColor} relative overflow-hidden group`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${srv.gradientColor} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-xl bg-gray-900 flex items-center justify-center mb-6 border border-white-10">
                    <span className="text-2xl">{srv.icon}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{srv.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{srv.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HEALTHCARE SERVICES */}
      {siteContent.healthcareServices && siteContent.healthcareServices.length > 0 && (
        <section className="section" id="healthcare">
          <div className="container">
            <div className="section-header">
              <h2><span className="text-gradient-cyan">Healthcare &amp; Medical</span> Marketing</h2>
              <p>Specialized marketing services for hospitals, clinics, pharmacies, and healthcare businesses.</p>
            </div>
            <div className="services-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {siteContent.healthcareServices.map((srv, idx) => (
                <div key={idx} className={`glass-morphism glass-card-hover p-6 rounded-2xl border-t-4 ${srv.borderColor} relative overflow-hidden group`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${srv.gradientColor} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center mb-4 border border-white-10">
                      <span className="text-xl">{srv.icon}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{srv.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{srv.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS / PROVEN PROCESS */}
      <section className="section" id="process">
        <div className="container">
          <div className="section-header">
            <h2>Our Proven <span className="text-gradient-gold">Growth Process</span></h2>
            <p>We make it easy for local businesses to upgrade their brand and get more customers. No stress, just results.</p>
          </div>
          <div className="process-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', position: 'relative' }}>
            <div className="process-card glass-morphism p-8 rounded-2xl border-t-4 border-cyan text-center relative z-10 group transition-transform duration-300 hover:-translate-y-2">
              <div className="step-number" style={{ width: '50px', height: '50px', background: 'linear-gradient(135deg, var(--cyan), #0077FF)', borderRadius: '50%', color: '#fff', fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 0 15px rgba(0,240,255,0.4)' }}>1</div>
              <h3 className="text-xl font-bold text-white mb-3">Free Strategy Session</h3>
              <p className="text-sm text-gray-400">We analyze your current brand, website, and marketing to find hidden growth opportunities.</p>
            </div>
            
            <div className="process-card glass-morphism p-8 rounded-2xl border-t-4 border-gold text-center relative z-10 group transition-transform duration-300 hover:-translate-y-2">
              <div className="step-number" style={{ width: '50px', height: '50px', background: 'linear-gradient(135deg, var(--gold), #FF8C00)', borderRadius: '50%', color: '#fff', fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 0 15px rgba(255,215,0,0.4)' }}>2</div>
              <h3 className="text-xl font-bold text-white mb-3">Premium Design</h3>
              <p className="text-sm text-gray-400">Our expert team creates high-converting websites, flyers, and branding that outshines your competitors.</p>
            </div>
            
            <div className="process-card glass-morphism p-8 rounded-2xl border-t-4 border-green-500 text-center relative z-10 group transition-transform duration-300 hover:-translate-y-2" style={{ borderTopColor: '#10B981' }}>
              <div className="step-number" style={{ width: '50px', height: '50px', background: 'linear-gradient(135deg, #10B981, #059669)', borderRadius: '50%', color: '#fff', fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 0 15px rgba(16,185,129,0.4)' }}>3</div>
              <h3 className="text-xl font-bold text-white mb-3">Launch & Grow</h3>
              <p className="text-sm text-gray-400">We launch your new assets and deploy targeted marketing campaigns to bring you a flood of new clients.</p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <div className="glass-morphism inline-block p-8 rounded-3xl border border-white-10" style={{ background: 'rgba(0,190,255,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
              <h3 className="text-2xl font-bold text-white mb-3">Want to see what we can do for your business?</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">Get a free, no-obligation marketing audit today. We'll show you exactly how to get more clients.</p>
              <a href="#contact" className="btn-primary" style={{ padding: '0.8rem 2.5rem', fontSize: '1.1rem' }}>Claim Free Audit</a>
            </div>
          </div>
        </div>
      </section>

      {/* PORTFOLIO */}
      <section className="section section-alt" id="portfolio">
        <div className="container">
          <div className="section-header">
            <h2>Our Upgraded <span className="text-gradient-cyan">Portfolio</span></h2>
            <p>Browse through high-converting designs and modern responsive websites created for local brands.</p>
          </div>

          {/* Filter Categories */}
          <div className="portfolio-filters" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '3rem' }}>
            {categories.map((cat, idx) => (
              <button 
                key={idx} 
                className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
                style={{ 
                  background: activeCategory === cat ? 'linear-gradient(135deg, var(--cyan), #0077FF)' : 'var(--glass)',
                  color: activeCategory === cat ? 'var(--navy)' : '#cbd5e1',
                  border: '1px solid ' + (activeCategory === cat ? 'var(--cyan)' : 'var(--glass-border)'),
                  padding: '0.6rem 1.4rem', borderRadius: '99px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="portfolio-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {filteredPortfolio.map((item, idx) => (
              <div key={idx} className="glass-morphism rounded-2xl overflow-hidden group cursor-pointer border border-white-10 transition-transform duration-300 hover:-translate-y-2">
                <div className="h-56 w-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-black to-transparent z-10 opacity-70"></div>
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                </div>
                <div className="p-6 relative z-30">
                  <span className="text-gradient-gold text-xs font-bold uppercase tracking-widest mb-2 block">{item.category}</span>
                  <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE ME */}
      <section className="section" id="whyChooseMe" style={{ position: 'relative' }}>
        {/* Subtle Blue Glow Effect */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(0, 150, 255, 0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }}></div>
        
        <div className="container relative z-10">
          <div className="section-header text-center mb-16">
            <h2>Why Businesses Choose <span className="text-gradient-cyan">GD Production</span></h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto" style={{ marginTop: '1rem' }}>Trusted graphic design, website development, SEO and digital marketing services across the USA.</p>
          </div>

          {/* Statistics Row */}
          <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '4rem', textAlign: 'center' }}>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">100+</div>
              <div className="text-sm font-semibold text-cyan tracking-wider uppercase">Projects Completed</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">50+</div>
              <div className="text-sm font-semibold text-gold tracking-wider uppercase">Business Websites</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">300+</div>
              <div className="text-sm font-semibold text-cyan tracking-wider uppercase">Marketing Designs</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">5<span className="text-gold">★</span></div>
              <div className="text-sm font-semibold text-gold tracking-wider uppercase">Client Satisfaction</div>
            </div>
          </div>

          {/* 4-Card Grid */}
          <div className="premium-cards-grid">
            <style jsx>{`
              .premium-cards-grid {
                display: grid;
                gap: 24px;
              }
              .premium-card {
                background: rgba(20,20,30,0.8);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 24px;
                padding: 30px;
                text-align: center;
                transition: all 0.4s ease;
                display: flex;
                flex-direction: column;
                align-items: center;
                height: 100%;
              }
              .premium-card:hover {
                transform: translateY(-10px);
                border-color: rgba(0, 240, 255, 0.3);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 240, 255, 0.1);
              }
              .premium-icon-container {
                width: 50px;
                height: 50px;
                margin-bottom: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                color: var(--cyan);
                background: rgba(0, 240, 255, 0.1);
                border-radius: 12px;
                box-shadow: 0 0 15px rgba(0, 240, 255, 0.2);
              }
              .premium-card h3 {
                font-size: 28px;
                font-weight: 700;
                color: #ffffff;
                margin-bottom: 16px;
                line-height: 1.2;
              }
              .premium-card p {
                font-size: 16px;
                color: rgba(255,255,255,0.75);
                line-height: 1.8;
              }
              @media (min-width: 1024px) {
                .premium-cards-grid { grid-template-columns: repeat(3, 1fr); }
              }
              @media (min-width: 768px) and (max-width: 1023px) {
                .premium-cards-grid { grid-template-columns: repeat(2, 1fr); }
              }
              @media (max-width: 767px) {
                .premium-cards-grid { grid-template-columns: 1fr; }
              }
            `}</style>

            <div className="premium-card">
              <div className="premium-icon-container"><ShieldCheck size={28} strokeWidth={2} /></div>
              <h3>No Upfront Payment</h3>
              <p>Pay only after reviewing completed work.</p>
            </div>
            <div className="premium-card">
              <div className="premium-icon-container"><Zap size={28} strokeWidth={2} /></div>
              <h3>Fast Delivery</h3>
              <p>Quick turnaround for designs and websites.</p>
            </div>
            <div className="premium-card">
              <div className="premium-icon-container"><PenTool size={28} strokeWidth={2} /></div>
              <h3>Professional Quality</h3>
              <p>Premium branding and high-converting designs.</p>
            </div>
            <div className="premium-card">
              <div className="premium-icon-container"><MapPin size={28} strokeWidth={2} /></div>
              <h3>Local Business Expertise</h3>
              <p>Specialized marketing for USA local businesses.</p>
            </div>
            <div className="premium-card">
              <div className="premium-icon-container"><Headphones size={28} strokeWidth={2} /></div>
              <h3>Dedicated Support</h3>
              <p>Direct communication and ongoing assistance.</p>
            </div>
            <div className="premium-card">
              <div className="premium-icon-container"><BarChart size={28} strokeWidth={2} /></div>
              <h3>Results Focused</h3>
              <p>Designed to generate leads and customers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HEALTHCARE TESTIMONIALS */}
      {siteContent.healthcareTestimonials && siteContent.healthcareTestimonials.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <h2>Healthcare Client <span className="text-gradient-cyan">Success Stories</span></h2>
              <p>See how we've helped medical practices and pharmacies grow.</p>
            </div>
            <div className="testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              {siteContent.healthcareTestimonials.map((t, idx) => (
                <div key={idx} className="glass-morphism p-8 rounded-2xl border border-white-5 relative flex flex-col justify-between">
                  <div>
                    <div className="star-row mb-4" style={{ color: 'var(--cyan)', fontSize: '1.1rem' }}>
                      {Array.from({ length: t.rating }).map((_, i) => <span key={i}>★</span>)}
                    </div>
                    <p className="text-gray-300 italic mb-6">"{t.text}"</p>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg mb-1">{t.author}</h4>
                    <p className="text-xs text-gold tracking-wide font-semibold">{t.business}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CLIENT TESTIMONIALS */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <h2>What Our <span className="text-gradient-gold">Clients Say</span></h2>
            <p>Read review feedback from local businesses who trust GD Production for graphic design and marketing.</p>
          </div>
          <div className="testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {siteContent.testimonials.map((t, idx) => (
              <div key={idx} className="glass-morphism p-8 rounded-2xl border border-white-5 relative flex flex-col justify-between">
                <div>
                  <div className="star-row mb-4" style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>
                    {Array.from({ length: t.rating }).map((_, i) => <span key={i}>★</span>)}
                  </div>
                  <p className="text-gray-300 italic mb-6">"{t.text}"</p>
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg mb-1">{t.author}</h4>
                  <p className="text-xs text-cyan tracking-wide font-semibold">{t.business}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="section cta-section" style={{ background: 'linear-gradient(180deg, var(--black) 0%, rgba(0, 240, 255, 0.05) 50%, var(--black) 100%)' }}>
        <div className="container text-center max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">{siteContent.healthcareCta ? siteContent.healthcareCta.title : "Ready To Grow Your Business?"}</h2>
          <p className="text-lg text-muted mb-8">{siteContent.healthcareCta ? siteContent.healthcareCta.subtitle : "Let's build a premium website, optimize your Google Maps ranking, or launch high-converting marketing designs. Remember, you see the work first before you pay."}</p>
          <a href="#contact" className="btn-gold" style={{ padding: '1.2rem 3rem', fontSize: '1.1rem', background: 'linear-gradient(135deg, #00F0FF, #0066cc)', color: '#fff', border: 'none', boxShadow: '0 8px 24px rgba(0,240,255,0.4)' }}>Request Free Quote</a>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="section section-alt" style={{ borderBottom: '1px solid var(--glass-border)' }}>
        <div className="container max-w-xl text-center glass-card p-10 border border-white-5" style={{ borderRadius: '2rem' }}>
          <h3 className="text-3xl font-bold text-white mb-2">Stay Updated</h3>
          <p className="text-muted text-sm mb-6">Get marketing tips, website updates and business growth ideas delivered directly to your inbox.</p>
          <form className="newsletter-form" onSubmit={handleNewsletterSubmit} style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="email" 
              placeholder="Enter your email address" 
              required 
              value={newsletterEmail} 
              onChange={(e) => setNewsletterEmail(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', padding: '0.8rem 1.2rem', borderRadius: '30px', color: '#fff', flex: 1, outline: 'none' }}
            />
            <button 
              type="submit" 
              disabled={submittingNewsletter}
              style={{ background: 'linear-gradient(135deg, var(--cyan), #0077FF)', color: 'var(--navy)', fontWeight: 'bold', padding: '0.8rem 2rem', borderRadius: '30px', border: 'none', cursor: 'pointer' }}
            >
              {submittingNewsletter ? '...' : 'Subscribe'}
            </button>
          </form>
        </div>
      </section>

      {/* CONTACT */}
      <section className="section" id="contact">
        <div className="container">
          <div className="contact-grid">
            <div>
              <h2>Ready to grow your business?<br/><span className="text-gradient-gold">Let's work together.</span></h2>
              <p className="text-muted-light">Fill out the form below to request a free consultation. Remember, there's no upfront pressure — we believe in building trust first.</p>
              <div className="contact-info">
                <div className="contact-item">
                  <div className="contact-icon blue">✉</div>
                  <div>
                    <p className="text-sm text-muted">Send an email</p>
                    <p className="fw-700 text-white">
                      <a href={`mailto:${siteContent.contactEmail}`} style={{ transition: 'color 0.3s' }} onMouseOver={(e) => e.target.style.color = 'var(--cyan)'} onMouseOut={(e) => e.target.style.color = 'inherit'}>
                        {siteContent.contactEmail}
                      </a>
                    </p>
                  </div>
                </div>
                {siteContent.contactPhone && (
                  <div className="contact-item" style={{ marginTop: '1.5rem' }}>
                    <div className="contact-icon blue" style={{ background: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold)' }}>📞</div>
                    <div>
                      <p className="text-sm text-muted">Give us a call</p>
                      <p className="fw-700 text-white">
                        <a href={`tel:${siteContent.contactPhone}`} style={{ transition: 'color 0.3s' }} onMouseOver={(e) => e.target.style.color = 'var(--gold)'} onMouseOut={(e) => e.target.style.color = 'inherit'}>
                          {siteContent.contactPhone}
                        </a>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <form className="contact-form glass-card" onSubmit={handleContactSubmit}>
                <div className="form-row">
                  <div className="form-group"><label>Name</label><input type="text" name="name" placeholder="John Doe" required value={contactData.name} onChange={(e) => setContactData({ ...contactData, name: e.target.value })} /></div>
                  <div className="form-group"><label>Business Name</label><input type="text" name="business_name" placeholder="Your Business LLC" value={contactData.business_name} onChange={(e) => setContactData({ ...contactData, business_name: e.target.value })} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Email</label><input type="email" name="email" placeholder="john@example.com" required value={contactData.email} onChange={(e) => setContactData({ ...contactData, email: e.target.value })} /></div>
                  <div className="form-group"><label>Phone Number <span style={{ opacity: 0.5, fontWeight: 'normal', fontSize: '0.8rem' }}>(Optional)</span></label><input type="tel" name="phone" placeholder="(555) 123-4567" value={contactData.phone || ''} onChange={(e) => setContactData({ ...contactData, phone: e.target.value })} /></div>
                </div>
                <div className="form-group"><label>Service Needed</label>
                  <select name="service" value={contactData.service} onChange={(e) => setContactData({ ...contactData, service: e.target.value })}>
                    <option value="" disabled>Select a service</option>
                    <option>Graphic Design</option>
                    <option>Website Development</option>
                    <option>Social Media Marketing</option>
                    <option>Google Maps Ranking</option>
                    <option>Full Business Growth Package</option>
                  </select>
                </div>
                <div className="form-group"><label>Message</label><textarea name="message" rows="4" placeholder="Tell me about your business goals..." required value={contactData.message} onChange={(e) => setContactData({ ...contactData, message: e.target.value })}></textarea></div>
                <div className="form-buttons">
                  <button type="submit" disabled={submittingContact} className="btn-primary flex-1">{submittingContact ? 'Sending...' : 'Book Free Consultation'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="footer-logo"><img src="/assets/logo.jpg" alt="GD Production Logo" className="logo-img-sm" style={{ height: '65px', borderRadius: '50%', marginBottom: '1rem', boxShadow: '0 0 15px rgba(0, 240, 255, 0.2)' }} /></div>
              <p className="text-sm text-muted">Premium agency services for local businesses across the USA.</p>
            </div>
            <div>
              <h4>Quick Links</h4>
              <ul>
                <li><a href="#">Home</a></li>
                <li><a href="#about">About Me</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#portfolio">My Work</a></li>
              </ul>
            </div>
            <div>
              <h4>Contact Info</h4>
              <ul>
                <li>✉ <a href={`mailto:${siteContent.contactEmail}`} style={{ transition: 'color 0.3s' }} onMouseOver={(e) => e.target.style.color = 'var(--gold)'} onMouseOut={(e) => e.target.style.color = 'inherit'}>{siteContent.contactEmail}</a></li>
                {siteContent.contactPhone && (
                  <li>📞 <a href={`tel:${siteContent.contactPhone}`} style={{ transition: 'color 0.3s' }} onMouseOver={(e) => e.target.style.color = 'var(--gold)'} onMouseOut={(e) => e.target.style.color = 'inherit'}>{siteContent.contactPhone}</a></li>
                )}
                <li>📍 Serving all 50 States, USA</li>
              </ul>
            </div>
            <div>
              <h4>Newsletter</h4>
              <p className="text-sm text-muted">Subscribe for marketing tips &amp; tricks.</p>
              <form onSubmit={handleNewsletterSubmit} className="newsletter-form"><input type="email" placeholder="Your email" required value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} /><button type="submit">Join</button></form>
            </div>
          </div>
          <div className="footer-divider"></div>
          <div className="footer-bottom">
            <p>© 2026 {siteContent.companyName}. All rights reserved.</p>
            <div><a href="#">Privacy Policy</a><a href="#">Terms of Service</a></div>
          </div>
        </div>
      </footer>

      {/* TOAST SYSTEM */}
      <div className={`toast-notification ${toastVisible ? 'show' : ''}`} id="emailToast">
        {toastMessage}
      </div>

      {/* EMAIL FLOAT BUTTON */}
      <a href={`mailto:${siteContent.contactEmail}`} onClick={handleEmailFloatClick} className="email-float" aria-label="Email Us" style={{ cursor: 'pointer' }}>
        <span>📧 Email Us</span>
      </a>
    </>
  );
}

export async function getServerSideProps() {
  const filePath = path.join(process.cwd(), 'data', 'site_content.json');
  const fileData = fs.readFileSync(filePath, 'utf8');
  const siteContent = JSON.parse(fileData);
  return {
    props: {
      siteContent
    }
  };
}
