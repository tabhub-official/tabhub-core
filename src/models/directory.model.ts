import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@ObjectType()
@InputType('DirectoryAsInput')
export class Directory {
  @IsUUID('4')
  @Field()
  id: string;

  @Field(() => String)
  name: string;

  /** Nullable means root directory */
  @Field(() => String, { nullable: true })
  parentDirectory?: string;
}
