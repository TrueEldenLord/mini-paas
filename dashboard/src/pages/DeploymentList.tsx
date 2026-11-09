// Role 4 — Kayla
// Real data is now wired in. The sidebar favorites and status cards show live deployments.
// The rest of the page (nav, alerts, charts) is yours to build out.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeploymentStore } from '../store/deployments';
import { useAuthStore } from '../store/auth';
import { setToken } from '../api/client';

function logout(navigate: (path: string) => void, clearUser: () => void) {
  setToken(null);
  clearUser();
  navigate('/login');
}

const POLL_INTERVAL = Number(import.meta.env.VITE_POLL_INTERVAL_MS) || 5000;

const STATUS_COLORS: Record<string, string> = {
  queued: '#9ca3af',
  building: '#f59e0b',
  running: '#22c55e',
  failed: '#ef4444',
};

const STATUS_BG: Record<string, string> = {
  queued: '#f3f4f6',
  building: '#fffbeb',
  running: '#f0fdf4',
  failed: '#fef2f2',
};

export default function DeploymentList() {
  const { deployments, fetchDeployments, submitDeployment, loading, error } = useDeploymentStore();
  const { username, email, clearUser } = useAuthStore();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const displayName = username || (email ? email.split('@')[0] : 'User');
  const displayEmail = email || '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!repoUrl.trim()) {
      setSubmitError('Repository URL is required.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitDeployment(repoUrl.trim());
      setRepoUrl('');
      setShowModal(false);
    } catch (err: any) {
      setSubmitError(err.message ?? 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    fetchDeployments();
    const interval = setInterval(fetchDeployments, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* left sidebar */}
      <aside className="sidebar">

        <div className="dashboard-logo">
          <h2>Mini PaaS</h2>
        </div>

        <div className="user-profile" style={{ justifyContent: 'space-between', flexDirection: 'column', alignItems: 'flex-start', height: 'auto', padding: '12px 14px', gap: '2px' }}>
          <p style={{ fontWeight: 600, fontSize: '13px' }}>{displayName}</p>
          {displayEmail && (
            <p style={{ fontSize: '11px', color: '#b8d4ee', marginTop: '2px' }}>{displayEmail}</p>
          )}
          <button
            onClick={() => logout(navigate, clearUser)}
            style={{
              background: 'none', border: 'none', color: '#b8d4ee',
              fontSize: '11px', cursor: 'pointer', padding: 0, marginTop: '6px',
            }}
          >
            Sign out
          </button>
        </div>

        <div style={{ padding: '12px 14px' }}>
          <button
            onClick={() => setShowModal(true)}
            style={{
              width: '100%', padding: '8px 12px', background: '#1e518c',
              color: '#fff', border: 'none', borderRadius: '6px',
              fontSize: '12px', cursor: 'pointer', fontWeight: 600,
            }}
          >
            + New Deployment
          </button>
        </div>

        <div className="favorites">
          <h3>DEPLOYMENTS</h3>
          <ul>
            {deployments.length === 0 ? (
              <li style={{ color: '#7eaad4', cursor: 'default' }}>None yet</li>
            ) : (
              deployments.slice(0, 8).map((d) => (
                <li key={d.id} onClick={() => navigate(`/deployments/${d.id}`)}>
                  {d.repo_url.split('/').pop()}
                </li>
              ))
            )}
          </ul>
        </div>

      </aside>

      {/* main content */}
      <main className="main-content">

        {/* top header */}
        <header className="top-header">
          <div className="app-name" style={{ fontWeight: 600, fontSize: '14px', color: '#1e518c' }}>
            All Deployments
          </div>
          <div className="header-right" style={{ color: '#9ca3af', fontSize: '12px' }}>
            {deployments.length} total
          </div>
        </header>

        {/* navigation */}
        <nav className="navigation">
          <a href="#">Resources</a>
          <a href="#">Code</a>
          <a href="#" className="active">Metrics</a>
          <a href="#">Activity</a>
          <a href="#">Access</a>
          <a href="#">Settings</a>
        </nav>

        {/* deployment cards */}
        <section className="status-cards">
          {error && (
            <p style={{ color: '#ef4444', fontSize: '12px', padding: '4px', width: '100%' }}>
              Could not reach API — retrying…
            </p>
          )}
          {!error && loading && deployments.length === 0 && (
            <p style={{ color: '#9ca3af', fontSize: '12px', padding: '4px' }}>Loading…</p>
          )}
          {!error && !loading && deployments.length === 0 && (
            <div style={{
              width: '100%', textAlign: 'center', padding: '60px 20px',
              color: '#9ca3af',
            }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🚀</div>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
                No deployments yet
              </p>
              <p style={{ fontSize: '13px', marginBottom: '20px' }}>
                Deploy your first app to get started.
              </p>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: '9px 20px', background: '#2563a6', color: '#fff',
                  border: 'none', borderRadius: '6px', fontSize: '13px',
                  cursor: 'pointer', fontWeight: 600,
                }}
              >
                + New Deployment
              </button>
            </div>
          )}
          {deployments.map((d) => (
            <div
              key={d.id}
              className="status-card"
              style={{
                cursor: 'pointer', width: '240px', height: 'auto',
                borderColor: STATUS_COLORS[d.status] ?? '#d0d0d8',
                background: STATUS_BG[d.status] ?? '#f9fafb',
              }}
              onClick={() => navigate(`/deployments/${d.id}`)}
            >
              <div className="card-header">
                <h3 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                  {d.repo_url.split('/').pop()}
                </h3>
                <span style={{
                  background: STATUS_COLORS[d.status] ?? '#9ca3af',
                  color: '#fff', padding: '1px 6px', borderRadius: '3px', fontSize: '9px', fontWeight: 600,
                }}>
                  {d.status}
                </span>
              </div>
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ fontSize: '10px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.repo_url}
                </span>
                <span style={{ fontSize: '10px', color: '#9ca3af', fontFamily: 'monospace' }}>
                  {d.id.slice(0, 8)}
                </span>
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                  {new Date(d.created_at + 'Z').toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* app alerts */}
        <section className="app-alerts">
          <h3>App Alerts</h3>
          <div className="alert-message">
            <strong>■ Request timeouts.</strong>
            Alert message input here API
          </div>
        </section>

        {/* errors */}
        <section className="metrics-section">
          <h3>Errors</h3>
          <div className="chart" id="errors-chart">
            <p>Error chart will go here</p>
          </div>
        </section>

        {/* response time */}
        <section className="metrics-section">
          <h3>Response Time</h3>
          <div className="chart-legend">
            <span> &lt;== api ==&gt; </span>
            <span> &lt;== api ==&gt; </span>
          </div>
          <div className="chart" id="response-chart">
            <p>response time code chart</p>
          </div>
        </section>

      </main>

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px', padding: '28px',
            width: '420px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <h2 style={{ fontSize: '18px', color: '#1e518c', marginBottom: '6px' }}>New Deployment</h2>
            <p style={{ fontSize: '12px', color: '#7b8492', marginBottom: '12px' }}>
              Enter a public GitHub repo URL to deploy.
            </p>
            <div style={{
              background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '6px',
              padding: '10px 12px', marginBottom: '16px', fontSize: '12px', color: '#92400e',
            }}>
              <strong>Requirements:</strong>
              <ul style={{ margin: '4px 0 0 16px', lineHeight: '1.7' }}>
                <li>Repo must be <strong>public</strong></li>
                <li><strong>Dockerfile</strong> must be present at the repo root</li>
                <li>App must listen on port <strong>8000</strong></li>
              </ul>
              <p style={{ marginTop: '6px' }}>
                Getting a 404? Your app is likely running on the wrong port. Update your app to listen on <strong>8000</strong>.
              </p>
            </div>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="https://github.com/user/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
                  borderRadius: '6px', fontSize: '13px', marginBottom: '12px',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
              {submitError && (
                <p style={{ color: '#ef4444', fontSize: '12px', marginBottom: '10px' }}>{submitError}</p>
              )}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setRepoUrl(''); setSubmitError(null); }}
                  style={{
                    padding: '8px 16px', background: 'none', border: '1px solid #d1d5db',
                    borderRadius: '6px', fontSize: '13px', cursor: 'pointer', color: '#6b7280',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !repoUrl.trim()}
                  style={{
                    padding: '8px 16px', background: submitting ? '#93c5fd' : '#1e518c',
                    color: '#fff', border: 'none', borderRadius: '6px',
                    fontSize: '13px', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 600,
                  }}
                >
                  {submitting ? 'Deploying…' : 'Deploy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
