import { Field, ObjectType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@ObjectType()
export class Category {
  @IsUUID('4')
  @Field()
  id: string;

  @Field(() => String)
  name: string;
}
