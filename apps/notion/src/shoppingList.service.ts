import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetBlockResponse } from '@notionhq/client/build/src/api-endpoints';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Client, isFullBlock, isFullPage } from '@notionhq/client';

enum ShoppingListStore {
    publix = 'Publix',
    costco = 'Costco',
}

enum ShoppingListButtonType {
    checkAll,
    clear,
}

type ShoppingListButton = {
    id: string;
    store: ShoppingListStore;
    type: ShoppingListButtonType;
};

@Injectable()
export class ShoppingListService {
    databaseId: string;
    buttons: ShoppingListButton[];
    notionService: Client;

    constructor(private configService: ConfigService) {
        this.notionService = new Client({
            auth: this.configService.get('NOTION_TOKEN'),
        });
        this.databaseId = this.configService.get('SHOPPING_LIST_DATABASE_ID');
        this.buttons = [
            {
                id: this.configService.get('CLEAR_COSTCO_BUTTON_ID'),
                store: ShoppingListStore.costco,
                type: ShoppingListButtonType.clear,
            },
            {
                id: this.configService.get('CLEAR_PUBLIX_BUTTON_ID'),
                store: ShoppingListStore.publix,
                type: ShoppingListButtonType.clear,
            },
            {
                id: this.configService.get('CHECK_ALL_PUBLIX_BUTTON_ID'),
                store: ShoppingListStore.publix,
                type: ShoppingListButtonType.checkAll,
            },
            {
                id: this.configService.get('CHECK_ALL_COSTCO_BUTTON_ID'),
                store: ShoppingListStore.costco,
                type: ShoppingListButtonType.checkAll,
            },
        ];
    }

    @Cron(CronExpression.EVERY_5_SECONDS)
    async checkButtons() {
        for (const button of this.buttons) {
            const blockPromise = this.notionService.blocks
                .retrieve({ block_id: button.id })
                .catch((err) => {
                    console.log('\n');
                    console.log(
                        `------Get ${
                            button.type === ShoppingListButtonType.clear
                                ? 'Clear'
                                : 'CheckAll'
                        } ${button.store} Button Failure------`,
                    );
                    console.log(`${err}`);
                });

            const block = (await blockPromise) as GetBlockResponse;
            if (this.isTodo(block) && block['to_do'].checked) {
                this.uncheckButton(button.id);
                switch (button.type) {
                    case ShoppingListButtonType.checkAll:
                        this.checkList(button.store);
                        break;
                    case ShoppingListButtonType.clear:
                        this.resetList(button.store);
                        break;
                }
            }
        }
    }

    // Check all "In Cart" from list.
    private async checkList(list: ShoppingListStore) {
        this.notionService.databases
            .query({
                database_id: this.databaseId,
                filter: {
                    and: [
                        {
                            property: list,
                            checkbox: {
                                equals: true,
                            },
                        },
                        {
                            property: 'In Cart',
                            checkbox: {
                                equals: false,
                            },
                        },
                    ],
                },
            })
            .then((response) => {
                response.results.forEach((page) => {
                    this.notionService.pages.update({
                        page_id: page.id,
                        properties: {
                            ['In Cart']: {
                                checkbox: true,
                            },
                        },
                    });
                });
            })
            .catch((err) => {
                console.log(`\n------Database Query Error------\n${err}`);
            });
    }

    // Remove all "In Cart" entries from list.
    private async resetList(list: ShoppingListStore) {
        this.notionService.databases
            .query({
                database_id: this.databaseId,
                filter: {
                    and: [
                        {
                            property: list,
                            checkbox: {
                                equals: true,
                            },
                        },
                        {
                            property: 'In Cart',
                            checkbox: {
                                equals: true,
                            },
                        },
                    ],
                },
            })
            .then((response) => {
                response.results.forEach((page) => {
                    if (!isFullPage(page)) return;
                    const count =
                        page.properties.Count != null
                            ? page.properties.Count['number']
                            : 1;

                    this.notionService.pages
                        .update({
                            page_id: page.id,
                            properties: {
                                [list]: {
                                    checkbox: false,
                                },
                                ['In Cart']: {
                                    checkbox: false,
                                },
                                Count: {
                                    number: count,
                                },
                            },
                        })
                        .then((page) => {
                            if (!isFullPage(page)) return;
                            console.log(
                                `\n------Page Updated------\n${page.properties.Name['title'][0].plain_text}`,
                            );
                        })
                        .catch((err) => {
                            console.log(
                                `\n------Page Update Failed------\n${err}`,
                            );
                        });
                });
            })
            .catch((err) => {
                console.log(`\n------Database Query Error------\n${err}`);
            });
    }

    // Uncheck button.
    private async uncheckButton(buttonId: string) {
        this.notionService.blocks
            .update({
                block_id: buttonId,
                to_do: {
                    checked: false,
                },
            })
            .then((block) => {
                if (!isFullBlock(block)) return;
                console.log(`\n------Block Updated------\n${block.type}`);
            })
            .catch((err) => {
                console.log(`\n------Block Update Failure------\n${err}`);
            });
    }

    private isTodo<T extends Record<string, unknown>>(
        obj: T,
    ): obj is T & { type: 'to_do' } {
        return 'type' in obj && obj.type === 'to_do';
    }
}
