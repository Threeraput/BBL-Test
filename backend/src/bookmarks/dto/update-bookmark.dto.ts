export class UpdateBookmarkDto {
  url!: string;
  title!: string;
  notes?: string;
  collectionId?: string;
}

export class PatchBookmarkDto {
  url?: string;
  title?: string;
  notes?: string;
  collectionId?: string;
}
