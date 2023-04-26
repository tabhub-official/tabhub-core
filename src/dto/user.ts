import { Field, InputType, PartialType } from '@nestjs/graphql';
import { IsEmail, IsUUID, MaxLength, MinLength } from 'class-validator';
import { User } from 'src/models';

@InputType()
export class CreateNewUserArgs {
  @Field()
  @MinLength(1)
  @MaxLength(25)
  username: string;

  @MaxLength(100)
  @Field({ nullable: false })
  full_name?: string;

  @IsEmail()
  @Field({ nullable: false })
  email: string;
}

@InputType()
export class UpdateUserArgs extends PartialType(User, InputType) {}

@InputType()
export class DeleteUserArgs {
  @Field()
  @IsUUID()
  id: string;
}

@InputType()
export class GetUserByIdArgs {
  @Field()
  @IsUUID()
  id: string;
}
