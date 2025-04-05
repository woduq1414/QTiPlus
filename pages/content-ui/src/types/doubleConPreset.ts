export interface DoubleCon {
  imgPath: string;
  packageIdx: string;
  sort: string;
  title: string;
}

export interface DoubleConPresetItem {
  presetKey: string;
  tag: string;
  firstDoubleCon: DoubleCon;
  secondDoubleCon: DoubleCon;
}

export interface DoubleConPresetData {
  [key: string]: {
    tag: string;
    firstDoubleCon: {
      packageIdx: string;
      sort: string;
    };
    secondDoubleCon: {
      packageIdx: string;
      sort: string;
    };
  };
}

export interface CustomConList {
  doubleConPreset?: DoubleConPresetData;
}
