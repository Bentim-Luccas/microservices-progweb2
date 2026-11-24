
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { ClientProxy } from '@nestjs/microservices';
import { timeout } from 'rxjs';

import {
  CreateUserDto,
  UpdateUserDto,
} from '@app/contracts';

@Controller('users')
export class UsersController {
  constructor(
    @Inject('USERS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.client
      .send('users.create', dto)
      .pipe(timeout(3000));
  }

  @Get()
  findAll() {
    return this.client
      .send('users.findAll', {})
      .pipe(timeout(3000));
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.client
      .send('users.findOne', id)
      .pipe(timeout(3000));
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.client
      .send('users.update', {
        id,
        data: dto,
      })
      .pipe(timeout(3000));
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.client
      .send('users.remove', id)
      .pipe(timeout(3000));
  }
}
