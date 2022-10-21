import { Injectable, OnModuleInit } from '@nestjs/common';
import * as rp from 'request-promise';
import * as cheerio from 'cheerio';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Crab, CrabDocument } from './crab.schema';

const url =
    'https://www.crabdatabase.info/en/photo-gallery/sea-life?ajax=1&page=';

@Injectable()
export class CrabService implements OnModuleInit {
    public crabs: CrabDocument[];

    constructor(
        @InjectModel(Crab.name) private crabModel: Model<CrabDocument>,
    ) {
        this.crabs = [];
    }

    async onModuleInit() {
        const count = await this.crabModel.countDocuments();

        if (count == 0) {
            const crabs = [];
            for (let i = 1; i <= 20; i++) {
                const html = await rp(url + i);
                const $ = cheerio.load(html + 1);
                const divs = $('div > div > a')
                    .map((i, div) => {
                        return {
                            name: $(div).attr('title'),
                            imageURL:
                                'https://www.crabdatabase.info' +
                                $(div).attr('href'),
                        };
                    })
                    .toArray();
                crabs.push(...divs);
            }
            const crabDocs = await this.crabModel.create(crabs);
            this.crabs = crabDocs;
        } else {
            const crabDocs = await this.crabModel.find();
            crabDocs.forEach((crab: CrabDocument) => {
                this.crabs.push(crab);
            });
        }
    }
}
