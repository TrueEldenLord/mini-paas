// Role 5 — Richelle
// This is your page. Use the deployment id from the URL to fetch and display details.
// Wire up polling, log viewer, status indicator, and live URL here.

import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { getDeployment } from "../api/client";
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

    const deploymentId = id ?? "";

    const [deployment, setDeployment] = useState<Deployment>({
        ...MOCK_DEPLOYMENT,
        id: deploymentId
    });

    const [connectionError, setConnectionError] = useState(false);

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

        // Repeat every 5 seconds
        const interval = setInterval(fetchDeployment, 5000);

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
                        Dashboard / Deployments / #{deployment.id}
                    </p>

                    <h1>{deployment.repo_url}</h1>

                    <p className="deployment-subtitle">
                        View deployment information and build activity.
                    </p>
                </div>

                <span className="deployment-id">
                    ID: #{deployment.id}
                </span>
            </div>

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
