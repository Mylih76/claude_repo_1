import { Module } from '@nestjs/common';
import { SearchRequestsService } from './search-requests.service';
import { SearchRequestsController } from './search-requests.controller';
import { MatchingService } from './matching.service';
import { ListingsModule } from '../listings/listings.module';

@Module({
  imports: [ListingsModule],
  controllers: [SearchRequestsController],
  providers: [SearchRequestsService, MatchingService],
  exports: [SearchRequestsService],
})
export class SearchRequestsModule {}
