// Role 4 — Kayla
// This is your page. The sidebar/layout CSS is already in index.css (ported from your style.css).
// Hook into useDeploymentStore to replace the hardcoded content with real data.

import { useNavigate } from 'react-router-dom';
import { useDeploymentStore } from '../store/deployments';

export default function DeploymentList() {
  const { deployments } = useDeploymentStore();
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex' }}>

      {/* Sidebar — from your original HTML */}
      <aside className="sidebar">
        <div className="dashboard-logo"><h2>Dashboard</h2></div>
        <div className="user-profile"><p>email profile</p></div>
        <div className="favorites">
          <h3>FAVORITES</h3>
          <ul>
            {deployments.slice(0, 8).map((d) => (
              <li key={d.id} onClick={() => navigate(`/deployments/${d.id}`)}>
                {d.repo_url.split('/').pop()}
              </li>
            ))}
          </ul>
        </div>
        <div className="personal-apps"><h3>Personal Apps</h3></div>
        <div className="organizations">
          <h3>ORGANIZATIONS</h3>
          <p>HELIOS</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <header className="top-header">
          <div className="back-button">&lt;</div>
          <div className="app-name">Deployments</div>
        </header>

        <nav className="navigation">
          <a href="#" className="active">Deployments</a>
        </nav>

        {/* Deployment list — replace this section with your full UI */}
        <section className="status-cards">
          {deployments.map((d) => (
            <div
              key={d.id}
              className="status-card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/deployments/${d.id}`)}
            >
              <div className="card-header">
                <h3>{d.repo_url.split('/').pop()}</h3>
                <span className="status-indicator">{d.status}</span>
              </div>
              <div className="card-content">
                <span>{d.repo_url}</span>
              </div>
            </div>
          ))}
        </section>
      </main>

    </div>
  );
}
