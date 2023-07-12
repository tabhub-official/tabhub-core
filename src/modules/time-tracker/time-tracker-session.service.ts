import { Injectable } from '@nestjs/common';
import moment from 'moment';
import { CollectionRegistry, db } from 'src/config';
import {
  TimeTrackerEngineState,
  TimeTrackerProductivityMode,
  TimeTrackerSession,
} from 'src/models/time-tracker.model';
import { v4 as uuidV4 } from 'uuid';

import { BaseCRUDService } from '../_base/baseCRUD.service';

@Injectable()
export class TimeTrackerSessionService extends BaseCRUDService<TimeTrackerSession> {
  constructor() {
    super(CollectionRegistry.User);
  }

  /** Create a new time tracker session */
  createNewSession = async (
    mode: TimeTrackerProductivityMode,
    date: number,
    recurring: boolean,
    sessionStartTime: number,
    sessionEndTime: number
  ): Promise<TimeTrackerSession> => {
    const _collection = await db.collection(this.collectionRegistry);
    const timeTrackerSessionID = `time-tracker-${uuidV4()}`;
    const data: TimeTrackerSession = {
      id: timeTrackerSessionID,
      createdAt: moment().unix(),
      date,
      mode,
      recurring,
      sessionStartTime,
      sessionEndTime,
      state: TimeTrackerEngineState.Void,
    };
    await _collection.doc(timeTrackerSessionID).create(data);
    return data;
  };
}
