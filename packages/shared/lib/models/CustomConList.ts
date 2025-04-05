import { DetailData, DetailDataSingle } from './DetailData.js';

export interface CustomConList {
  conLabelList: ConLabelList;
  doubleConPreset: DoubleConPreset;
}

export interface ConLabelList {
  [key: string]: {
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
  };
}

export interface DoubleConPreset {
  [presetKey: string]: {
    firstDoubleCon: DetailDataSingle;
    secondDoubleCon: DetailDataSingle;
    tag: string;
  };
}

// "152583-21/152583-22": {
//   "firstDoubleCon": {
//     "imgPath": "//dcimg5.dcinside.com/dccon.php?no=62b5df2be09d3ca567b1c5bc12d46b394aa3b1058c6e4d0ca41648b658ea2471eed949887dc103ac9e62c11feaee83da271bd3ad4780a5279a17ce8bf12c8ca02ea84362d94b8763170525d640",
//     "packageIdx": "152583",
//     "sort": "21",
//     "title": "21"
//   },
//   "presetKey": "152583-21/152583-22",
//   "secondDoubleCon": {
//     "imgPath": "//dcimg5.dcinside.com/dccon.php?no=62b5df2be09d3ca567b1c5bc12d46b394aa3b1058c6e4d0ca41648b658ea2471eed949887dc103ac9e62c11feaee83da271bd3ad4780a5279a17ce8bf12c8ca02ea84362d94b8763140525d640",
//     "packageIdx": "152583",
//     "sort": "22",
//     "title": "22"
//   },
//   "tag": "밍파쿵야중단"
// },
