import { TFrontendBundle, TPluginConfig } from '@cromwell/core';
import { getLogger, JwtAuthGuard, Roles } from '@cromwell/core-backend';
import { Body, Controller, Get, HttpException, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { FrontendBundleDto } from '../dto/frontend-bundle.dto';
import { UpdateInfoDto } from '../dto/update-info.dto';
import { PluginService } from '../services/plugin.service';

const logger = getLogger();

@ApiBearerAuth()
@ApiTags('Plugins')
@Controller('plugin')
export class PluginController {

    constructor(private readonly pluginService: PluginService) { }


    @Get('settings')
    @ApiOperation({
        description: 'Returns JSON settings of a plugin by pluginName.',
        parameters: [{ name: 'pluginName', in: 'query', required: true }]
    })
    @ApiResponse({
        status: 200,
    })
    async getPluginConfig(@Query('pluginName') pluginName: string): Promise<TPluginConfig | undefined> {
        logger.log('PluginController::getPluginConfig ' + pluginName);

        if (pluginName && pluginName !== "") {
            const plugin = await this.pluginService.findOne(pluginName);

            if (plugin) {
                let defaultSettings;
                let settings;
                try {
                    if (plugin.defaultSettings) defaultSettings = JSON.parse(plugin.defaultSettings);
                } catch (e) {
                    getLogger(false).error(e);
                }
                try {
                    if (plugin.settings) settings = JSON.parse(plugin.settings);
                } catch (e) {
                    getLogger(false).error(e);
                }

                const out = Object.assign({}, defaultSettings, settings);

                return out;
            } else {
                throw new HttpException('pluginName not found', HttpStatus.NOT_FOUND);
            }
        }

        throw new HttpException('Invalid pluginName', HttpStatus.NOT_ACCEPTABLE);
    }

    @Post('settings')
    @UseGuards(JwtAuthGuard)
    @Roles('administrator')
    @ApiOperation({
        description: 'Saves JSON settings of a plugin by pluginName.',
        parameters: [{ name: 'pluginName', in: 'query', required: true }]
    })
    @ApiResponse({
        status: 200,
        type: Boolean
    })
    @ApiForbiddenResponse({ description: 'Forbidden.' })
    async savePluginConfig(@Query('pluginName') pluginName: string, @Body() input): Promise<boolean> {

        logger.log('PluginController::savePluginConfig');
        if (pluginName && pluginName !== "") {
            const plugin = await this.pluginService.findOne(pluginName);
            if (plugin) {
                plugin.settings = typeof input === 'string' ? input : JSON.stringify(input);
                await this.pluginService.save(plugin);
                return true;
            } else {
                logger.error(`PluginController::savePluginConfig Error Plugin ${pluginName} was no found!`);
            }
        }
        return false;
    }


    @Get('frontend-bundle')
    @ApiOperation({
        description: `Returns plugin's JS frontend bundle info.`,
        parameters: [{ name: 'pluginName', in: 'query', required: true }]
    })
    @ApiResponse({
        status: 200,
        type: FrontendBundleDto
    })
    async getPluginFrontendBundle(@Query('pluginName') pluginName: string): Promise<TFrontendBundle | undefined> {
        logger.log('PluginController::getPluginFrontendBundle');

        if (pluginName && pluginName !== "") {
            const bundle = await this.pluginService.getPluginBundle(pluginName, 'frontend');
            if (bundle) {
                return bundle;
            }
        }

        throw new HttpException('Invalid pluginName or frontend bundle not found', HttpStatus.NOT_ACCEPTABLE);
    }


    @Get('admin-bundle')
    @ApiOperation({
        description: `Returns plugin's JS admin bundle info.`,
        parameters: [{ name: 'pluginName', in: 'query', required: true }]
    })
    @ApiResponse({
        status: 200,
        type: FrontendBundleDto
    })
    @ApiForbiddenResponse({ description: 'Forbidden.' })
    async getPluginAdminBundle(@Query('pluginName') pluginName: string): Promise<TFrontendBundle | undefined> {
        logger.log('PluginController::getPluginAdminBundle');

        if (pluginName && pluginName !== "") {
            const bundle = await this.pluginService.getPluginBundle(pluginName, 'admin');
            if (bundle) {
                return bundle;
            }
        }

        throw new HttpException('Invalid pluginName or admin panel bundle not found', HttpStatus.NOT_ACCEPTABLE);
    }


    @Get('check-update')
    @UseGuards(JwtAuthGuard)
    @Roles('administrator', 'guest')
    @ApiOperation({
        description: `Returns available Update for sepcified Plugin`,
        parameters: [{ name: 'pluginName', in: 'query', required: true }]
    })
    @ApiResponse({
        status: 200,
        type: UpdateInfoDto,
    })
    async checkUpdate(@Query('pluginName') pluginName: string): Promise<UpdateInfoDto | boolean | undefined> {
        const update = await this.pluginService.checkPluginUpdate(pluginName);
        if (update) return new UpdateInfoDto()?.parseVersion?.(update);
        return false;
    }


    @Get('update')
    @UseGuards(JwtAuthGuard)
    @Roles('administrator')
    @ApiOperation({
        description: `Updates a Plugin to latest version`,
        parameters: [{ name: 'pluginName', in: 'query', required: true }]
    })
    @ApiResponse({
        status: 200,
        type: Boolean,
    })
    async updatePlugin(@Query('pluginName') pluginName: string): Promise<boolean | undefined> {
        return this.pluginService.handlePluginUpdate(pluginName);
    }


    @Get('install')
    @UseGuards(JwtAuthGuard)
    @Roles('administrator')
    @ApiOperation({
        description: `Installs a Plugin`,
        parameters: [{ name: 'pluginName', in: 'query', required: true }]
    })
    @ApiResponse({
        status: 200,
        type: Boolean,
    })
    async installPlugin(@Query('pluginName') pluginName: string): Promise<boolean | undefined> {
        return this.pluginService.handleInstallPlugin(pluginName);
    }


    @Get('delete')
    @UseGuards(JwtAuthGuard)
    @Roles('administrator')
    @ApiOperation({
        description: `Deletes a Plugin`,
        parameters: [{ name: 'pluginName', in: 'query', required: true }]
    })
    @ApiResponse({
        status: 200,
        type: Boolean,
    })
    async deletePlugin(@Query('pluginName') pluginName: string): Promise<boolean | undefined> {
        return this.pluginService.handleDeletePlugin(pluginName);
    }

}
