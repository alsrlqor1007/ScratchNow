import { Request, Response } from 'express';
import { Post } from '../models/post';
import { User } from '../models/user';
import { Comment } from '../models/comment';
import { Liking } from '../models/liking';
import { tokenAuthentication } from './authFunctions';

const postsController = {
  getPost: async (req: Request, res: Response) => {
    const { id } = req.query;

    try {
      await Post.findOne({
        where: { id: Number(id) },
        include: [
          {
            model: User,
            as: 'userHasManyPosts',
            attributes: ['id', 'nickname', 'profile_image_url'],
          },
        ],
      }).then((data) => {
        res.json({ data: data, message: `Post detail of post id ${id}` });
      });
    } catch (err) {
      res.status(404).json({ message: 'Invalid post id' });
    }
  },

  createPost: async (req: Request, res: Response) => {
    const { painting_url, text, user_id } = req.body;

    await Post.create({ painting_url, text, user_id }).then((data) => {
      res.status(201).json({ postData: data, message: `Created the post` });
    });
  },

  modifyPost: async (req: Request, res: Response) => {
    const tokenValidity = tokenAuthentication(req);
    const { post_id, painting_url, text } = req.body;

    if (!tokenValidity) {
      res.status(404).json({ message: 'Invalid Token' });
    } else {
      try {
        await Post.update(
          { painting_url, text },
          { where: { id: post_id } },
        ).then(() => {
          res.status(200).json({ message: `Modified the post ${post_id}` });
        });
      } catch (err) {
        res.status(404).json({ message: 'Invalid post id' });
      }
    }
  },

  deletePost: async (req: Request, res: Response) => {
    const tokenValidity = tokenAuthentication(req);
    const { id } = req.query;

    if (!tokenValidity) {
      res.status(404).json({ message: 'Invalid Token' });
    } else {
      await Post.destroy({ where: { id: Number(id) } })
        .then(() => {
          Comment.destroy({ where: { post_id: Number(id) } });
          Liking.destroy({ where: { post_id: Number(id) } });
        })
        .then(() => {
          res.status(200).json({ message: `Soft deleted the post ${id}` });
        });
    }
  },
};

export default postsController;
