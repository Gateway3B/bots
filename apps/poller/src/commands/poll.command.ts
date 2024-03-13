import { SlashCommandPipe } from '@discord-nestjs/common';
import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { createHash, randomBytes } from 'crypto';
import {
    ActionRowBuilder,
    APIActionRowComponent,
    APIMessageActionRowComponent,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    CacheType,
    ChatInputCommandInteraction,
    ColorResolvable,
    CommandInteraction,
    EmbedBuilder,
    GuildMemberRoleManager,
    InteractionReplyOptions,
    Message,
    MessageActionRowComponentBuilder,
} from 'discord.js';
import { Model } from 'mongoose';
import { PollDto } from '../dtos/poll.dto';
import {
    PollSettings,
    PollSettingsDocument,
} from '../service/pollSettings.schema';
import * as sharp from 'sharp';
import * as vega from 'vega';

type Poll = {
    interaction: ChatInputCommandInteraction<CacheType>;
    guildSettings: PollSettings;
    pollId: string;
    embed?: InteractionReplyOptions;
    options?: Map<number, string>;
    numOptions?: number;
    pollTime?: number;
    voters?: Map<string, Voter>;
    finalize?: boolean;
    results?: number[];
    followUp?: Message<boolean>;
    graph?: Buffer;
};

type Voter = {
    counter: number;
    votes: Vote[];
};

type Vote = {
    index: number;
    order: number;
    state: boolean;
};

@Command({
    name: 'poll',
    description: 'Initiate a poll in this channel.',
})
export class PollCommand {
    constructor(
        @InjectModel(PollSettings.name)
        private pollSettingsModel: Model<PollSettingsDocument>,
        private configService: ConfigService,
    ) {}

    @Handler()
    async handler(
        @InteractionEvent(SlashCommandPipe) dto: PollDto,
        @InteractionEvent() interaction: CommandInteraction,
    ): Promise<void> {
        let guildSettings = (await this.pollSettingsModel.findOne({
            guild: interaction.guild.id,
        })) as PollSettings;

        if (guildSettings === null) {
            guildSettings = await this.pollSettingsModel.create({
                guild: interaction.guild.id,
                type: 'standard',
                time_limit_hours: null,
                time_limit_minutes: 5,
                real_time_results: false,
                multiple_votes: false,
                role: null,
            });
        }

        const pollId = encodeURIComponent(
            createHash('sha256')
                .update(
                    this.makeQuestion(
                        interaction.options.get('title').value as string,
                    ) + randomBytes(256).toString(),
                )
                .digest('base64'),
        ).replace(/%/g, '');

        const poll: Poll = {
            interaction: interaction as ChatInputCommandInteraction<CacheType>,
            guildSettings: guildSettings,
            pollId: pollId,
        };

        this.createPollEmbed(poll);

        this.setPollTimer(poll);

        this.computeFooter(poll);

        this.createButtonHandler(poll);

        poll.interaction.reply(poll.embed);

        if (poll.guildSettings.real_time_results) {
            await this.displayResults(poll);
        }
    }

    private createPollEmbed(poll: Poll) {
        const embed = new EmbedBuilder()
            .setTitle(
                this.makeQuestion(
                    poll.interaction.options.get('title').value as string,
                ),
            )
            .setColor(this.configService.get<ColorResolvable>('PrimaryColor'));

        const buttonRows: ActionRowBuilder<MessageActionRowComponentBuilder>[] =
            [];
        buttonRows.push(
            new ActionRowBuilder<MessageActionRowComponentBuilder>(),
        );

        let numOptions = 0;
        for (let i = 1; i <= 10; i++) {
            const option = poll.interaction.options.get(`option_${i}`)
                ?.value as string;
            if (option) {
                if (buttonRows[buttonRows.length - 1].components.length === 5)
                    buttonRows.push(
                        new ActionRowBuilder<MessageActionRowComponentBuilder>(),
                    );

                numOptions++;
                embed.addFields({
                    name: `Option ${this.keycapEmojiMap(numOptions)}`,
                    value: option,
                    inline: true,
                });

                if (!poll.options) poll.options = new Map<number, string>();

                poll.options.set(numOptions, option);

                buttonRows[buttonRows.length - 1].addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${poll.pollId}${numOptions}`)
                        .setLabel(`Option ${this.keycapEmojiMap(numOptions)}`)
                        .setStyle(ButtonStyle.Primary),
                );
            }
        }

        embed.setFooter({ text: '-' });

        poll.numOptions = numOptions;

        poll.embed = {
            embeds: [embed],
            components: buttonRows,
        };
    }

    private setPollTimer(poll: Poll) {
        poll.pollTime =
            (poll.guildSettings.time_limit_hours * 60000 +
                poll.guildSettings.time_limit_minutes) *
            60000;

        setTimeout(() => this.finalizePoll(poll), poll.pollTime);
    }

    private computeFooter(poll: Poll) {
        const date = new Date(Date.now() + poll.pollTime);
        let suffix;

        switch (date.getDate()) {
            case 1:
                suffix = 'st';
                break;
            case 2:
                suffix = 'nd';
                break;
            case 3:
                suffix = 'rd';
                break;
            default:
                suffix = 'th';
        }

        const hours = date.getHours() % 12 === 0 ? '12' : date.getHours() % 12;
        const minutes =
            Math.floor(date.getMinutes() / 10) === 0
                ? '0' + date.getMinutes()
                : date.getMinutes();
        const ampm = date.getHours() / 12 === 0 ? 'am' : 'pm';

        const type = `${
            poll.guildSettings.type.charAt(0).toUpperCase() +
            poll.guildSettings.type.slice(1)
        } Poll`;
        const multiple = `${
            poll.guildSettings.multiple_votes ? 'Multiple Votes' : 'Single Vote'
        }`;
        const role = `Minimum Role: ${
            poll.guildSettings.role
                ? poll.interaction.guild.roles.cache.get(
                      poll.guildSettings.role,
                  ).name
                : '@everyone'
        }`;

        (
            poll.embed.embeds[0] as EmbedBuilder
        ).data.footer.text = `Poll Ends At: ${hours}:${minutes}${ampm} on the ${date.getDate()}${suffix}\n${type}|${multiple}|${role}`;
    }

    private createButtonHandler(poll: Poll) {
        poll.voters = new Map<string, Voter>();

        const collector =
            poll.interaction.channel.createMessageComponentCollector({
                filter: (i: ButtonInteraction<'cached'>) =>
                    i.customId.substring(0, poll.pollId.length) === poll.pollId,
                time: poll.pollTime,
            });

        collector.on('collect', async (i: ButtonInteraction) => {
            const voteNumber =
                parseInt(i.customId.substring(poll.pollId.length)) - 1;

            const embed = new EmbedBuilder().setColor(
                this.configService.get<ColorResolvable>('PrimaryColor'),
            );

            const multiVote =
                poll.guildSettings.multiple_votes ||
                poll.guildSettings.type === 'ranked';

            if (
                poll.guildSettings.role &&
                (i.member.roles as GuildMemberRoleManager).highest.position <
                    poll.interaction.guild.roles.cache.get(
                        poll.guildSettings.role,
                    ).position
            ) {
                embed.setTitle(
                    'Your Role Is Not High Enough To Vote In This Poll',
                );
            } else if (!poll.voters.has(i.user.id)) {
                const voter = {
                    counter: multiVote ? 0 : voteNumber,
                    votes: new Array(poll.numOptions)
                        .fill(null)
                        .map((value, index) => ({
                            index: index,
                            order: 0,
                            state: false,
                        })),
                };
                voter.votes[voteNumber].state = true;
                poll.voters.set(i.user.id, voter);

                embed.setTitle(
                    `Vote Added for Option ${this.keycapEmojiMap(
                        voteNumber + 1,
                    )}`,
                );
            } else {
                if (multiVote) {
                    const voter = poll.voters.get(i.user.id);

                    const state = voter.votes[voteNumber].state != true;
                    const counter = ++voter.counter;

                    voter.votes[voteNumber].state = state;
                    voter.votes[voteNumber].order = counter;

                    embed.setTitle(
                        `Vote ${
                            state ? 'Added' : 'Removed'
                        } for Option ${this.keycapEmojiMap(voteNumber + 1)}`,
                    );
                    embed.setDescription(`${
                        poll.guildSettings.type === 'ranked'
                            ? 'Vote Ranking Descending'
                            : 'Current Votes'
                    }: 
                        ${voter.votes
                            .filter((x) => x.state)
                            .sort((a, b) => a.order - b.order)
                            .map((x) => this.keycapEmojiMap(x.index + 1))
                            .toString()}`);
                } else {
                    const voter = poll.voters.get(i.user.id);
                    if (voter.counter === voteNumber) {
                        embed.setTitle(
                            `Vote Removed for Option ${this.keycapEmojiMap(
                                voteNumber + 1,
                            )}`,
                        );
                        poll.voters.delete(i.user.id);
                    } else {
                        voter.votes[voter.counter].state =
                            voter.votes[voter.counter].state != true;
                        voter.votes[voteNumber].state =
                            voter.votes[voteNumber].state != true;

                        embed.setTitle(
                            `Vote Added for Option ${this.keycapEmojiMap(
                                voteNumber + 1,
                            )}`,
                        );
                        embed.setDescription(
                            `Vote Removed for Option ${this.keycapEmojiMap(
                                voter.counter + 1,
                            )}`,
                        );

                        voter.counter = voteNumber;
                    }
                }
            }

            if (poll.guildSettings.real_time_results) {
                await this.displayResults(poll);
            }

            i.reply({ embeds: [embed], ephemeral: true });
        });
    }

    private finalizePoll(poll: Poll) {
        poll.embed.components.forEach(
            (x: APIActionRowComponent<APIMessageActionRowComponent>) =>
                x.components.forEach((x) => (x.disabled = true)),
        );
        poll.interaction.editReply(poll.embed);
        poll.finalize = true;
        this.displayResults(poll);
    }

    private async displayResults(poll: Poll) {
        let sum = 0;
        poll.results = new Array(poll.numOptions).fill(0);
        if (!(poll.guildSettings.type === 'ranked') || !poll.finalize) {
            poll.voters.forEach((voter) => {
                voter.votes.forEach((vote) => {
                    poll.results[vote.index] += vote.state ? 1 : 0;

                    if (vote.state) sum++;
                });
            });
        } else {
            const excludeList = [];
            for (let i = 0; i < poll.numOptions; i++) {
                poll.voters.forEach((voter) => {
                    const voteList = voter.votes
                        .map((x) => x)
                        .sort((x) => x.order);
                    voteList.every((value) => {
                        if (
                            excludeList.indexOf(value.index) < 0 &&
                            value.state
                        ) {
                            poll.results[value.index] += 1;
                            sum++;
                            return false;
                        }
                        return true;
                    });
                });
                const max = poll.results
                    .map((x) => x)
                    .sort()
                    .reverse()[0];
                if (max / sum > 0.5) break;

                const min = poll.results.map((x) => x).sort()[0];
                poll.results.every((value, index) => {
                    if (value === min) {
                        excludeList.push(index);
                        return false;
                    }
                    return true;
                });

                if (i != poll.numOptions - 1) {
                    poll.results = new Array(poll.numOptions).fill(0);
                    sum = 0;
                }
            }
        }

        await this.generateGraph(poll);

        let description;
        let descriptionOptionValue;

        let topValue;
        if (poll.guildSettings.type === 'reverse')
            topValue = poll.results.slice().sort()[0];
        else topValue = poll.results.slice().sort().reverse()[0];

        const tieArray = [];
        poll.results.forEach((value, index) => {
            if (value === topValue) {
                tieArray.push(index);
            }
        });

        if (sum == 0) {
            description = `No Votes, No One `;
        } else if (tieArray.length === 1) {
            description = `Option ${this.keycapEmojiMap(tieArray[0] + 1)} `;
            descriptionOptionValue = poll.options.get(tieArray[0] + 1);
        } else {
            description = `Tie Between ${tieArray
                .map((x) => ` ${this.keycapEmojiMap(x + 1)}`)
                .toString()} No One `;
        }

        if (poll.finalize) {
            description = `${description} Wins!`;
        } else {
            description = `${description} Is In The Lead!`;
        }

        if (descriptionOptionValue)
            description = `${description}\n\n🏆${descriptionOptionValue}`;

        const embed = new EmbedBuilder()
            .setColor(this.configService.get<ColorResolvable>('PrimaryColor'))
            .setTitle(
                this.makeQuestion(
                    poll.interaction.options.get('title').value as string,
                ),
            )
            .setDescription(description)
            .setImage(`attachment://${poll.pollId}.png`);

        if (!poll.followUp) {
            poll.followUp = await poll.interaction.followUp({
                embeds: [embed],
                files: [{ attachment: poll.graph, name: `${poll.pollId}.png` }],
            });
        } else {
            await poll.followUp.edit({
                embeds: [embed],
                attachments: [],
                files: [],
            });
            await poll.followUp.edit({
                embeds: [embed],
                files: [{ attachment: poll.graph, name: `${poll.pollId}.png` }],
            });
        }
    }

    private async generateGraph(poll: Poll) {
        const pollResults: vega.Spec = {
            $schema: 'https://vega.github.io/schema/vega/v3.0.json',
            width: 500,
            height: 200,
            padding: 5,
            data: [
                {
                    name: 'table',
                    values: poll.results.map((value, index) => ({
                        category: `${index + 1}:${poll.options.get(
                            index + 1,
                        )}`.slice(0, 12 - poll.numOptions),
                        amount: value,
                    })),
                },
            ],
            scales: [
                {
                    name: 'xscale',
                    type: 'band',
                    domain: { data: 'table', field: 'category' },
                    range: 'width',
                    padding: 0.05,
                    round: true,
                },
                {
                    name: 'yscale',
                    domain: { data: 'table', field: 'amount' },
                    nice: true,
                    range: 'height',
                },
            ],
            axes: [
                {
                    orient: 'bottom',
                    scale: 'xscale',
                    labelColor: 'white',
                    labelFontSize: 30,
                    labelAngle: 14 + poll.numOptions / 2,
                    labelLineHeight: 10, //'line-bottom',
                },
            ],
            marks: [
                {
                    name: 'bars',
                    type: 'rect',
                    from: { data: 'table' },
                    encode: {
                        enter: {
                            x: { scale: 'xscale', field: 'category' },
                            width: { scale: 'xscale', band: 1 },
                            y: { scale: 'yscale', field: 'amount' },
                            y2: { scale: 'yscale', value: 0 },
                            fill: {
                                value:
                                    '#' +
                                    this.configService.get<string>(
                                        'PrimaryColor',
                                    ),
                            },
                            cornerRadiusTopLeft: { value: 20 },
                            cornerRadiusTopRight: { value: 20 },
                        },
                    },
                },
                {
                    type: 'text',
                    from: { data: 'bars' },
                    encode: {
                        enter: {
                            x: {
                                field: 'x',
                                offset: 7 + (0.5 * 500) / poll.results.length,
                            },
                            width: {
                                scale: 'xscale',
                                band: 1,
                            },
                            y: { field: 'y' },
                            text: { field: 'datum.amount' },
                            fontSize: { value: 40 },
                            fill: { value: 'white' },
                            align: { value: 'right' },
                            baseline: { value: 'bottom' },
                        },
                    },
                },
            ],
        };

        const view = new vega.View(vega.parse(pollResults), {
            renderer: 'none',
        });

        const svg = await view.toSVG();

        poll.graph = await sharp(Buffer.from(svg)).toFormat('png').toBuffer();
    }

    private makeQuestion(title: string): string {
        if (title.charAt(title.length - 1) != '?') return `${title}?`;
        return title;
    }

    private keycapEmojiMap(number: number) {
        switch (number) {
            case 1:
                return '1️⃣';
            case 2:
                return '2️⃣';
            case 3:
                return '3️⃣';
            case 4:
                return '4️⃣';
            case 5:
                return '5️⃣';
            case 6:
                return '6️⃣';
            case 7:
                return '7️⃣';
            case 8:
                return '8️⃣';
            case 9:
                return '9️⃣';
            case 10:
                return '🔟';
        }
    }
}
