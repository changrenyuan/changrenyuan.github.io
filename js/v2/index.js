import { initCommentList } from './list.js';
import { initBarrage } from './barrage.js';
import { mountCommentDOM } from './mount.js';

const config = {
  apiBase: '',
  postId: '',
  enableBarrage: false,
  barrageInterval: 5000,
  ...(window.__COMMENT_CONFIG__ || {})
};

document.addEventListener('DOMContentLoaded', () => {
  const dom = mountCommentDOM();

  if (!dom) return;

  initCommentList(config);

  if (config.enableBarrage) {
    initBarrage(config);
  }
});
