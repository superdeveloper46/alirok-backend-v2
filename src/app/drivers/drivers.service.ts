import { BadRequestException, Injectable } from '@nestjs/common';

import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../../prisma/prisma.service';

import {
  DeleteDriverDTO,
  DriversDto,
  GetDriverInfoDto,
  GetDriversDto,
} from './dto/drivers.dto';

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  filterDrivers = (drivers: DriversDto[]) => {
    const incompleteDrivers = drivers.map((driver) => {
      if (
        !driver.first_name ||
        !driver.last_name ||
        !driver.email ||
        (!driver.phone && !driver.license_number)
      )
        return driver;
    });

    return incompleteDrivers;
  };

  async createDrivers(currentCompany: string, drivers: DriversDto[]) {
    try {
      if (!currentCompany) {
        throw new BadRequestException('Company uuid is missing');
      }

      if (!drivers) {
        throw new BadRequestException('Drivers not defined');
      }

      const incomplete = this.filterDrivers(drivers);

      const completeDrivers = drivers.filter((object1) => {
        return !incomplete.some((object2) => {
          return object1 === object2;
        });
      });

      await this.prisma.drivers.createMany({
        data: drivers.map((driver) => ({
          driver_uuid: uuidv4(),
          first_name: driver.first_name,
          last_name: driver.last_name,
          photo: driver.photo,
          email: driver.email,
          phone: driver.photo,
          license_number: driver.license_number,
          sta_license_status: driver.sta_license_status,
          sta_number: driver.sta_number,
          sta_expiration_date: driver.sta_expiration_date,
          iacssp_training_date: driver.iacssp_training_date,
          iacssp_expiration_date: driver.iacssp_expiration_date,
          company_uuid: currentCompany,
        })),
      });

      return {
        created: [...completeDrivers],
        incomplete: [...incomplete],
      };
    } catch (err) {
      return err;
    }
  }

  async deleteDriver(payload: DeleteDriverDTO) {
    try {
      const driver_uuid = payload.driver_uuid;

      const driver = await this.prisma.drivers.delete({
        where: { driver_uuid: driver_uuid },
      });
      return driver;
    } catch (err) {
      return err;
    }
  }

  async getDrivers(currentCompany: string, params: GetDriversDto) {
    try {
      const { skip, take } = params;

      const drivers = await this.prisma.drivers.findMany({
        skip: skip && +skip,
        take: take && +take,
        where: {
          company_uuid: currentCompany,
        },
      });

      return drivers;
    } catch (err) {
      return err;
    }
  }

  async getDriverByInfo(driverInfo: GetDriverInfoDto) {
    try {
      if (!driverInfo.first_name || !driverInfo.last_name) {
        throw new BadRequestException('Driver information is missing');
      }

      const driver = await this.prisma.drivers.findFirst({
        where: {
          first_name: driverInfo.first_name,
          last_name: driverInfo.last_name,
          license_number: driverInfo.license_number,
        },
      });

      return driver;
    } catch (error) {
      return error;
    }
  }

  async getDriverById(driver_uuid: string) {
    try {
      if (driver_uuid) {
        throw new BadRequestException('Driver uuid is missing');
      }

      const driver = await this.prisma.drivers.findUnique({
        where: {
          driver_uuid: driver_uuid,
        },
      });

      return driver;
    } catch (error) {
      return error;
    }
  }
}
