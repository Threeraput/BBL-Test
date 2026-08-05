import { IsNotEmpty, IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';

export class UpdateBookmarkDto {
  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  notes?: string | null;

  @IsString()
  @IsUUID()
  @IsOptional()
  collectionId?: string | null;
}

export class PatchBookmarkDto {
  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  notes?: string | null;

  @IsString()
  @IsUUID()
  @IsOptional()
  collectionId?: string | null;
}
