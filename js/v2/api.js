export async function fetchComments(apiBase, postId, since = 0) {
  const res = await fetch(`${apiBase}/list?postId=${postId}&since=${since}`);
  return res.json();
}

export async function submitComment(apiBase, data) {
  const res = await fetch(`${apiBase}/add`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function likeComment(apiBase, id) {
  const res = await fetch(`${apiBase}/like?id=${id}`);
  return res.json();
}