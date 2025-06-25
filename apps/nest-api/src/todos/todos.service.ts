import { Injectable } from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TodosService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createTodoDto: CreateTodoDto) {
    return this.prisma.todos.create({
      data: { ...createTodoDto },
    });
  }

  findAll() {
    return this.prisma.todos.findMany();
  }

  findOne(id: number) {
    return this.prisma.todos.findUnique({ where: { id: id } });
  }

  update(id: number, updateTodoDto: UpdateTodoDto) {
    return this.prisma.todos.update({
      where: { id: id },
      data: updateTodoDto,
    });
  }

  remove(id: number) {
    return this.prisma.todos.delete({ where: { id } });
  }
}
