import { Field, InputType, PartialType } from '@nestjs/graphql';
import { ArrayNotEmpty, IsUUID, MaxLength, MinLength } from 'class-validator';
import { AccessVisibility, Repository } from 'src/models';

@InputType()
export class RepositoryTabAsInput {
  @Field(() => String)
  url: string;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  favIconUrl?: string;

  @Field(() => String, { nullable: true })
  title?: string;
}

@InputType()
export class CreateNewRepositoryArgs {
  @Field()
  @MinLength(1)
  @MaxLength(40)
  name: string;

  @MaxLength(200)
  @Field({ nullable: false })
  description?: string;

  @ArrayNotEmpty()
  @Field(() => [RepositoryTabAsInput])
  tabs: RepositoryTabAsInput[];

  @IsUUID('4')
  @Field(() => String, { nullable: false })
  workspaceId: string;

  @Field(() => AccessVisibility, { defaultValue: AccessVisibility.Private })
  visibility: AccessVisibility;
}

@InputType()
export class UpdateRepositoryArgs extends PartialType(Repository, InputType) {}

@InputType()
export class DeleteRepositoryArgs {
  @Field()
  @IsUUID('4')
  id: string;
}

@InputType()
export class GetRepositoryByIdArgs {
  @Field()
  @IsUUID('4')
  id: string;
}
