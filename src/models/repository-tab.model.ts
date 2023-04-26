import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@ObjectType()
@InputType("RepositoryTabInput")
export class RepositoryTab {
  @IsUUID('4')
  @Field()
  id: string;

  @Field(() => String)
  url: string;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => [String], { defaultValue: [], description: 'List of repository tabs IDs' })
  pinned: string[];

  @Field(() => String, { nullable: true })
  repositoryId?: string;
}
