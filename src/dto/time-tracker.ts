import { Field, InputType } from '@nestjs/graphql';
import { TimeTrackerProductivityMode } from 'src/models/time-tracker.model';

@InputType()
export class CreateNewTimeTrackerArgs {
  @Field(() => TimeTrackerProductivityMode)
  mode: TimeTrackerProductivityMode;

  @Field(() => Number)
  date: number;

  @Field(() => Number)
  sessionStartTime: number;

  @Field(() => Number)
  sessionEndTime: number;

  @Field(() => String)
  trackedTabs: string;
}

@InputType()
export class GetTimeTrackerSessionArgs {
  @Field(() => String)
  id: string;
}
