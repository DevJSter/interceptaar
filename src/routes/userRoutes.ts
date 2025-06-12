import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/userController';
import {
  validateUserCreation,
  validateUserUpdate,
  validatePagination
} from '../middlewares/validation';

const router = Router();

// GET /api/users - Get all users with pagination
router.get('/', validatePagination, getAllUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', getUserById);

// POST /api/users - Create new user
router.post('/', validateUserCreation, createUser);

// PUT /api/users/:id - Update user
router.put('/:id', validateUserUpdate, updateUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', deleteUser);

export default router;
