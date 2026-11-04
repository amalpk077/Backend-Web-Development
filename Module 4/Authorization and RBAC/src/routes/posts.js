const express = require('express');
const { posts } = require('../data');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// List posts — any authenticated user.
router.get('/', (req, res) => {
  return res.status(200).json(posts);
});

// Create a post — the caller becomes the author.
router.post('/', (req, res) => {
  const post = {
    id: String(posts.length + 1),
    authorId: req.user.id,
    title: req.body?.title ?? 'Untitled',
    hidden: false,
  };
  posts.push(post);
  return res.status(201).json(post);
});

function canManagePost(user, post) {
  return user.id === post.authorId || user.role === 'moderator' || user.role === 'admin';
}

// Update a post.
router.patch('/:id', (req, res) => {
  const post = posts.find((p) => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post not found' } });
  }

  if (!canManagePost(req.user, post)) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action' } });
  }

  post.title = req.body?.title ?? post.title;
  return res.status(200).json(post);
});

// Delete a post.
router.delete('/:id', (req, res) => {
  const idx = posts.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post not found' } });
  }

  if (!canManagePost(req.user, posts[idx])) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action' } });
  }

  posts.splice(idx, 1);
  return res.status(200).json({ ok: true });
});

// Hide a post — should be moderator/admin only.
router.post('/:id/hide', requireRole('moderator', 'admin'), (req, res) => {
  const post = posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post not found' } });
  post.hidden = true;
  return res.status(200).json(post);
});

module.exports = router;
