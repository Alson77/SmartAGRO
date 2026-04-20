const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const ScrapedSubsidy = require('../models/ScrapedSubsidy');

class SubsidyScraper {
  constructor() {
    this.sources = [
      {
        name: 'Ministry of Agriculture and Livestock Development',
        url: 'https://www.moald.gov.np/',
        type: 'dynamic' // Requires JavaScript execution
      },
      {
        name: 'Agriculture Development Bank',
        url: 'https://www.adb.org.np/',
        type: 'static'
      },
      {
        name: 'National Agricultural Research Council',
        url: 'https://www.narc.gov.np/',
        type: 'static'
      }
    ];
  }

  async scrapeAllSources() {
    const results = [];

    for (const source of this.sources) {
      try {
        console.log(`🔍 Scraping ${source.name}...`);
        const subsidies = await this.scrapeSource(source);
        results.push(...subsidies);
        console.log(`✅ Found ${subsidies.length} subsidies from ${source.name}`);
      } catch (error) {
        console.error(`❌ Error scraping ${source.name}:`, error.message);
      }
    }

    return results;
  }

  async scrapeSource(source) {
    try {
      if (source.type === 'dynamic') {
        return await this.scrapeDynamicSite(source);
      } else {
        return await this.scrapeStaticSite(source);
      }
    } catch (error) {
      console.error(`Error scraping ${source.name}:`, error.message);
      return [];
    }
  }

  async scrapeStaticSite(source) {
    try {
      const response = await axios.get(source.url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const subsidies = [];

      // Look for subsidy-related content
      const subsidySelectors = [
        '.subsidy', '.grant', '.scheme', '.program',
        '[class*="subsidy"]', '[class*="grant"]', '[class*="scheme"]',
        'h1, h2, h3, h4', 'p', '.content', '.main-content'
      ];

      subsidySelectors.forEach(selector => {
        $(selector).each((i, element) => {
          const text = $(element).text().trim();
          if (this.isSubsidyRelated(text)) {
            const subsidy = this.parseSubsidyText(text, source);
            if (subsidy) {
              subsidies.push(subsidy);
            }
          }
        });
      });

      return subsidies;
    } catch (error) {
      console.error(`Error scraping static site ${source.name}:`, error.message);
      return [];
    }
  }

  async scrapeDynamicSite(source) {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

      await page.goto(source.url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for dynamic content to load
      await page.waitForTimeout(3000);

      const content = await page.evaluate(() => {
        const elements = document.querySelectorAll('h1, h2, h3, h4, p, .content, .main-content, .subsidy, .grant, .scheme');
        return Array.from(elements).map(el => el.textContent?.trim()).filter(text => text && text.length > 10);
      });

      const subsidies = [];
      content.forEach(text => {
        if (this.isSubsidyRelated(text)) {
          const subsidy = this.parseSubsidyText(text, source);
          if (subsidy) {
            subsidies.push(subsidy);
          }
        }
      });

      return subsidies;
    } catch (error) {
      console.error(`Error scraping dynamic site ${source.name}:`, error.message);
      return [];
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  isSubsidyRelated(text) {
    const subsidyKeywords = [
      'subsidy', 'grant', 'scheme', 'program', 'assistance', 'support',
      'agricultural subsidy', 'farm subsidy', 'crop subsidy', 'fertilizer subsidy',
      'seed subsidy', 'equipment subsidy', 'irrigation subsidy',
      'रकम', 'अनुदान', 'सहयोग', 'कार्यक्रम', 'योजना'
    ];

    const lowerText = text.toLowerCase();
    return subsidyKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  }

  parseSubsidyText(text, source) {
    try {
      // Basic parsing logic - this would need to be enhanced based on actual website structure
      const title = this.extractTitle(text);
      const description = this.extractDescription(text);
      const amount = this.extractAmount(text);

      if (!title || !description) return null;

      return {
        title,
        description,
        subsidyType: this.categorizeSubsidy(text),
        eligibleCrops: this.extractCrops(text),
        maximumAmount: amount,
        sourceUrl: source.url,
        sourceName: source.name,
        lastUpdated: new Date(),
        isActive: true,
        region: 'Nepal',
        category: 'agricultural'
      };
    } catch (error) {
      console.error('Error parsing subsidy text:', error.message);
      return null;
    }
  }

  extractTitle(text) {
    // Extract first sentence or heading
    const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 10);
    return sentences[0]?.trim() || text.substring(0, 100);
  }

  extractDescription(text) {
    return text.length > 200 ? text.substring(0, 500) + '...' : text;
  }

  extractAmount(text) {
    // Look for amounts in text (Nepali Rupees)
    const amountRegex = /(?:Rs\.?|रु\.?|रुपैयाँ)\s*(\d+(?:,\d+)*(?:\.\d+)?)/gi;
    const matches = text.match(amountRegex);
    if (matches && matches.length > 0) {
      // Extract the first amount found
      const amountMatch = matches[0].match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
      if (amountMatch) {
        return parseFloat(amountMatch[1].replace(/,/g, ''));
      }
    }
    return null;
  }

  categorizeSubsidy(text) {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('seed') || lowerText.includes('बीउ')) return 'Seeds';
    if (lowerText.includes('fertilizer') || lowerText.includes('खाद')) return 'Fertilizer';
    if (lowerText.includes('equipment') || lowerText.includes('उपकरण')) return 'Equipment';
    if (lowerText.includes('irrigation') || lowerText.includes('सिंचाइ')) return 'Irrigation';
    if (lowerText.includes('crop') || lowerText.includes('फसल')) return 'Crops';

    return 'General Agricultural';
  }

  extractCrops(text) {
    const cropKeywords = [
      'rice', 'धान', 'wheat', 'गेहूँ', 'corn', 'मक्का', 'potato', 'आलु',
      'tomato', 'गोलभेडा', 'onion', 'प्याज', 'vegetable', 'तरकारी'
    ];

    const foundCrops = [];
    const lowerText = text.toLowerCase();

    cropKeywords.forEach(crop => {
      if (lowerText.includes(crop.toLowerCase())) {
        foundCrops.push(crop);
      }
    });

    return foundCrops.length > 0 ? foundCrops : ['All Crops'];
  }

  async updateDatabase(subsidies) {
    try {
      let updated = 0;
      let created = 0;

      for (const subsidy of subsidies) {
        // Check if subsidy already exists
        const existing = await ScrapedSubsidy.findOne({
          title: subsidy.title,
          sourceUrl: subsidy.sourceUrl
        });

        if (existing) {
          // Update existing
          await ScrapedSubsidy.findByIdAndUpdate(existing._id, {
            ...subsidy,
            lastUpdated: new Date()
          });
          updated++;
        } else {
          // Create new
          await ScrapedSubsidy.create(subsidy);
          created++;
        }
      }

      console.log(`📊 Database update complete: ${created} created, ${updated} updated`);
      return { created, updated };
    } catch (error) {
      console.error('Error updating database:', error.message);
      throw error;
    }
  }

  async getLatestSubsidies(limit = 50) {
    try {
      return await ScrapedSubsidy.find({ isActive: true })
        .sort({ lastUpdated: -1 })
        .limit(limit);
    } catch (error) {
      console.error('Error fetching latest subsidies:', error.message);
      return [];
    }
  }
}

module.exports = new SubsidyScraper();