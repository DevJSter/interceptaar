import { User, CreateUserRequest, UpdateUserRequest } from '../types';
import { generateId } from '../utils/helpers';

class UserService {
  private users: User[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      createdAt: new Date('2024-01-16'),
      updatedAt: new Date('2024-01-16')
    }
  ];

  async getAllUsers(
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ users: User[]; total: number }> {
    // Simulate async operation
    await this.delay(10);

    // Sort users
    const sortedUsers = [...this.users].sort((a, b) => {
      const aValue = (a as any)[sortBy];
      const bValue = (b as any)[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedUsers = sortedUsers.slice(startIndex, startIndex + limit);

    return {
      users: paginatedUsers,
      total: this.users.length
    };
  }

  async getUserById(id: string): Promise<User | null> {
    await this.delay(5);
    return this.users.find(user => user.id === id) || null;
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    await this.delay(15);

    const existingUser = this.users.find(u => u.email === userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const newUser: User = {
      id: generateId(),
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: string, updateData: UpdateUserRequest): Promise<User> {
    await this.delay(10);

    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    // Check if email already exists (excluding current user)
    if (updateData.email) {
      const existingUser = this.users.find(u => u.email === updateData.email && u.id !== id);
      if (existingUser) {
        throw new Error('Email is already in use by another user');
      }
    }

    const updatedUser: User = {
      ...this.users[userIndex],
      ...(updateData.name && { name: updateData.name.trim() }),
      ...(updateData.email && { email: updateData.email.toLowerCase().trim() }),
      updatedAt: new Date()
    };

    this.users[userIndex] = updatedUser;
    return updatedUser;
  }

  async deleteUser(id: string): Promise<User> {
    await this.delay(5);

    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    const deletedUser = this.users.splice(userIndex, 1)[0];
    return deletedUser;
  }

  async searchUsers(query: string): Promise<User[]> {
    await this.delay(20);

    const lowerQuery = query.toLowerCase();
    return this.users.filter(user => 
      user.name.toLowerCase().includes(lowerQuery) ||
      user.email.toLowerCase().includes(lowerQuery)
    );
  }

  async getUserStats(): Promise<{ total: number; recent: number }> {
    await this.delay(5);

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recent = this.users.filter(user => user.createdAt > oneDayAgo).length;

    return {
      total: this.users.length,
      recent
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new UserService();
