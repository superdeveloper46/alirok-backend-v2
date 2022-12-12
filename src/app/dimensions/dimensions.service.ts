import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import {
  FindAllCommonDimensionsDTO,
  CreateDimensionsDTO,
  UpdateDimensionsDTO,
  DeleteDimensionsDTO,
} from './dto/dimensions.dto';

@Injectable()
export class DimensionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(payload: FindAllCommonDimensionsDTO) {
    try {
      const whereCondition = {};

      if (payload.user_company_uuid) {
        whereCondition['user_company_uuid'] = payload.user_company_uuid;
      }

      const locationReferenceTypeData = await this.prisma.dimensional.findMany({
        where: { ...whereCondition },
      });

      return locationReferenceTypeData;
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Error in fetching dimensions data!',
      );
    }
  }

  async createForCompany({ user_company_uuid, value }: CreateDimensionsDTO) {
    try {
      // Check if dimension already exists
      const dimensionExists = await this.prisma.dimensional.findMany({
        where: {
          user_company_uuid,
          value,
        },
      });

      if (dimensionExists.length > 0) {
        throw new BadRequestException('Dimension already exists');
      }

      // Add dimensional
      const locationReferenceTypeData = await this.prisma.dimensional.create({
        data: { dimensional_factor_uuid: uuidv4(), user_company_uuid, value },
      });
      return locationReferenceTypeData;
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Error in creating dimensions data!',
      );
    }
  }

  async updateForCompany({
    dimensional_factor_uuid,
    user_company_uuid,
    value,
  }: UpdateDimensionsDTO) {
    try {
      // Check if dimension does not exists
      const dimensionUpdateCheck = await this.prisma.dimensional.findMany({
        where: {
          dimensional_factor_uuid,
          user_company_uuid,
        },
      });

      if (dimensionUpdateCheck.length == 0) {
        throw new NotFoundException('Dimension not found');
      }

      // Check if dimension already exists
      const dimensionExists = await this.prisma.dimensional.findMany({
        where: {
          NOT: {
            dimensional_factor_uuid,
          },
          user_company_uuid,
          value,
        },
      });

      if (dimensionExists.length > 0) {
        throw new BadRequestException('Dimension already exists');
      }

      // Update dimensional
      await this.prisma.dimensional.updateMany({
        data: {
          value,
        },
        where: {
          dimensional_factor_uuid,
          user_company_uuid,
        },
      });

      return {
        dimensional_factor_uuid,
        user_company_uuid,
        value,
      };
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Error in updating dimensions data!',
      );
    }
  }

  async deleteForCompany({
    dimensional_factor_uuid,
    user_company_uuid,
  }: DeleteDimensionsDTO) {
    try {
      // Check if dimension does not exists
      const dimensionUpdateCheck = await this.prisma.dimensional.findMany({
        where: {
          dimensional_factor_uuid,
          user_company_uuid,
        },
      });

      if (dimensionUpdateCheck.length == 0) {
        throw new NotFoundException('Dimension not found');
      }

      // Update dimensional
      await this.prisma.dimensional.deleteMany({
        where: {
          dimensional_factor_uuid,
          user_company_uuid,
        },
      });

      return {
        dimensional_factor_uuid,
        user_company_uuid,
      };
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Error in updating dimensions data!',
      );
    }
  }

  async upsertDimGrossWeightFactor(currentCompany: string) {
    const exists = await this.prisma.dimensional.findFirst({
      where: {
        user_company_uuid: currentCompany,
        value: 0,
      },
    });

    // Check if exists
    if (exists) {
      return exists;
    }

    // Create new and send back
    return await this.prisma.dimensional.create({
      data: {
        dimensional_factor_uuid: uuidv4(),
        user_company_uuid: currentCompany,
        value: 0,
      },
    });
  }
}
