import { Injectable } from '@angular/core';
import { AagtModule } from 'app/aagt/aagt.module';
import * as ebase from 'app/data/models/_entity-base';
import { GenerationAsset } from './generation-asset';
import { TriggerAction } from './trigger-action';
import * as aagtCfg from './sp-aagt-config';
import { AagtDataModule } from '../aagt-data.module';

export class AssetTriggerAction extends ebase.SpEntityBase {
    sequence: number;
    actionStatus: 'In-progress' | 'Scheduled' | 'Rescheduled' | 'Delayed';
    outcome: 'PCW' | 'On-time' | 'Under-time' | 'Over-time' | 'Blamed';
    plannedStart: Date;
    plannedStop: Date;
    scheduledStart: Date;
    scheduledStop: Date;
    actualStart: Date;
    actualStop: Date;
    generationAssetId: number;
    triggerActionId: number;
    generationAsset: GenerationAsset;
    triggerAction: TriggerAction;
}

@Injectable({ providedIn: AagtDataModule })
export class AssetTriggerActionMetadata extends ebase.MetadataBase<
AssetTriggerAction
> {
    metadataFor = AssetTriggerAction;

    constructor () {
        super(aagtCfg.AagtListName.AssetTrigAct);
        this.entityDefinition.dataProperties.actionStatus = {
            dataType: this.dt.String
        };
        this.entityDefinition.dataProperties.sequence = { dataType: this.dt.Int16 };
        this.entityDefinition.dataProperties.outcome = { dataType: this.dt.String };
        this.entityDefinition.dataProperties.plannedStart = {
            dataType: this.dt.DateTime,
            isNullable: false
        };
        this.entityDefinition.dataProperties.plannedStop = {
            dataType: this.dt.DateTime,
            isNullable: false
        };
        this.entityDefinition.dataProperties.scheduledStart = {
            dataType: this.dt.DateTime,
            isNullable: false
        };
        this.entityDefinition.dataProperties.scheduledStop = {
            dataType: this.dt.DateTime,
            isNullable: false
        };
        this.entityDefinition.dataProperties.actualStart = {
            dataType: this.dt.DateTime,
            isNullable: false
        };
        this.entityDefinition.dataProperties.actualStop = {
            dataType: this.dt.DateTime,
            isNullable: false
        };
        this.entityDefinition.dataProperties.generationAssetId = {
            dataType: this.dt.Int32,
            isNullable: false
        };
        this.entityDefinition.dataProperties.triggerActionId = {
            dataType: this.dt.Int32,
            isNullable: false
        };

        Object.assign(
            this.entityDefinition.dataProperties,
            this.baseDataProperties
        );
    }
}