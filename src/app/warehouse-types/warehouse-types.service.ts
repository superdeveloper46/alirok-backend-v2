import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
// import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WarehouseTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async listAllWarehouse() {
    try {
      // await this.prisma.warehouse_types.createMany({
      //   data: [
      //     {
      //       warehouse_type_uuid: uuidv4(),
      //       name: 'Warehouse',
      //       icon: 'warehouse',
      //     },
      //     {
      //       warehouse_type_uuid: uuidv4(),
      //       name: 'Airport Terminal',
      //       icon: 'plane',
      //     },
      //     {
      //       warehouse_type_uuid: uuidv4(),
      //       name: 'Port Terminal',
      //       icon: 'ship',
      //     },
      //   ],
      // });

      return this.prisma.warehouse_types.findMany();
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Error while fetching warehouse types!',
      );
    }
  }
}
