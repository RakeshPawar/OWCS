/**
 * Styles for the OWCS Viewer component
 */

import { css } from 'lit';

export const owcsViewerStyles = css`
  :host {
    display: block;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: #1f2933; /* softer dark for readability */
    background: #ffffff;
    border-radius: 10px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    overflow: hidden;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  /* Header styles */
  .header {
    color: #4052a2e3; /* slightly softer white for readability */
    padding: 1rem 2rem;
    border-bottom: 0.5px solid #535b671c;
    margin: 4px;
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    flex-wrap: wrap; /* responsive for smaller screens */
  }

  .title-section {
    flex: 1;
    min-width: 200px; /* prevent text from collapsing */
  }

  .title {
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    line-height: 1.2; /* improve readability */
  }

  .version-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    cursor: help;
  }

  .version-icon {
    background: #453b3b0d;
    padding: 0.25rem 0.6rem;
    border-radius: 6px; /* slightly rounder for modern look */
    font-size: 0.875rem;
    font-weight: 600;
    color: #4052a2e3;
    letter-spacing: 0.5px; /* subtle text refinement */
    transition:
      background 0.3s,
      transform 0.2s;
  }

  /* Optional description text below title */
  .header-description {
    font-size: 1rem;
    color: #d1d5db; /* softer gray for secondary text */
    margin-top: 0.25rem;
    line-height: 1.5;
  }

  .description {
    margin: 0;
    opacity: 0.9;
    font-size: 1rem;
    line-height: 1.6;
  }

  /* Extensions section */
  .extensions {
    padding: 1.5rem 2rem;
  }

  .extensions-card {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    padding: 1.5rem;
  }

  .extensions-title {
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
  }

  .extensions-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 0.75rem;
  }

  .extension-item {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.75rem;
    background: #f9fafb;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
  }

  .extension-key {
    font-weight: 600;
    color: #374151;
    font-size: 0.875rem;
    white-space: nowrap;
  }

  .extension-value {
    color: #6b7280;
    font-size: 0.875rem;
    font-family: 'Monaco', 'Courier New', monospace;
    word-break: break-word;
    overflow-wrap: break-word;
  }

  /* Metadata card (collapsible) */
  .metadata-card {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .metadata-header {
    cursor: pointer;
    user-select: none;
    padding: 0.5rem 1rem;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background-color 0.2s;
    list-style: none;
  }

  .metadata-header::-webkit-details-marker {
    display: none;
  }

  .metadata-header:hover {
    background-color: #f9fafb;
  }

  .metadata-toggle-icon {
    width: 1.125rem;
    height: 1.125rem;
    color: #6b7280;
    transition: transform 0.2s;
  }

  .metadata-card[open] .metadata-toggle-icon {
    transform: rotate(180deg);
  }

  .metadata-content {
    padding: 1.5rem;
    border-top: 1px solid #e5e7eb;
    background: #fafafa;
  }

  /* Search bar */
  .search-bar {
    display: flex;
    padding: 1.5rem 2rem 1rem 2rem;
    background: #ffffff;
  }

  .search-input {
    width: 100%;
    padding: 0.875rem 1rem 0.875rem 2.75rem;
    border: 2px solid #e5e7eb;
    border-radius: 4px;
    font-size: 0.9375rem;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%236b7280' viewBox='0 0 16 16'%3E%3Cpath d='M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: 0.875rem center;
    background-size: 1.125rem;
  }

  .search-input:focus {
    outline: none;
    border-color: #1f2937;
    box-shadow: 0 0 0 3px rgba(31, 41, 55, 0.08);
  }

  /* Components list */
  .components-list {
    padding: 1.5rem 2rem 2rem 2rem;
    display: grid;
    gap: 1rem;
  }

  .no-results {
    text-align: center;
    padding: 3rem 2rem;
    color: #6b7280;
    font-style: italic;
  }

  /* Component Card styles - Swagger-like */
  .component-card {
    background: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    overflow: hidden;
    transition: box-shadow 0.2s;
  }

  .component-card:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .component-header {
    cursor: pointer;
    user-select: none;
    padding-left: 16px;
    background: transparent;
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: background-color 0.2s;
  }

  .component-header:hover {
    background-color: #f9fafb;
  }

  .component-method-badge {
    padding: 1rem 1.25rem;
    background: #6366f1;
    color: #ffffff;
    min-width: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
  }

  .component-tag {
    flex: 1;
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
    font-family: 'Monaco', 'Courier New', monospace;
    margin: 0;
    word-break: break-word;
    padding: 1rem 0;
  }

  .component-toggle-icon {
    padding: 1rem 1.25rem;
    width: 1.25rem;
    height: 1.25rem;
    color: #6b7280;
    transition: transform 0.2s;
  }

  .component-card[open] .component-toggle-icon {
    transform: rotate(180deg);
  }

  .component-body {
    border-top: 1px solid #e5e7eb;
    background: #fafafa;
  }

  /* Sections - Props and Events (Swagger-style collapsible) */
  .section-item {
    border-bottom: 1px solid #e5e7eb;
  }

  .section-item:last-child {
    border-bottom: none;
  }

  .section-header {
    cursor: pointer;
    user-select: none;
    padding: 1rem 1.5rem;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background-color 0.2s;
    border: none;
  }

  .section-header:hover {
    background-color: #f9fafb;
  }

  .section-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .section-toggle-icon {
    width: 1rem;
    height: 1rem;
    color: #6b7280;
    transition: transform 0.2s;
  }

  .section-item[open] .section-toggle-icon {
    transform: rotate(180deg);
  }

  .section-content {
    padding: 1.5rem;
    background: #ffffff;
  }

  .code-block {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 0.8125rem;
    line-height: 1.6;
    max-width: 100%;
  }

  .code-block pre {
    margin: 0;
    white-space: pre;
    overflow-x: auto;
  }

  .code-block pre code {
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 0.8125rem;
    white-space: pre;
  }

  .empty-state {
    color: #9ca3af;
    font-style: italic;
    font-size: 0.875rem;
    padding: 0.75rem;
    text-align: left;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
  }

  /* Error styles */
  .error {
    background: #fef2f2;
    border: 1px solid #fca5a5;
    border-radius: 8px;
    padding: 1.5rem;
    margin: 1.5rem 2rem;
    color: #b91c1c;
  }

  .error-title {
    font-weight: 600;
    margin: 0 0 0.5rem 0;
  }

  .error-message {
    margin: 0;
    font-size: 0.875rem;
  }

  /* Loading state */
  .loading {
    text-align: center;
    padding: 3rem 2rem;
    color: #6b7280;
  }

  .spinner {
    width: 3rem;
    height: 3rem;
    border: 3px solid #e5e7eb;
    border-top-color: #4f46e5;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
