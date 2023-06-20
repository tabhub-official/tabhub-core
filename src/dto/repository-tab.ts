import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class SearchTabOnWebArgs {
  @Field()
  websiteUrl: string;
}

@InputType()
export class GatherUrlsMetadataArgs {
  @Field(() => [String])
  websiteUrls: string[];
}

@InputType()
export class QueryOpenGraphMetadataArgs {
  @Field()
  websiteUrl: string;
}
