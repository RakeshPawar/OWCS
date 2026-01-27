import { createRoot, Root } from 'react-dom/client';

import { ProductDetail, ProductSearchProps } from './types';

export class ProductSearchWidgetElement extends HTMLElement implements ProductSearchProps {
  private _data?: ProductSearchProps['data'];
  private reactRoot?: Root;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  get data() {
    return this._data!;
  }

  set data(data: ProductSearchProps['data']) {
    this._data = data;
    this.render();
  }

  connectedCallback() {
    const reactRootElement = document.createElement('div');
    reactRootElement.className = 'contents font-verlag text-web-body-regular-md leading-web-body-regular-md font-web-body-regular text-neutral-50';
    this.reactRoot = createRoot(reactRootElement);
    this.shadowRoot!.appendChild(reactRootElement);

    this.style.display = 'contents';

    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  disconnectedCallback() {
    this.shadowRoot!.replaceChildren();
    this.reactRoot?.unmount();
    this.reactRoot = undefined;
  }

  handleProductSelect(searchTerm: string, productDetail: ProductDetail) {
    this.dispatchEvent(
      new CustomEvent('PRODUCT_SELECT', {
        detail: { searchTerm, productDetail },
      })
    );
  }

  handleNoInstrumentFound(notFound: boolean) {
    this.dispatchEvent(
      new CustomEvent('NO_INSTRUMENT_FOUND', {
        detail: notFound,
      })
    );
  }

  handleEmptyMessageActionClick() {
    this.dispatchEvent(new CustomEvent('NO_INSTRUMENT_MESSAGE_ACTION'));
  }

  private render() {
    if (!this.isConnected || !this._data || !this.reactRoot) return;

    this.reactRoot.render(<></>);
  }
}

if (!customElements.get('product-search-webpack-element')) customElements.define('product-search-webpack-element', ProductSearchWidgetElement);
