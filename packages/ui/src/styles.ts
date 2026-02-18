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
    background: #1f2937;
    color: #ffffff;
    padding: 2rem;
    border-bottom: 2px solid #374151;
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .title-section {
    flex: 1;
  }

  .title {
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .version-badge {
    display: inline-flex;
    align-items: center;
    cursor: help;
  }

  .version-icon {
    background: rgba(255, 255, 255, 0.15);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 600;
    transition: background 0.2s;
  }

  .version-icon:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  .description {
    margin: 0;
    opacity: 0.9;
    font-size: 1rem;
    line-height: 1.6;
  }

  /* Extensions section */
  .extensions {
    background: #f4f5f7;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .extensions-title {
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
    margin: 0 0 1rem 0;
  }

  .extensions-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 0.75rem;
  }

  .extension-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: #ffffff;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    transition: box-shadow 0.2s;
  }

  .extension-item:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .extension-key {
    font-weight: 600;
    color: #374151;
    font-size: 0.875rem;
  }

  .extension-value {
    color: #6b7280;
    font-size: 0.875rem;
    font-family: 'Monaco', 'Courier New', monospace;
  }

  /* Search bar */
  .search-bar {
    padding: 1.5rem 2rem;
    background: #ffffff;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 1rem;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%236b7280' viewBox='0 0 16 16'%3E%3Cpath d='M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: 0.75rem center;
    background-size: 1rem;
  }

  .search-input:focus {
    outline: none;
    border-color: #1f2937;
    box-shadow: 0 0 0 3px rgba(31, 41, 55, 0.08);
  }

  /* Components list */
  .components-list {
    padding: 1.5rem 2rem;
  }

  .no-results {
    text-align: center;
    padding: 3rem 2rem;
    color: #6b7280;
    font-style: italic;
  }

  /* Accordion styles */
  .accordion-item {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 1rem;
    overflow: hidden;
    transition: box-shadow 0.2s;
  }

  .accordion-item:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .accordion-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    background: #ffffff;
    cursor: pointer;
    user-select: none;
    transition: background 0.2s;
  }

  .accordion-header:hover {
    background: #f4f5f7;
  }

  .accordion-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    font-family: 'Monaco', 'Courier New', monospace;
    margin: 0;
  }

  .accordion-icon {
    width: 1.25rem;
    height: 1.25rem;
    transition: transform 0.2s;
  }

  .accordion-item[open] .accordion-icon {
    transform: rotate(180deg);
  }

  .accordion-content {
    padding: 1.5rem;
    background: #f4f5f7;
    border-top: 1px solid #e5e7eb;
  }

  /* Code blocks */
  .code-section {
    margin-bottom: 1.5rem;
  }

  .code-section:last-child {
    margin-bottom: 0;
  }

  .code-label {
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
    margin: 0 0 0.75rem 0;
  }

  .code-block {
    background: #f4f5f7;
    border: 1px solid #e5e7eb;
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 0.875rem;
    line-height: 1.6;
  }

  .code-block pre {
    margin: 0;
    white-space: pre;
  }

  .code-block pre code {
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 0.875rem;
    white-space: pre;
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
