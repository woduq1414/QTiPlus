import parseCookies from '@src/functions/cookies';
import useGlobalStore from '@src/store/globalStore';
import { useEffect, useState, useRef } from 'react';

interface ConInfoEditPageProps {
  packageIdx: number;
}

const ConInfoEditPage: React.FC<ConInfoEditPageProps> = props => {
  const { userPackageData, unicroId, setUserPackageData } = useGlobalStore();

  const packageIdx = props.packageIdx;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center pointer-events-none 
        `}>
      <div className="bg-white p-6 rounded-lg shadow-lg pointer-events-auto flex flex-col gap-4">
        <div className="flex flex-col gap-2">{packageIdx}</div>
        <div className="cursor-pointer bg-red-400" onClick={async () => {}}>
          저장
        </div>
        <div>unicro_id : {unicroId}</div>
      </div>
    </div>
  );
};

export default ConInfoEditPage;
