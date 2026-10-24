// Role 4 — Kayla
// Real data is now wired in. The sidebar favorites and status cards show live deployments.
// The rest of the page (nav, alerts, charts) is yours to build out.

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeploymentStore } from '../store/deployments';

function logout(navigate: (path: string) => void) {
  localStorage.removeItem('access_token');
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
  const { deployments, fetchDeployments, loading, error } = useDeploymentStore();
  const navigate = useNavigate();

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
    </>
  );
}
