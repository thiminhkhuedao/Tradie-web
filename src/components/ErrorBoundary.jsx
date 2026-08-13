// components/ErrorBoundary.jsx
import React from "react";
import { T } from "../styles/tokens";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Component Error Caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 20,
          borderRadius: T.r.md || 8,
          background: T.surface2 || "#F1F5F9",
          border: `1px solid ${T.border || "#CBD5E1"}`,
          textAlign: "center",
          color: T.muted || "#64748B",
          fontSize: 14
        }}>
          <p style={{ margin: "0 0 12px 0" }}>
            {this.props.fallbackText || "This section is currently unavailable."}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: "6px 12px",
              borderRadius: T.r.sm || 4,
              border: `1px solid ${T.border || "#CBD5E1"}`,
              background: "#FFFFFF",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}