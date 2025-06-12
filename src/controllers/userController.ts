import { Request, Response } from 'express';
import { CreateUserRequest, UpdateUserRequest, PaginationQuery } from '../types';
import { createResponse } from '../utils/helpers';
import config from '../utils/config';
import userService from '../services/userService';

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = config.pagination.defaultLimit, sortBy = 'createdAt', sortOrder = 'desc', search } = req.query as PaginationQuery & { [key: string]: string };

    // Convert to numbers and validate
    const pageNum = Math.max(1, parseInt(page.toString(), 10));
    const limitNum = Math.min(config.pagination.maxLimit, Math.max(1, parseInt(limit.toString(), 10)));

    let users, total;

    if (search && search.trim()) {
      // Search functionality
      const searchResults = await userService.searchUsers(search.trim());
      const startIndex = (pageNum - 1) * limitNum;
      users = searchResults.slice(startIndex, startIndex + limitNum);
      total = searchResults.length;
    } else {
      // Regular pagination
      const result = await userService.getAllUsers(pageNum, limitNum, sortBy, sortOrder as 'asc' | 'desc');
      users = result.users;
      total = result.total;
    }

    const response = {
      users,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalUsers: total,
        hasNextPage: (pageNum - 1) * limitNum + users.length < total,
        hasPrevPage: pageNum > 1,
        limit: limitNum
      },
      ...(search && { searchQuery: search })
    };

    res.json(createResponse(true, 'Users retrieved successfully', response));
  } catch (error) {
    res.status(500).json(createResponse(false, 'Failed to retrieve users', null, (error as Error).message));
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    if (!user) {
      res.status(404).json(createResponse(false, 'User not found'));
      return;
    }

    res.json(createResponse(true, 'User retrieved successfully', user));
  } catch (error) {
    res.status(500).json(createResponse(false, 'Failed to retrieve user', null, (error as Error).message));
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userData: CreateUserRequest = req.body;
    const newUser = await userService.createUser(userData);

    res.status(201).json(createResponse(true, 'User created successfully', newUser));
  } catch (error) {
    const message = (error as Error).message;
    const statusCode = message.includes('already exists') ? 400 : 500;
    res.status(statusCode).json(createResponse(false, message));
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateUserRequest = req.body;
    
    const updatedUser = await userService.updateUser(id, updateData);
    res.json(createResponse(true, 'User updated successfully', updatedUser));
  } catch (error) {
    const message = (error as Error).message;
    let statusCode = 500;
    
    if (message.includes('not found')) {
      statusCode = 404;
    } else if (message.includes('already in use')) {
      statusCode = 400;
    }
    
    res.status(statusCode).json(createResponse(false, message));
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedUser = await userService.deleteUser(id);

    res.json(createResponse(true, 'User deleted successfully', deletedUser));
  } catch (error) {
    const message = (error as Error).message;
    const statusCode = message.includes('not found') ? 404 : 500;
    res.status(statusCode).json(createResponse(false, message));
  }
};

export const getUserStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await userService.getUserStats();
    res.json(createResponse(true, 'User statistics retrieved successfully', stats));
  } catch (error) {
    res.status(500).json(createResponse(false, 'Failed to retrieve user statistics', null, (error as Error).message));
  }
};
