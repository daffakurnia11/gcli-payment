import cron from 'node-cron';

interface SchedulePayload {
  id: string;
  runAt: Date;
  handler: () => Promise<void>;
}

interface ScheduleJob {
  stop: () => void;
  id: string;
  runAt: Date;
}

export class SchedulerService {
  private readonly jobs = new Map<string, ScheduleJob>();

  schedule(payload: SchedulePayload): void {
    if (payload.runAt.getTime() <= Date.now()) {
      throw new Error('Schedule time must be in the future');
    }

    this.cancel(payload.id);

    const minute = payload.runAt.getUTCMinutes();
    const hour = payload.runAt.getUTCHours();
    const dayOfMonth = payload.runAt.getUTCDate();
    const month = payload.runAt.getUTCMonth() + 1;
    const scheduleExpression = `${minute} ${hour} ${dayOfMonth} ${month} *`;

    const task = cron.schedule(
      scheduleExpression,
      () => {
        void payload.handler().finally(() => {
          task.stop();
          this.jobs.delete(payload.id);
        });
      },
      {
        timezone: 'UTC'
      }
    );

    this.jobs.set(payload.id, {
      stop: () => task.stop(),
      id: payload.id,
      runAt: payload.runAt
    });
  }

  cancel(id: string): boolean {
    const job = this.jobs.get(id);

    if (!job) {
      return false;
    }

    job.stop();
    this.jobs.delete(id);
    return true;
  }

  list(): Array<{ id: string; runAt: Date }> {
    return Array.from(this.jobs.values()).map((job) => ({
      id: job.id,
      runAt: job.runAt
    }));
  }
}
