// we're buiilding a blog API
// userController.js

const prisma = require('../lib/prisma.js');
const passport = require("../config/passport.js");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {body, validationResult, matchedData} = require('express-validator');
const { get } = require('http');


const validateSignup = [
  body('email').trim().isEmail().withMessage("Invalid email address"),
  body('password').isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
];


const postSignup = [
  validateSignup,
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = matchedData(req);

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.create({ data: { email, password: hashedPassword } });
      
      return res.json({ success: true, message: 'User registered successfully' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
]

const validateLogin = [
  body('email').trim().isEmail().withMessage("Invalid email address"),
  body('password').notEmpty().withMessage("Password is required"),
  body('password').custom(async (value, { req }) => {
    const user = await prisma.user.findUnique({
      where: {
        email: req.body.email
      }
    });

    if (!user) {
      throw new Error('Invalid email');
    }

    const isMatch = await bcrypt.compare(value, user.password);
    if (!isMatch) {
      throw new Error('Invalid password');
    }
    return true;
  })
]


const postLogin = [
  validateLogin,
  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    // sign the user in and return a JWT token
    try {
      const user = await prisma.user.findUnique({ where: { email: req.body.email } });
      const token = jwt.sign(
        { sub: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      return res.json({ success: true, token, role: user.role });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
]

const getPosts = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({});
    res.json({ success: true, posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

const getPost = async (req, res) => {
  const slug = req.params.slug;

  try {
    const post = await prisma.post.findUnique({
      where: { slug },
      include: { author: true }
    });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    return res.json({ success: true, post });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

const getComments = async (req, res) => {
    const slug = req.params.slug;

    try {
       const post = await prisma.post.findUnique({ where: { slug } });
      if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
      const comments = await prisma.comment.findMany({
        where: { postId: post.id },
        include: { author: true }
      });
      return res.json({ success: true, comments });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
}

const postComment = async (req, res) => {
    const slug = req.params.slug;

    const { content } = req.body;

    try {
      const post = await prisma.post.findUnique({ where: { slug } });
      if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

      const comment = await prisma.comment.create({
      data: { content, postId: post.id, authorId: req.user.id }
      });
      
      return res.json({ success: true, comment });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
}

const getCreatePost = async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  return res.json({ success: true, message: 'Render post form' });
}

const postCreatePost = async (req, res) => {
  const { title, content } = req.body;
  const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

  try {
    const post = await prisma.post.create({
        data: { title, content, slug, authorId: req.user.id }
    });
    return res.json({ success: true, post });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// PATCH /posts/:id  
const updatePost = async (req, res) => {
  const postId = parseInt(req.params.id);
  const { title, content } = req.body;
  const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

  try {
    const post = await prisma.post.update({
      where: { id: postId },
      data: { title, content, slug }  // slug can be changed freely
    });
    return res.json({ success: true, post });
  } catch (err) {
    // Prisma throws P2002 on unique constraint violation
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Slug already taken' });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// DELETE /posts/:id
const deletePost = async (req, res) => {
  const postId = parseInt(req.params.id);

  try {
    await prisma.post.delete({ where: { id: postId } });
    return res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}  

const updateComment = async (req, res) => {
  const commentId = parseInt(req.params.commentId);
  const { content } = req.body;

  try {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    // check if the comment belongs to the user
    if (comment.authorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    
    const updatedComment = await prisma.comment.update({
      where: { id: commentId, authorId: req.user.id },
      data: { content }
    });
    return res.json({ success: true, comment: updatedComment });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

const deleteComment = async (req, res) => {
  const commentId = parseInt(req.params.commentId);

  try {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    // check if the comment belongs to the user
    if (comment.authorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    await prisma.comment.delete({
      where: { id: commentId, authorId: req.user.id }
    });
    return res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = {
    postSignup, // validation + handler
    postLogin,  // validation + handler
    getLogout,
    getPosts,
    getPost,
    getComments,
    postComment,
    updateComment,
    deleteComment,
    getCreatePost,
    postCreatePost,
    updatePost,
    deletePost
}
