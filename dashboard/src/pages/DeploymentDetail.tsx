// Role 5 — Richelle
// This is your page. Use the deployment id from the URL to fetch and display details.
// Wire up polling, log viewer, status indicator, and live URL here.

import { useParams } from 'react-router-dom';

export default function DeploymentDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="main-content" style={{ marginLeft: 0, padding: '2rem' }}>
      <h2>Deployment Detail</h2>
      <p>ID: {id}</p>
      {/* Richelle: build out status indicator, log viewer, live URL here */}
    </div>
  );
}
