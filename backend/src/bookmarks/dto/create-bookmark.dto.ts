export class CreateBookmarkDto {
  url!: string;
  title!: string;
  notes?: string;
  collectionId?: string;
}
