import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';
export class CreateTodoDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ required: true })
  title: string;

  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty({ required: true })
  completed: boolean;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ required: true })
  userId: number;
}
