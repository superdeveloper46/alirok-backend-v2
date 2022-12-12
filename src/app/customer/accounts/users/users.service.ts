import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  administrative_divisions,
  administrative_division_types,
  locations,
  location_administrative_divisions,
  postal_codes,
  users,
} from '@generated/client';

import { compareSync, hashSync } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

import { PrismaService } from '../../../../prisma/prisma.service';
import { AddressService } from '../../../misc/address/address.service';
import { S3Service } from '../../../../vendors/s3/s3.service';
import { IdentifyDto } from './dto/identify.dto';
import { FindAllDto } from './dto/findAll.dto';
import { maskString, maskEmail } from '../../../../helpers/mask-string.helper';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { SetPasswordDto } from './dto/setPassword.dto';
import { FindUniqueDto } from './dto/findUniqueDto.dto';
import { UpdatePhotoDto } from './dto/updatePhoto.dto';
import { SendgridService } from 'src/vendors/sendgrid/sendgrid.service';
import { Request } from 'express';

const VERIFY_EMAIL_ROUTE = 'email-confirmation';
const RESET_PASSWORD_ROUTE = 'reset-password';

@Injectable()
export class UsersService {
  private API_KEY: string;
  private BUCKET_NAME: string;

  constructor(
    private readonly S3Service: S3Service,
    private readonly prisma: PrismaService,
    private readonly addressService: AddressService,
    private readonly configService: ConfigService,
    private readonly sendgridService: SendgridService,
  ) {
    this.API_KEY = configService.get('API_KEY');
    this.BUCKET_NAME = configService.get<string>('BUCKET_NAME');
  }

  formatUserAddress(
    user: users & {
      locations: locations & {
        location_administrative_divisions: (location_administrative_divisions & {
          administrative_divisions: administrative_divisions & {
            administrative_division_types: administrative_division_types;
          };
        })[];
        postal_codes: postal_codes;
      };
    },
  ) {
    const cityObj =
      user.locations &&
      user.locations.location_administrative_divisions &&
      user.locations.location_administrative_divisions.find(
        (e) =>
          e.administrative_divisions.administrative_division_types.name ===
          'city',
      );

    const streetObj =
      user.locations &&
      user.locations.location_administrative_divisions &&
      user.locations.location_administrative_divisions.find(
        (e) =>
          e.administrative_divisions.administrative_division_types.name ===
          'street',
      );

    const stateObj =
      user.locations &&
      user.locations.location_administrative_divisions &&
      user.locations.location_administrative_divisions.find(
        (e) =>
          e.administrative_divisions.administrative_division_types.name ===
          'state',
      );

    const countryObj =
      user.locations &&
      user.locations.location_administrative_divisions &&
      user.locations.location_administrative_divisions.find(
        (e) =>
          e.administrative_divisions.administrative_division_types.name ===
          'country',
      );

    const postalCodeObj = user.locations && user?.locations?.postal_codes;
    const complement = user?.locations?.complement ?? '';
    const street_number = user?.locations?.street_number ?? '';
    const addressType = user?.locations?.address_type ?? 'RESIDENTIAL';
    const rawAddress = user?.locations?.raw_address ?? '';

    delete user.locations;

    return {
      ...user,
      home_address: {
        complement_address: complement,
        street_number: street_number,
        postal_code: postalCodeObj && postalCodeObj.value,
        city: cityObj && cityObj.administrative_divisions.value,
        street: streetObj && streetObj.administrative_divisions.value,
        state: stateObj && stateObj.administrative_divisions.value,
        country: countryObj && countryObj.administrative_divisions.value,
        address_type: addressType,
        raw_address: rawAddress,
      },
    };
  }

  async currentUser(currentUser: users) {
    try {
      const user = await this.prisma.users.findUnique({
        where: { user_uuid: currentUser.user_uuid },
        include: {
          locations: {
            include: {
              postal_codes: true,
              location_administrative_divisions: {
                include: {
                  administrative_divisions: {
                    include: {
                      administrative_division_types: true,
                    },
                  },
                },
              },
            },
          },
          companies: {
            select: {
              company_uuid: true,
              legal_name: true,
              fantasy_name: true,
              tax_id: true,
              logo: true,
              icon: true,
              currency_uuid: true,
              alirok_terms_agreement: true,
              user_uuid: true,
              company_type_uuid: true,
              onboarding_finished: true,
              email: true,
              phone: true,
              headquarter_address_uuid: true,
              is_registered: true,
              company_types: true,
            },
          },
        },
      });

      const formattedUser = this.formatUserAddress(user);

      return formattedUser;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  emailTokenHasExpired = (tokenExpiresDate) => {
    const now = new Date();
    return now > tokenExpiresDate;
  };

  async passwordIsValid(incomingPassword, password) {
    return await compareSync(incomingPassword, password);
  }

  async resetPassword(origin: string, user: users) {
    const token = crypto.randomBytes(50).toString('hex');

    const tokenExpiresIn = new Date();
    tokenExpiresIn.setDate(tokenExpiresIn.getDate() + 1);

    await this.prisma.users.update({
      data: {
        confirm_email_token: token,
        confirm_email_token_expires: tokenExpiresIn,
      },
      where: { user_uuid: user?.user_uuid },
    });
    const link = `${origin}/${RESET_PASSWORD_ROUTE}/${user?.email}/${token}`;

    await this.sendgridService.send({
      data: {
        link,
        emailMessage: 'Reset your password in the button below.',
        buttonText: 'Reset password',
      },
      subject: 'Password Reset',
      templateId: 'd-37616bd7bcd040d4ad91d585245f3c4d',
      to: user?.email,
    });

    return;
  }

  async resendConfirmationEmail(origin: string, user: users) {
    let token = '';
    if (this.emailTokenHasExpired(user?.confirm_email_token_expires)) {
      token = crypto.randomBytes(50).toString('hex');
      const expiresIn = new Date();
      expiresIn.setDate(expiresIn.getDate() + 1);
      await this.prisma.users.update({
        data: {
          confirm_email_token: token,
          confirm_email_token_expires: expiresIn,
        },
        where: { user_uuid: user?.user_uuid },
      });
    } else {
      token = user.confirm_email_token;
    }

    const linkConfirmation = `${origin}/${VERIFY_EMAIL_ROUTE}/${user.user_uuid}/${token}`;
    const email = {
      to: user?.email,
      templateId: 'd-d76ee70abb8e4c9a9ac27b612d016bb1',
      subject: 'Alirok email confirmation',
      data: {
        link: linkConfirmation,
        emailMessage: 'Please confirm your email in the button below',
        buttonText: 'Confirm Email Address',
      },
    };

    await this.sendgridService.send(email);
  }

  async registerUser(register, req: Request) {
    return await this.prisma.$transaction(async (prisma) => {
      const origin = req.get('origin');

      if (!register.email) {
        throw new BadRequestException('Not enough parameters provided!');
      }

      try {
        const userFound = await prisma.users.findUnique({
          where: { email: register.email },
        });

        if (userFound) {
          if (!userFound.password) {
            await this.resetPassword(origin, userFound);
            throw new BadRequestException(
              'Customer without password, reset password was sent',
            );
          }
          throw new BadRequestException('User already exist!');
        }

        // Create token and token expiration date
        const token = crypto.randomBytes(50).toString('hex');
        const expiresIn = new Date();
        expiresIn.setDate(expiresIn.getDate() + 1);

        const body = register;
        body.user_uuid = uuidv4();
        body.password = hashSync(body.password, 10);
        body.confirm_email_token = token;
        body.confirm_email_token_expires = expiresIn;

        let homeAddress = {};

        if (body.home_address) {
          const location = await this.addressService.createLocation(
            body.home_address,
          );
          const location_uuid = location ? location.location_uuid : null;
          homeAddress = {
            home_address_uuid: location_uuid,
          };
        }

        const currentDate = new Date();

        const user = await prisma.users.create({
          data: {
            ...body,
            ...homeAddress,
            created_at: currentDate,
          },
        });

        const linkConfirmation = `${origin}/${VERIFY_EMAIL_ROUTE}/${user.user_uuid}/${token}`;

        const email = {
          to: user?.email,
          templateId: 'd-d76ee70abb8e4c9a9ac27b612d016bb1',
          subject: 'Alirok email confirmation',
          data: {
            link: linkConfirmation,
            emailMessage: 'Please confirm your email in the button below',
            buttonText: 'Confirm Email Address',
          },
        };

        await this.sendgridService.send(email);

        return user;
      } catch (err) {
        throw err;
      }
    });
  }

  async confirmEmail(confirmEmailData, request: Request) {
    const { user_uuid, token } = confirmEmailData;

    if (!user_uuid || !token) {
      throw new BadRequestException('Missing required information');
    }

    const user = await this.prisma.users.findUnique({
      where: { user_uuid: user_uuid },
    });

    if (
      !user ||
      (!user.account_activate && user.confirm_email_token !== token)
    ) {
      throw new BadRequestException('Invalid data');
    }

    if (user.account_activate) {
      throw new BadRequestException('Account already activated');
    }

    const now = new Date();
    const expiresIn = now;
    if (now > user.confirm_email_token_expires) {
      const token = crypto.randomBytes(50).toString('hex');
      expiresIn.setDate(expiresIn.getDate() + 1);

      await this.prisma.users.update({
        data: {
          confirm_email_token: token,
          confirm_email_token_expires: expiresIn,
        },
        where: { user_uuid: user?.user_uuid },
      });

      const emailMessage = 'Please confirm your email in the button below:';
      const linkConfirmation = `${request.get('origin')}${VERIFY_EMAIL_ROUTE}/${
        user.user_uuid
      }/${token}`;

      const email = {
        to: user?.email,
        templateId: 'd-d76ee70abb8e4c9a9ac27b612d016bb1',
        subject: 'Alirok email confirmation',
        data: {
          link: linkConfirmation,
          emailMessage:
            emailMessage ?? 'Please confirm your email in the button below',
          buttonText: 'Confirm Email Address',
        },
      };

      await this.sendgridService.send(email);

      throw new BadRequestException('Confirmation link expired');
    } else {
      await this.prisma.users.update({
        data: {
          account_activate: true,
        },
        where: { user_uuid: user?.user_uuid },
      });
      return {
        message:
          'Congratulations, your account is ready now. We hope you enjoy Alirok.',
      };
    }
  }

  async updatePassword({ email, newPassword, token }) {
    if (!email || !token || !newPassword) {
      const message = 'Not enough parameters provided!';
      throw new BadRequestException(message);
    }

    try {
      const user = await this.prisma.users.findFirst({
        where: {
          email,
          confirm_email_token: token,
        },
      });

      if (!user) {
        const message = 'User not found.';
        throw new BadRequestException(message);
      }

      const now = new Date();
      if (now > user.confirm_email_token_expires) {
        const message =
          'Your request has expired. Please request to reset password again.';
        throw new BadRequestException(message);
      }

      const hashedPassword = hashSync(newPassword, 10);

      await this.prisma.users.update({
        where: { email },
        data: {
          confirm_email_token: null,
          confirm_email_token_expires: null,
          password: hashedPassword,
        },
      });

      const message = 'Your password has successfully reset.';
      return { message };
    } catch (err) {
      throw new BadRequestException('Registration failed');
    }
  }

  public async findMaskedAddresses({
    term,
    take,
    skip,
    orderBy,
    sortOrder,
  }: FindAllDto) {
    try {
      if (!term || term.length === 0) {
        return [];
      }

      const users = await this.prisma.users.findMany({
        where: {
          OR: [
            { email: { contains: term || '', mode: 'insensitive' } },
            { first_name: { contains: term || '', mode: 'insensitive' } },
            { last_name: { contains: term || '', mode: 'insensitive' } },
          ],
        },
        skip: skip ? +skip : 0,
        take: take ? +take : 20,
        orderBy: orderBy && {
          [orderBy]: sortOrder || 'asc',
        },
        include: {
          locations: {
            include: {
              postal_codes: true,
              location_administrative_divisions: {
                include: {
                  administrative_divisions: {
                    include: {
                      administrative_division_types: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const maskedUsers = users.map(({ locations, ...rest }) => {
        const cityObj =
          locations &&
          locations.location_administrative_divisions &&
          locations.location_administrative_divisions.find(
            (e) =>
              e.administrative_divisions.administrative_division_types.name ===
              'city',
          );

        const streetObj =
          locations &&
          locations.location_administrative_divisions &&
          locations.location_administrative_divisions.find(
            (e) =>
              e.administrative_divisions.administrative_division_types.name ===
              'street',
          );

        const stateObj =
          locations &&
          locations.location_administrative_divisions &&
          locations.location_administrative_divisions.find(
            (e) =>
              e.administrative_divisions.administrative_division_types.name ===
              'state',
          );

        const countryObj =
          locations &&
          locations.location_administrative_divisions &&
          locations.location_administrative_divisions.find(
            (e) =>
              e.administrative_divisions.administrative_division_types.name ===
              'country',
          );

        const postalCodeObj = locations && locations.postal_codes;
        const addressType = locations?.address_type ?? 'RESIDENTIAL';

        return {
          user_uuid: rest.user_uuid,
          first_name: rest.first_name && rest.first_name,
          last_name: rest.last_name && rest.last_name,
          tax_id:
            rest.tax_id &&
            maskString(rest.tax_id, '*', Math.floor(rest.tax_id.length / 2)),
          email: rest.email && maskEmail(rest.email),
          phone: rest.phone &&
            (rest.phone as any).number && {
              ...(rest.phone as any),
              number: maskString(
                (rest.phone as any).number,
                '*',
                Math.floor((rest.phone as any).number.length / 2),
              ),
            },
          photo: rest.photo,
          isAddressComplete:
            !!countryObj &&
            !!stateObj &&
            !!streetObj &&
            !!cityObj &&
            !!postalCodeObj &&
            !!(locations && locations.street_number),
          address: locations && {
            complement: locations.complement,
            street_number: maskString(
              locations.street_number,
              '*',
              Math.floor(locations.street_number.length / 2),
            ),
            postal_code: maskString(
              postalCodeObj.value,
              '*',
              Math.floor(postalCodeObj.value.length / 2),
            ),
            city: cityObj && cityObj.administrative_divisions.value,
            street:
              streetObj &&
              maskString(
                streetObj.administrative_divisions.value,
                '*',
                Math.floor(streetObj.administrative_divisions.value.length / 2),
              ),
            state: stateObj && stateObj.administrative_divisions.value,
            country: countryObj && countryObj.administrative_divisions.value,
            address_type: addressType,
          },
        };
      });

      return maskedUsers;
    } catch (error) {
      return error;
    }
  }

  public async findMaskedUser({ uuid }: FindUniqueDto) {
    try {
      if (!uuid || uuid.length === 0) {
        return;
      }

      const user = await this.prisma.users.findUnique({
        where: { user_uuid: uuid },
        include: {
          locations: {
            include: {
              postal_codes: true,
              location_administrative_divisions: {
                include: {
                  administrative_divisions: {
                    include: {
                      administrative_division_types: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const maskedUser = () => {
        const cityObj =
          user.locations &&
          user.locations.location_administrative_divisions &&
          user.locations.location_administrative_divisions.find(
            (e) =>
              e.administrative_divisions.administrative_division_types.name ===
              'city',
          );

        const streetObj =
          user.locations &&
          user.locations.location_administrative_divisions &&
          user.locations.location_administrative_divisions.find(
            (e) =>
              e.administrative_divisions.administrative_division_types.name ===
              'street',
          );

        const stateObj =
          user.locations &&
          user.locations.location_administrative_divisions &&
          user.locations.location_administrative_divisions.find(
            (e) =>
              e.administrative_divisions.administrative_division_types.name ===
              'state',
          );

        const countryObj =
          user.locations &&
          user.locations.location_administrative_divisions &&
          user.locations.location_administrative_divisions.find(
            (e) =>
              e.administrative_divisions.administrative_division_types.name ===
              'country',
          );

        const postalCodeObj = user.locations && user.locations.postal_codes;

        return {
          user_uuid: user.user_uuid,
          first_name: user.first_name && user.first_name,
          last_name: user.last_name && user.last_name,
          tax_id:
            user.tax_id &&
            maskString(user.tax_id, '*', Math.floor(user.tax_id.length / 2)),
          email: user.email && maskEmail(user.email),
          phone: user.phone &&
            (user.phone as any).number && {
              ...(user.phone as any),
              number: maskString(
                (user.phone as any).number,
                '*',
                Math.floor((user.phone as any).number.length / 2),
              ),
            },
          photo: user.photo,
          isAddressComplete:
            !!countryObj &&
            !!stateObj &&
            !!streetObj &&
            !!cityObj &&
            !!postalCodeObj &&
            !!(user.locations && user.locations.street_number),
          address: user.locations && {
            complement: user.locations.complement,
            street_number: maskString(
              user.locations.street_number,
              '*',
              Math.floor(user.locations.street_number.length / 2),
            ),
            postal_code: maskString(
              postalCodeObj.value,
              '*',
              Math.floor(postalCodeObj.value.length / 2),
            ),
            city: cityObj && cityObj.administrative_divisions.value,
            street:
              streetObj &&
              maskString(
                streetObj.administrative_divisions.value,
                '*',
                Math.floor(streetObj.administrative_divisions.value.length / 2),
              ),
            state: stateObj && stateObj.administrative_divisions.value,
            country: countryObj && countryObj.administrative_divisions.value,
          },
        };
      };

      return maskedUser();
    } catch (error) {
      return error;
    }
  }

  async setPassword(setPasswordDto: SetPasswordDto, request: Request) {
    try {
      const { email, password, account_activate } = setPasswordDto;

      const user = await this.prisma.users.findUnique({
        where: {
          email,
        },
      });

      if (!user) {
        throw new NotFoundException('User not Found');
      } else if (user.password) {
        throw new NotFoundException('User already have a password');
      } else if (user.is_block) {
        throw new ForbiddenException('User is blocked.');
      }

      const hashedPassword = hashSync(password, 10);
      let updatedUser: users;

      if (!user.account_activate && !account_activate) {
        const now = new Date();
        const expiresIn = now;
        const token = crypto.randomBytes(50).toString('hex');
        expiresIn.setDate(expiresIn.getDate() + 1);

        updatedUser = await this.prisma.users.update({
          data: {
            password: hashedPassword,
            account_activate: account_activate,
            confirm_email_token: token,
            confirm_email_token_expires: expiresIn,
          },
          where: { user_uuid: user?.user_uuid },
        });

        const emailMessage = 'Please confirm your email in the button below:';
        const linkConfirmation = `${request.get(
          'origin',
        )}${VERIFY_EMAIL_ROUTE}/${user.user_uuid}/${token}`;

        const email = {
          to: user?.email,
          templateId: 'd-d76ee70abb8e4c9a9ac27b612d016bb1',
          subject: 'Alirok email confirmation',
          data: {
            link: linkConfirmation,
            emailMessage:
              emailMessage ?? 'Please confirm your email in the button below',
            buttonText: 'Confirm Email Address',
          },
        };

        await this.sendgridService.send(email);
      } else {
        updatedUser = await this.prisma.users.update({
          data: {
            password: hashedPassword,
            account_activate: account_activate,
          },
          where: { user_uuid: user?.user_uuid },
        });
      }
      return updatedUser;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async login(loginDto: LoginDto, request: Request) {
    const { email, password } = loginDto;

    const user = await this.prisma.users.findUnique({
      where: {
        email,
      },
      include: {
        companies: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not Found');
    } else if (!user.password) {
      await this.resetPassword(request.get('origin'), user);
      throw new NotFoundException('Password not registered yet');
    } else if (!user.account_activate) {
      await this.resendConfirmationEmail(request.get('origin'), user);
      throw new BadRequestException('Account not activated');
    } else if (user.is_block) {
      throw new ForbiddenException('User is blocked.');
    }
    const isValidPassword = compareSync(password, user.password);

    console.log(isValidPassword);
    if (!isValidPassword) {
      throw new BadRequestException('Password not valid');
    }

    const api_token_uuid = uuidv4();

    const token = jwt.sign({ uuid: api_token_uuid }, this.API_KEY, {
      expiresIn: '7 days',
    });

    try {
      const currentDate = new Date();

      await this.prisma.api_tokens.create({
        data: {
          api_token_uuid,
          token: crypto.createHash('sha256').update(token).digest('hex'),
          created_at: currentDate,
          expires_at: null,
          users: {
            connect: {
              user_uuid: user.user_uuid,
            },
          },
        },
      });

      return {
        user,
        token,
      };
    } catch (err) {
      throw err;
    }
  }

  async identify(identifyDto: IdentifyDto) {
    const {
      email,
      password,
      first_name,
      last_name,
      phone,
      tax_id,
      home_address,
    } = identifyDto;

    let user = await this.prisma.users.findFirst({
      where: { email },
    });

    if (user && password) {
      const isPasswordValid = compareSync(password, user.password);

      if (!isPasswordValid) throw new ForbiddenException();
    } else if (!user) {
      const location = home_address
        ? await this.addressService.createLocation(home_address)
        : null;

      const home_address_uuid = location ? location.location_uuid : undefined;

      user = await this.prisma.users.create({
        data: {
          user_uuid: uuidv4(),
          email,
          password: password ? hashSync(password, 10) : undefined,
          first_name,
          last_name,
          phone: {
            ...phone,
          },
          tax_id,
          home_address_uuid,
        },
      });
    }

    return {
      user_uuid: user.user_uuid,
    };
  }

  async updatePhoto(updatePhotoDto: UpdatePhotoDto) {
    let signedRequest = '';
    let resultUrl = '';

    try {
      if (updatePhotoDto.file) {
        const fileType = updatePhotoDto.file.type;
        const fileExtension = updatePhotoDto.file.type.match(/\/([a-z]{3,})$/);

        const fileExtensionFormatted = fileExtension ? fileExtension[1] : null;

        if (
          !fileExtensionFormatted ||
          (fileExtensionFormatted !== 'jpeg' &&
            fileExtensionFormatted !== 'jpg' &&
            fileExtensionFormatted !== 'png')
        ) {
          throw new BadRequestException('File type invalid!');
        }

        const field = updatePhotoDto.file.field;
        const fileName = `images/${updatePhotoDto.user_uuid}-user-${field}.${fileExtensionFormatted}`;

        const s3 = this.S3Service.awsS3();

        const s3Params = {
          Bucket: this.BUCKET_NAME,
          Key: fileName,
          Expires: 60,
          ContentType: fileType,
          ACL: 'public-read',
        };

        signedRequest = s3.getSignedUrl('putObject', s3Params);
        resultUrl = `https://${this.BUCKET_NAME}.s3.amazonaws.com/${fileName}`;

        const userUpdated = await this.prisma.users.update({
          data: {
            photo: resultUrl,
          },
          where: {
            user_uuid: updatePhotoDto.user_uuid,
          },
        });

        return { ...userUpdated, signedRequest };
      }
    } catch (error) {
      return error;
    }
  }

  async updateUser(currentUser: users, updateUserData: any) {
    try {
      if (!currentUser.user_uuid) {
        throw new BadRequestException('Missing user uuid');
      }

      const userFound = await this.prisma.users.findUnique({
        where: {
          user_uuid: currentUser.user_uuid,
        },
        select: {
          user_uuid: true,
        },
      });

      if (!userFound) {
        throw new BadRequestException('User not found');
      }

      const body = updateUserData;
      let homeAddress = {};

      if (body.home_address) {
        const location = await this.addressService.createLocation(
          body.home_address,
        );
        const location_uuid = location ? location.location_uuid : null;
        homeAddress = {
          home_address_uuid: location_uuid,
        };

        delete body.home_address;
      }

      const userUpdated = await this.prisma.users.update({
        where: {
          user_uuid: userFound.user_uuid,
        },
        data: {
          ...homeAddress,
          ...body,
        },
        include: {
          companies: true,
          locations: {
            include: {
              postal_codes: true,
              location_administrative_divisions: {
                include: {
                  administrative_divisions: {
                    include: {
                      administrative_division_types: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const formattedUser = this.formatUserAddress(userUpdated);

      return formattedUser;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
