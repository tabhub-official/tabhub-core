import { Field, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';
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
@InputType('TimeTrackerSessionSettingInputType')
export class TimeTrackerSessionSetting {
  @Field(() => Number)
  limit_least_used_time: number;

  @Field(() => TimeTrackerProductivityMode)
  mode: TimeTrackerProductivityMode;

  @Field(() => Number)
  session_start_time: number;

  @Field(() => Number)
  session_end_time: number;

  @Field(() => Number)
  setting_enabled_from: number;

  @Field(() => Number, { nullable: true })
  setting_enabled_to: number | null;

  @Field(() => Boolean, { defaultValue: true })
  interrupt_on_close: boolean;
}

@ObjectType()
@InputType('TimeTrackerSessionInputType')
export class TimeTrackerSession {
  @Field()
  @IsUUID('4')
  id: string;

  @Field(() => TimeTrackerEngineState)
  state: TimeTrackerEngineState;

  @Field(() => TimeTrackerProductivityMode)
  mode: TimeTrackerProductivityMode;

  @Field(() => Number)
  session_start_time: number;

  @Field(() => Number)
  session_end_time: number;

  @Field(() => Number)
  date: number;

  @Field(() => String, { defaultValue: '[]' })
  trackedTabs: string;
}
