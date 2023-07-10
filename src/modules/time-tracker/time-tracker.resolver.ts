import { Logger } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateNewTimeTrackerArgs } from 'src/dto/time-tracker';
import { AppResponse, ResponseType } from 'src/models';
import { TimeTrackerSession } from 'src/models/time-tracker.model';
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

  @Query(() => [TimeTrackerSession])
  async getUserTimeTrackerSessions(@Context('req') req) {
    try {
      const authUser = getAuthUser(req);
      const existingUser = await this.userService.getUserByEmail(authUser.email);
      const timeTrackerSessions = existingUser.timeTrackerSessions;
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
      const { mode, date, recurring, sessionEndTime, sessionStartTime } = args;
      const existingUser = await this.userService.getUserByEmail(authUser.email);
      const timeTrackerSession = await this.timeTrackerSessionService.createNewSession(
        mode,
        date,
        recurring,
        sessionStartTime,
        sessionEndTime
      );
      existingUser.timeTrackerSessions = existingUser.timeTrackerSessions.concat([
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
