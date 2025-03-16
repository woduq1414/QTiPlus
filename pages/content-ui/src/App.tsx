import { useEffect } from 'react';
import { ToggleButton } from '@extension/ui';
import { exampleThemeStorage } from '@extension/storage';
import { t } from '@extension/i18n';

export default function App() {
  useEffect(() => {
    console.log('content ui loaded');
  }, []);
  function parseCookies(): Record<string, string> {
    return document.cookie
      .split("; ")
      .reduce<Record<string, string>>((cookies, cookie) => {
        const [key, value] = cookie.split("=");
        if (key) {
          cookies[key] = decodeURIComponent(value || "");
        }
        return cookies;
      }, {});
  }

  function getQueryValue(paramName: string) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(paramName);
  }



  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[999999999]">
      <div className="bg-white p-6 rounded-lg shadow-lg pointer-events-auto flex flex-col gap-20">
        <div
          className='cursor-pointer'
          onClick={() => {
            const cookies = parseCookies();
            const ci_t = cookies["ci_c"];

            chrome.storage.local.get([`AllPackageData_${ci_t}`], function (result) {
              console.log('Value currently is ', result[`AllPackageData_${ci_t}`]);
            });

            return;
 
            // 사용 예시
            const postNumber = getQueryValue('no');
            const galleryId = getQueryValue('id');
            console.log(postNumber, galleryId);

            const check6Value = document.getElementById("check_6")?.getAttribute("value");
            const check7Value = document.getElementById("check_7")?.getAttribute("value");
            const check8Value = document.getElementById("check_8")?.getAttribute("value");

            console.log(check6Value, check7Value, check8Value);



            // 사용 예시
 



            const packageIdx = 151346;
            const detailIdx = 1241690924;
            const name = document.getElementsByClassName("user_info_input")[0].children[0].textContent;


            fetch("https://gall.dcinside.com/dccon/insert_icon", {
              "headers": {
                "accept": "*/*",
                "accept-language": "ko,en-US;q=0.9,en;q=0.8,ja;q=0.7,de;q=0.6",
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "sec-ch-ua": "\"Chromium\";v=\"134\", \"Not:A-Brand\";v=\"24\", \"Google Chrome\";v=\"134\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-requested-with": "XMLHttpRequest"
              },
              "referrer": `https://gall.dcinside.com/mgallery/board/view/?id=qwer_fan&no=${postNumber}&page=1`,
              "referrerPolicy": "unsafe-url",
              "body": `id=${galleryId}&no=${postNumber}&package_idx=${packageIdx}&detail_idx=${detailIdx}&double_con_chk=&name=${name}&ci_t=${ci_t}&input_type=comment&t_vch2=&t_vch2_chk=&c_gall_id=qwer_fan&c_gall_no=${postNumber}&g-recaptcha-response=&check_6=${check6Value}&check_7=${check7Value}&check_8=${check8Value}&_GALLTYPE_=M`,
              "method": "POST",
              "mode": "cors",
              "credentials": "include"
            }).then(response => {
              console.log(response);
              const refreshButton = document.getElementsByClassName("btn_cmt_refresh")[0] as HTMLButtonElement;
              refreshButton?.click();
            })


          }}>
          버튼
        </div>

        <div
          className='cursor-pointer bg-red-400'
          onClick={async () => {
            const cookies = parseCookies();
            const ci_t = cookies["ci_c"];

            async function fetchList(page: number) {
              const response = await fetch("https://gall.dcinside.com/dccon/lists", {
                "headers": {
                  "accept": "*/*",
                  "accept-language": "ko,en-US;q=0.9,en;q=0.8,ja;q=0.7,de;q=0.6",
                  "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                  "sec-ch-ua": "\"Chromium\";v=\"134\", \"Not:A-Brand\";v=\"24\", \"Google Chrome\";v=\"134\"",
                  "sec-ch-ua-mobile": "?0",
                  "sec-ch-ua-platform": "\"Windows\"",
                  "sec-fetch-dest": "empty",
                  "sec-fetch-mode": "cors",
                  "sec-fetch-site": "same-origin",
                  "x-requested-with": "XMLHttpRequest"
                },
                "referrer": "https://gall.dcinside.com/mgallery/board/view",
                "referrerPolicy": "unsafe-url",
                "body": `ci_t=${ci_t}&target=icon&page=${page}`,
                "method": "POST",
                "mode": "cors",
                "credentials": "include"
              })
              const data = await response.json();
              
              // 500 밀리 초 후에 리턴
              await new Promise(resolve => setTimeout(resolve, 500));
              return data;



            }

            let data = await fetchList(0);
  

            const maxPage = data.max_page + 1;
            // const maxPage = 1;

            function processData(data: any) {
              const list = data.list;

              const result: { [key: number]: { packageIdx: number; conList: { [key: string]: string }; title: string } } = {

              }
              list.forEach((item: any) => {
                const detailList = item.detail;

                if (detailList.length === 0) {
                  return;
                }

                const packageIdx = detailList[0].package_idx;
                let packageResult: { packageIdx: number; conList: { [key: string]: string }; title: string } = {
                  packageIdx: packageIdx,
                  conList: {},
                  title: item.title
                };
                detailList.forEach((detailItem: any) => {
                  const detailIdx = detailItem.detail_idx;
                  const sort = detailItem.sort;
                  packageResult.conList[sort] = detailIdx;

                });



                result[packageIdx] = packageResult;
              });

 

              return result;


            }

            let allResult = {} as any;

            for (let i = 0; i < maxPage; i++) {
              if (i === 0) {
        
                Object.assign(allResult, processData(data));

              } else {
                data = await fetchList(i);
                Object.assign(allResult, processData(data));
              }

            }

    
            
            const storageKey = `AllPackageData_${ci_t}`;

            chrome.storage.local.set({ [storageKey]: allResult }, function () {
              console.log('Value is set to ', allResult);
            }
            );
            

          }}>
          동기화하기기
        </div>
      </div>
    </div>
  );
}
