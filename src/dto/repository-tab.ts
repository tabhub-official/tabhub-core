import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class SearchTabOnWebArgs {
  @Field()
  websiteUrl: string;

  @Field()
  offset: number;

  @Field()
  limit: number;
}

@InputType()
export class QueryOpenGraphMetadataArgs {
  @Field()
  websiteUrl: string;
}
