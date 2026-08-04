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
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { type AuthenticatedRequest } from '../auth/auth.types';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { PatchCollectionDto, UpdateCollectionDto } from './dto/update-collection.dto';

@UseGuards(AuthGuard)
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  list(@Req() req: AuthenticatedRequest) {
    return this.collectionsService.list(req.auth!.subject);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.collectionsService.getOne(id, req.auth!.subject);
  }

  @Post()
  create(@Body() dto: CreateCollectionDto, @Req() req: AuthenticatedRequest) {
    return this.collectionsService.create(req.auth!.subject, dto);
  }

  @Put(':id')
  replace(
    @Param('id') id: string,
    @Body() dto: UpdateCollectionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.collectionsService.replace(id, req.auth!.subject, dto);
  }

  @Patch(':id')
  patch(
    @Param('id') id: string,
    @Body() dto: PatchCollectionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.collectionsService.patch(id, req.auth!.subject, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.collectionsService.remove(id, req.auth!.subject);
  }
}
