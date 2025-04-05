import React from 'react';
import useGlobalStore from '@src/store/globalStore';
import { Page } from '@src/enums/Page';
import { ConInfoEditPageProps } from '@src/types/conInfo';
import ConItem from '@src/components/ConItem';
import { useConInfo } from '@src/hooks/useConInfo';

const ConInfoEditPage: React.FC<ConInfoEditPageProps> = ({ packageIdx }) => {
  const { userPackageData, setCurrentPage, setIsEditMode } = useGlobalStore();

  const { items, handleChange, saveConInfo } = useConInfo(packageIdx, userPackageData);

  if (!userPackageData) {
    return <div>데이터가 없습니다.</div>;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none max-w-[100vw] mx-auto flex-col z-[999999999]">
      <div
        className="bg-[rgba(246,246,246,0.75)] p-6 rounded-2xl shadow-2xl pointer-events-auto flex flex-col gap-4 
          text-black dark:bg-[rgba(46,46,46,0.75)] dark:text-white"
        style={{ backdropFilter: 'blur(15px)' }}>
        <div className="flex flex-row">
          <div
            className="w-[90px] cursor-pointer"
            onClick={() => {
              setCurrentPage(Page.CON_LIST);
              setIsEditMode(true);
            }}>
            이전
          </div>
          <div className="flex-grow text-center font-semibold">
            <h1>{userPackageData[packageIdx].title}</h1>
          </div>
          <div className="w-[90px]" />
        </div>

        <div className="flex flex-col gap-2 sm:gap-8 max-h-[65vh] overflow-y-auto overflow-auto scrollbar">
          {userPackageData[packageIdx] &&
            Object.keys(userPackageData[packageIdx].conList).map(key => {
              const item = items.find(i => i.id === parseInt(key));
              if (!item) return null;

              return (
                <ConItem
                  key={key}
                  item={item}
                  imgPath={userPackageData[packageIdx].conList[key].imgPath}
                  onItemChange={handleChange}
                />
              );
            })}
        </div>

        <div
          className="cursor-pointer text-center text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 
            focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 
            dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
          onClick={saveConInfo}>
          저장
        </div>
      </div>
    </div>
  );
};

export default ConInfoEditPage;
