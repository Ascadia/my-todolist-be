import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateTaskDto, EditTaskDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  getTasks(userId: number) {
    return this.prisma.task.findMany({
      where: {
        userId,
      },
    });
  }

  getTaskById(userId: number, taskId: number) {
    return this.prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });
  }

  async createTask(userId: number, dto: CreateTaskDto) {
    const bookmark = await this.prisma.task.create({
      data: {
        userId,
        ...dto,
      },
    });
    return bookmark;
  }

  async editTaskById(userId: number, taskId: number, dto: EditTaskDto) {
    // get the task by id
    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });
    // check if user own the task
    if (!task || task.userId !== userId) {
      throw new ForbiddenException('Access to resource denied');
    }
    // edit task
    return this.prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        ...dto,
      },
    });
  }

  async deleteTaskById(userId: number, taskId: number) {
    // get the task by id
    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });
    // check if user own the task
    if (!task || task.userId !== userId) {
      throw new ForbiddenException('Access to resource denied');
    }
    // delete task
    await this.prisma.task.delete({
      where: {
        id: taskId,
      },
    });
  }
}
