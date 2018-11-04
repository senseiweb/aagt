import { Injectable } from '@angular/core';
import { AagtModule } from 'app/aagt/aagt.module';
import * as ebase from 'app/data/models/_entity-base';

export class ActionItem extends ebase.SpEntityBase {
    action: string;
    shortCode: string;
    duration: number;
    assignedTeamType: string;
    availableForUse: boolean;
    notes: string;
    // get important(): boolean {
    //   if (!this.tags.length) { return false; }
    //   return this.tags.some(tag => tag.tagHandle === 'important');
    // }
    // get critical(): boolean {
    //   if (!this.tags.length) { return false; }
    //   return this.tags.some(tag => tag.tagHandle === 'critical');
    // }
    // get completed(): boolean {
    //   if (!this.tags.length) { return false; }
    //   return this.tags.some(tag => tag.tagHandle === 'done');
    // }
    // get tags(): MxFilterTag[] {
    //   if (!this.entityAspect) { return []; }
    //   const em = this.entityAspect.entityManager;
    //   return this.mxFilterTagId ? this.mxFilterTagId.results.map(tagId => {
    //     return em.getEntityByKey('MxFilterTag', tagId) as MxFilterTag;
    //   }) : [];
    // }
    // set tags(tags: MxFilterTag[]) {
    //   const tagIds = tags.map(t => t.id);
    //   this.mxFilterTagId.results = tagIds;
    // }
    // mxFilterTagId: SpMultiLookup;
}

@Injectable({ providedIn: AagtModule })
export class ActionItemMetadata extends ebase.MetadataBase<ActionItem> {
    metadataFor = ActionItem;

    constructor () {
        super('ActionItem');
        this.entityDefinition.dataProperties.action = { dataType: this.dt.String };
        this.entityDefinition.dataProperties.shortCode = {
            dataType: this.dt.String
        };
        this.entityDefinition.dataProperties.assignedTeamType = {
            dataType: this.dt.String
        };
        this.entityDefinition.dataProperties.duration = { dataType: this.dt.Int16 };

        Object.assign(
            this.entityDefinition.dataProperties,
            this.baseDataProperties
        );
    }
}
