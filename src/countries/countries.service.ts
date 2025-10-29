import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { createCanvas, loadImage } from 'canvas';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { Country } from 'src/schemas/country..schema';

@Injectable()
export class CountriesService {
  private readonly countriesUrl =
    'https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies';
  private readonly exchangeUrl = 'https://open.er-api.com/v6/latest/USD';
  private lastRefreshedAt: string = null;

  constructor(
    @InjectModel(Country.name)
    private countryModel: Model<Country>,
  ) {}

  async refreshCountries(): Promise<{ message: string; total: number }> {
  try {
    const [countriesRes, exchangeRes] = await Promise.all([
      axios.get(this.countriesUrl),
      axios.get(this.exchangeUrl),
    ]);

    const countriesData = countriesRes.data;
    const exchangeRates = exchangeRes.data.rates;

    const ops = countriesData.map(async (country: any) => {
      let name = country.name?.trim();
      if (!name) return; // skip invalid entries

      // normalize for consistency
      name = name.replace(/\s*\(.*?\)\s*/g, '').trim(); // remove parentheses content (e.g., (Plurinational State of))
      name = name.toLowerCase(); // make case-insensitive unique

      const capital = country.capital || null;
      const region = country.region || null;
      const population = country.population || 0;
      const flag_url = country.flag || null;
      const currency_code = country.currencies?.[0]?.code ?? null;

      let exchange_rate = null;
      let estimated_gdp = 0;

      if (currency_code && exchangeRates[currency_code]) {
        exchange_rate = exchangeRates[currency_code];
        const randomMultiplier = Math.floor(1000 + Math.random() * 1000);
        estimated_gdp = (population * randomMultiplier) / exchange_rate;
      }

      await this.countryModel.updateOne(
        { name },
        {
          $set: {
            name,
            capital,
            region,
            population,
            currency_code,
            exchange_rate,
            estimated_gdp,
            flag_url,
            last_refreshed_at: new Date(),
          },
        },
        { upsert: true },
      );
    });

    await Promise.all(ops);

    const total = await this.countryModel.countDocuments();
    this.lastRefreshedAt = new Date().toISOString();

    return { message: 'Countries refreshed successfully', total };
  } catch (err) {
    throw new HttpException(
      `Failed to refresh countries: ${err.message}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

  private async generateSummaryImage(totalCountries: number): Promise<void> {
    const topCountries = await this.countryModel
      .find({ estimated_gdp: { $ne: null } })
      .sort({ estimated_gdp: -1 })
      .limit(5)
      .lean();

    const width = 900;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 40px Arial';
    ctx.fillText('🌍 Country Summary', 40, 80);

    ctx.font = '28px Arial';
    ctx.fillText(`Total Countries: ${totalCountries}`, 40, 150);
    ctx.fillText(`Last Refresh: ${this.lastRefreshedAt}`, 40, 190);

    ctx.fillText('Top 5 by Estimated GDP:', 40, 250);
    let y = 300;
    topCountries.forEach((c, i) => {
      ctx.fillText(
        `${i + 1}. ${c.name} — ${c.estimated_gdp.toFixed(2)}`,
        60,
        y,
      );
      y += 40;
    });

    const cacheDir = join(process.cwd(), 'cache');
    await mkdir(cacheDir, { recursive: true });

    const outputPath = join(cacheDir, 'summary.png');
    const buffer = canvas.toBuffer('image/png');
    await writeFile(outputPath, buffer);
  }

  async getSummaryImage(): Promise<Buffer | { error: string }> {
    const imagePath = join(process.cwd(), 'cache', 'summary.png');
    try {
      const fs = await import('fs/promises');
      return await fs.readFile(imagePath);
    } catch {
      return { error: 'Summary image not found' };
    }
  }

  async findOne(name: string): Promise<Country> {
    const country = await this.countryModel
      .findOne({
        name: { $regex: `^${this.escapeRegex(name)}$`, $options: 'i' },
      })
      .exec();

    if (!country) {
      throw new NotFoundException({ error: `Country '${name}' not found` });
    }

    return country;
  }

  async findAll(query: any): Promise<Country[]> {
    const { region, currency, sort } = query;
    const filter: any = {};

    if (region) filter.region = region;
    if (currency) filter.currency_code = currency;

    let sortObj: any = {};
    if (sort) {
      if (sort === 'gdp_desc') sortObj = { estimated_gdp: -1 };
      else if (sort === 'gdp_asc') sortObj = { estimated_gdp: 1 };
    }

    return this.countryModel.find(filter).sort(sortObj).exec();
  }

  async delete(name: string): Promise<{ message: string }> {
    const result = await this.countryModel.deleteOne({
      name: { $regex: `^${this.escapeRegex(name)}$`, $options: 'i' },
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException({ error: `Country '${name}' not found` });
    }

    return { message: `Country '${name}' deleted successfully` };
  }

  async getStatus() {
    const total = await this.countryModel.countDocuments();
    const latest = await this.countryModel
      .findOne()
      .sort({ last_refreshed_at: -1 })
      .select('last_refreshed_at')
      .lean();

    return {
      total_countries: total,
      last_refreshed_at: latest?.last_refreshed_at ?? null,
    };
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
