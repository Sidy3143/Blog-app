// routes/userRouter.js
const router = require('express').Router();
const userController = require('../controllers/userController');
const { requireAuth, requireAdmin } = require('../auth/authMiddleware');

router.post('/signup', userController.postSignup);

router.post('/login', userController.postLogin);

router.get('/posts', userController.getPosts);
router.post('/posts', requireAdmin, userController.postCreatePost);

router.get('/posts/:slug', userController.getPost);
router.put('/posts/:id', requireAdmin, userController.updatePost); // keep id for update
router.delete('/posts/:id', requireAdmin, userController.deletePost);

router.get('/posts/:slug/comments', userController.getComments);
router.post('/posts/:slug/comments', requireAuth, userController.postComment); 
router.put('/posts/:slug/comments/:commentId', requireAuth, userController.updateComment); 
router.delete('/posts/:slug/comments/:commentId', requireAuth, userController.deleteComment);


module.exports = router;