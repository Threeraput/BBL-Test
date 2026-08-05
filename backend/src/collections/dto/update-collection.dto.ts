import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class UpdateCollectionDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class PatchCollectionDto {
  @IsString()
  @IsOptional()
  name?: string;
}
