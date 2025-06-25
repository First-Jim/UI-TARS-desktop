import { ApiProperty } from '@nestjs/swagger';
import { Todos } from '@prisma/client';
export class TodoEntity implements Todos {
  @ApiProperty()
  id: number;
  @ApiProperty()
  title: string;
  @ApiProperty()
  completed: boolean;
  @ApiProperty()
  userId: number;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
}
