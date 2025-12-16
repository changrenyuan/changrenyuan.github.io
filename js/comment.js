// comment.js
(function() {
  // ===== 配置 =====
  const API_BASE = 'https://api.yikii.cn/api/message'; // Cloudflare Workers API 地址
  const ARTICLE_ID = window.location.pathname.replace(/\//g, '-'); // 每篇文章唯一ID

  // ===== 创建 DOM =====
  const container = document.createElement('div');
  container.id = 'comments-container';
  container.innerHTML = `
    <h3>留言板</h3>
    <div id="comments-list"></div>
    <button id="wechat-login-btn">微信登录留言</button>
    <textarea id="comment-text" placeholder="输入留言" style="width:100%;height:80px;margin-top:5px"></textarea>
    <button id="submit-comment-btn">提交留言</button>
  `;
  document.body.appendChild(container);

  // ===== 加载留言 =====
  async function loadComments() {
    try {
      const res = await fetch(API_BASE);
      const comments = await res.json();
      const list = document.getElementById('comments-list');
      if (comments.length === 0) {
        list.innerHTML = '<p>暂无留言</p>';
        return;
      }
      list.innerHTML = comments
        .map(c => `<p>${c.content} <small>${new Date(c.time).toLocaleString()}</small></p>`)
        .join('');
    } catch(e) {
      console.error('加载留言失败', e);
    }
  }

  // ===== 微信登录 =====
  document.getElementById('wechat-login-btn').onclick = () => {
    window.open(`${API_BASE}/wechat-login`, '_blank', 'width=500,height=600');
  };

  // ===== 提交留言 =====
  document.getElementById('submit-comment-btn').onclick = async () => {
    const content = document.getElementById('comment-text').value.trim();
    if (!content) return alert('留言不能为空');

    try {
      const res = await fetch(`${API_BASE}/submit-comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: ARTICLE_ID, content })
      });
      if (res.status === 200) {
        alert('留言成功');
        document.getElementById('comment-text').value = '';
        loadComments();
      } else if (res.status === 401) {
        alert('请先微信登录');
      } else {
        alert('提交失败');
      }
    } catch(e) {
      console.error('提交留言失败', e);
    }
  };

  // ===== 页面加载时初始化 =====
  loadComments();

})();
