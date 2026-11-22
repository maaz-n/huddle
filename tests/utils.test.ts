import { describe, it, expect } from 'vitest';
import { cn, isOverdue } from '@/lib/utils';
import type { TasksWithAssignees } from '@/types/types';

describe('lib/utils', () => {
  it('cn merges tailwind classes properly', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('isOverdue returns false for completed tasks', () => {
    const task: TasksWithAssignees = {
      id: '1',
      title: 'Test Task',
      description: null,
      status: 'done',
      priority: 'low',
      workspaceId: 'w1',
      assigneeId: 'u1',
      createdBy: 'u1',
      dueDate: new Date(Date.now() - 86400000).toISOString(),
      revisionNote: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { id: 'u1', name: 'User', email: 'user@example.com', image: null },
    };
    expect(isOverdue(task)).toBe(false);
  });

  it('isOverdue returns true for past due tasks that are not done', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const task: TasksWithAssignees = {
      id: '2',
      title: 'Overdue Task',
      description: null,
      status: 'todo',
      priority: 'high',
      workspaceId: 'w1',
      assigneeId: 'u1',
      createdBy: 'u1',
      dueDate: yesterday.toISOString(),
      revisionNote: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { id: 'u1', name: 'User', email: 'user@example.com', image: null },
    };
    expect(isOverdue(task)).toBe(true);
  });
});
