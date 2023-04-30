import { Field, InputType, OmitType, PartialType } from '@nestjs/graphql';
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
export class UpdateUserArgs extends PartialType(OmitType(User, ['id']), InputType) {}

@InputType()
export class GetUserByIdArgs {
  @Field()
  @IsUUID()
  id: string;
}
