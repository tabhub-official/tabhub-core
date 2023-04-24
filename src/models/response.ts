import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum ResponseType {
  Success = 'success',
  Error = 'error',
}

registerEnumType(ResponseType, {
  name: 'ResponseType',
});

@ObjectType()
export class AppResponse {
  @Field()
  message: string;

  @Field(() => ResponseType)
  type: ResponseType;
}
