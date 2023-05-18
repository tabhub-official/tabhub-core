import { Field, InputType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

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
