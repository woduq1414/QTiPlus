export interface ConItem {
  id: number;
  title: string;
  tag: string;
  who: boolean[];
}

export interface ConInfoEditPageProps {
  packageIdx: string;
}

export interface ConListData {
  title: string;
  conList: {
    [key: string]: {
      title: string;
      tag: string;
      imgPath: string;
      who: string[];
    };
  };
  packageIdx: string;
}

export interface CustomConList {
  conLabelList: {
    [key: string]: ConListData;
  };
}
