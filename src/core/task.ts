export interface Task {
    readonly id: string;
    readonly description: string;
    readonly category: string;
    readonly priority: Priority;
    readonly status: TaskStatus;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly completedAt?: Date;
    readonly tags: readonly string[];
}

export enum Priority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent'
}

export enum TaskStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

export interface CreateTaskInput {
    description: string;
    category?: string;
    priority?: Priority;
    tags?: string[];
}

export interface UpdateTaskInput {
    description?: string;
    category?: string;
    priority?: Priority;
    status?: TaskStatus;
    tags?: string[];
}

export class TaskEntity {
    static create(input: CreateTaskInput): Task {
        const now = new Date();
        return {
            id: crypto.randomUUID(),
            description: input.description,
            category: input.category ?? 'general',
            priority: input.priority ?? Priority.MEDIUM,
            status: TaskStatus.PENDING,
            createdAt: now,
            updatedAt: now,
            tags: input.tags ?? [],
        };
    }

    static update(task: Task, input: UpdateTaskInput): Task {
        const updatedTask: Task = {
            ...task,
            description: input.description ?? task.description,
            category: input.category ?? task.category,
            priority: input.priority ?? task.priority,
            status: input.status ?? task.status,
            tags: input.tags ?? task.tags,
            updatedAt: new Date(),
        };

        // set completion time when status changes to completed
        if (input.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
            return { ...updatedTask, completedAt: new Date() };
        }

        return updatedTask;
    }

    static validateDescription(description: string): boolean {
        return description.trim().length > 0 && description.length <= 500;
    }

    static validateCategory(category: string): boolean {
        return /^[a-zA-Z0-9_-]+$/.test(category) && category.length <= 50;
    }

    static validateTags(tags: string[]): boolean {
        return tags.every(tag => /^[a-zA-Z0-9_-]+$/.test(tag) && tag.length <= 30) && tags.length <= 10;
    }
}