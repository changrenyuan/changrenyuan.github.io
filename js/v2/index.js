import { initCommentList } from './list.js';
import { initBarrage } from './barrage.js';

const config = {
  apiBase: '',
  postId: '',
  enableBarrage: false,
  barrageInterval: 5000,
  ...(window.__COMMENT_CONFIG__ || {})
};

document.addEventListener('DOMContentLoaded', () => {
  initCommentList(config);
  if (config.enableBarrage) initBarrage(config);
});