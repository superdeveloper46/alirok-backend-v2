import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  Req,
  Put,
} from '@nestjs/common';
import { Roles } from '../../common/decorator/roles.decorator';
import { CompanyRelationshipsService } from './company-relationships.service';
import { CurrentCompany } from '../../common/decorator/current-company.decorator';
import { Request } from 'express';
import {
  ParcelRateRelationshipsDTO,
  ParcelRateRelationshipsQueryDTO,
  CreateVendorDTO,
  FetchPendingInviteDTO,
  SearchCompanyDTO,
  FetchAllInviteByConnectTypeDTO,
  AcceptPendingInviteDTO,
  VerifyInvitationDTO,
} from './dto/company-relationships.dto';

@Controller('company-relationships')
export class CompanyRelationshipsController {
  constructor(
    private readonly companyRelationshipsService: CompanyRelationshipsService,
  ) {}

  @Roles('user')
  @Get('/parcel-rate-relationships/:relationType')
  findAllCustomerRelationships(
    @CurrentCompany() currentCompany: string,
    @Param() { relationType }: ParcelRateRelationshipsDTO,
    @Query() queryPrams: ParcelRateRelationshipsQueryDTO,
  ) {
    return this.companyRelationshipsService.findAllCustomerRelationships({
      currentCompany,
      relationType,
      queryParams: queryPrams,
    });
  }

  @Roles('user')
  @Get('/search-companies/')
  searchCompanies(
    @Query() query: SearchCompanyDTO,
    @CurrentCompany() currentCompany: string,
  ) {
    return this.companyRelationshipsService.searchCompanies(
      query,
      currentCompany,
    );
  }

  @Get('/verify-invitation/:companyRelationUUID')
  verifyInvitation(@Param() params: VerifyInvitationDTO) {
    return this.companyRelationshipsService.verifyInvitation(params);
  }

  @Roles('user')
  @Get('/invites-list/:relationType')
  fetchAllInvitations(
    @Param() { relationType }: ParcelRateRelationshipsDTO,
    @CurrentCompany() currentCompany: string,
  ) {
    return this.companyRelationshipsService.fetchAllInvitations(
      relationType,
      currentCompany,
    );
  }

  @Roles('user')
  @Get('/invitations/count')
  fetchInvitationsCount(@CurrentCompany() currentCompany: string) {
    return this.companyRelationshipsService.fetchInvitationsCount(
      currentCompany,
    );
  }

  @Roles('user')
  @Get('/invitations/:connectType/:relationType?')
  fetchAllInviteByConnectType(
    @Param() params: FetchAllInviteByConnectTypeDTO,
    @CurrentCompany() currentCompany: string,
  ) {
    return this.companyRelationshipsService.fetchAllInviteByConnectType(
      params,
      currentCompany,
    );
  }

  @Roles('user')
  @Post('/invite/:relationType')
  createVendor(
    // Create a Vendor or Customer invitation
    @Param() { relationType }: ParcelRateRelationshipsDTO,
    @CurrentCompany() currentCompany: string,
    @Body() createVendor: CreateVendorDTO,
    @Req() request: Request,
  ) {
    return this.companyRelationshipsService.createVendor(
      relationType,
      createVendor,
      currentCompany,
      request,
    );
  }

  @Roles('user')
  @Get('/pending-invite/:relationType/:relationshipUUID')
  fetchPendingInvite(
    @Param() params: FetchPendingInviteDTO,
    @CurrentCompany() currentCompany: string,
  ) {
    return this.companyRelationshipsService.fetchPendingInvite(
      params,
      currentCompany,
    );
  }

  @Roles('user')
  @Put('/accept-pending-invite/:relationType/:relationshipUUID')
  acceptPendingInvite(
    @Param() params: FetchPendingInviteDTO,
    @Body() inviteData: AcceptPendingInviteDTO,
    @CurrentCompany() currentCompany: string,
  ) {
    return this.companyRelationshipsService.acceptPendingInvite(
      params,
      currentCompany,
      inviteData,
    );
  }
}
