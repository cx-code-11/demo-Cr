'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../AuthContext';
import { UserPlus, AlertCircle, FileText } from 'lucide-react';

export default function RegisterPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('DONOR');
  
  // NGO Extra fields
  const [ngoDescription, setNgoDescription] = useState('');
  const [ngoDocumentUrl, setNgoDocumentUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      name,
      email,
      password,
      role,
      ...(role === 'NGO' && {
        ngoDescription,
        ngoDocumentUrl
      })
    };

    try {
      const res = await fetch('http://localhost:5005/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Log the user in
      login(data.token, data.user);

      // Redirect accordingly
      if (data.user.role === 'ADMIN') {
        router.push('/dashboard/admin');
      } else if (data.user.role === 'NGO') {
        router.push('/dashboard/ngo');
      } else {
        router.push('/dashboard/donor');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '5rem 0',
      flex: 1
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '2.5rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Create Account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Join Trust Aid as a donor or fundraiser</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Full Name / Organization Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe / Hope Org"
              className="form-input"
              required
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="form-input"
              required
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="form-input"
              required
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Account Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="form-select">
              <option value="DONOR">Donor (Make contributions)</option>
              <option value="NGO">NGO Representative (Raise funds)</option>
            </select>
          </div>

          {/* Dynamic NGO Fields */}
          {role === 'NGO' && (
            <div style={{
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px dashed rgba(59, 130, 246, 0.2)',
              borderRadius: '10px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={16} /> NGO Verification Setup
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Organization Description</label>
                <textarea
                  value={ngoDescription}
                  onChange={(e) => setNgoDescription(e.target.value)}
                  placeholder="Explain your NGO's mission and purpose..."
                  className="form-input"
                  style={{ minHeight: '80px', fontSize: '0.9rem' }}
                  required={role === 'NGO'}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Registration Document Link (PDF / Certificate)</label>
                <input
                  type="url"
                  value={ngoDocumentUrl}
                  onChange={(e) => setNgoDocumentUrl(e.target.value)}
                  placeholder="https://example.com/docs/cert.pdf"
                  className="form-input"
                  style={{ fontSize: '0.9rem' }}
                  required={role === 'NGO'}
                />
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Note: NGO accounts require administrator approval before active campaigns can be created or payouts requested.
              </div>
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            {loading ? 'Creating Account...' : (
              <>
                <UserPlus size={18} />
                Register
              </>
            )}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '2rem',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)'
        }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
