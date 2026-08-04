import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BookmarksModule } from '../bookmarks/bookmarks.module';
import { PrismaService } from '../prisma.service';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';

@Module({
  imports: [AuthModule, BookmarksModule],
  controllers: [CollectionsController],
  providers: [CollectionsService, PrismaService],
  exports: [CollectionsService],
})
export class CollectionsModule {}
