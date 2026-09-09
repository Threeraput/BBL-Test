import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBookmarkDto {
  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsUUID()
  @IsOptional()
  collectionId?: string;
}
