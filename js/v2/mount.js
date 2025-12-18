export function mountCommentDOM() {
  const anchor = document.getElementById('comments-section');

  if (!anchor) {
    console.error('[comment] #comments-section not found');
    return null;
  }

  // 只移除 noscript，不清空整个容器
  const noscript = anchor.querySelector('noscript');
  if (noscript) {
    noscript.remove();
  }

  // 如果已经挂载过，直接返回
  let root = document.getElementById('comment-root');
  if (root) {
    return {
      root,
      barrage: root.querySelector('#barrage'),
      list: root.querySelector('#comment-list')
    };
  }

  root = document.createElement('div');
  root.id = 'comment-root';

  root.innerHTML = `
    <div id="barrage"></div>
    <div id="comment-list"></div>
  `;

  anchor.appendChild(root);

  return {
    root,
    barrage: root.querySelector('#barrage'),
    list: root.querySelector('#comment-list')
  };
}
