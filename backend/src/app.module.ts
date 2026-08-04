import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { CollectionsModule } from './collections/collections.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [AuthModule, UsersModule, CollectionsModule, BookmarksModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
