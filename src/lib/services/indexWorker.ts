import { prisma } from '@/lib/prisma';
import { getNextRunDate } from '@/lib/validators/cron';
import { IndexJob } from '@prisma/client';
import { EventEmitter } from 'events';
import { indexService } from './indexService';

class IndexWorker extends EventEmitter {
  private isRunning: boolean = false;
  private currentJob: IndexJob | null = null;
  private workerInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.checkSchedules = this.checkSchedules.bind(this);
  }

  public start() {
    if (this.workerInterval) {
      return;
    }

    // Check schedules every minute
    this.workerInterval = setInterval(this.checkSchedules, 60 * 1000);
    this.checkSchedules(); // Run initial check
  }

  public stop() {
    if (this.workerInterval) {
      clearInterval(this.workerInterval);
      this.workerInterval = null;
    }
  }

  private async checkSchedules() {
    if (this.isRunning) {
      return;
    }

    try {
      // Get all enabled schedules
      const schedules = await prisma.indexSchedule.findMany({
        where: { enabled: true },
      });

      const now = new Date();

      for (const schedule of schedules) {
        try {
          const nextRun = getNextRunDate(schedule.cronExpression);
          
          // If the next run time is in the past, execute the job
          if (nextRun <= now) {
            await this.executeJob(schedule);
            
            // Update schedule's last run time
            await prisma.indexSchedule.update({
              where: { id: schedule.id },
              data: { lastRun: now },
            });
          }
        } catch (error) {
          console.error(`Error processing schedule ${schedule.id}:`, error);
          continue;
        }
      }
    } catch (error) {
      console.error('Error checking schedules:', error);
    }
  }

  private async executeJob(schedule: any) {
    this.isRunning = true;

    try {
      // Create a new job record
      this.currentJob = await prisma.indexJob.create({
        data: {
          scheduleId: schedule.id,
          type: schedule.type,
          status: 'running',
          startedAt: new Date(),
        },
      });

      // Emit job start event
      this.emit('jobStart', this.currentJob);

      // Execute the indexing based on type
      if (schedule.type === 'full') {
        await indexService.runFullIndex(this.currentJob.id, (progress) => {
          this.emit('jobProgress', { job: this.currentJob, progress });
        });
      } else {
        await indexService.runIncrementalIndex(this.currentJob.id, (progress) => {
          this.emit('jobProgress', { job: this.currentJob, progress });
        });
      }

      // Update job as completed
      await prisma.indexJob.update({
        where: { id: this.currentJob.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      // Emit job complete event
      this.emit('jobComplete', this.currentJob);
    } catch (error) {
      console.error('Error executing job:', error);

      // Update job as failed
      if (this.currentJob) {
        await prisma.indexJob.update({
          where: { id: this.currentJob.id },
          data: {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date(),
          },
        });
      }

      // Emit job error event
      this.emit('jobError', { job: this.currentJob, error });
    } finally {
      this.isRunning = false;
      this.currentJob = null;
    }
  }

  public async getJobStatus(jobId: string) {
    return prisma.indexJob.findUnique({
      where: { id: jobId },
      include: {
        schedule: true,
      },
    });
  }

  public async cancelJob(jobId: string) {
    if (this.currentJob?.id === jobId) {
      this.isRunning = false;
      this.currentJob = null;

      await prisma.indexJob.update({
        where: { id: jobId },
        data: {
          status: 'cancelled',
          completedAt: new Date(),
        },
      });

      this.emit('jobCancel', jobId);
      return true;
    }
    return false;
  }

  public async getScheduleStatus(scheduleId: string) {
    const schedule = await prisma.indexSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        jobs: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!schedule) {
      return null;
    }

    const nextRun = getNextRunDate(schedule.cronExpression);
    const lastJob = schedule.jobs[0];

    return {
      ...schedule,
      nextRun,
      lastJob,
      isRunning: this.currentJob?.scheduleId === scheduleId,
    };
  }

  public async getWorkerStatus() {
    const stats = await indexService.getIndexStats();
    const activeJob = this.currentJob ? await this.getJobStatus(this.currentJob.id) : null;
    const recentJobs = await prisma.indexJob.findMany({
      take: 10,
      orderBy: { startedAt: 'desc' },
      include: {
        schedule: true,
      },
    });

    return {
      isRunning: this.isRunning,
      activeJob,
      recentJobs,
      indexStats: stats,
    };
  }
}

// Create a singleton instance
export const indexWorker = new IndexWorker();

// Start the worker when the module is imported
if (process.env.NODE_ENV === 'production') {
  indexWorker.start();
} 