import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { type AuthenticatedRequest } from '../auth/auth.types';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { PatchBookmarkDto, UpdateBookmarkDto } from './dto/update-bookmark.dto';

@UseGuards(AuthGuard)
@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Get()
  list(
    @Query('collectionId') collectionId: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bookmarksService.list(req.auth!.subject, collectionId);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.bookmarksService.getOne(id, req.auth!.subject);
  }

  @Post()
  create(@Body() dto: CreateBookmarkDto, @Req() req: AuthenticatedRequest) {
    return this.bookmarksService.create(req.auth!.subject, dto);
  }

  @Put(':id')
  replace(
    @Param('id') id: string,
    @Body() dto: UpdateBookmarkDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bookmarksService.replace(id, req.auth!.subject, dto);
  }

  @Patch(':id')
  patch(
    @Param('id') id: string,
    @Body() dto: PatchBookmarkDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bookmarksService.patch(id, req.auth!.subject, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.bookmarksService.remove(id, req.auth!.subject);
  }
}
