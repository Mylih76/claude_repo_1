import { Module } from '@nestjs/common';
import { SearchRequestsService } from './search-requests.service';
import { SearchRequestsController } from './search-requests.controller';
import { MatchingService } from './matching.service';
import { TextParserService } from './text-parser.service';
import { TextSimilarityService } from './text-similarity.service';
import { ListingsModule } from '../listings/listings.module';

@Module({
  imports: [ListingsModule],
  controllers: [SearchRequestsController],
  providers: [
    SearchRequestsService,
    MatchingService,
    TextParserService,
    TextSimilarityService,
  ],
  exports: [SearchRequestsService],
})
export class SearchRequestsModule {}
