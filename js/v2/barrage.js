import { state } from './state.js';
import { fetchComments } from './api.js';

export function initBarrage(config) {
  const container = document.getElementById('barrage');
  if (!container) return;

  setInterval(async () => {
    if (state.isTrackOccupied) return;

    const data = await fetchComments(
      config.apiBase,
      config.postId,
      state.lastFetchTimestamp
    );

    data.comments.forEach(c => state.barrageQueue.push(c));
    playNext(container);
  }, config.barrageInterval);
}

function playNext(container) {
  if (state.barrageQueue.length === 0) return;

  state.isTrackOccupied = true;
  const c = state.barrageQueue.shift();

  const el = document.createElement('div');
  el.className = 'barrage-item';
  el.textContent = c.content;

  container.appendChild(el);

  el.addEventListener('animationend', () => {
    el.remove();
    state.isTrackOccupied = false;
  });
}