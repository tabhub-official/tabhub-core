import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@ObjectType()
@InputType('RepositoryTabInput')
export class RepositoryTab {
  @IsUUID('4')
  @Field()
  id: string;

  @Field(() => String)
  url: string;

  @Field(() => String, { defaultValue: '' })
  description: string;

  @Field(() => String, { nullable: true })
  customName?: string;

  @Field(() => String, { nullable: false })
  title: string;

  @Field(() => String, { nullable: false })
  favIconUrl: string;

  @Field(() => [String], { defaultValue: [], description: 'List of repository tabs IDs' })
  pinned: string[];

  @Field(() => [String], { defaultValue: [], description: 'List of labels' })
  labels: string[];

  /** Null means root directory */
  @Field(() => String, { nullable: true })
  parentDirectory?: string;
}
