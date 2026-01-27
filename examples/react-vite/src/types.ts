export type ProductSearchProps = {
  data: {
    pattern?: string;
    showEmptyMessage?: boolean;
    onlyShowOfferedUniverse?: boolean;
    bookingCenter?: string;
    hideGridWhenEmpty?: boolean;
    emptyMessageActionTitle?: string;
    showTradeButton?: boolean;
    allowSetupBmo?: boolean;
  };
  onProductSelect?: (searchTerm: string, productDetail: ProductDetail) => void;
  onNoInstrumentFound?: (notFound: boolean) => void;
  noInstrumentFoundMessageAction?: () => void;
  productTypeChanged?: () => void;
};

export type ProductDetail = {
  assetClass: string;
  isAvailableInPsp: boolean;
};
