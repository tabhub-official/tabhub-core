import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class LocalWindow {
  @Field()
  message: string;
}
