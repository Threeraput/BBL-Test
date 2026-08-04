import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma.service';
import { BookmarksController } from './bookmarks.controller';
import { BookmarksService } from './bookmarks.service';

@Module({
  imports: [AuthModule],
  controllers: [BookmarksController],
  providers: [BookmarksService, PrismaService],
  exports: [BookmarksService],
})
export class BookmarksModule {}
