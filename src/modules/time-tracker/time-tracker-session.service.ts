import { Injectable } from '@nestjs/common';
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
    super(CollectionRegistry.TimeTracker);
  }

  /** Create a new time tracker session */
  createNewSession = async (
    mode: TimeTrackerProductivityMode,
    date: number,
    session_start_time: number,
    session_end_time: number,
    trackedTabs: string
  ): Promise<TimeTrackerSession> => {
    const _collection = await db.collection(this.collectionRegistry);
    const timeTrackerSessionID = `time-tracker-${uuidV4()}`;
    const data: TimeTrackerSession = {
      id: timeTrackerSessionID,
      date,
      mode,
      session_start_time,
      session_end_time,
      state: TimeTrackerEngineState.Void,
      trackedTabs,
    };
    await _collection.doc(timeTrackerSessionID).create(data);
    return data;
  };
}
