import { Field, InputType, PartialType } from '@nestjs/graphql';
import { IsEmail, IsUUID, MaxLength, MinLength } from 'class-validator';
import { User } from 'src/models';

@InputType()
export class CreateNewUserArgs {
  @Field()
  uid: string;

  @Field()
  profile_image: string;

  @Field()
  @MinLength(1)
  @MaxLength(25)
  username: string;

  @MaxLength(100)
  @Field({ nullable: true })
  full_name?: string;

  @IsEmail()
  @Field({ nullable: false })
  email: string;

  @Field({ defaultValue: 'UNKNOWN' })
  provider: string;
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
