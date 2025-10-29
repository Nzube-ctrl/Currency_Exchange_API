import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import { CountriesService } from './countries.service';
import { Response } from 'express';
import * as fs from 'fs';

@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Post('refresh')
  async refreshCountries() {
    return this.countriesService.refreshCountries();
  }

  @Get()
  async getAllCountries(@Query() query: any) {
    return this.countriesService.findAll(query);
  }

  @Get(':name')
  async getCountryByName(@Param('name') name: string) {
    return this.countriesService.findOne(name);
  }

  @Delete(':name')
  async deleteCountry(@Param('name') name: string) {
    return this.countriesService.delete(name);
  }

  @Get('/image')
  async getImage(@Res() res: Response) {
    const imagePath = await this.countriesService.getSummaryImage();
    if (typeof imagePath === 'object') {
      return res.status(404).json(imagePath);
    }

    const img = fs.createReadStream(imagePath);
    res.setHeader('Content-Type', 'image/png');
    img.pipe(res);
  }
}
