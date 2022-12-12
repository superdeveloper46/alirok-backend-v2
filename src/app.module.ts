import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { CompaniesModule } from './app/admin/accounts/companies/companies.module';
import { CompaniesModule as CompaniesCustomerModule } from './app/customer/accounts/companies/companies.module';
import { UsersModule as UsersCustomerModule } from './app/customer/accounts/users/users.module';
import { UsersModule } from './app/admin/accounts/users/users.module';
import { MembersModule } from './app/customer/accounts/members/members.module';
import { HealthModule } from './app/health/health.module';
import { CompaniesTypesModule } from './app/admin/misc/companies-types/companies-types.module';
import { AuthGuard } from './common/guard/auth.guard';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VendorsModule } from './vendors/vendors.module';
import { CouriersModule } from './app/couriers/couriers.module';
import { ParcelBookingModule } from './app/parcel-booking/parcel-booking.module';
import { AddressModule } from './app/misc/address/address.module';
import { ParcelRatesModule } from './app/customer/parcel/parcel-rates/parcel-rates.module';
import { FormattersModule } from './app/misc/formatters/formatters.module';
import { CurrencyModule } from './app/misc/currency/currency.module';
import { HtsModule } from './app/misc/hts/hts.module';
import { CheckoutModule } from './app/checkout/checkout.module';
import { ObjectHelperModule } from './app/misc/object-helper/object-helper.module';
import { PaymentMethodsModule } from './app/payment-methods/payment-methods.module';
import { EventsModule } from './app/events/events.module';
import { SentryModule } from '@ntegral/nestjs-sentry';
import { UniversalTrackingModule } from './app/universal-tracking/universal-tracking.module';
import { ValueServicesModule } from './app/customer/value-services/value-services.module';
import { AccountModule } from './app/accounts/account.module';
import { ShipmentsModule } from './app/shipments/shipments.module';
import { FeedbackModule } from './app/feedback/feedback.module';
import { CompanyTypesModule } from './app/customer/company-types/company-types.module';
import { CoveragesModule } from './app/coverages/coverages.module';
import { LocationReferenceTypesModule } from './app/location-reference-types/location-reference-types.module';
import { WeekDaysModule } from './app/week-days/week-days.module';
import { ParcelMassMeasuresModule } from './app/parcel-mass-measures/parcel-mass-measures.module';
import { CompaniesCarriersModule } from './app/misc/companies-carriers/companies-carriers.module';
import { AirportsModule } from './app/airports/airports.module';
import { AirlineModule } from './app/company-categories/airline/airline.module';
import { ExporterModule } from './app/company-categories/exporter/exporter.module';
import { ForwarderModule } from './app/company-categories/forwarders/forwarder.module';
import { GeneralSaleAgentModule } from './app/company-categories/general-sale-agent/general-sale-agent.module';
import { ImporterModule } from './app/company-categories/importer/importer.module';
import { ShippingLineModule } from './app/company-categories/shipping-line/shipping-line.module';
import { ThirdPartyModule } from './app/company-categories/third-party/third-party.module';
import { TruckingModule } from './app/company-categories/trucking/trucking.module';
import { Warehouse3plModule } from './app/company-categories/warehouse-3pl/warehouse-3pl.module';
import { PortsModule } from './app/ports/ports.module';
import { CompanyRelationshipsModule } from './app/company-relationships/company-relationships.module';
import { DimensionsModule } from './app/dimensions/dimensions.module';
import { MassMeasuresModule } from './app/mass-measures/mass-measures.module';
import { LengthMeasuresModule } from './app/length-measures/length-measures.module';
import { CronJobsModule } from './app/cron-jobs/cron-jobs.module';
import { DropOffLocationsModule } from './app/drop-off-locations/drop-off-locations.module';
import { WarehouseTypesModule } from './app/warehouse-types/warehouse-types.module';
import { ModalsModule } from './app/modals/modals.module';
import { DriversModule } from './app/drivers/drivers.module';
import { InviteFriendsModule } from './app/invite-friends/invite-friends.module';
import { BookingCommentsModule } from './app/booking-comments/booking-comments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SentryModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (cfg: ConfigService) => ({
        dsn: cfg.get('SENTRY_DNS'),
        debug: true,
        environment: cfg.get('ENVIRONMENT'),
        release: null,
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    AddressModule,
    PrismaModule,
    HttpModule,
    UsersModule,
    MembersModule,
    CompaniesModule,
    CompaniesCustomerModule,
    UsersCustomerModule,
    CompaniesTypesModule,
    ParcelRatesModule,
    HealthModule,
    VendorsModule,
    CouriersModule,
    ParcelBookingModule,
    CheckoutModule,
    FormattersModule,
    CurrencyModule,
    HtsModule,
    ObjectHelperModule,
    PaymentMethodsModule,
    EventsModule,
    UniversalTrackingModule,
    ValueServicesModule,
    AccountModule,
    ShipmentsModule,
    FeedbackModule,
    CompanyTypesModule,
    CoveragesModule,
    LocationReferenceTypesModule,
    WeekDaysModule,
    ParcelMassMeasuresModule,
    CompaniesCarriersModule,
    AirportsModule,
    AirlineModule,
    ExporterModule,
    ForwarderModule,
    GeneralSaleAgentModule,
    ImporterModule,
    ShippingLineModule,
    ThirdPartyModule,
    TruckingModule,
    Warehouse3plModule,
    PortsModule,
    CompanyRelationshipsModule,
    DimensionsModule,
    MassMeasuresModule,
    LengthMeasuresModule,
    CronJobsModule,
    DropOffLocationsModule,
    WarehouseTypesModule,
    ModalsModule,
    DriversModule,
    InviteFriendsModule,
    BookingCommentsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
