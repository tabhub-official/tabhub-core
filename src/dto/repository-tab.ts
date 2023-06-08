import { Field, InputType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

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
export class PinRepositoryTabArgs {
  @Field()
  @IsUUID('4')
  tabId: string;
}

@InputType()
export class UnpinRepositoryTabArgs {
  @Field()
  @IsUUID('4')
  tabId: string;
}
