import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NewCreateParcelBookingDTO } from './dto/new-parcel-booking.dto';
import { ParcelBookingHelperService } from './parcel-booking-helper/parcel-booking-helper.service';

@Injectable()
export class ParcelBookingService {
  constructor(
    private readonly parcelBookingHelper: ParcelBookingHelperService,
    private readonly prisma: PrismaService,
  ) {}

  private validateDestinyPhoneNumberFormat(destiny: string, number: string) {
    switch (destiny) {
      case 'BR':
        if (number?.length !== 13 && number?.length !== 12)
          throw new BadRequestException(
            `Phone number in the wrong format for country ${destiny}.`,
          );

        return;
        break;

      default:
        return;
        break;
    }
  }

  async createParcelBooking(createData: NewCreateParcelBookingDTO) {
    try {
      let formattedCreateData = createData;

      const { uuid, draft } = formattedCreateData;

      console.time('create parcel booking');
      console.log('create parcel booking');

      const origin = createData?.quote?.whereFrom?.data?.country;
      const destiny = createData?.quote?.whereTo?.data?.country;

      if (createData?.recipient?.phone?.number) {
        this.validateDestinyPhoneNumberFormat(
          destiny,
          createData?.recipient?.phone?.number,
        );
      }

      if (origin === 'RU' || destiny === 'RU') {
        throw new BadRequestException(
          'Quotes not available for this origin and/or destination',
        );
      }

      if (createData.order.company.name === 'Fedex') {
        if (
          createData.quote.whatsInside.data.length > 1 ||
          createData.quote.whatsInside.data[0].pieces > 1
        ) {
          throw new BadRequestException('Multiple packages not available!');
        }
      }

      const {
        isRecipientWithCompanyId,
        isRecipientWithUserId,
        isSenderWithCompanyId,
        isSenderWithUserId,
        isRecipientWithMemberId,
        isSenderWithMemberId,
        membersIdInfo,
      } = this.validateMixIds(createData);

      console.timeLog('create parcel booking', 'validate mix ids');

      if (isSenderWithUserId || isSenderWithCompanyId || isSenderWithMemberId) {
        const address = isSenderWithUserId
          ? await this.parcelBookingHelper.findUserAddressData(
              formattedCreateData?.sender?.address.userId,
            )
          : isSenderWithCompanyId
          ? await this.parcelBookingHelper.findCompanyAddressData(
              formattedCreateData?.sender?.address.companyId,
            )
          : await this.parcelBookingHelper.findMemberAddressData(
              formattedCreateData?.sender?.address.memberId,
            );
        console.timeLog('create parcel booking', 'if has sender id, find');

        if (!address)
          throw new BadRequestException(
            'Sender user address not found or not completed!',
          );

        const senderInfo = membersIdInfo.senderUserIdInfo
          ? await this.parcelBookingHelper.findUserData(
              formattedCreateData?.sender?.userId,
            )
          : membersIdInfo.senderCompanyIdInfo
          ? await this.parcelBookingHelper.findCompanyData(
              formattedCreateData?.sender?.companyId,
            )
          : membersIdInfo.senderMemberIdInfo
          ? await this.parcelBookingHelper.findMemberData(
              formattedCreateData?.sender?.memberId,
            )
          : null;

        const dataSender =
          formattedCreateData.sender.pre_filled !== 'ADDRESS' && senderInfo
            ? {
                email: senderInfo?.email,
                phone: senderInfo?.phone,
                taxId: senderInfo?.taxId,
                companyName: senderInfo?.companyName,
                lastName: senderInfo?.lastName,
                firstName: senderInfo?.firstName,
              }
            : {};

        formattedCreateData = {
          ...formattedCreateData,
          quote: {
            ...formattedCreateData.quote,
            whereFrom: {
              data: {
                ...formattedCreateData?.quote?.whereFrom?.data,
                ...address,
              },
            },
          },
          sender: {
            ...formattedCreateData.sender,
            ...dataSender,
            address: {
              ...formattedCreateData?.sender?.address,
              ...address,
            },
          },
        };
      }
      if (
        isRecipientWithUserId ||
        isRecipientWithCompanyId ||
        isRecipientWithMemberId
      ) {
        const address = isRecipientWithUserId
          ? await this.parcelBookingHelper.findUserAddressData(
              formattedCreateData?.recipient?.address.userId,
            )
          : isRecipientWithCompanyId
          ? await this.parcelBookingHelper.findCompanyAddressData(
              formattedCreateData?.recipient?.address.companyId,
            )
          : await this.parcelBookingHelper.findMemberAddressData(
              formattedCreateData?.recipient?.address.memberId,
            );

        console.timeLog('create parcel booking', 'if has recipient id, find');

        if (!address)
          throw new BadRequestException(
            'Recipient user address not found or not completed!',
          );

        const recipientInfo = membersIdInfo.recipientUserIdInfo
          ? await this.parcelBookingHelper.findUserData(
              formattedCreateData?.recipient?.userId,
            )
          : membersIdInfo.recipientCompanyIdInfo
          ? await this.parcelBookingHelper.findCompanyData(
              formattedCreateData?.recipient?.companyId,
            )
          : membersIdInfo.recipientMemberIdInfo
          ? await this.parcelBookingHelper.findMemberData(
              formattedCreateData?.recipient?.memberId,
            )
          : null;

        const dataRecipient =
          formattedCreateData.recipient.pre_filled !== 'ADDRESS' &&
          recipientInfo
            ? {
                email: recipientInfo?.email,
                phone: recipientInfo?.phone,
                taxId: recipientInfo?.taxId,
                companyName: recipientInfo?.companyName,
                lastName: recipientInfo?.lastName,
                firstName: recipientInfo?.firstName,
              }
            : {};

        formattedCreateData = {
          ...formattedCreateData,
          quote: {
            ...formattedCreateData.quote,
            whereTo: {
              data: {
                ...formattedCreateData?.quote?.whereTo?.data,
                ...address,
              },
            },
          },
          recipient: {
            ...formattedCreateData.recipient,
            ...dataRecipient,
            address: {
              ...formattedCreateData?.recipient?.address,
              ...address,
            },
          },
        };
      }

      if ((!uuid && draft) || (!uuid && !draft)) {
        return await this.parcelBookingHelper.createPartialParcelBooking(
          formattedCreateData,
        );
      }

      if ((uuid && draft) || (uuid && !draft)) {
        return this.parcelBookingHelper.updateParcelBooking(
          formattedCreateData,
        );
      }
      console.timeEnd('create parcel booking');
    } catch (error) {
      console.log(error);
      console.timeEnd('create parcel booking');
      throw error;
    }
  }

  async getParcelBookingData(id: string): Promise<NewCreateParcelBookingDTO> {
    return await this.prisma.$transaction(async (prisma) => {
      try {
        const findBooking = await this.parcelBookingHelper.findParcelBooking(
          id,
          prisma,
        );

        const handleMembers =
          await this.parcelBookingHelper.handleParcelMembers(findBooking);

        const response: NewCreateParcelBookingDTO = {
          draft: true,
          order: findBooking.metadata as any,
          uuid: findBooking.parcel_booking_uuid,
          quote: findBooking.quote as any,
          user: {
            third_party: !!handleMembers.thirdParty,
            email: findBooking.users?.email,
            uuid: findBooking.user_uuid,
          },
        };

        if (handleMembers?.sender) {
          response.sender = this.parcelBookingHelper.formatMembersToActors(
            handleMembers.sender,
            findBooking.quote as any,
          );
        }

        if (handleMembers?.recipient) {
          response.recipient = this.parcelBookingHelper.formatMembersToActors(
            handleMembers.recipient,
            findBooking.quote as any,
          );
        }

        return response;
      } catch (error) {
        throw error;
      }
    });
  }

  private validateMixIds(createData: NewCreateParcelBookingDTO) {
    const isSenderWithUserId = !!createData?.sender?.address?.userId;
    const isSenderWithCompanyId = !!createData?.sender?.address?.companyId;
    const isSenderWithMemberId = !!createData?.sender?.address?.memberId;

    const isRecipientWithUserId = !!createData?.recipient?.address?.userId;
    const isRecipientWithCompanyId =
      !!createData?.recipient?.address?.companyId;
    const isRecipientWithMemberId = !!createData?.recipient?.address?.memberId;

    const membersIdInfo: {
      senderUserIdInfo: boolean;
      senderCompanyIdInfo: boolean;
      senderMemberIdInfo: boolean;
      recipientUserIdInfo: boolean;
      recipientCompanyIdInfo: boolean;
      recipientMemberIdInfo: boolean;
    } = {
      senderUserIdInfo: !!createData?.sender?.userId,
      senderCompanyIdInfo: !!createData?.sender?.companyId,
      senderMemberIdInfo: !!createData?.sender?.memberId,
      recipientUserIdInfo: !!createData?.recipient?.userId,
      recipientCompanyIdInfo: !!createData?.recipient?.companyId,
      recipientMemberIdInfo: !!createData?.recipient?.memberId,
    };

    return {
      isSenderWithUserId,
      isSenderWithCompanyId,
      isRecipientWithUserId,
      isRecipientWithCompanyId,
      isSenderWithMemberId,
      isRecipientWithMemberId,
      membersIdInfo,
    };
  }
}
