import { TAttribute, TAttributeInput } from '@cromwell/core';
import { EntityRepository } from 'typeorm';

import { checkEntitySlug, handleBaseInput } from '../helpers/base-queries';
import { getLogger } from '../helpers/logger';
import { Attribute } from '../models/entities/attribute.entity';
import { BaseRepository } from './base.repository';

const logger = getLogger();

@EntityRepository(Attribute)
export class AttributeRepository extends BaseRepository<Attribute> {

    async getAttributes(): Promise<Attribute[]> {
        logger.log('AttributeRepository::getAttributes');
        return this.find();
    }

    async getAttribute(id: string): Promise<Attribute | undefined> {
        logger.log('AttributeRepository::getAttribute; id: ' + id);
        return this.getById(id);
    }

    async handleAttributeInput(attribute: Attribute, input: TAttributeInput) {
        handleBaseInput(attribute, input);
        attribute.key = input.key;
        attribute.type = input.type;
        attribute.values = input.values.sort((a, b) => (a.value > b.value) ? 1 : -1);
        attribute.icon = input.icon;
        attribute.required = input.required;
        if (input.isEnabled === undefined) attribute.isEnabled = true;
    }

    async createAttribute(createAttribute: TAttributeInput, id?: string): Promise<TAttribute> {
        logger.log('AttributeRepository::createAttribute');
        let attribute = new Attribute();
        if (id) attribute.id = id;

        await this.handleAttributeInput(attribute, createAttribute);

        attribute = await this.save(attribute);
        await checkEntitySlug(attribute, Attribute);

        return attribute;
    }

    async updateAttribute(id: string, updateAttribute: TAttributeInput): Promise<Attribute> {
        logger.log('AttributeRepository::updateAttribute; id: ' + id);
        let attribute = await this.findOne({
            where: { id }
        });
        if (!attribute) throw new Error(`Attribute ${id} not found!`);

        await this.handleAttributeInput(attribute, updateAttribute);

        attribute = await this.save(attribute);
        await checkEntitySlug(attribute, Attribute);

        return attribute;
    }

    async deleteAttribute(id: string): Promise<boolean> {
        logger.log('AttributeRepository::deleteAttribute; id: ' + id);
        return this.deleteEntity(id);
    }


}