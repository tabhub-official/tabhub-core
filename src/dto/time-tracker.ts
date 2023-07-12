import { Field, InputType } from '@nestjs/graphql';
import { TimeTrackerProductivityMode } from 'src/models/time-tracker.model';

@InputType()
export class CreateNewTimeTrackerArgs {
  @Field(() => TimeTrackerProductivityMode)
  mode: TimeTrackerProductivityMode;

  @Field(() => Number)
  date: number;

  @Field(() => Boolean)
  recurring: boolean;

  @Field(() => Number)
  sessionStartTime: number;

  @Field(() => Number)
  sessionEndTime: number;
}
