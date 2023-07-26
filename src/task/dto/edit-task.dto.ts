import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class EditTaskDto {
  @IsString()
  @IsOptional()
  text?: string;

  @IsBoolean()
  @IsOptional()
  isDone?: boolean;
}
