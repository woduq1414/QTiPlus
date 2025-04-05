import { DetailDataSingle } from './DetailData.js';

export interface RecentUsedDoubleCon {
  detailIdx: string;
  firstDoubleCon: DetailDataSingle;
  secondDoubleCon: DetailDataSingle;
  isDoubleCon?: boolean;
}
