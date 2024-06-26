export type TabDescriptor = {
  url?: string;
  title?: string;
  favIconUrl?: string;
  pinned?: boolean;
  cookieStoreId?: string;
};

export type TabSetDescriptor = {
  key: string;
  data: TabDescriptor[];
  color?: string;
  size?: [width: number, height: number];
};
