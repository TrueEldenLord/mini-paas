// Role 4 — Kayla
// Real data is now wired in. The sidebar favorites and status cards show live deployments.
// The rest of the page (nav, alerts, charts) is yours to build out.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeploymentStore } from '../store/deployments';
import { setToken } from '../api/client';

function logout(navigate: (path: string) => void) {
  setToken(null);
  navigate('/login');
}

const POLL_INTERVAL = Number(import.meta.env.VITE_POLL_INTERVAL_MS) || 5000;

const STATUS_COLORS: Record<string, string> = {
  queued: '#9ca3af',
  building: '#f59e0b',
  running: '#72bf74',
  failed: '#ef4444',
};

export default function DeploymentList() {
  const { deployments, fetchDeployments, submitDeployment, loading, error } = useDeploymentStore();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
      {/* left menu */}
      <aside className="sidebar">

        <div className="dashboard-logo">
          <h2>Dashboard</h2>
        </div>

        <div className="user-profile" style={{ justifyContent: 'space-between' }}>
          <p>email profile</p>
          <button
            onClick={() => logout(navigate)}
            style={{
              background: 'none', border: 'none', color: '#b8d4ee',
              fontSize: '11px', cursor: 'pointer', padding: 0,
            }}
          >
            Sign out
          </button>
        </div>

        <div style={{ padding: '12px 16px' }}>
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
          <h3>FAVORITES</h3>
          <ul>
            {deployments.length === 0 ? (
              <li>No deployments yet</li>
            ) : (
              deployments.slice(0, 8).map((d) => (
                <li key={d.id} onClick={() => navigate(`/deployments/${d.id}`)}>
                  {d.repo_url.split('/').pop()}
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="personal-apps">
          <h3>Personal Apps</h3>
        </div>

        <div className="organizations">
          <h3>ORGANIZATIONS</h3>
          <p>HELIOS</p>
        </div>

      </aside>

      {/* main body */}
      <main className="main-content">

        {/* TOP HEADER */}
        <header className="top-header">
          <div className="back-button">&lt;</div>
          <div className="app-name">hit</div>
          <div className="header-right">blog</div>
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

        {/* status cards — live deployments */}
        <section className="status-cards">
          {error && (
            <p style={{ color: '#ef4444', fontSize: '12px', padding: '4px' }}>
              Could not reach API — retrying…
            </p>
          )}
          {!error && loading && deployments.length === 0 && (
            <p style={{ color: '#9ca3af', fontSize: '12px', padding: '4px' }}>Loading…</p>
          )}
          {!error && !loading && deployments.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '12px', padding: '4px' }}>No deployments yet.</p>
          ) : (
            deployments.map((d) => (
              <div
                key={d.id}
                className="status-card"
                style={{ cursor: 'pointer', width: '220px', height: 'auto' }}
                onClick={() => navigate(`/deployments/${d.id}`)}
              >
                <div className="card-header">
                  <h3>{d.repo_url.split('/').pop()}</h3>
                  <span
                    className="status-indicator"
                    style={{ background: STATUS_COLORS[d.status] ?? '#9ca3af', width: 'auto', padding: '0 5px', borderRadius: '3px', fontSize: '9px' }}
                  >
                    {d.status}
                  </span>
                </div>
                <div className="card-content" style={{ marginTop: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#777', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.repo_url}
                  </span>
                  <span style={{ fontSize: '10px', color: '#aaa', display: 'block', marginTop: '3px' }}>
                    {d.id.slice(0, 8)}
                  </span>
                  <span style={{ fontSize: '10px', color: '#aaa', display: 'block', marginTop: '2px' }}>
                    {new Date(d.created_at + 'Z').toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
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
