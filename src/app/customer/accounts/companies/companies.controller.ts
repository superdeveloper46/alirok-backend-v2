import { Body, Controller, Post, Query, Get, Param, Req } from '@nestjs/common';
import { Request } from 'express';
import { CreateCompanyDto } from './dto/createCompany.dto';
import { CompaniesService } from './companies.service';
import { Roles } from '../../../../common/decorator/roles.decorator';
import { CurrentUser } from '../../../../common/decorator/current-user.decorator';
import { users } from '@generated/client';
import { FindAllDto } from './dto/findAll.dto';
import { FindCompanyDto } from './dto/findCompany.dto';
import { UpdateImage } from './dto/updateCompanyImage.dto';

@Controller('customer/accounts/companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('searchCompanies')
  findAllCompanyMembers(
    @Query()
    query: FindAllDto,
  ) {
    return this.companiesService.findMemberCompany(query);
  }

  @Get('findCompanyMember')
  findCompany(
    @Query()
    query: FindCompanyDto,
  ) {
    return this.companiesService.findCompany(query);
  }

  @Roles('user')
  @Post()
  create(
    @Body()
    createCompanyDto: CreateCompanyDto,
    @CurrentUser() currentUser: users,
  ) {
    return this.companiesService.createCompany(createCompanyDto, currentUser);
  }

  @Post(':userId/user')
  createWithoutAuth(
    @Body()
    createCompanyDto: CreateCompanyDto,
    @Param('userId') userId: string,
  ) {
    return this.companiesService.createWithoutAuth(createCompanyDto, userId);
  }

  @Post('updateImage')
  updateImage(
    @Body()
    updateImage: UpdateImage,
    @Req() req: Request,
  ) {
    return this.companiesService.updateImage(updateImage, req);
  }
}
