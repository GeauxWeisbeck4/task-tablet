import { ensureDir } from "jsr:@std/fs";
import { join } from "jsr:@std/path";
import { Task, TaskStatus } from "./task.ts";

export interface StorageRepository {
    save(task: Task): Promise<void>;
    findById(id: string): Promise<Task | null>;
    findAll(): Promise<Task[]>;
    findByStatus(status: TaskStatus): Promise<Task[]>;
    findByCategory(category: string): Promise<Task[]>;
    update(id: string, task: Task): Promise<boolean>;
    delete(id: string): Promise<boolean>;
    search(query: string): Promise<Task[]>;
}

export class FileStorageRepository implements StorageRepository {
    private readonly dataDir: string;
    private readonly taskFile: string;

    constructor(dataDir?: string) {
        const homeDir = Deno.env.get('HOME') ?? Deno.env.get('USERPROFILE') ?? '.';
        this.dataDir = dataDir ?? join(homeDir, '.task-logger');
        this.taskFile = join(this.dataDir, 'tasks.json');
    }

    async save(task: Task): Promise<void> {
        await this.ensureDataDir();
        const tasks = await this.loadTasks();
        tasks.push(task);
        await this.saveTasks(tasks);
    }

    async findById(id: string): Promise<Task | null> {
        const tasks = await this.loadTasks();
        return tasks.find((task: Task) => task.id === id) ?? null;
    }

    async findAll(): Promise<Task[]> {
      return await this.loadTasks();
    }

    async findByStatus(status: TaskStatus): Promise<Task[]> {
        const tasks = await this.loadTasks();
        return tasks.filter(task => task.status === status);
    }

    async findByCategory(category: string): Promise<Task[]> {
      const tasks = await this.loadTasks();
      return tasks.filter(task => task.category === category);
    }

    async update(id: string, updatedTask: Task): Promise<boolean> {
        const tasks = await this.loadTasks();
        const index = tasks.findIndex(task => task.id === id);

        if (index === -1) return false;

        tasks[index] = updatedTask;
        await this.saveTasks(tasks);
        return true;
    }

    async delete(id: string): Promise<boolean> {
        const tasks = await this.loadTasks();
        const filteredTasks = tasks.filter(task => task.id !== id);

        if (filteredTasks.length === tasks.length) return false;

        await this.saveTasks(filteredTasks);
        return true;
    }

    async search(query: string): Promise<Task[]> {
        const tasks = await this.loadTasks();
        const searchTerm = query.toLowerCase();

        return tasks.filter(task => 
            task.description.toLowerCase().includes(searchTerm) ||
            task.category.toLowerCase().includes(searchTerm) ||
            task.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }

    private async ensureDataDir(): Promise<void> {
        await ensureDir(this.dataDir);
    }

    private async loadTasks(): Promise<Task[]> {
        try {
            const data = await Deno.readTextFile(this.taskFile);
            const parsed = JSON.parse(data);

            return parsed.map((task: Task) => ({
                ...task,
                createdAt: new Date(task.createdAt),
                updatedAt: new Date(task.updatedAt),
                completedAt: task.completedAt ? new Date(task.completedAt): undefined,
            }));
        } catch (error) {
            if (error instanceof Deno.errors.NotFound) {
                return [];
            }
            throw error;
        }
    }

    private async saveTasks(tasks: Task[]): Promise<void> {
        await this.ensureDataDir();
        await Deno.writeTextFile(this.taskFile, JSON.stringify(tasks, null, 2));
    }
}