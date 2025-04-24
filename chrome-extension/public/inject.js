if (window.location.href.includes('/write/')) {
  let focusPosition = undefined;

  window.addEventListener('message', event => {
    // console.log("QTIPLUS_MESSAGE", event);
    if (event.source !== window) return;
    if (event.data.type === 'INSERT_DCCON_EDITOR') {
      const conList = event.data.data.conList;
      const isBigCon = event.data.data.isBigCon;

      const isMobileVersion = window.location.host === 'm.dcinside.com';
      const isDoubleCon = conList.length === 2;

      if (isMobileVersion) {
        if (focusPosition) {
          restoreCursorPosition();
        }
        // console.log(conList.map(con => {
        //     return {
        //         img_tag: `
        //        <img class="written_dccon dccon-img ${isBigCon ? 'bigdccon' : ''}"
        //         src="https:${con.imgPath}"
        //         alt="1" detail="${con.detailIdx}"></span><span class="cont-inr">
        //         `,
        //         img_src: `https:${con.imgPath}`,
        //         detail_idx: con.detailIdx,
        //         result: "ok",
        //         alt: "1"

        //     }
        // }))

        if (isDoubleCon) {
          const html = `
                <div class="block dccon" contenteditable="false">
                <span class="cont dccon"><span class="cont-inr"><button type="button" class="sp-imgclose con-close">
                <span class="blind">삭제</span></button><div class="dccon-view-box double">
                <img class="written_dccon ${isBigCon ? 'bigdccon' : ''}" src="https:${conList[0].imgPath}" alt="1" detail="${conList[0].detailIdx}"></div></span>
                <span class="cont-inr"><span class="pos"><span class="order-handle"></span></span>
                <div class="dccon-view-box double"><img class="written_dccon ${isBigCon ? 'bigdccon' : ''}" src="https:${conList[1].imgPath}" alt="2" 
                detail="${conList[1].detailIdx}"></div></span></span>
                </div><p><br></p>
                `;
          document.execCommand('insertHTML', false, html);
        } else {
          const html = `
                <div class="block dccon" contenteditable="false">
                <span class="cont dccon"><span class="cont-inr"><button type="button" class="sp-imgclose">
                <span class="blind">삭제</span></button><span class="pos">
                <span class="order-handle"></span></span>
                <div class="dccon-view-box"><img class="written_dccon ${isBigCon ? 'bigdccon' : ''}" 
                src="https:${conList[0].imgPath}"
                alt="0" detail="${conList[0].detailIdx}"></div></span></span>
                </div><p><br></p>
                `;
          //         $('#memo').summernote('pasteHTML', );

          document.execCommand('insertHTML', false, html);
        }

        // $("#textbox").summernote("insertDccon", conList.map(con => {
        //     return {
        //         img_tag: `
        //        <img class="written_dccon dccon-img ${isBigCon ? 'bigdccon' : ''}"
        //         src="https:${con.imgPath}"
        //         alt="1" detail="${con.detailIdx}"></span><span class="cont-inr">
        //         `,
        //         img_src: `https:${con.imgPath}`,
        //         detail_idx: con.detailIdx,
        //         result : "ok",
        //         alt : "1"

        //     }
        // }), conList.length, isBigCon ? "bigdccon dccon-img" : "dccon-img");
      } else {
        waitForAttach().then(async found => {
          if (found) {
            if (focusPosition) {
              restoreCursorPosition();
            }
            window.insert_icon(
              conList
                .map(con => {
                  return `<img class="written_dccon ${isBigCon ? 'bigdccon' : ''}" src="https:${con.imgPath}" conalt="0" alt="0" con_alt="0" title="0" detail="${con.detailIdx}">`;
                })
                .join(''),
            );
          } else {
          }
        });
      }
    }
  });

  // document.querySelector(".note-editable").addEventListener("click", () => {
  //     console.log("memo click");
  // });

  // document.querySelector(".note-editable").addEventListener("focus", () => {
  //     console.log("memo focus");
  // });

  document.querySelector('.note-editable').addEventListener('blur', () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      focusPosition = selection.getRangeAt(0).cloneRange();
    }

    // console.log(focusPosition);
  });

  function restoreCursorPosition() {
    if (focusPosition) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(focusPosition);
    }
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function waitForAttach(timeout = 5000) {
    const start = Date.now();
    while (typeof window.attach !== 'function') {
      if (Date.now() - start > timeout) {
        return false;
      }
      await sleep(500);
    }
    return true;
  }
}
