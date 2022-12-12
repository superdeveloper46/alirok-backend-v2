import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Put,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../../../../common/decorator/roles.decorator';
import { CurrentUser } from '../../../../common/decorator/current-user.decorator';
import { users } from '@generated/client';
import { IdentifyDto } from './dto/identify.dto';
import { FindAllDto } from './dto/findAll.dto';
import { LoginDto } from './dto/login.dto';
import { SetPasswordDto } from './dto/setPassword.dto';
import { FindUniqueDto } from './dto/findUniqueDto.dto';
import { UpdatePhotoDto } from './dto/updatePhoto.dto';
import { Request } from 'express';
@Controller('customer/accounts/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles('user')
  @Get('currentUser')
  currentUser(@CurrentUser() currentUser: users) {
    return this.usersService.currentUser(currentUser);
  }

  @Roles('user')
  @Put('update')
  updateUser(@CurrentUser() currentUser: users, @Body() updateUserData: any) {
    return this.usersService.updateUser(currentUser, updateUserData);
  }

  @Get('maskedUser')
  findMaskedUser(
    @Query()
    query: FindUniqueDto,
  ) {
    return this.usersService.findMaskedUser(query);
  }

  @Get('maskedAddresses')
  findMaskedAddresses(
    @Query()
    query: FindAllDto,
  ) {
    return this.usersService.findMaskedAddresses(query);
  }

  @Post('identify')
  identify(
    @Body()
    identifyDto: IdentifyDto,
  ) {
    return this.usersService.identify(identifyDto);
  }

  @Post('register')
  registerUser(
    @Body()
    register,
    @Req() request: Request,
  ) {
    return this.usersService.registerUser(register, request);
  }

  @Get('confirm-email/:user_uuid/:token')
  confirmEmail(@Param() confirmEmailData, @Req() request: Request) {
    return this.usersService.confirmEmail(confirmEmailData, request);
  }

  @Put('update-password')
  updatePassword(@Param() confirmEmailData) {
    return this.usersService.updatePassword(confirmEmailData);
  }

  @Post('login')
  login(
    @Body()
    loginDto: LoginDto,
    @Req() request: Request,
  ) {
    return this.usersService.login(loginDto, request);
  }

  @Post('setPassword')
  setPassword(
    @Body()
    setPasswordDto: SetPasswordDto,
    @Req() request: Request,
  ) {
    return this.usersService.setPassword(setPasswordDto, request);
  }

  @Post('updatePhoto')
  updatePhoto(
    @Body()
    updatePhotoDto: UpdatePhotoDto,
  ) {
    return this.usersService.updatePhoto(updatePhotoDto);
  }
}
