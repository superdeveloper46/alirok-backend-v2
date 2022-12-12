import { Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { FindByCompanyDto } from './dto/findByCompany.dto';
import { FindAllDto } from './dto/findAll.dto';
import { UsersService } from './users.service';
import { Roles } from '../../../../common/decorator/roles.decorator';

@Controller('admin/accounts/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles('admin')
  @Get('company/:id')
  findByCompany(
    @Param('id') id: string,
    @Query()
    query: FindByCompanyDto,
  ) {
    return this.usersService.findByCompany(id, query);
  }

  @Roles('admin')
  @Get()
  findAll(
    @Query()
    query: FindAllDto,
  ) {
    return this.usersService.findAll(query);
  }

  @Roles('admin')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Roles('admin')
  @Delete(':id')
  disableAccount(@Param('id') id: string) {
    return this.usersService.disableAccount(id);
  }

  @Roles('admin')
  @Post('activate/:id')
  activateAccount(@Param('id') id: string) {
    return this.usersService.activateAccount(id);
  }
}
