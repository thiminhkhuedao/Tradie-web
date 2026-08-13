// components/LoadingState.jsx

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/index.js';

export function LoadingState({ isLoading, error, onRetry, children }) {
  const { t } = useTranslation();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  const loadingStepsKeys = [
    "loading.steps.loading",
    "loading.steps.saving",
    "loading.steps.almostThere"
  ];

  // Timer logic to track how long loading takes
  useEffect(() => {
    let interval = null;
    if (isLoading) {
      setElapsedTime(0);
      setStepIndex(0);
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => clearInterval(interval);
  }, [isLoading]);

  // Cycle through status messages after 4 seconds
  useEffect(() => {
    let stepInterval = null;
    if (isLoading && elapsedTime >= 4) {
      stepInterval = setInterval(() => {
        setStepIndex((prev) => (prev + 1) % loadingStepsKeys.length);
      }, 2000);
    }

    return () => clearInterval(stepInterval);
  }, [isLoading, elapsedTime]);

  // Priority 1: Error Handling
  if (error) {
    return (
      <div className="error-container" style={{ textAlign: 'center', padding: '20px' }}>
        <p style={{ color: '#DC2626', fontWeight: 'bold', marginBottom: '12px' }}>
          {typeof error === 'string' ? t(error) : error.message || t("errors.general")}
        </p>
        {onRetry && (
          <button 
            onClick={onRetry}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {t("common.retry")}
          </button>
        )}
      </div>
    );
  }

  // Priority 2: Not loading? Render original UI
  if (!isLoading) {
    return children;
  }

  // Priority 3: Thresholds (< 1s shows nothing to prevent flicker)
  if (elapsedTime < 1) {
    return null; 
  }

  return (
    <div className="loading-container" style={{ textAlign: 'center', padding: '20px' }}>
      {/* Step 1: Spinner (1s - 3s) */}
      <div className="spinner"></div>

      {/* Step 2: Status Messages (4s - 9s) */}
      {elapsedTime >= 4 && elapsedTime < 10 && (
        <p style={{ marginTop: '10px', fontWeight: '500' }}>
          {t(loadingStepsKeys[stepIndex])}
        </p>
      )}

      {/* Step 3: Detailed Progress Bar & Step Indicator (10s+) */}
      {elapsedTime >= 10 && (
        <div style={{ marginTop: '15px' }}>
          <p style={{ fontWeight: 'bold' }}>{t("loading.longWaitNotice")}</p>
          
          {/* Simple Progress Bar */}
          <div style={{ width: '100%', background: '#e0e0e0', borderRadius: '8px', overflow: 'hidden', height: '10px', margin: '10px 0' }}>
            <div 
              style={{ 
                width: `${Math.min((elapsedTime / 20) * 100, 95)}%`, 
                background: '#007bff', 
                height: '100%', 
                transition: 'width 0.5s ease' 
              }} 
            />
          </div>

          {/* Step Indicator */}
          <small>{t("loading.elapsedTimeLabel", { seconds: elapsedTime })}</small>
        </div>
      )}
    </div>
  );
}