// pages/admin.js
import React, { useState, useEffect } from 'react';
import Head from 'next/head';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [submittingLogin, setSubmittingLogin] = useState(false);
  
  // Data State
  const [siteContent, setSiteContent] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Portfolio addition state
  const [newProject, setNewProject] = useState({ title: '', category: 'Restaurants', description: '', image: '' });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Authenticate user check on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/get-data');
      if (response.ok) {
        const data = await response.json();
        setSiteContent(data.siteContent);
        setSubscribers(data.subscribers || []);
        setLeads(data.leads || []);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setSubmittingLogin(true);
    setLoginError('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (response.ok) {
        setPassword('');
        fetchData();
      } else {
        const errData = await response.json();
        setLoginError(errData.error || 'Invalid password');
      }
    } catch (error) {
      setLoginError('Error connecting to login endpoint.');
    } finally {
      setSubmittingLogin(false);
    }
  };

  // Base64 file upload helper
  const handleFileUpload = async (e, fieldSetter) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result;
      try {
        const res = await fetch('/api/admin/upload-portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64, filename: file.name })
        });
        const data = await res.json();
        if (res.ok) {
          fieldSetter(data.imageUrl);
          alert('Image uploaded successfully to: ' + data.imageUrl);
        } else {
          alert('Upload failed: ' + data.error);
        }
      } catch (err) {
        console.error(err);
        alert('Upload connection error.');
      } finally {
        setUploadingImage(false);
      }
    };
  };

  // Save all changes back to JSON store
  const handleSaveAll = async () => {
    // Validation for discounts
    if (siteContent.discountOffers) {
      for (let i = 0; i < siteContent.discountOffers.length; i++) {
        const d = siteContent.discountOffers[i];
        if (!d.discountValue || isNaN(d.discountValue)) {
          alert(`Discount Offer #${i + 1}: Discount value cannot be empty and must be a valid number.`);
          return;
        }
        if (isNaN(d.originalPrice) || isNaN(d.finalPrice)) {
          alert(`Discount Offer #${i + 1}: Price fields must be valid numbers.`);
          return;
        }
        if (d.endDate && d.startDate && new Date(d.endDate) < new Date(d.startDate)) {
          alert(`Discount Offer #${i + 1}: End date cannot be before start date.`);
          return;
        }
      }
    }

    setSaving(true);
    setSaveMessage('');
    try {
      const response = await fetch('/api/admin/save-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteContent })
      });
      const data = await response.json();
      if (response.ok) {
        setSaveMessage('✅ Changes saved successfully!');
        setTimeout(() => setSaveMessage(''), 4000);
      } else {
        setSaveMessage(`❌ Save failed: ${data.error || 'Server error'}`);
      }
    } catch (error) {
      setSaveMessage('❌ Error connecting to server.');
    } finally {
      setSaving(false);
    }
  };

  // Discount Handlers
  const handleAddDiscount = () => {
    const newDiscount = {
      title: 'New Discount Offer',
      discountType: 'percentage',
      discountValue: 10,
      originalPrice: 100,
      finalPrice: 90,
      description: 'A great offer for a limited time.',
      badgeText: 'Limited Time Offer',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true,
      ctaText: 'Claim Offer',
      ctaLink: '#contact'
    };
    setSiteContent({ ...siteContent, discountOffers: [...(siteContent.discountOffers || []), newDiscount] });
  };

  const handleDeleteDiscount = (idxToDelete) => {
    const updated = (siteContent.discountOffers || []).filter((_, idx) => idx !== idxToDelete);
    setSiteContent({ ...siteContent, discountOffers: updated });
  };

  const handleDiscountChange = (idx, field, value) => {
    const updated = [...(siteContent.discountOffers || [])];
    updated[idx] = { ...updated[idx], [field]: value };
    setSiteContent({ ...siteContent, discountOffers: updated });
  };

  // Portfolio Handlers
  const handleAddProject = () => {
    if (!newProject.title || !newProject.image) {
      alert('Please provide a project title and image URL/upload.');
      return;
    }
    const updatedPortfolio = [...siteContent.portfolio, newProject];
    setSiteContent({ ...siteContent, portfolio: updatedPortfolio });
    setNewProject({ title: '', category: 'Restaurants', description: '', image: '' });
  };

  const handleDeleteProject = (idxToDelete) => {
    const updatedPortfolio = siteContent.portfolio.filter((_, idx) => idx !== idxToDelete);
    setSiteContent({ ...siteContent, portfolio: updatedPortfolio });
  };

  // Testimonials Handler
  const handleAddTestimonial = () => {
    const newTestimonial = { author: '', business: '', rating: 5, text: '' };
    setSiteContent({ ...siteContent, testimonials: [...siteContent.testimonials, newTestimonial] });
  };
  const handleDeleteTestimonial = (idxToDelete) => {
    const updated = siteContent.testimonials.filter((_, idx) => idx !== idxToDelete);
    setSiteContent({ ...siteContent, testimonials: updated });
  };
  const handleTestimonialChange = (idx, field, value) => {
    const updatedTestimonials = [...siteContent.testimonials];
    updatedTestimonials[idx] = { ...updatedTestimonials[idx], [field]: value };
    setSiteContent({ ...siteContent, testimonials: updatedTestimonials });
  };

  // Services Handler
  const handleAddService = () => {
    const newService = { icon: '✨', title: 'New Service', description: '' };
    setSiteContent({ ...siteContent, services: [...siteContent.services, newService] });
  };
  const handleDeleteService = (idxToDelete) => {
    const updated = siteContent.services.filter((_, idx) => idx !== idxToDelete);
    setSiteContent({ ...siteContent, services: updated });
  };
  const handleServiceChange = (idx, field, value) => {
    const updatedServices = [...siteContent.services];
    updatedServices[idx] = { ...updatedServices[idx], [field]: value };
    setSiteContent({ ...siteContent, services: updatedServices });
  };

  // Healthcare Services Handler
  const handleAddHealthcareService = () => {
    const newService = { icon: '🏥', title: 'New Healthcare Service', description: '' };
    setSiteContent({ ...siteContent, healthcareServices: [...(siteContent.healthcareServices || []), newService] });
  };
  const handleDeleteHealthcareService = (idxToDelete) => {
    const updated = siteContent.healthcareServices.filter((_, idx) => idx !== idxToDelete);
    setSiteContent({ ...siteContent, healthcareServices: updated });
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--black)' }}>
        <Head>
          <title>Admin Login | GD Production</title>
        </Head>
        <div className="glass-card max-w-sm w-full p-8 border border-white-10" style={{ borderRadius: '1.5rem', textAlign: 'center' }}>
          <h2 className="text-3xl font-bold mb-6 text-white">Admin Login</h2>
          {loginError && <p className="text-sm text-red-400 mb-4" style={{ color: '#FF4136', fontWeight: 'bold' }}>{loginError}</p>}
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }}
              />
            </div>
            <button 
              type="submit" 
              disabled={submittingLogin}
              style={{ width: '100%', padding: '1rem', borderRadius: '99px', background: 'linear-gradient(135deg, var(--cyan), #0077FF)', color: 'var(--navy)', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '1rem' }}
            >
              {submittingLogin ? 'Authenticating...' : 'Sign In'}
            </button>
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); alert('The default admin password is GDProduction2026.\n\nIf you changed it, please check the ADMIN_PASSWORD variable in your .env file.'); }} 
                style={{ color: 'var(--cyan)', fontSize: '0.9rem', textDecoration: 'none' }}
              >
                Forgot Password?
              </a>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!siteContent) {
    return <div style={{ color: '#fff', textAlign: 'center', padding: '50px' }}>Loading Database Content...</div>;
  }

  return (
    <div className="admin-dashboard-container" style={{ background: 'var(--black)', minHeight: '100vh', color: '#fff', padding: '3rem 1rem' }}>
      <Head>
        <title>Admin Dashboard | GD Production</title>
      </Head>
      
      <div className="container">
        <div className="flex justify-between items-center mb-8 flex-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">GD Production Admin Dashboard</h1>
            <p className="text-sm text-muted">Update landing page, testimonials, portfolio items, and view subscribers.</p>
          </div>
          <div>
            <button 
              onClick={handleSaveAll}
              disabled={saving}
              style={{ padding: '0.8rem 2rem', borderRadius: '30px', background: 'linear-gradient(135deg, var(--gold), #b8952a)', color: 'var(--navy)', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(212,175,55,0.3)' }}
            >
              {saving ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        </div>

        {saveMessage && (
          <div className="p-4 rounded-xl mb-6 text-center" style={{ background: saveMessage.includes('✅') ? 'rgba(46,204,113,0.15)' : 'rgba(231,76,60,0.15)', border: '1px solid ' + (saveMessage.includes('✅') ? '#2ecc71' : '#e74c3c'), color: saveMessage.includes('✅') ? '#2ecc71' : '#e74c3c', fontWeight: 'bold' }}>
            {saveMessage}
          </div>
        )}

        {/* Dashboard Tabs Grid */}
        <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem' }}>
          
          {/* Sidebar Tabs */}
          <div className="admin-sidebar glass-card p-6 border border-white-5" style={{ borderRadius: '1.5rem', height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {['overview', 'hero', 'team', 'services', 'healthcare', 'discounts', 'portfolio', 'testimonials', 'subscribers', 'leads', 'settings'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  textAlign: 'left',
                  padding: '0.8rem 1.2rem',
                  borderRadius: '10px',
                  background: activeTab === tab ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
                  color: activeTab === tab ? 'var(--cyan)' : '#cbd5e1',
                  border: '1px solid ' + (activeTab === tab ? 'rgba(0, 240, 255, 0.2)' : 'transparent'),
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  textTransform: 'capitalize'
                }}
              >
                {tab === 'subscribers' ? 'Subscribers 📬' : tab === 'healthcare' ? 'Healthcare 🩺' : tab === 'discounts' ? 'Discounts 🏷️' : tab === 'leads' ? 'Leads 📥' : tab === 'overview' ? 'Overview 📊' : tab === 'team' ? 'Team 👥' : tab}
              </button>
            ))}
          </div>

          {/* Main Editing Panel */}
          <div className="admin-main glass-card p-8 border border-white-5" style={{ borderRadius: '1.5rem' }}>
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-2xl font-bold mb-6 text-cyan border-b border-white-10 pb-3">Dashboard Overview</h3>
                
                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                  <div className="glass-card p-6" style={{ borderRadius: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                    <p style={{ color: 'var(--muted)', fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Leads</p>
                    <h4 style={{ color: '#fff', fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>{leads.length}</h4>
                  </div>
                  <div className="glass-card p-6" style={{ borderRadius: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                    <p style={{ color: 'var(--muted)', fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Subscribers</p>
                    <h4 style={{ color: 'var(--cyan)', fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>{subscribers.length}</h4>
                  </div>
                  <div className="glass-card p-6" style={{ borderRadius: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                    <p style={{ color: 'var(--muted)', fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Portfolio Size</p>
                    <h4 style={{ color: 'var(--gold)', fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>{siteContent.portfolio?.length || 0}</h4>
                  </div>
                  <div className="glass-card p-6" style={{ borderRadius: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                    <p style={{ color: 'var(--muted)', fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Testimonials</p>
                    <h4 style={{ color: '#fff', fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>{siteContent.testimonials?.length || 0}</h4>
                  </div>
                </div>

                {/* Recent Activity */}
                <h4 className="text-xl font-bold mb-4 text-white">Recent Leads</h4>
                {leads.length === 0 ? (
                  <p className="text-muted mb-6">No contact leads yet.</p>
                ) : (
                  <div className="mb-6" style={{ borderRadius: '1rem', border: '1px solid var(--glass-border)', overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <tr style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                          <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--glass-border)' }}>Name</th>
                          <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--glass-border)' }}>Service</th>
                          <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--glass-border)' }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.slice().reverse().slice(0, 3).map((lead, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem' }}>
                            <td style={{ padding: '12px 16px', color: '#fff', fontWeight: 'bold' }}>{lead.name}</td>
                            <td style={{ padding: '12px 16px', color: 'var(--cyan)' }}>{lead.service || 'N/A'}</td>
                            <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{new Date(lead.submittedAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {/* Quick Actions */}
                <h4 className="text-xl font-bold mb-4 text-white mt-8">Quick Actions</h4>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button onClick={() => setActiveTab('portfolio')} style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', background: 'rgba(0,240,255,0.1)', color: 'var(--cyan)', border: '1px solid rgba(0,240,255,0.2)', cursor: 'pointer', fontWeight: 'bold' }}>Manage Portfolio</button>
                  <button onClick={() => setActiveTab('leads')} style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', background: 'rgba(212,175,55,0.1)', color: 'var(--gold)', border: '1px solid rgba(212,175,55,0.2)', cursor: 'pointer', fontWeight: 'bold' }}>View All Leads</button>
                  <button onClick={() => window.open('/', '_blank')} style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontWeight: 'bold' }}>View Live Site ↗</button>
                </div>
              </div>
            )}

            {/* HERO TAB */}
            {activeTab === 'hero' && (
              <div>
                <h3 className="text-2xl font-bold mb-6 text-cyan border-b border-white-10 pb-3">Edit Hero Section</h3>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Hero Badge Text</label>
                  <input type="text" value={siteContent.hero.badge} onChange={(e) => setSiteContent({ ...siteContent, hero: { ...siteContent.hero, badge: e.target.value } })} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                </div>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Hero Main Title</label>
                  <textarea rows="2" value={siteContent.hero.title} onChange={(e) => setSiteContent({ ...siteContent, hero: { ...siteContent.hero, title: e.target.value } })} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none', fontFamily: 'inherit' }}></textarea>
                </div>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Hero Subtitle</label>
                  <textarea rows="3" value={siteContent.hero.subtitle} onChange={(e) => setSiteContent({ ...siteContent, hero: { ...siteContent.hero, subtitle: e.target.value } })} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none', fontFamily: 'inherit' }}></textarea>
                </div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Primary CTA Text</label>
                    <input type="text" value={siteContent.hero.primaryCta} onChange={(e) => setSiteContent({ ...siteContent, hero: { ...siteContent.hero, primaryCta: e.target.value } })} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Secondary CTA Text</label>
                    <input type="text" value={siteContent.hero.secondaryCta} onChange={(e) => setSiteContent({ ...siteContent, hero: { ...siteContent.hero, secondaryCta: e.target.value } })} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                  </div>
                </div>
              </div>
            )}

            {/* TEAM TAB */}
            {activeTab === 'team' && (
              <div>
                <div className="flex justify-between items-center mb-6 border-b border-white-10 pb-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="text-2xl font-bold text-cyan" style={{ margin: 0 }}>Team & Employees</h3>
                  <button onClick={() => {
                    const newEmp = {
                      id: Date.now(), name: 'New Employee', position: 'Position', image: '', bio: '', skills: [], experience: '', email: '', phone: '', socialLinks: { linkedin: '', twitter: '', instagram: '' }, isVisible: true, cards: []
                    };
                    setSiteContent({ ...siteContent, employees: [...(siteContent.employees || []), newEmp] });
                  }} style={{ padding: '0.5rem 1rem', borderRadius: '10px', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--cyan)', fontWeight: 'bold', border: '1px solid rgba(0, 240, 255, 0.2)', cursor: 'pointer' }}>+ Add Employee</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                  {siteContent.employees?.map((emp, idx) => (
                    <div key={emp.id || idx} className="p-6 rounded-2xl border border-white-10" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className="flex justify-between items-center mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 className="text-white font-bold text-lg">Employee #{idx + 1}</h4>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => {
                            if(idx === 0) return;
                            const updated = [...siteContent.employees];
                            const temp = updated[idx-1];
                            updated[idx-1] = updated[idx];
                            updated[idx] = temp;
                            setSiteContent({ ...siteContent, employees: updated });
                          }} style={{ padding: '0.4rem 0.8rem', background: 'var(--glass)', color: '#fff', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.5 : 1 }}>↑ Up</button>
                          
                          <button onClick={() => {
                            if(idx === siteContent.employees.length - 1) return;
                            const updated = [...siteContent.employees];
                            const temp = updated[idx+1];
                            updated[idx+1] = updated[idx];
                            updated[idx] = temp;
                            setSiteContent({ ...siteContent, employees: updated });
                          }} style={{ padding: '0.4rem 0.8rem', background: 'var(--glass)', color: '#fff', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: idx === siteContent.employees.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === siteContent.employees.length - 1 ? 0.5 : 1 }}>↓ Down</button>
                        </div>
                      </div>

                      <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                        <div className="form-group">
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Name <span style={{color: 'red'}}>*</span></label>
                          <input type="text" value={emp.name} onChange={(e) => { const updated = [...siteContent.employees]; updated[idx].name = e.target.value; setSiteContent({ ...siteContent, employees: updated }); }} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                        </div>
                        <div className="form-group">
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Position / Designation</label>
                          <input type="text" value={emp.position} onChange={(e) => { const updated = [...siteContent.employees]; updated[idx].position = e.target.value; setSiteContent({ ...siteContent, employees: updated }); }} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Profile Image URL</label>
                        <input type="text" value={emp.image} onChange={(e) => { const updated = [...siteContent.employees]; updated[idx].image = e.target.value; setSiteContent({ ...siteContent, employees: updated }); }} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none', marginBottom: '0.5rem' }} />
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <input type="file" accept="image/*" disabled={uploadingImage} onChange={(e) => handleFileUpload(e, (url) => { const updated = [...siteContent.employees]; updated[idx].image = url; setSiteContent({ ...siteContent, employees: updated }); })} />
                          {emp.image && <img src={emp.image} alt="Preview" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50%', border: '2px solid var(--cyan)' }} />}
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Short Bio</label>
                        <textarea rows="4" value={emp.bio} onChange={(e) => { const updated = [...siteContent.employees]; updated[idx].bio = e.target.value; setSiteContent({ ...siteContent, employees: updated }); }} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none', fontFamily: 'inherit' }}></textarea>
                      </div>

                      <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                        <div className="form-group">
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Skills (Comma Separated)</label>
                          <input type="text" value={emp.skills?.join(', ') || ''} onChange={(e) => { const updated = [...siteContent.employees]; updated[idx].skills = e.target.value.split(',').map(s => s.trim()).filter(s => s); setSiteContent({ ...siteContent, employees: updated }); }} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} placeholder="e.g. SEO, Web Design, Marketing" />
                        </div>
                        <div className="form-group">
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Experience</label>
                          <input type="text" value={emp.experience || ''} onChange={(e) => { const updated = [...siteContent.employees]; updated[idx].experience = e.target.value; setSiteContent({ ...siteContent, employees: updated }); }} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} placeholder="e.g. 5+ Years" />
                        </div>
                      </div>

                      <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                        <div className="form-group">
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Email Address</label>
                          <input type="email" value={emp.email || ''} onChange={(e) => { const updated = [...siteContent.employees]; updated[idx].email = e.target.value; setSiteContent({ ...siteContent, employees: updated }); }} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                        </div>
                        <div className="form-group">
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Phone Number (Optional)</label>
                          <input type="tel" value={emp.phone || ''} onChange={(e) => { const updated = [...siteContent.employees]; updated[idx].phone = e.target.value; setSiteContent({ ...siteContent, employees: updated }); }} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                        </div>
                      </div>
                      
                      <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="form-group">
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>LinkedIn URL</label>
                          <input type="text" value={emp.socialLinks?.linkedin || ''} onChange={(e) => { const updated = [...siteContent.employees]; updated[idx].socialLinks = { ...updated[idx].socialLinks, linkedin: e.target.value }; setSiteContent({ ...siteContent, employees: updated }); }} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                        </div>
                        <div className="form-group">
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Twitter URL</label>
                          <input type="text" value={emp.socialLinks?.twitter || ''} onChange={(e) => { const updated = [...siteContent.employees]; updated[idx].socialLinks = { ...updated[idx].socialLinks, twitter: e.target.value }; setSiteContent({ ...siteContent, employees: updated }); }} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                        </div>
                        <div className="form-group">
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Instagram URL</label>
                          <input type="text" value={emp.socialLinks?.instagram || ''} onChange={(e) => { const updated = [...siteContent.employees]; updated[idx].socialLinks = { ...updated[idx].socialLinks, instagram: e.target.value }; setSiteContent({ ...siteContent, employees: updated }); }} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                        </div>
                      </div>

                      <div className="flex justify-between items-center mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)' }}>Metric Cards (Optional)</label>
                        <button onClick={() => { const updated = [...siteContent.employees]; updated[idx].cards = [...(updated[idx].cards || []), { title: 'New', text: 'Card' }]; setSiteContent({ ...siteContent, employees: updated }); }} style={{ padding: '0.3rem 0.8rem', borderRadius: '8px', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--cyan)', fontWeight: 'bold', border: '1px solid rgba(0, 240, 255, 0.2)', cursor: 'pointer', fontSize: '0.8rem' }}>+ Add Card</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        {emp.cards?.map((card, cIdx) => (
                          <div key={cIdx} className="p-3 rounded-lg border border-white-5 flex gap-4 items-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                            <input type="text" placeholder="Title" value={card.title} onChange={(e) => { const updated = [...siteContent.employees]; updated[idx].cards[cIdx].title = e.target.value; setSiteContent({ ...siteContent, employees: updated }); }} style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', outline: 'none', borderBottom: '1px solid var(--glass-border)' }} />
                            <input type="text" placeholder="Text" value={card.text} onChange={(e) => { const updated = [...siteContent.employees]; updated[idx].cards[cIdx].text = e.target.value; setSiteContent({ ...siteContent, employees: updated }); }} style={{ flex: 2, background: 'transparent', border: 'none', color: '#fff', outline: 'none', borderBottom: '1px solid var(--glass-border)' }} />
                            <button onClick={() => { const updated = [...siteContent.employees]; updated[idx].cards = updated[idx].cards.filter((_, i) => i !== cIdx); setSiteContent({ ...siteContent, employees: updated }); }} style={{ color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#fff', fontWeight: 'bold' }}>
                          <input type="checkbox" checked={emp.isVisible} onChange={(e) => { const updated = [...siteContent.employees]; updated[idx].isVisible = e.target.checked; setSiteContent({ ...siteContent, employees: updated }); }} style={{ width: '20px', height: '20px', accentColor: 'var(--cyan)' }} />
                          Show Employee on Website
                        </label>
                        <button onClick={() => { const updated = siteContent.employees.filter((_, i) => i !== idx); setSiteContent({ ...siteContent, employees: updated }); }} style={{ background: 'rgba(231,76,60,0.1)', color: '#e74c3c', border: '1px solid rgba(231,76,60,0.2)', padding: '0.5rem 1.5rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>Delete Employee</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SERVICES TAB */}
            {activeTab === 'services' && (
              <div>
                <div className="flex justify-between items-center mb-6 border-b border-white-10 pb-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="text-2xl font-bold text-cyan" style={{ margin: 0 }}>Edit Services Section</h3>
                  <button onClick={handleAddService} style={{ padding: '0.5rem 1rem', borderRadius: '10px', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--cyan)', fontWeight: 'bold', border: '1px solid rgba(0, 240, 255, 0.2)', cursor: 'pointer' }}>+ Add Service</button>
                </div>
                {siteContent.services.map((srv, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-white-5 mb-4" style={{ background: 'rgba(255,255,255,0.01)' }}>
                    <h4 className="text-white font-bold mb-3">Service #{idx + 1}</h4>
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Icon</label>
                        <input type="text" value={srv.icon} onChange={(e) => handleServiceChange(idx, 'icon', e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none', textAlign: 'center' }} />
                      </div>
                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Title</label>
                        <input type="text" value={srv.title} onChange={(e) => handleServiceChange(idx, 'title', e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Description</label>
                      <textarea rows="2" value={srv.description} onChange={(e) => handleServiceChange(idx, 'description', e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none', fontFamily: 'inherit' }}></textarea>
                    </div>
                    <button onClick={() => handleDeleteService(idx)} style={{ background: 'rgba(231,76,60,0.1)', color: '#e74c3c', border: '1px solid rgba(231,76,60,0.2)', padding: '0.4rem 1rem', borderRadius: '10px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>Remove Service</button>
                  </div>
                ))}
              </div>
            )}

            {/* DISCOUNTS TAB */}
            {activeTab === 'discounts' && (
              <div>
                <div className="flex justify-between items-center mb-6 border-b border-white-10 pb-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="text-2xl font-bold text-cyan" style={{ margin: 0 }}>Discount Offers</h3>
                  <button onClick={handleAddDiscount} style={{ padding: '0.5rem 1rem', borderRadius: '10px', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--cyan)', fontWeight: 'bold', border: '1px solid rgba(0, 240, 255, 0.2)', cursor: 'pointer' }}>+ Add Discount Offer</button>
                </div>
                {(siteContent.discountOffers || []).map((discount, idx) => (
                  <div key={idx} className="p-6 rounded-2xl border border-white-5 mb-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-white-5" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 className="text-white font-bold text-lg">Offer #{idx + 1}</h4>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#fff', fontWeight: 'bold' }}>
                        <input type="checkbox" checked={discount.isActive} onChange={(e) => handleDiscountChange(idx, 'isActive', e.target.checked)} style={{ width: '20px', height: '20px', accentColor: 'var(--cyan)' }} />
                        Active on Website
                      </label>
                    </div>
                    
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Offer Title <span style={{color: 'red'}}>*</span></label>
                        <input type="text" value={discount.title} onChange={(e) => handleDiscountChange(idx, 'title', e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                      </div>
                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Badge Text (e.g. "Limited Time")</label>
                        <input type="text" value={discount.badgeText} onChange={(e) => handleDiscountChange(idx, 'badgeText', e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                      </div>
                    </div>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Discount Type</label>
                        <select value={discount.discountType} onChange={(e) => handleDiscountChange(idx, 'discountType', e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }}>
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount ($)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Discount Value <span style={{color: 'red'}}>*</span></label>
                        <input type="number" value={discount.discountValue} onChange={(e) => handleDiscountChange(idx, 'discountValue', e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                      </div>
                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Original Price ($)</label>
                        <input type="number" value={discount.originalPrice} onChange={(e) => handleDiscountChange(idx, 'originalPrice', e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                      </div>
                    </div>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Final/Discounted Price ($)</label>
                        <input type="number" value={discount.finalPrice} onChange={(e) => handleDiscountChange(idx, 'finalPrice', e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Short Description</label>
                      <textarea rows="2" value={discount.description} onChange={(e) => handleDiscountChange(idx, 'description', e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none', fontFamily: 'inherit' }}></textarea>
                    </div>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Start Date <span style={{color: 'red'}}>*</span></label>
                        <input type="date" value={discount.startDate} onChange={(e) => handleDiscountChange(idx, 'startDate', e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                      </div>
                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>End Date <span style={{color: 'red'}}>*</span></label>
                        <input type="date" value={discount.endDate} onChange={(e) => handleDiscountChange(idx, 'endDate', e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                        {new Date(discount.endDate) < new Date(discount.startDate) && <span style={{ color: '#e74c3c', fontSize: '0.8rem', marginTop: '0.5rem', display: 'block' }}>End date cannot be before start date</span>}
                      </div>
                    </div>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>CTA Button Text</label>
                        <input type="text" value={discount.ctaText} onChange={(e) => handleDiscountChange(idx, 'ctaText', e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                      </div>
                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>CTA Button Link</label>
                        <input type="text" value={discount.ctaLink} onChange={(e) => handleDiscountChange(idx, 'ctaLink', e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <button onClick={() => handleDeleteDiscount(idx)} style={{ background: 'rgba(231,76,60,0.1)', color: '#e74c3c', border: '1px solid rgba(231,76,60,0.2)', padding: '0.6rem 1.5rem', borderRadius: '10px', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 'bold' }}>Delete Offer</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* HEALTHCARE TAB */}
            {activeTab === 'healthcare' && (
              <div>
                <h3 className="text-2xl font-bold mb-6 text-cyan border-b border-white-10 pb-3">Healthcare Marketing</h3>
                
                <div className="p-5 rounded-xl border border-white-5 mb-6" style={{ background: 'rgba(255,255,255,0.01)' }}>
                  <h4 className="text-white font-bold mb-4">Healthcare CTA Section</h4>
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Title</label>
                    <input type="text" value={siteContent.healthcareCta?.title || ''} onChange={(e) => setSiteContent({ ...siteContent, healthcareCta: { ...siteContent.healthcareCta, title: e.target.value } })} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Subtitle</label>
                    <textarea rows="2" value={siteContent.healthcareCta?.subtitle || ''} onChange={(e) => setSiteContent({ ...siteContent, healthcareCta: { ...siteContent.healthcareCta, subtitle: e.target.value } })} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none', fontFamily: 'inherit' }}></textarea>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', marginTop: '2rem' }}>
                  <h4 className="text-white font-bold" style={{ margin: 0 }}>Healthcare Services</h4>
                  <button onClick={handleAddHealthcareService} style={{ padding: '0.5rem 1rem', borderRadius: '10px', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--cyan)', fontWeight: 'bold', border: '1px solid rgba(0, 240, 255, 0.2)', cursor: 'pointer' }}>+ Add Healthcare Service</button>
                </div>
                {siteContent.healthcareServices && siteContent.healthcareServices.map((srv, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-white-5 mb-4" style={{ background: 'rgba(255,255,255,0.01)' }}>
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Icon</label>
                        <input type="text" value={srv.icon} onChange={(e) => { const updated = [...siteContent.healthcareServices]; updated[idx].icon = e.target.value; setSiteContent({ ...siteContent, healthcareServices: updated }); }} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none', textAlign: 'center' }} />
                      </div>
                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Title</label>
                        <input type="text" value={srv.title} onChange={(e) => { const updated = [...siteContent.healthcareServices]; updated[idx].title = e.target.value; setSiteContent({ ...siteContent, healthcareServices: updated }); }} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Description</label>
                      <textarea rows="2" value={srv.description} onChange={(e) => { const updated = [...siteContent.healthcareServices]; updated[idx].description = e.target.value; setSiteContent({ ...siteContent, healthcareServices: updated }); }} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none', fontFamily: 'inherit' }}></textarea>
                    </div>
                    <button onClick={() => handleDeleteHealthcareService(idx)} style={{ background: 'rgba(231,76,60,0.1)', color: '#e74c3c', border: '1px solid rgba(231,76,60,0.2)', padding: '0.4rem 1rem', borderRadius: '10px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>Remove Service</button>
                  </div>
                ))}
              </div>
            )}

            {/* PORTFOLIO TAB */}
            {activeTab === 'portfolio' && (
              <div>
                <h3 className="text-2xl font-bold mb-6 text-cyan border-b border-white-10 pb-3">Portfolio Manager</h3>
                
                {/* Before After Showcase Editor */}
                <div className="p-6 rounded-2xl border border-cyan-20 mb-8" style={{ background: 'rgba(0,240,255,0.02)' }}>
                  <h4 className="text-cyan font-bold text-lg mb-4">Before / After Showcase</h4>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Showcase Project Name</label>
                    <input type="text" value={siteContent.beforeAfterShowcase.title} onChange={(e) => setSiteContent({ ...siteContent, beforeAfterShowcase: { ...siteContent.beforeAfterShowcase, title: e.target.value } })} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Description</label>
                    <textarea rows="2" value={siteContent.beforeAfterShowcase.description} onChange={(e) => setSiteContent({ ...siteContent, beforeAfterShowcase: { ...siteContent.beforeAfterShowcase, description: e.target.value } })} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none', fontFamily: 'inherit' }}></textarea>
                  </div>
                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="form-group">
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Before Image URL</label>
                      <input type="text" value={siteContent.beforeAfterShowcase.beforeImage} onChange={(e) => setSiteContent({ ...siteContent, beforeAfterShowcase: { ...siteContent.beforeAfterShowcase, beforeImage: e.target.value } })} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none', marginBottom: '0.5rem' }} />
                      <input type="file" accept="image/*" disabled={uploadingImage} onChange={(e) => handleFileUpload(e, (url) => setSiteContent({ ...siteContent, beforeAfterShowcase: { ...siteContent.beforeAfterShowcase, beforeImage: url } }))} />
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>After Image URL</label>
                      <input type="text" value={siteContent.beforeAfterShowcase.afterImage} onChange={(e) => setSiteContent({ ...siteContent, beforeAfterShowcase: { ...siteContent.beforeAfterShowcase, afterImage: e.target.value } })} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none', marginBottom: '0.5rem' }} />
                      <input type="file" accept="image/*" disabled={uploadingImage} onChange={(e) => handleFileUpload(e, (url) => setSiteContent({ ...siteContent, beforeAfterShowcase: { ...siteContent.beforeAfterShowcase, afterImage: url } }))} />
                    </div>
                  </div>
                </div>

                {/* Add New Project */}
                <div className="p-6 rounded-2xl border border-white-10 mb-8" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <h4 className="text-white font-bold text-lg mb-4">Add New Portfolio Project</h4>
                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Title</label>
                      <input type="text" placeholder="Cafe Redesign Flyer" value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Category</label>
                      <select value={newProject.category} onChange={(e) => setNewProject({ ...newProject, category: e.target.value })} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }}>
                        <option>Restaurants</option>
                        <option>Butcher Shops</option>
                        <option>Salons</option>
                        <option>Event Businesses</option>
                        <option>Websites</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Description</label>
                    <input type="text" placeholder="Promo banner details..." value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Project Image URL / File Upload</label>
                    <input type="text" placeholder="/assets/portfolio/filename.png" value={newProject.image} onChange={(e) => setNewProject({ ...newProject, image: e.target.value })} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none', marginBottom: '0.5rem' }} />
                    <input type="file" accept="image/*" disabled={uploadingImage} onChange={(e) => handleFileUpload(e, (url) => setNewProject({ ...newProject, image: url }))} />
                  </div>
                  <button onClick={handleAddProject} style={{ padding: '0.8rem 2rem', borderRadius: '30px', background: 'linear-gradient(135deg, var(--cyan), #0077FF)', color: 'var(--navy)', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Add Project</button>
                </div>

                {/* Existing Projects List */}
                <h4 className="text-white font-bold text-lg mb-4">Existing Projects ({siteContent.portfolio.length})</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                  {siteContent.portfolio.map((item, idx) => (
                    <div key={idx} className="glass-morphism p-4 rounded-xl border border-white-5 flex flex-col justify-between" style={{ background: 'rgba(255,255,255,0.01)' }}>
                      <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group">
                          <label style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Title</label>
                          <input type="text" value={item.title} onChange={(e) => { const newPort = [...siteContent.portfolio]; newPort[idx].title = e.target.value; setSiteContent({ ...siteContent, portfolio: newPort }); }} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '0.75rem', color: '#fff', outline: 'none' }} />
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Category</label>
                          <select value={item.category} onChange={(e) => { const newPort = [...siteContent.portfolio]; newPort[idx].category = e.target.value; setSiteContent({ ...siteContent, portfolio: newPort }); }} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '0.75rem', color: '#fff', outline: 'none' }}>
                            <option>Restaurants</option>
                            <option>Butcher Shops</option>
                            <option>Salons</option>
                            <option>Event Businesses</option>
                            <option>Websites</option>
                            <option>Healthcare & Medical</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Description</label>
                        <input type="text" value={item.description} onChange={(e) => { const newPort = [...siteContent.portfolio]; newPort[idx].description = e.target.value; setSiteContent({ ...siteContent, portfolio: newPort }); }} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '0.75rem', color: '#fff', outline: 'none' }} />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Image URL</label>
                        <input type="text" value={item.image} onChange={(e) => { const newPort = [...siteContent.portfolio]; newPort[idx].image = e.target.value; setSiteContent({ ...siteContent, portfolio: newPort }); }} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '0.75rem', color: '#fff', outline: 'none' }} />
                      </div>
                      <button onClick={() => handleDeleteProject(idx)} style={{ marginTop: '15px', background: 'rgba(231,76,60,0.1)', color: '#e74c3c', border: '1px solid rgba(231,76,60,0.2)', padding: '0.4rem 1rem', borderRadius: '10px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>Remove Duplicate / Delete</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TESTIMONIALS TAB */}
            {activeTab === 'testimonials' && (
              <div>
                <div className="flex justify-between items-center mb-6 border-b border-white-10 pb-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="text-2xl font-bold text-cyan" style={{ margin: 0 }}>Edit Client Testimonials</h3>
                  <button onClick={handleAddTestimonial} style={{ padding: '0.5rem 1rem', borderRadius: '10px', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--cyan)', fontWeight: 'bold', border: '1px solid rgba(0, 240, 255, 0.2)', cursor: 'pointer' }}>+ Add Testimonial</button>
                </div>
                {siteContent.testimonials.map((t, idx) => (
                  <div key={idx} className="p-5 rounded-xl border border-white-5 mb-6" style={{ background: 'rgba(255,255,255,0.01)' }}>
                    <h4 className="text-white font-bold mb-4">Testimonial #{idx + 1}</h4>
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Author</label>
                        <input type="text" value={t.author} onChange={(e) => handleTestimonialChange(idx, 'author', e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                      </div>
                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Business Name</label>
                        <input type="text" value={t.business} onChange={(e) => handleTestimonialChange(idx, 'business', e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                      </div>
                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Stars (1-5)</label>
                        <input type="number" min="1" max="5" value={t.rating} onChange={(e) => handleTestimonialChange(idx, 'rating', Number(e.target.value))} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none', textAlign: 'center' }} />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Review Text</label>
                      <textarea rows="3" value={t.text} onChange={(e) => handleTestimonialChange(idx, 'text', e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none', fontFamily: 'inherit' }}></textarea>
                    </div>
                    <button onClick={() => handleDeleteTestimonial(idx)} style={{ background: 'rgba(231,76,60,0.1)', color: '#e74c3c', border: '1px solid rgba(231,76,60,0.2)', padding: '0.4rem 1rem', borderRadius: '10px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>Remove Testimonial</button>
                  </div>
                ))}
              </div>
            )}

            {/* SUBSCRIBERS TAB */}
            {activeTab === 'subscribers' && (
              <div>
                <div className="flex justify-between items-center mb-6 border-b border-white-10 pb-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="text-2xl font-bold text-cyan" style={{ margin: 0 }}>Newsletter Subscribers</h3>
                  {subscribers.length > 0 && (
                    <button onClick={() => {
                      const csvContent = "data:text/csv;charset=utf-8," + "Email,Subscribed Date\n" + subscribers.map(s => `${s.email},${s.subscribedAt}`).join("\n");
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", "subscribers.csv");
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }} style={{ padding: '0.5rem 1rem', borderRadius: '10px', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--cyan)', fontWeight: 'bold', border: '1px solid rgba(0, 240, 255, 0.2)', cursor: 'pointer' }}>Export CSV</button>
                  )}
                </div>
                
                {subscribers.length === 0 ? (
                  <p className="text-muted text-center py-6">No newsletter subscribers yet.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--muted)', fontSize: '0.85rem' }}>
                          <th style={{ padding: '10px' }}>Email</th>
                          <th style={{ padding: '10px' }}>Subscribed Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscribers.map((sub, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem' }}>
                            <td style={{ padding: '12px 10px', color: '#fff', fontWeight: 'bold' }}>{sub.email}</td>
                            <td style={{ padding: '12px 10px', color: 'var(--muted)' }}>{new Date(sub.subscribedAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* LEADS TAB */}
            {activeTab === 'leads' && (
              <div>
                <div className="flex justify-between items-center mb-6 border-b border-white-10 pb-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="text-2xl font-bold text-cyan" style={{ margin: 0 }}>Contact Form Leads</h3>
                  {leads.length > 0 && (
                    <button onClick={() => {
                      const csvContent = "data:text/csv;charset=utf-8," + "Name,Business Name,Email,Phone,Service,Message,Submitted Date\n" + leads.map(l => `"${l.name}","${l.business_name}","${l.email}","${l.phone}","${l.service}","${(l.message || '').replace(/"/g, '""')}","${l.submittedAt}"`).join("\n");
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", "contact_leads.csv");
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }} style={{ padding: '0.5rem 1rem', borderRadius: '10px', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold)', fontWeight: 'bold', border: '1px solid rgba(212, 175, 55, 0.2)', cursor: 'pointer' }}>Export CSV</button>
                  )}
                </div>
                
                {leads.length === 0 ? (
                  <p className="text-muted text-center py-6">No contact leads yet.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--muted)', fontSize: '0.85rem' }}>
                          <th style={{ padding: '10px' }}>Name / Business</th>
                          <th style={{ padding: '10px' }}>Contact Info</th>
                          <th style={{ padding: '10px' }}>Service</th>
                          <th style={{ padding: '10px' }}>Message</th>
                          <th style={{ padding: '10px' }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.slice().reverse().map((lead, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem', verticalAlign: 'top' }}>
                            <td style={{ padding: '12px 10px' }}>
                              <strong style={{ color: '#fff', display: 'block' }}>{lead.name}</strong>
                              <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{lead.business_name || 'N/A'}</span>
                            </td>
                            <td style={{ padding: '12px 10px' }}>
                              <a href={`mailto:${lead.email}`} style={{ color: 'var(--cyan)', display: 'block', marginBottom: '4px' }}>{lead.email}</a>
                              <a href={`tel:${lead.phone}`} style={{ color: 'var(--gold)', fontSize: '0.8rem' }}>{lead.phone || 'N/A'}</a>
                            </td>
                            <td style={{ padding: '12px 10px', color: '#fff' }}>
                              <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{lead.service || 'None'}</span>
                            </td>
                            <td style={{ padding: '12px 10px', color: 'var(--muted)', maxWidth: '300px' }}>
                              <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{lead.message}</p>
                            </td>
                            <td style={{ padding: '12px 10px', color: 'var(--muted)', fontSize: '0.8rem' }}>{new Date(lead.submittedAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div>
                <h3 className="text-2xl font-bold mb-6 text-cyan border-b border-white-10 pb-3">Website Settings</h3>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Company Name</label>
                    <input type="text" value={siteContent.companyName} onChange={(e) => setSiteContent({ ...siteContent, companyName: e.target.value })} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Contact Email</label>
                    <input type="email" value={siteContent.contactEmail} onChange={(e) => setSiteContent({ ...siteContent, contactEmail: e.target.value })} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                  </div>
                </div>
                
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Contact Phone</label>
                    <input type="text" placeholder="(555) 123-4567" value={siteContent.contactPhone || ''} onChange={(e) => setSiteContent({ ...siteContent, contactPhone: e.target.value })} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                  </div>
                </div>
                
                <h4 className="text-white font-bold text-lg mb-4">SEO Config</h4>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Meta SEO Title</label>
                  <input type="text" value={siteContent.settings.seo.title} onChange={(e) => setSiteContent({ ...siteContent, settings: { ...siteContent.settings, seo: { ...siteContent.settings.seo, title: e.target.value } } })} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                </div>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Meta Description</label>
                  <textarea rows="3" value={siteContent.settings.seo.description} onChange={(e) => setSiteContent({ ...siteContent, settings: { ...siteContent.settings, seo: { ...siteContent.settings.seo, description: e.target.value } } })} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none', fontFamily: 'inherit' }}></textarea>
                </div>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Keywords (comma separated)</label>
                  <input type="text" value={siteContent.settings.seo.keywords} onChange={(e) => setSiteContent({ ...siteContent, settings: { ...siteContent.settings, seo: { ...siteContent.settings.seo, keywords: e.target.value } } })} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                </div>

                <h4 className="text-white font-bold text-lg mb-4">Social Links</h4>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Facebook Link</label>
                    <input type="text" value={siteContent.settings.socialLinks.facebook} onChange={(e) => setSiteContent({ ...siteContent, settings: { ...siteContent.settings, socialLinks: { ...siteContent.settings.socialLinks, facebook: e.target.value } } })} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Instagram Link</label>
                    <input type="text" value={siteContent.settings.socialLinks.instagram} onChange={(e) => setSiteContent({ ...siteContent, settings: { ...siteContent.settings, socialLinks: { ...siteContent.settings.socialLinks, instagram: e.target.value } } })} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', outline: 'none' }} />
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
