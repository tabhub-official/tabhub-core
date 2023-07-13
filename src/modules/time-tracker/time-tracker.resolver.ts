import { Logger } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateNewTimeTrackerArgs } from 'src/dto/time-tracker';
import { AppResponse, ResponseType } from 'src/models';
import { TimeTrackerSession, TimeTrackerSessionSetting } from 'src/models/time-tracker.model';
import { getAuthUser } from 'src/utils';

import { UserService } from '../user';
import { TimeTrackerSessionService } from './time-tracker-session.service';

@Resolver(() => TimeTrackerSession)
export class TimeTrackerResolver {
  private readonly logger = new Logger(TimeTrackerResolver.name);

  constructor(
    private userService: UserService,
    private timeTrackerSessionService: TimeTrackerSessionService
  ) {}

  @Mutation(() => AppResponse)
  async toggleTimeTracker(@Context('req') req): Promise<AppResponse> {
    try {
      const authUser = getAuthUser(req);
      const existingUser = await this.userService.getUserByEmail(authUser.email);
      if (!existingUser) throw new Error('User not found');
      await this.userService.updateData(existingUser.id, {
        time_tracker_enabled: !existingUser.time_tracker_enabled,
      });
      return {
        message: 'Toggled time tracker',
        type: ResponseType.Success,
      };
    } catch (error: any) {
      return {
        message: `Toggled time tracker failed: ${error}`,
        type: ResponseType.Error,
      };
    }
  }

  @Mutation(() => TimeTrackerSessionSetting)
  async updateTimeTrackerSetting(
    @Context('req') req,
    @Args('updateTimeTrackerSettingArgs') args: TimeTrackerSessionSetting
  ) {
    try {
      const authUser = getAuthUser(req);
      const timeTrackerSetting = await this.userService.updateTimeTrackerSetting(authUser.id, args);
      return timeTrackerSetting;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  @Query(() => [TimeTrackerSession])
  async getUserTimeTrackerSessions(@Context('req') req) {
    try {
      const authUser = getAuthUser(req);
      const existingUser = await this.userService.getUserByEmail(authUser.email);
      if (!existingUser) throw new Error('User not found');
      const timeTrackerSessions = existingUser.time_tracker_sessions;
      return timeTrackerSessions;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  @Mutation(() => AppResponse)
  async createNewTimeTrackerSession(
    @Context('req') req,
    @Args('createNewTimeTrackerArgs') args: CreateNewTimeTrackerArgs
  ): Promise<AppResponse> {
    try {
      const authUser = getAuthUser(req);
      const { mode, date, sessionEndTime, sessionStartTime } = args;
      const existingUser = await this.userService.getUserByEmail(authUser.email);
      if (!existingUser) throw new Error('User not found');
      const timeTrackerSession = await this.timeTrackerSessionService.createNewSession(
        mode,
        date,
        sessionStartTime,
        sessionEndTime
      );
      existingUser.time_tracker_sessions = existingUser.time_tracker_sessions.concat([
        timeTrackerSession,
      ]);
      return {
        message: `Successfully create time tracker session`,
        type: ResponseType.Success,
      };
    } catch (error) {
      this.logger.error(`[CREATE_NEW_SESSION]: ${error.message}`);
      return {
        message: error,
        type: ResponseType.Error,
      };
    }
  }
}
