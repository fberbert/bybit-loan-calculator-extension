import React from 'react';
import { createRoot } from 'react-dom/client';
import { BybitLoanCalculator } from '../ui/BybitLoanCalculator';
import styles from '../styles/extension.css?inline';
import { getExtensionRoot } from './injectRoot';

const shadowRoot = getExtensionRoot();
const style = document.createElement('style');
style.textContent = styles;
shadowRoot.appendChild(style);

const appRoot = document.createElement('div');
appRoot.id = 'bybit-loan-diagnostics-app';
shadowRoot.appendChild(appRoot);

createRoot(appRoot).render(
  <React.StrictMode>
    <BybitLoanCalculator />
  </React.StrictMode>
);
