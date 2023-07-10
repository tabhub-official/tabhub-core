import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

export enum TimeTrackerEngineState {
  Offline,
  Idle,
  Running,
  Void,
}

registerEnumType(TimeTrackerEngineState, {
  name: 'TimeTrackerEngineState',
  description: 'Engine state for Time Tracker',
});

export enum TimeTrackerProductivityMode {
  CasualMode,
  FocusMode,
}

registerEnumType(TimeTrackerProductivityMode, {
  name: 'TimeTrackerProductivityMode',
  description: 'Productivity mode for Time Tracker',
});

@ObjectType()
export class TimeTrackerSession {
  @Field()
  @IsUUID('4')
  id: string;

  @Field(() => TimeTrackerProductivityMode)
  mode: TimeTrackerProductivityMode;

  @Field(() => TimeTrackerEngineState)
  state: TimeTrackerEngineState;

  @Field(() => Number)
  sessionStartTime: number;

  @Field(() => Number)
  sessionEndTime: number;

  @Field(() => Number)
  createdAt: number;

  @Field(() => Number)
  date: number;

  @Field(() => Boolean)
  recurring: boolean;
}
