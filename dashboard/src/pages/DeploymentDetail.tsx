// Role 5 — Richelle
// This is your page. Use the deployment id from the URL to fetch and display details.
// Wire up polling, log viewer, status indicator, and live URL here.

import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { getDeployment } from "../api/client";
import { useDeploymentStore } from "../store/deployments";
import type { Deployment } from "../types";
import "./DeploymentDetail.css";

const MOCK_DEPLOYMENT: Deployment = {
    id: "00000000-0000-0000-0000-000000000000",
    repo_url: "github.com/example/helios-demo",
    status: "building",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    container_id: null,
    public_url: null,
    logs: "[10:30:01] Deployment initialized.\n[10:30:02] Cloning GitHub repository...\n[10:30:04] Repository cloned successfully.\n[10:30:05] Preparing Docker build...\n[10:30:08] Installing dependencies...\n[10:30:12] Building Docker image...\n[10:30:15] Build in progress..."
};

const statusDetails = {
    queued: {
        label: "Queued",
        description: "Waiting for a deployment worker",
        icon: "◷"
    },
    building: {
        label: "Building",
        description: "Your application is being built",
        icon: "⟳"
    },
    running: {
        label: "Running",
        description: "Your application is live",
        icon: "✓"
    },
    failed: {
        label: "Failed",
        description: "Deployment encountered an error",
        icon: "!"
    }
};

export default function DeploymentDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { removeDeployment } = useDeploymentStore();

    const deploymentId = id ?? "";

    const [deployment, setDeployment] = useState<Deployment>({
        ...MOCK_DEPLOYMENT,
        id: deploymentId
    });

    const [connectionError, setConnectionError] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    async function handleDelete() {
        setDeleting(true);
        try {
            await removeDeployment(deploymentId);
            navigate('/');
        } finally {
            setDeleting(false);
            setConfirmDelete(false);
        }
    }

    // Reference to the build log container
    const logContainerRef = useRef<HTMLDivElement>(null);

    // Retrieve deployment information every 5 seconds
    useEffect(() => {
        let active = true;

        const fetchDeployment = async () => {
            try {
                const data = await getDeployment(deploymentId);

                if (active) {
                    setDeployment(data);
                    setConnectionError(false);
                }
            } catch {
                if (active) {
                    setConnectionError(true);
                }
            }
        };

        // Fetch immediately when the page loads
        fetchDeployment();

        const pollInterval = Number(import.meta.env.VITE_POLL_INTERVAL_MS) || 5000;
        const interval = setInterval(fetchDeployment, pollInterval);

        return () => {
            active = false;
            clearInterval(interval);
        };
    }, [deploymentId]);

    // Automatically scroll to the newest log entry
    useEffect(() => {
        const logContainer = logContainerRef.current;

        if (logContainer) {
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    }, [deployment.logs]);

    const currentStatus = statusDetails[deployment.status]
        ? deployment.status
        : "queued";

    const status = statusDetails[currentStatus];

    const logLines = deployment.logs?.split("\n").filter(Boolean) ?? [];

    return (
        <div className="deployment-page">

            {/* Page Header */}
            <div className="deployment-header">
                <div>
                    <p className="deployment-breadcrumb">
                        <span onClick={() => navigate('/')} style={{ cursor: 'pointer', color: '#1e518c' }}>Dashboard</span>
                        {' / Deployments / '}#{deployment.id}
                    </p>

                    <h1>{deployment.repo_url}</h1>

                    <p className="deployment-subtitle">
                        View deployment information and build activity.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                    <span className="deployment-id">
                        ID: #{deployment.id}
                    </span>
                    <button
                        onClick={() => setConfirmDelete(true)}
                        style={{
                            padding: '7px 14px', background: '#fee2e2', color: '#dc2626',
                            border: '1px solid #fca5a5', borderRadius: '6px',
                            fontSize: '12px', cursor: 'pointer', fontWeight: 600,
                        }}
                    >
                        Delete Deployment
                    </button>
                </div>
            </div>

            {confirmDelete && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }}>
                    <div style={{
                        background: '#fff', borderRadius: '12px', padding: '28px',
                        width: '380px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    }}>
                        <h2 style={{ fontSize: '17px', color: '#dc2626', marginBottom: '8px' }}>Delete Deployment?</h2>
                        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>
                            This will permanently remove the deployment and stop the running container.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setConfirmDelete(false)}
                                style={{
                                    padding: '8px 16px', background: 'none', border: '1px solid #d1d5db',
                                    borderRadius: '6px', fontSize: '13px', cursor: 'pointer', color: '#6b7280',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                style={{
                                    padding: '8px 16px', background: deleting ? '#fca5a5' : '#dc2626',
                                    color: '#fff', border: 'none', borderRadius: '6px',
                                    fontSize: '13px', cursor: deleting ? 'not-allowed' : 'pointer', fontWeight: 600,
                                }}
                            >
                                {deleting ? 'Deleting…' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Deployment Status */}
            <section className="deployment-card">
                <div className="section-heading">
                    <h2>Deployment Status</h2>

                    <span className="refresh-label">
                        <span className="refresh-dot"></span>
                        Auto-refresh: 5 seconds
                    </span>
                </div>

                <div className={`deployment-status deployment-status--${currentStatus}`}>
                    <span className="status-icon">
                        {status.icon}
                    </span>

                    <div className="status-content">
                        <strong>{status.label}</strong>
                        <span>{status.description}</span>
                    </div>
                </div>

                {connectionError && (
                    <p className="connection-message">
                        API unavailable. Displaying demo data while waiting
                        for the connection.
                    </p>
                )}
            </section>

            {/* Deployment Information */}
            <section className="deployment-card">
                <h2>Deployment Information</h2>

                <div className="deployment-info-grid">
                    <div className="info-item">
                        <span>Repository</span>
                        <strong>{deployment.repo_url}</strong>
                    </div>

                    <div className="info-item">
                        <span>Container ID</span>
                        <strong>{deployment.container_id ?? "—"}</strong>
                    </div>

                    <div className="info-item">
                        <span>Deployment ID</span>
                        <strong>#{deployment.id}</strong>
                    </div>

                    <div className="info-item">
                        <span>Created</span>
                        <strong>{new Date(deployment.created_at + 'Z').toLocaleString()}</strong>
                    </div>
                </div>
            </section>

            {/* Live Application URL */}
            {currentStatus === "running" && deployment.public_url && (
                <section className="live-url-card">
                    <div>
                        <span className="live-indicator"></span>

                        <strong>Your application is live!</strong>

                        <p>
                            Your deployment was successful.
                            Visit your application below.
                        </p>
                    </div>

                    <a
                        href={deployment.public_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="live-url-button"
                    >
                        Open Application ↗
                    </a>

                    <p className="live-url-text">
                        {deployment.public_url}
                    </p>
                </section>
            )}

            {/* Build Logs */}
            <section className="deployment-card logs-card">
                <div className="section-heading">
                    <div>
                        <h2>Build Logs</h2>

                        <p className="logs-subtitle">
                            Deployment output and build activity
                        </p>
                    </div>

                    <span className="logs-live">
                        ● LIVE
                    </span>
                </div>

                <div
                    className="log-container"
                    ref={logContainerRef}
                    aria-label="Deployment build logs"
                    aria-live="polite"
                >
                    {logLines.map((log, index) => (
                        <div className="log-line" key={index}>
                            <span className="log-number">
                                {String(index + 1).padStart(2, "0")}
                            </span>

                            <span>{log}</span>
                        </div>
                    ))}
                </div>

                <div className="logs-footer">
                    <span>
                        {logLines.length} log entries
                    </span>

                    <span>Automatically scrolling</span>
                </div>
            </section>

        </div>
    );
}
