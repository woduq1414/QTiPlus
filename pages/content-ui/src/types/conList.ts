export interface ConPackage {
  title: string;
  mainImg: string;
  packageIdx: string;
  isHide: boolean;
  conList: {
    [key: string]: {
      title: string;
      tag: string;
      imgPath: string;
      who: string[];
    };
  };
}

export interface ConLabel {
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
    [key: string]: ConLabel;
  };
  doubleConPreset?: any; // TODO: 구체적인 타입 정의 필요
}

export interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  importedFileData: any; // TODO: 구체적인 타입 정의 필요
  setConLabelList: (data: any) => void;
  setDoubleConPreset: (data: any) => void;
}

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPackageData: { [key: string]: ConPackage } | null;
  isHideState: { [key: string]: boolean };
  userId: string;
}

export interface ConListItemProps {
  who: string;
  packageData: ConPackage;
  customConData: ConLabel | null;
  isEditMode: boolean;
  isHideState: { [key: string]: boolean };
  onToggleHide: (packageIdx: string) => void;
  onClick: () => void;
}
