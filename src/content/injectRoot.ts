export function getExtensionRoot(): ShadowRoot {
  const existing = document.getElementById('bybit-loan-calculator-extension-root');
  if (existing?.shadowRoot) {
    placeHost(existing);
    return existing.shadowRoot;
  }

  const host = document.createElement('div');
  host.id = 'bybit-loan-calculator-extension-root';
  host.style.display = 'inline-flex';
  host.style.alignItems = 'center';
  host.style.height = '40px';
  host.style.zIndex = '2147483647';
  placeHost(host);
  watchHeaderDeposit(host);
  return host.attachShadow({ mode: 'open' });
}

function placeHost(host: HTMLElement): void {
  const deposit = document.getElementById('HEADER-DEPOSIT');
  const parent = deposit?.parentElement;

  if (deposit && parent) {
    if (host.parentElement !== parent || host.nextElementSibling !== deposit) {
      parent.insertBefore(host, deposit);
    }
    return;
  }

  if (!host.parentElement) {
    document.body.appendChild(host);
  }
}

function watchHeaderDeposit(host: HTMLElement): void {
  const observer = new MutationObserver(() => {
    placeHost(host);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}
