import axios from "axios";
import * as cheerio from "cheerio";

interface IntelItem {
  title?: string;
  snippet?: string;
  status?: string;
  source: string;
  stall_point?: string;
}

interface AllianceStats {
  confidence: string;
  sources: string[];
  trackingStability: string;
  identifiedStallPoints: string[];
  lastUpdated: string;
}

interface TriangulatedResult {
  game: string;
  allianceStats: AllianceStats;
}

export class ScoutEngine {
  
  async fetchRedditIntel(gameName: string): Promise<IntelItem[]> {
    try {
      const searchUrl = `https://www.reddit.com/r/beermoney/search.json?q=${encodeURIComponent(gameName)}&restrict_sr=1&limit=10`;
      const { data } = await axios.get(searchUrl, {
        headers: { 'User-Agent': 'FreedmindCaddy/1.0' }
      });
      
      const posts: IntelItem[] = [];
      if (data?.data?.children) {
        for (const child of data.data.children) {
          const post = child.data;
          posts.push({
            title: post.title,
            snippet: post.selftext?.substring(0, 200) || '',
            source: 'Reddit r/beermoney'
          });
        }
      }
      return posts;
    } catch (e: any) {
      console.error("Reddit Scout Failed:", e.message);
      return [];
    }
  }

  async fetchBeerMoneyIntel(gameName: string): Promise<IntelItem[]> {
    try {
      const searchUrl = `https://www.reddit.com/r/beermoneyglobal/search.json?q=${encodeURIComponent(gameName)}&restrict_sr=1&limit=10`;
      const { data } = await axios.get(searchUrl, {
        headers: { 'User-Agent': 'FreedmindCaddy/1.0' }
      });
      
      const posts: IntelItem[] = [];
      if (data?.data?.children) {
        for (const child of data.data.children) {
          const post = child.data;
          posts.push({
            title: post.title,
            snippet: post.selftext?.substring(0, 200) || '',
            source: 'Reddit r/beermoneyglobal'
          });
        }
      }
      return posts;
    } catch (e: any) {
      console.error("BeerMoney Scout Failed:", e.message);
      return [];
    }
  }

  async fetchFreecashAcademyIntel(gameName: string): Promise<IntelItem[]> {
    try {
      const academyUrl = `https://freecash.com/academy/en/search?q=${encodeURIComponent(gameName)}`;
      const { data } = await axios.get(academyUrl);
      const $ = cheerio.load(data);
      
      let techStats: IntelItem[] = [];
      $('.academy-article-card').each((i, el) => {
        const snippet = $(el).find('.excerpt').text().trim().toLowerCase();
        
        if (snippet.includes('tracking') || snippet.includes('offerwall')) {
          techStats.push({
            title: $(el).find('.title').text().trim(),
            status: snippet.includes('pending') ? 'Delayed Tracking' : 'Stable Tracking',
            source: 'Freecash Academy'
          });
        }
      });
      return techStats;
    } catch (e: any) {
      console.error("Freecash Scout Failed:", e.message);
      return [];
    }
  }

  findStallPoints(allData: IntelItem[]): string[] {
    const stallPoints: string[] = [];
    const stallKeywords = ['stuck', 'stall', 'wall', 'cliff', 'impossible', 'paywall', 'p2w', 'days', 'weeks'];
    
    for (const item of allData) {
      const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
      for (const keyword of stallKeywords) {
        if (text.includes(keyword)) {
          const match = text.match(new RegExp(`(level|day|chapter|stage)?\\s*\\d+.*${keyword}|${keyword}.*\\d+`, 'i'));
          if (match) {
            stallPoints.push(match[0].trim());
          }
        }
      }
    }
    
    return Array.from(new Set(stallPoints)).slice(0, 5);
  }

  async triangulate(gameName: string): Promise<TriangulatedResult> {
    const [reddit, bm, freecash] = await Promise.all([
      this.fetchRedditIntel(gameName),
      this.fetchBeerMoneyIntel(gameName),
      this.fetchFreecashAcademyIntel(gameName)
    ]);

    const allData = [...reddit, ...bm, ...freecash];
    
    return {
      game: gameName,
      allianceStats: {
        confidence: allData.length > 7 ? 'High' : 'Medium',
        sources: ['Reddit', 'BeerMoney', 'Freecash Academy'],
        trackingStability: freecash.length > 0 ? (freecash[0].status || 'Unknown') : 'Unknown',
        identifiedStallPoints: this.findStallPoints(allData),
        lastUpdated: new Date().toISOString()
      }
    };
  }
}

export const scoutEngine = new ScoutEngine();
