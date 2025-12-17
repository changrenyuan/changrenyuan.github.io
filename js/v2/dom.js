import { formatDate } from './utils.js';
import { likeComment } from './api.js';

export function createCommentItem(comment, config) {
  const div = document.createElement('div');
  div.className = 'comment-item';

  div.innerHTML = `
    <div class="meta">
      <span class="author">${comment.author}</span>
      <span class="time">${formatDate(comment.timestamp)}</span>
    </div>
    <div class="content">${comment.content}</div>
    <button class="like">👍 ${comment.likes}</button>
  `;

  div.querySelector('.like').onclick = async () => {
    await likeComment(config.apiBase, comment.id);
  };

  return div;
}