import { fetchComments } from './api.js';
import { createCommentItem } from './dom.js';
import { state } from './state.js';

export async function initCommentList(config) {
  const container = document.getElementById('comment-list');
  if (!container) {
    console.warn('[comment] comment-list not found');
    return;
  }

  const data = await fetchComments(config.apiBase, config.postId);
  const frag = document.createDocumentFragment();

  data.comments.forEach(c => {
    frag.appendChild(createCommentItem(c, config));
    state.lastFetchTimestamp = Math.max(state.lastFetchTimestamp, c.timestamp);
  });

  container.appendChild(frag);
}