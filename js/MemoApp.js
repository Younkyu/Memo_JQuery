"use strict"
// Memo Class
class Memo {
  constructor(top, left, id, width, height, contents, zIndex) {
    this.width = width;
    this.height = height;
    this.contents = contents;
    this.top = top;
    this.left = left;
    this.zIndex = zIndex;
    this.id = id;
  }
}

const addEventListener = (canvas, memoApp) => {

  // addMemoListener
  // rightClick
  $(canvas).bind('contextmenu', (e) => {
    e.preventDefault();
    const { pageY, pageX } = e;
    memoApp.addMemo(pageY, pageX);
  });

  // addMemoCloseButtonListener
  $(document).on('click', '.btn_close', (e) => {
    const id = $(e.target).closest('.memo').attr('id');
    memoApp.removeMemo(id);
  });

  // addMemoMoverListener
  let $draggingMemo = null;
  $(canvas)
    .on('mousedown', '.header', function (e) {
      // if not close btn
      if ($(e.target).is('.btn_close')) return;
      // add Draggable
      $(this).attr('unselectable', 'on').addClass('draggable');
      e.preventDefault();
      $(canvas).on('mousemove', (e) => {
        // drag start
        if ($draggingMemo) {
          const id = $draggingMemo.attr('id');
          memoApp.moveMemo(e.pageY, e.pageX, id);
        }
      });
      $draggingMemo = $(e.target).closest('.memo');
    })
    .on('mouseup', '.memo', function () {
      // drag end
      $draggingMemo = null;
      $(this).removeAttr('unselectable').removeClass('draggable');
    });

  // addMemoSizeChangeListener
  let $draggingTextarea = null;
  $(canvas)
    .on('mousedown', '.btn_size', function (e) {
      $(this).attr('unselectable', 'on').addClass('draggable');
      e.preventDefault();
      // get current size end current x,y
      const x = e.pageX;
      const y = e.pageY;
      const { clientHeight } = $(e.target).prev()[0];
      const { clientWidth } = $(e.target).prev()[0];
      // drag start
      $(canvas).on('mousemove', (e) => {
        if ($draggingTextarea) {
          const id = $draggingTextarea.closest('.memo').attr('id');
          const newWidth = clientWidth + e.pageX - x;
          const newHeight = clientHeight + e.pageY - y;
          memoApp.changeSizeMemo(newWidth, newHeight, id);
        }
      });
      $draggingTextarea = $(e.target).prev();
    })
    // drag end
    .on('mouseup', '.btn_size', function () {
      $draggingTextarea = null;
      $(this).removeAttr('unselectable').removeClass('draggable');
    });

  // addTextAreaClickLister
  $(document).on('click', '.memo', (e) => {
    // if not close btn
    if ($(e.target).is('.btn_close')) return;
    const id = $(e.target).closest('.memo').attr('id');
    memoApp.upZIndexMemo(id);
  });

  // addWindowCloseListener
  // saveMemoData
  $(window).bind('beforeunload', () => {
    memoApp.saveAllMemo();
  });
}

// MemoApp Class
class MemoApp {
  constructor(canvas) {
    this.list = [];
    this.lastCreatedId = 1;
    this.lastZIndex = 1;
    this.canvas = canvas
    this.loadMemoData()
    addEventListener(canvas, this)
  }

  getNewMemoHtml = () => '<div class="memo" style="top:100px;left:100px">\n'
    + '            <div class="header">\n'
    + '                <h1 class="blind">메모장</h1>\n'
    + '                <button class="btn_close"><span class="blind">닫기</span></button>\n'
    + '            </div>\n'
    + '            <div class="content">\n'
    + '                <div class="textarea" contenteditable="true" style="width:200px; height:100px;">'
    + '                </div>\n'
    + '                <button class="btn_size"><span class="blind">메모장 크기 조절</span></button>\n'
    + '            </div>\n'
    + '        </div>'

  getNewId = () => {
    this.lastCreatedId = this.lastCreatedId * 1 + 1;
    return `memo${this.lastCreatedId}`;
  }

  getHighestZIndex = () => {
    this.lastZIndex = this.lastZIndex * 1 + 1;
    return this.lastZIndex;
  }

  moveMemo = (top, left, id) => {
    // memo Data
    const memo = this.list.find(v => v.id === id);
    const zIndex = this.getHighestZIndex();
    memo.top = top;
    memo.left = left;
    memo.zIndex = zIndex;

    // memo Html
    const memoHtml = $(`#${id}`);
    memoHtml
      .offset({
        top,
        left,
      })
      .css('z-index', zIndex);
  }

  changeSizeMemo = (width, height, id) => {
    // memo Data
    const memo = this.list.find(v => v.id === id);
    memo.width = width;
    memo.height = height;

    // memo Html
    const memoTextareaHtml = $(`#${id}`).find('.textarea');
    memoTextareaHtml.css({
      width,
      height,
    });
  }

  upZIndexMemo = (id) => {
    // memo Data
    const memo = this.list.find(v => v.id === id);
    const zIndex = this.getHighestZIndex();
    memo.zIndex = zIndex;

    // memo Html
    const memoHtml = $(`#${id}`);
    memoHtml.css('z-index', zIndex);

    // focus
    memoHtml.find('.textarea').focus()
  }

  addMemo = (top = 0, left = 0, id = this.getNewId(), width = 200, height = 100, contents = '', zIndex = this.getHighestZIndex()) => {
    const memo = new Memo(top, left, id, width, height, contents, zIndex);
    // create Memo
    $(this.getNewMemoHtml())
      .appendTo(this.canvas)
      .attr('id', memo.id)
      .offset({
        top,
        left,
      })
      .css('z-index', zIndex);
    $(`#${id}`)
      .find('.textarea')
      .css({ width, height })
      .html(contents)
      .focus();
    this.list = this.list.concat(memo);
  }

  removeMemo = (id) => {
    // memo Data
    this.list = this.list.filter(v => v.id !== id);

    // memo Html
    $(`#${id}`).remove();
  }

  saveAllMemo = () => {
    const { list } = this;
    const saveData = list
    // memo text save
      .map((memo) => {
        const { id } = memo;
        const memoTextareaHtml = $(`#${id}`).find('.textarea');
        const text = memoTextareaHtml.html();
        memo.contents = text;
        return memo;
      })
      // reset zIndex, id
      .sort((a, b) => a.zIndex * 1 - b.zIndex * 1)
      .map((memo, i) => {
        memo.zIndex = i + 1;
        memo.id = `memo${i + 1}`;
        return memo;
      });

    const listIndex = list.length + 1;

    // save at localStorage
    localStorage.setItem('memoLastCreatedId', listIndex);
    localStorage.setItem('memoLastZIndex', listIndex);
    localStorage.setItem('memoData', JSON.stringify(saveData));
  }

  loadMemoData = () => {
    const data = localStorage.getItem('memoData');
    const lastId = localStorage.getItem('memoLastCreatedId');
    const zIndex = localStorage.getItem('memoLastZIndex');
    this.lastCreatedId = lastId || 1;
    this.lastZIndex = zIndex || 1;
    if (data) {
      const dataObjectArray = JSON.parse(data);
      dataObjectArray.forEach((memo) => {
        this.addMemo(memo.top, memo.left, memo.id, memo.width, memo.height, memo.contents, memo.zIndex);
      });
    }
  }
}
