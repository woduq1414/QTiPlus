export interface DetailDataSingle {
  packageIdx: string;
  sort: string;
  detailIdx?: string;
  imgPath?: string;
  title?: string;
  tag?: string;
  who?: string[];
  isDoubleCon?: boolean;
}

export interface DetailDataDouble {
  presetKey?: string;
  firstDoubleCon: DetailDataSingle | null;
  secondDoubleCon: DetailDataSingle | null;
  tag: string;
  who?: string[];
  isDoubleCon?: boolean;
}

export type DetailData = DetailDataSingle | DetailDataDouble;
