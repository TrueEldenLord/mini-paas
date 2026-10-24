// Role 4 — Kayla
// Your original HTML structure is preserved exactly below, just converted to JSX.
// When you're ready to wire in real data, import useDeploymentStore and useNavigate
// and swap out the hardcoded content.

export default function DeploymentList() {
  return (
    <>
      {/* left menu */}
      <aside className="sidebar">

        <div className="dashboard-logo">
          <h2>Dashboard</h2>
        </div>

        <div className="user-profile">
          <p>email profile</p>
        </div>

        <div className="favorites">
          <h3>FAVORITES</h3>
          <ul>
            <li className="active">blog</li>
            <li> xxx </li>
            <li> xxx </li>
            <li> xxx </li>
            <li> xxx </li>
            <li> xxx </li>
            <li> xxx </li>
            <li> xxx </li>
            <li> xxx</li>
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

        {/* status card section */}
        <section className="status-cards">

          <div className="status-card web-card">
            <div className="card-header">
              <h3>WEB</h3>
              <span className="status-indicator">✓</span>
            </div>
            <div className="card-content">
              <span className="count">2X</span>
              <span>9 dynos</span>
            </div>
          </div>

          <div className="status-card worker-card">
            <div className="card-header">
              <h3>WORKER</h3>
              <span className="status-indicator">✓</span>
            </div>
            <div className="card-content">
              <span className="count">1X</span>
              <span>0 dynos</span>
            </div>
          </div>

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
