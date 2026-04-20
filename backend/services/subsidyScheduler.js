const cron = require('node-cron');
const subsidyScraper = require('./subsidyScraper');

class SubsidyScheduler {
  constructor() {
    this.isRunning = false;
  }

  // Schedule daily scraping at 2 AM Nepal time (UTC 20:15)
  // Cron format: '15 20 * * *' (15th minute of 20th hour, every day)
  startDailyScraping() {
    console.log('🚀 Starting automated subsidy scraping scheduler...');

    // Run daily at 2:15 AM UTC (8:30 AM Nepal time)
    cron.schedule('15 20 * * *', async () => {
      if (this.isRunning) {
        console.log('⏭️  Skipping scheduled scraping - previous run still active');
        return;
      }

      try {
        this.isRunning = true;
        console.log('🔄 Running scheduled subsidy scraping...');

        const scrapedSubsidies = await subsidyScraper.scrapeAllSources();

        if (scrapedSubsidies.length > 0) {
          const { created, updated } = await subsidyScraper.updateDatabase(scrapedSubsidies);
          console.log(`✅ Scheduled scraping complete: ${created} created, ${updated} updated`);
        } else {
          console.log('ℹ️  Scheduled scraping complete: No new subsidies found');
        }
      } catch (error) {
        console.error('❌ Scheduled scraping failed:', error.message);
      } finally {
        this.isRunning = false;
      }
    });

    console.log('✅ Daily subsidy scraping scheduled (runs at 2:15 AM UTC / 8:30 AM Nepal time)');
  }

  // Manual trigger for testing
  async runNow() {
    if (this.isRunning) {
      throw new Error('Scraping is already running');
    }

    try {
      this.isRunning = true;
      console.log('🔄 Running manual subsidy scraping...');

      const scrapedSubsidies = await subsidyScraper.scrapeAllSources();

      if (scrapedSubsidies.length > 0) {
        const { created, updated } = await subsidyScraper.updateDatabase(scrapedSubsidies);
        console.log(`✅ Manual scraping complete: ${created} created, ${updated} updated`);
        return { scraped: scrapedSubsidies.length, created, updated };
      } else {
        console.log('ℹ️  Manual scraping complete: No new subsidies found');
        return { scraped: 0, created: 0, updated: 0 };
      }
    } catch (error) {
      console.error('❌ Manual scraping failed:', error.message);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: this.getNextRunTime()
    };
  }

  // Calculate next run time
  getNextRunTime() {
    const now = new Date();
    const nextRun = new Date(now);

    // Set to 2:15 AM UTC tomorrow
    nextRun.setUTCHours(20, 15, 0, 0);

    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun;
  }
}

module.exports = new SubsidyScheduler();